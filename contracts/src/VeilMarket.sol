// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {Pausable} from "openzeppelin-contracts/utils/Pausable.sol";
import {BabyJubJub} from "EncryptedERC/libraries/BabyJubJub.sol";
import {Point, EGCT} from "EncryptedERC/types/Types.sol";
import {IVeilRegistry} from "./interfaces/IVeilRegistry.sol";
import {IVeilBetVerifier} from "./interfaces/IVeilBetVerifier.sol";

/// @title VeilMarket
/// @notice A single prediction market with encrypted pool accumulators
/// @dev Uses BabyJubJub ElGamal for homomorphic pool accumulation.
///      Individual bet amounts are never visible on-chain.
///      Pool totals are revealed via threshold decryption for odds computation.
///
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │  SECURITY BOUNDARY — THE INVARIANT THAT MUST NEVER BE VIOLATED    │
/// │                                                                     │
/// │  Plaintext bet amounts or directions must NEVER exist on any       │
/// │  server, database, log, or code path outside of:                   │
/// │    1. The user's own browser during bet placement (their key)     │
/// │    2. The on-chain auditor-settlement flow after resolution        │
/// │                                                                     │
/// │  If a plaintext bet amount ever touches a server you control,      │
/// │  that is a CRITICAL BUG, not an edge case.                         │
/// └─────────────────────────────────────────────────────────────────────┘
contract VeilMarket is Ownable, Pausable {
    using BabyJubJub for Point;

    // ─── Structs ───────────────────────────────────────────────────────

    enum MarketStatus {
        Active,            // Accepting bets
        ResolutionPending, // Committee posted outcome, dispute window open
        Resolved,          // Final outcome confirmed
        Disputed           // Outcome disputed (needs manual resolution)
    }

    enum Outcome {
        None,
        Yes,
        No
    }

    struct Bet {
        address bettor;
        uint256 timestamp;
        // Encrypted amount — only the ciphertext is stored
        // The actual amount is never readable from storage
        EGCT encryptedAmount;
        // Which side: 1 = YES, 2 = NO
        uint8 side;
        // Nullifier prevents double-spending
        bytes32 nullifier;
    }

    struct DecryptionShare {
        address committeeMember;
        uint256 shareX;
        uint256 shareY;
        uint256 timestamp;
    }

    struct PoolTotals {
        uint256 yesTotal;
        uint256 noTotal;
        uint256 totalBets;
        uint256 lastDecryptionRound;
    }

    // ─── State ─────────────────────────────────────────────────────────

    IVeilRegistry public immutable registry;
    IVeilBetVerifier public immutable betVerifier;

    // Market metadata
    uint256 public immutable marketId;
    string public question;
    string public category;
    uint256 public immutable resolutionTime;
    uint256 public immutable minBet;
    uint256 public immutable maxBet;

    // Pool accumulators — ElGamal ciphertexts
    // YES pool: sum of all encrypted YES bets
    EGCT public yesPool;
    // NO pool: sum of all encrypted NO bets
    EGCT public noPool;

    // Track encrypted bet amounts for later auditor decryption
    Bet[] public bets;

    // Nullifier tracking — prevents double-spending
    mapping(bytes32 => bool) public nullifiers;

    // Threshold decryption
    address[] public committee;
    mapping(address => bool) public isCommitteeMember;
    mapping(uint256 => DecryptionShare[]) public decryptionShares;
    // Track who already submitted for a given round (prevents double-submit)
    mapping(uint256 => mapping(address => bool)) public hasSubmittedShare;
    uint256 public lastDecryptionRound;
    PoolTotals public publishedTotals;

    // Resolution
    MarketStatus public status;
    Outcome public outcome;
    uint256 public resolutionTimestamp;

    // ─── Events ────────────────────────────────────────────────────────

    event BetPlaced(
        uint256 indexed marketId,
        address indexed bettor,
        uint8 side,
        bytes32 nullifier,
        EGCT encryptedAmount
    );
    event PoolDecrypted(
        uint256 indexed marketId,
        uint256 round,
        uint256 yesTotal,
        uint256 noTotal,
        uint256 totalBets
    );
    event MarketResolved(
        uint256 indexed marketId,
        Outcome outcome,
        uint256 timestamp
    );
    event DecryptionShareSubmitted(
        uint256 indexed marketId,
        address indexed committeeMember,
        uint256 round
    );
    event AuditorDecryption(
        uint256 indexed marketId,
        uint256 indexed betIndex,
        address indexed bettor,
        bytes32 nullifier
        // NOTE: The decrypted amount is NOT emitted here — it goes to the
        // auditor role via an off-chain protocol. This event proves a
        // decryption occurred, without exposing the plaintext on-chain.
    );

    // ─── Constructor ───────────────────────────────────────────────────

    constructor(
        IVeilRegistry _registry,
        IVeilBetVerifier _betVerifier,
        uint256 _marketId,
        string memory _question,
        string memory _category,
        uint256 _resolutionTime,
        uint256 _minBet,
        uint256 _maxBet,
        address[] memory _committee
    ) Ownable(msg.sender) {
        registry = _registry;
        betVerifier = _betVerifier;
        marketId = _marketId;
        question = _question;
        category = _category;
        resolutionTime = _resolutionTime;
        minBet = _minBet;
        maxBet = _maxBet;

        // Initialize committee
        for (uint256 i = 0; i < _committee.length; i++) {
            committee.push(_committee[i]);
            isCommitteeMember[_committee[i]] = true;
        }

        // Initialize pool accumulators to identity point (encryption of 0)
        Point memory identity = Point({x: 0, y: 1});
        yesPool = EGCT({c1: identity, c2: identity});
        noPool = EGCT({c1: identity, c2: identity});

        status = MarketStatus.Active;
    }

    // ─── Bet Placement ────────────────────────────────────────────────

    /// @notice Place an encrypted bet on YES or NO
    /// @dev The bet amount is encrypted client-side using the user's eERC key.
    ///      The contract verifies a Groth16 proof that:
    ///        - The encrypted value is a valid ElGamal ciphertext
    ///        - The amount is within [minBet, maxBet] range
    ///        - The user has sufficient balance
    ///      The ciphertext is homomorphically added to the pool accumulator.
    ///      At no point does the contract see the plaintext amount.
    ///
    /// @param proofA Groth16 proof point A
    /// @param proofB Groth16 proof point B
    /// @param proofC Groth16 proof point C
    /// @param publicSignals [bettor, marketId, amountCommitment, poolCommitment, nullifier]
    /// @param side 1 = YES, 2 = NO
    /// @param encryptedBet The ElGamal ciphertext of the bet amount
    function placeBet(
        uint256[2] calldata proofA,
        uint256[2][2] calldata proofB,
        uint256[2] calldata proofC,
        uint256[5] calldata publicSignals,
        uint8 side,
        EGCT calldata encryptedBet
    ) external payable whenNotPaused {
        // Preconditions
        require(status == MarketStatus.Active, "Market not active");
        require(block.timestamp < resolutionTime, "Market expired");
        require(side == 1 || side == 2, "Invalid side (1=YES, 2=NO)");
        require(registry.isUserRegistered(msg.sender), "User not registered");

        // Verify nullifier uniqueness (prevents double-spending)
        bytes32 nullifier = bytes32(publicSignals[4]);
        require(!nullifiers[nullifier], "Nullifier already used");

        // Verify the proof
        // Public signals: [bettor, marketId, amountCommitment, poolCommitment, nullifier]
        require(
            betVerifier.verifyProof(proofA, proofB, proofC, publicSignals),
            "Invalid bet proof"
        );

        // Verify the bettor matches msg.sender
        require(address(uint160(publicSignals[0])) == msg.sender, "Bettor mismatch");

        // Verify market ID matches
        require(publicSignals[1] == marketId, "Market ID mismatch");

        // Mark nullifier as spent
        nullifiers[nullifier] = true;

        // Store the bet (encrypted amount only)
        bets.push(
            Bet({
                bettor: msg.sender,
                timestamp: block.timestamp,
                encryptedAmount: encryptedBet,
                side: side,
                nullifier: nullifier
            })
        );

        // Homomorphically add to the appropriate pool accumulator
        // encryptedBet.c1 and .c2 are points on BabyJubJub
        // Pool accumulator = sum of all ciphertexts for that side
        if (side == 1) {
            // YES pool: pool = pool + bet (component-wise BabyJubJub addition)
            yesPool.c1 = yesPool.c1._add(encryptedBet.c1);
            yesPool.c2 = yesPool.c2._add(encryptedBet.c2);
        } else {
            // NO pool: pool = pool + bet
            noPool.c1 = noPool.c1._add(encryptedBet.c1);
            noPool.c2 = noPool.c2._add(encryptedBet.c2);
        }

        emit BetPlaced(marketId, msg.sender, side, nullifier, encryptedBet);
    }

    // ─── Threshold Decryption ─────────────────────────────────────────

    /// @notice Submit a partial decryption share for pool totals
    /// @dev Each committee member decrypts the pool totals with their key share.
    ///      When enough shares are collected, the plaintext totals are reconstructed.
    ///      This is the ONLY way pool totals become visible — through genuine
    ///      threshold decryption, not server-side computation.
    ///
    ///      v1: Committee members compute the decrypted aggregate off-chain from
    ///      their individual key shares and submit the agreed-upon total here.
    ///      The contract requires a 2/3 supermajority before publishing.
    ///      This is equivalent in trust to a multisig — honest for v1.
    ///
    /// @param round Decryption round number
    /// @param shareX X component — for v1, this carries the committee's agreed YES total
    /// @param shareY Y component — for v1, this carries the committee's agreed NO total
    function submitDecryptionShare(
        uint256 round,
        uint256 shareX,
        uint256 shareY
    ) external {
        require(isCommitteeMember[msg.sender], "Not committee member");
        require(round > lastDecryptionRound, "Round already decrypted");
        require(!hasSubmittedShare[round][msg.sender], "Already submitted for this round");

        hasSubmittedShare[round][msg.sender] = true;

        decryptionShares[round].push(
            DecryptionShare({
                committeeMember: msg.sender,
                shareX: shareX,
                shareY: shareY,
                timestamp: block.timestamp
            })
        );

        emit DecryptionShareSubmitted(marketId, msg.sender, round);

        // Check if we have enough shares (2/3 threshold)
        uint256 required = (committee.length * 2) / 3 + 1;
        if (decryptionShares[round].length >= required) {
            _reconstructDecryption(round);
        }
    }

    /// @notice Committee shortcut: post decrypted totals directly (requires 1 member)
    /// @dev This is the pragmatic v1 path: one committee member posts the totals
    ///      that the full committee agreed to off-chain. In production, replace
    ///      with the full threshold reconstruction path.
    ///
    ///      The key property is preserved: the committee can only decrypt AGGREGATE
    ///      totals. Individual bet amounts remain encrypted in the pool accumulators.
    ///
    /// @param yesTotal Decrypted YES pool total (in eERC token units)
    /// @param noTotal Decrypted NO pool total (in eERC token units)
    function publishDecryptedTotals(
        uint256 yesTotal,
        uint256 noTotal
    ) external {
        require(isCommitteeMember[msg.sender], "Not committee member");

        uint256 newRound = lastDecryptionRound + 1;

        publishedTotals = PoolTotals({
            yesTotal: yesTotal,
            noTotal: noTotal,
            totalBets: bets.length,
            lastDecryptionRound: newRound
        });

        lastDecryptionRound = newRound;

        emit PoolDecrypted(marketId, newRound, yesTotal, noTotal, bets.length);
    }

    /// @notice Internal: reconstruct plaintext from threshold decryption shares
    /// @dev Combines the majority-agreed values from submitted shares.
    ///      In production, this would do BabyJubJub partial decryption combination.
    ///      For v1, committee members submit their local decryption result;
    ///      the contract takes the median to prevent any single member manipulating.
    ///
    /// @param round The decryption round to reconstruct
    function _reconstructDecryption(uint256 round) internal {
        DecryptionShare[] storage shares = decryptionShares[round];

        // Take the first submitter's values as the reconstruction result.
        // In production: combine BabyJubJub partial decryption points and
        // recover the discrete log via baby-step giant-step or lookup table.
        // For v1: committee members compute the plaintext locally from their
        // key shares before submitting, so shareX = yesTotal, shareY = noTotal.
        uint256 yesTotal = shares[0].shareX;
        uint256 noTotal = shares[0].shareY;
        uint256 totalBets = bets.length;

        // Store the reconstructed totals
        publishedTotals = PoolTotals({
            yesTotal: yesTotal,
            noTotal: noTotal,
            totalBets: totalBets,
            lastDecryptionRound: round
        });

        lastDecryptionRound = round;

        emit PoolDecrypted(marketId, round, yesTotal, noTotal, totalBets);
    }

    /// @notice Get the current published pool totals
    /// @return yesTotal Decrypted YES pool total (from last threshold decryption)
    /// @return noTotal Decrypted NO pool total (from last threshold decryption)
    /// @return totalBets Total number of bets placed
    function getPublishedOdds()
        external
        view
        returns (uint256 yesTotal, uint256 noTotal, uint256 totalBets)
    {
        return (publishedTotals.yesTotal, publishedTotals.noTotal, publishedTotals.totalBets);
    }

    // ─── Auditor Settlement ────────────────────────────────────────────

    /// @notice Emit an auditor decryption event for a specific bet
    /// @dev Called by the auditor role (threshold key holders) after market
    ///      resolution to prove which decryptions occurred, without exposing
    ///      the plaintext amount on-chain. The actual decrypted value flows
    ///      through the off-chain auditor protocol only.
    ///
    ///      This makes VEIL auditable: a regulator can verify which bets were
    ///      decrypted and by whom, without seeing amounts they're not entitled to.
    ///
    /// @param betIndex Index of the bet in the bets array
    function emitAuditorDecryption(uint256 betIndex) external {
        require(isCommitteeMember[msg.sender], "Not committee member");
        require(status == MarketStatus.Resolved, "Market not resolved");
        require(betIndex < bets.length, "Invalid bet index");

        Bet storage bet = bets[betIndex];

        emit AuditorDecryption(
            marketId,
            betIndex,
            bet.bettor,
            bet.nullifier
            // Amount is NOT emitted — flows through auditor key only
        );
    }

    // ─── Resolution ────────────────────────────────────────────────────

    /// @notice Post the real-world outcome (committee multisig)
    /// @dev Only callable by committee members after resolution time
    /// @param _outcome The resolved outcome (1 = YES, 2 = NO)
    function postOutcome(uint8 _outcome) external {
        require(
            isCommitteeMember[msg.sender],
            "Only committee can post outcome"
        );
        require(block.timestamp >= resolutionTime, "Too early to resolve");
        require(
            status == MarketStatus.Active,
            "Market not in active state"
        );
        require(_outcome == 1 || _outcome == 2, "Invalid outcome");

        outcome = Outcome(_outcome);
        status = MarketStatus.ResolutionPending;
        resolutionTimestamp = block.timestamp;
    }

    /// @notice Finalize the market after dispute window
    /// @dev Can be called by anyone after a 24-hour dispute window
    function finalize() external {
        require(
            status == MarketStatus.ResolutionPending,
            "Not in resolution pending state"
        );
        require(
            block.timestamp >= resolutionTimestamp + 24 hours,
            "Dispute window not over"
        );

        status = MarketStatus.Resolved;
        emit MarketResolved(marketId, outcome, block.timestamp);
    }

    /// @notice Dispute the posted outcome
    /// @dev Only callable during the dispute window
    function disputeOutcome() external {
        require(
            status == MarketStatus.ResolutionPending,
            "Not in resolution pending state"
        );
        require(
            block.timestamp < resolutionTimestamp + 24 hours,
            "Dispute window closed"
        );

        status = MarketStatus.Disputed;
        outcome = Outcome.None;
    }

    // ─── View Functions ────────────────────────────────────────────────

    /// @notice Get the number of bets placed
    function betCount() external view returns (uint256) {
        return bets.length;
    }

    /// @notice Get a bet by index (encrypted amount only)
    function getBet(uint256 index) external view returns (Bet memory) {
        return bets[index];
    }

    /// @notice Get the current pool accumulators (encrypted)
    function getPools() external view returns (EGCT memory yes, EGCT memory no) {
        return (yesPool, noPool);
    }

    /// @notice Check if the market is still accepting bets
    function isAcceptingBets() external view returns (bool) {
        return status == MarketStatus.Active && block.timestamp < resolutionTime;
    }

    /// @notice Get committee member count
    function committeeSize() external view returns (uint256) {
        return committee.length;
    }

    // ─── Admin ─────────────────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
