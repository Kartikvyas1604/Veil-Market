// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {IVeilFactory} from "./interfaces/IVeilFactory.sol";
import {VeilMarket} from "./VeilMarket.sol";
import {IVeilRegistry} from "./interfaces/IVeilRegistry.sol";
import {IVeilBetVerifier} from "./interfaces/IVeilBetVerifier.sol";

/// @title VeilFactory
/// @notice Deploys and tracks Veil prediction market contracts
/// @dev Each market is a separate contract holding encrypted pool accumulators
contract VeilFactory is IVeilFactory, Ownable {
    address public immutable registry;
    address public immutable betVerifier;
    address public immutable usdc;

    /// @notice marketId => market contract address
    mapping(uint256 => address) private _markets;

    /// @notice Total number of markets created
    uint256 private _marketCount;

    // ─── Events ────────────────────────────────────────────────────────

    // IVeilFactory already defines MarketCreated; we extend with category
    event MarketCreatedExtended(
        uint256 indexed marketId,
        address indexed marketContract,
        string question,
        string category,
        uint256 resolutionTime
    );

    // ─── Constructor ───────────────────────────────────────────────────

    constructor(address _registry, address _betVerifier, address _usdc) Ownable(msg.sender) {
        registry = _registry;
        betVerifier = _betVerifier;
        usdc = _usdc;
    }

    // ─── Market Creation ───────────────────────────────────────────────

    /// @notice Deploy a new prediction market
    /// @param question The market question (e.g., "Will BTC reach $100k by Dec 2026?")
    /// @param category Market category (e.g., "Crypto", "Politics", "Sports")
    /// @param resolutionTime Unix timestamp when the market resolves
    /// @param minBet Minimum bet amount in eERC tokens
    /// @param maxBet Maximum bet amount in eERC tokens
    /// @param committee Addresses of the threshold decryption committee
    /// @return marketContract The address of the deployed market
    function createMarket(
        string calldata question,
        string calldata category,
        uint256 resolutionTime,
        uint256 minBet,
        uint256 maxBet,
        address[] calldata committee
    ) external override returns (address) {
        require(resolutionTime > block.timestamp, "Resolution must be in the future");
        require(committee.length >= 2, "Committee must have at least 2 members");

        uint256 marketId = _marketCount;

        address marketContract = address(
            new VeilMarket{
                salt: keccak256(abi.encodePacked(marketId, block.timestamp))
            }(
                IVeilRegistry(registry),
                IVeilBetVerifier(betVerifier),
                marketId,
                question,
                category,
                resolutionTime,
                minBet,
                maxBet,
                committee,
                usdc
            )
        );

        _markets[marketId] = marketContract;
        _marketCount++;

        emit MarketCreated(marketId, marketContract, question, resolutionTime);
        emit MarketCreatedExtended(marketId, marketContract, question, category, resolutionTime);

        return marketContract;
    }

    // ─── View Functions ────────────────────────────────────────────────

    /// @notice Get the contract address for a market
    function getMarket(uint256 marketId) external view override returns (address) {
        return _markets[marketId];
    }

    /// @notice Get total market count
    function marketCount() external view override returns (uint256) {
        return _marketCount;
    }

    /// @notice Get all market addresses (for indexer bootstrap)
    function getAllMarkets() external view returns (address[] memory) {
        address[] memory markets = new address[](_marketCount);
        for (uint256 i = 0; i < _marketCount; i++) {
            markets[i] = _markets[i];
        }
        return markets;
    }
}
