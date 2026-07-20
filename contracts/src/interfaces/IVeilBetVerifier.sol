// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

/// @title IVeilBetVerifier
/// @notice Interface for the Groth16 bet proof verifier
interface IVeilBetVerifier {
    /// @notice Verify a Groth16 proof that a bet is valid
    function verifyProof(
        uint256[2] calldata pointA_,
        uint256[2][2] calldata pointB_,
        uint256[2] calldata pointC_,
        uint256[5] calldata publicSignals_
    ) external view returns (bool verified_);
}
