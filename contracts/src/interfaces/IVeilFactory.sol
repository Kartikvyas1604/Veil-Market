// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/// @title IVeilFactory
/// @notice Events and types for the Veil market factory
interface IVeilFactory {
    event MarketCreated(
        uint256 indexed marketId,
        address indexed marketContract,
        string question,
        uint256 resolutionTime
    );

    function createMarket(
        string calldata question,
        string calldata category,
        uint256 resolutionTime,
        uint256 minBet,
        uint256 maxBet,
        address[] calldata committee
    ) external returns (address);

    function getMarket(uint256 marketId) external view returns (address);
    function marketCount() external view returns (uint256);
}
