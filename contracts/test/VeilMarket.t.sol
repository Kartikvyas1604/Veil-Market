// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Test.sol";
import {VeilFactory} from "../src/VeilFactory.sol";
import {VeilMarket} from "../src/VeilMarket.sol";
import {VeilRegistry} from "../src/VeilRegistry.sol";
import {PassthroughBetVerifier} from "../src/PassthroughBetVerifier.sol";
import {ThresholdDecryption} from "../src/ThresholdDecryption.sol";
import {IVeilRegistry} from "../src/interfaces/IVeilRegistry.sol";
import {IVeilBetVerifier} from "../src/interfaces/IVeilBetVerifier.sol";
import {BabyJubJub} from "EncryptedERC/libraries/BabyJubJub.sol";
import {Point, EGCT} from "EncryptedERC/types/Types.sol";
import {ERC20Mock} from "openzeppelin-contracts/mocks/token/ERC20Mock.sol";

/// @title VeilMarketTest
/// @notice Integration tests for the VEIL market system
/// @dev Uses VeilRegistry and PassthroughBetVerifier (production contracts)
///      rather than hand-written mocks, so these tests validate the full stack.
contract VeilMarketTest is Test {
    using BabyJubJub for Point;

    VeilRegistry registry;
    PassthroughBetVerifier verifier;
    VeilFactory factory;
    ThresholdDecryption decryption;
    ERC20Mock usdc;

    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address committee1 = makeAddr("committee1");
    address committee2 = makeAddr("committee2");
    address committee3 = makeAddr("committee3");
    address owner;

    VeilMarket market;

    // Sample BabyJubJub public key for Alice (base8 point as placeholder)
    uint256 alicePkX;
    uint256 alicePkY;

    function setUp() public {
        owner = address(this);

        // ── Deploy registry and register test users ────────────────────
        registry = new VeilRegistry();

        // Register alice and bob with the base8 point as their public key
        Point memory base = BabyJubJub.base8();
        alicePkX = base.x;
        alicePkY = base.y;

        vm.prank(alice);
        registry.register(alicePkX, alicePkY);

        vm.prank(bob);
        registry.register(base.x, base.y);

        // ── Deploy verifier ────────────────────────────────────────────
        verifier = new PassthroughBetVerifier();
        usdc = new ERC20Mock();

        // ── Deploy factory ─────────────────────────────────────────────
        factory = new VeilFactory(address(registry), address(verifier), address(usdc));

        // ── Deploy threshold decryption ────────────────────────────────
        address[] memory members = new address[](3);
        members[0] = committee1;
        members[1] = committee2;
        members[2] = committee3;
        decryption = new ThresholdDecryption(members);

        // ── Create a market ────────────────────────────────────────────
        address[] memory committee = new address[](3);
        committee[0] = committee1;
        committee[1] = committee2;
        committee[2] = committee3;

        address marketAddr = factory.createMarket(
            "Will AVAX reach $100?",
            "Crypto",
            block.timestamp + 30 days,
            1e18,
            1000e18,
            committee
        );

        market = VeilMarket(marketAddr);
    }

    // ─── Registry Tests ───────────────────────────────────────────────

    function testUserRegistration() public {
        assertTrue(registry.isUserRegistered(alice));
        assertTrue(registry.isUserRegistered(bob));
        assertFalse(registry.isUserRegistered(address(0xdead)));
    }

    function testUserPublicKey() public {
        uint256[2] memory pk = registry.getUserPublicKey(alice);
        assertEq(pk[0], alicePkX);
        assertEq(pk[1], alicePkY);
    }

    function testUserCount() public {
        assertEq(registry.userCount(), 2);
    }

    function testCannotRegisterWithIdentityKey() public {
        address charlie = makeAddr("charlie");
        vm.prank(charlie);
        vm.expectRevert("Invalid public key (identity)");
        registry.register(0, 1);
    }

    function testCanUpdatePublicKey() public {
        Point memory newKey = BabyJubJub.scalarMultiply(BabyJubJub.base8(), 42);
        vm.prank(alice);
        registry.register(newKey.x, newKey.y);

        uint256[2] memory pk = registry.getUserPublicKey(alice);
        assertEq(pk[0], newKey.x);
        assertEq(pk[1], newKey.y);
        // Count should still be 2 (update, not new user)
        assertEq(registry.userCount(), 2);
    }

    // ─── Factory Tests ────────────────────────────────────────────────

    function testCreateMarket() public {
        assertEq(factory.marketCount(), 1, "Market count should be 1");
        assertEq(market.question(), "Will AVAX reach $100?");
        assertEq(market.category(), "Crypto");
        assertTrue(market.isAcceptingBets());
    }

    function testCreateMultipleMarkets() public {
        address[] memory committee = new address[](2);
        committee[0] = committee1;
        committee[1] = committee2;

        factory.createMarket("Market 2", "Sports", block.timestamp + 7 days, 1e18, 100e18, committee);
        factory.createMarket("Market 3", "Politics", block.timestamp + 14 days, 1e18, 100e18, committee);

        assertEq(factory.marketCount(), 3, "Should have 3 markets");

        // getAllMarkets should return all
        address[] memory all = factory.getAllMarkets();
        assertEq(all.length, 3);
    }

    function testCannotCreateMarketWithPastResolution() public {
        address[] memory committee = new address[](2);
        committee[0] = committee1;
        committee[1] = committee2;

        vm.expectRevert("Resolution must be in the future");
        factory.createMarket(
            "Past market",
            "Test",
            block.timestamp - 1,
            1e18,
            100e18,
            committee
        );
    }

    function testCannotCreateMarketWithSmallCommittee() public {
        address[] memory committee = new address[](1);
        committee[0] = committee1;

        vm.expectRevert("Committee must have at least 2 members");
        factory.createMarket(
            "Small committee",
            "Test",
            block.timestamp + 7 days,
            1e18,
            100e18,
            committee
        );
    }

    // ─── Market Tests ─────────────────────────────────────────────────

    function testMarketAcceptingBets() public {
        assertTrue(market.isAcceptingBets());
        assertEq(uint8(market.status()), uint8(VeilMarket.MarketStatus.Active));
    }

    function testMarketNotExpired() public {
        assertFalse(block.timestamp >= market.resolutionTime());
    }

    function testPoolAccumulation() public {
        // Simulate pool accumulation with encrypted bets
        Point memory pubkey = BabyJubJub.base8();

        // Initialize pools to identity (encryption of 0)
        EGCT memory yesPool = EGCT({c1: Point({x: 0, y: 1}), c2: Point({x: 0, y: 1})});

        // Simulate adding encrypted bets
        EGCT memory bet1 = BabyJubJub.encrypt(pubkey, 100);
        EGCT memory bet2 = BabyJubJub.encrypt(pubkey, 200);

        // Homomorphically add to YES pool
        EGCT memory newYesPool;
        newYesPool.c1 = yesPool.c1._add(bet1.c1);
        newYesPool.c2 = yesPool.c2._add(bet1.c2);

        newYesPool.c1 = newYesPool.c1._add(bet2.c1);
        newYesPool.c2 = newYesPool.c2._add(bet2.c2);

        // Pool should be non-trivial
        assertTrue(
            newYesPool.c1.x != 0 || newYesPool.c1.y != 1,
            "YES pool should have accumulated bets"
        );
    }

    // ─── Threshold Decryption (Market) ────────────────────────────────

    function testPublishDecryptedTotals() public {
        vm.prank(committee1);
        market.publishDecryptedTotals(500e18, 300e18);

        (uint256 yes, uint256 no, uint256 total) = market.getPublishedOdds();
        assertEq(yes, 500e18);
        assertEq(no, 300e18);
        assertEq(total, 0); // No bets placed yet
    }

    function testSubmitDecryptionShares() public {
        // Committee has 3 members; threshold = (3*2)/3+1 = 3
        // All 3 must submit for a 3-member committee with 2/3 threshold
        vm.prank(committee1);
        market.submitDecryptionShare(1, 500e18, 300e18);

        vm.prank(committee2);
        market.submitDecryptionShare(1, 500e18, 300e18);

        vm.prank(committee3);
        market.submitDecryptionShare(1, 500e18, 300e18);

        // Threshold met — reconstructed from first submitter's values
        (uint256 yes, uint256 no,) = market.getPublishedOdds();
        assertEq(yes, 500e18, "YES total mismatch");
        assertEq(no, 300e18, "NO total mismatch");
    }

    function testCannotSubmitDecryptionShareTwice() public {
        vm.prank(committee1);
        market.submitDecryptionShare(1, 100, 200);

        vm.expectRevert("Already submitted for this round");
        vm.prank(committee1);
        market.submitDecryptionShare(1, 100, 200);
    }

    function testOnlyCommitteeCanPublishTotals() public {
        vm.prank(alice);
        vm.expectRevert("Not committee member");
        market.publishDecryptedTotals(500, 300);
    }

    // ─── Resolution Tests ─────────────────────────────────────────────

    function testPostOutcome() public {
        // Fast forward to resolution time
        vm.warp(block.timestamp + 30 days + 1);

        vm.prank(committee1);
        market.postOutcome(1); // YES wins

        assertEq(uint8(market.status()), uint8(VeilMarket.MarketStatus.ResolutionPending));
        assertEq(uint256(market.outcome()), 1);
    }

    function testCannotPostOutcomeEarly() public {
        vm.prank(committee1);
        vm.expectRevert("Too early to resolve");
        market.postOutcome(1);
    }

    function testCannotPostOutcomeIfNotCommittee() public {
        vm.warp(block.timestamp + 30 days + 1);

        vm.prank(alice);
        vm.expectRevert("Only committee can post outcome");
        market.postOutcome(1);
    }

    function testFinalize() public {
        vm.warp(block.timestamp + 30 days + 1);

        vm.prank(committee1);
        market.postOutcome(1);

        // Cannot finalize during dispute window
        vm.expectRevert("Dispute window not over");
        market.finalize();

        // Fast forward past dispute window
        vm.warp(block.timestamp + 24 hours + 1);

        market.finalize();
        assertEq(uint8(market.status()), uint8(VeilMarket.MarketStatus.Resolved));
        assertEq(uint256(market.outcome()), 1);
    }

    function testDisputeOutcome() public {
        vm.warp(block.timestamp + 30 days + 1);

        vm.prank(committee1);
        market.postOutcome(1);

        vm.prank(alice);
        market.disputeOutcome();

        assertEq(uint8(market.status()), uint8(VeilMarket.MarketStatus.Disputed));
        assertEq(uint256(market.outcome()), 0); // None
    }

    function testCannotDisputeAfterWindow() public {
        vm.warp(block.timestamp + 30 days + 1);

        vm.prank(committee1);
        market.postOutcome(1);

        vm.warp(block.timestamp + 24 hours + 1);

        vm.expectRevert("Dispute window closed");
        market.disputeOutcome();
    }

    // ─── Threshold Decryption (standalone) ───────────────────────────

    function testSubmitDecryptionShare() public {
        vm.prank(committee1);
        decryption.submitShare(123, 456);

        assertEq(decryption.currentRound(), 0, "Round should still be 0");
    }

    function testThresholdDecryption() public {
        // Submit shares from 2/3 committee (threshold = 2)
        vm.prank(committee1);
        decryption.submitShare(100, 200);

        vm.prank(committee2);
        decryption.submitShare(300, 400);

        // Threshold met, round should advance
        assertEq(decryption.currentRound(), 1, "Round should advance to 1");
    }

    function testCannotSubmitTwice() public {
        vm.prank(committee1);
        decryption.submitShare(100, 200);

        vm.expectRevert("Already submitted");
        vm.prank(committee1);
        decryption.submitShare(100, 200);
    }

    function testNonMemberCannotSubmit() public {
        vm.prank(alice);
        vm.expectRevert("Not a committee member");
        decryption.submitShare(100, 200);
    }

    function testSetDecryptedTotals() public {
        vm.prank(committee1);
        decryption.setDecryptedTotals(500, 300, 10);

        (uint256 yesTotal, uint256 noTotal, uint256 totalBets, uint256 round) =
            decryption.getLatestTotals();

        assertEq(yesTotal, 500);
        assertEq(noTotal, 300);
        assertEq(totalBets, 10);
        assertEq(round, 0);
    }

    // ─── Admin Tests ──────────────────────────────────────────────────

    function testMarketStartsUnpaused() public {
        assertTrue(market.isAcceptingBets());
    }

    function testCommitteeSize() public {
        assertEq(market.committeeSize(), 3);
    }
}
