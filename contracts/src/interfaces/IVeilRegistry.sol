// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/// @title IVeilRegistry
/// @notice Interface for user registration — wraps the eERC Registrar
interface IVeilRegistry {
    function getUserPublicKey(address user) external view returns (uint256[2] memory);
    function isUserRegistered(address user) external view returns (bool);
}
