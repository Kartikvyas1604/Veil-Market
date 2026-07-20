// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {IVeilBetVerifier} from "./interfaces/IVeilBetVerifier.sol";

/// @title PassthroughBetVerifier
/// @notice Testnet verifier — always returns true.
/// @dev In production this is replaced by the Groth16 circuit-generated verifier
///      compiled from the eERC bet circuit. The passthrough is used on Fuji testnet
///      because the circuit wasm/zkey files are not bundled with the hackathon build.
///
///      The architecture is identical: the real verifier exposes the same interface
///      and the market contract calls it the same way. Swapping it out is a one-line
///      factory change with no market contract changes needed.
///
/// ⚠️  DO NOT DEPLOY TO MAINNET — this makes proof verification trivially bypassable.
contract PassthroughBetVerifier is IVeilBetVerifier {
    /// @inheritdoc IVeilBetVerifier
    function verifyProof(
        uint256[2] calldata /*pointA_*/,
        uint256[2][2] calldata /*pointB_*/,
        uint256[2] calldata /*pointC_*/,
        uint256[5] calldata /*publicSignals_*/
    ) external pure override returns (bool verified_) {
        return true;
    }
}
