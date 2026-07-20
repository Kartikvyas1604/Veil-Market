// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import {Ownable} from "openzeppelin-contracts/access/Ownable.sol";
import {IVeilRegistry} from "./interfaces/IVeilRegistry.sol";

/// @title VeilRegistry
/// @notice On-chain registry mapping wallet addresses to BabyJubJub public keys.
///         Users register once by submitting their eERC public key, derived
///         client-side from a wallet signature. This public key is used to
///         encrypt their bet amounts before submission.
///
/// @dev This is the production replacement for the MockRegistry used in tests.
///      In the full eERC stack this would be replaced by the ava-labs Registrar,
///      but for v1 we deploy our own to avoid depending on a testnet address.
///
/// ┌─────────────────────────────────────────────────────────────────────┐
/// │  SECURITY INVARIANT                                                 │
/// │  The public key stored here is used ONLY for encrypting bets.      │
/// │  Private keys never leave the user's browser.                      │
/// └─────────────────────────────────────────────────────────────────────┘
contract VeilRegistry is IVeilRegistry, Ownable {
    // wallet address => BabyJubJub public key [x, y]
    mapping(address => uint256[2]) private _publicKeys;
    mapping(address => bool) private _registered;

    // All registered users (for enumeration)
    address[] private _users;

    // ─── Events ────────────────────────────────────────────────────────

    event UserRegistered(
        address indexed user,
        uint256 publicKeyX,
        uint256 publicKeyY
    );

    event UserUpdated(
        address indexed user,
        uint256 publicKeyX,
        uint256 publicKeyY
    );

    // ─── Constructor ───────────────────────────────────────────────────

    constructor() Ownable(msg.sender) {}

    // ─── Registration ──────────────────────────────────────────────────

    /// @notice Register with a BabyJubJub public key
    /// @dev Call this once from the frontend after deriving your key from
    ///      a wallet signature. The public key is [x, y] on BabyJubJub.
    /// @param publicKeyX X coordinate of the BabyJubJub public key
    /// @param publicKeyY Y coordinate of the BabyJubJub public key
    function register(uint256 publicKeyX, uint256 publicKeyY) external {
        require(publicKeyX != 0 || publicKeyY != 1, "Invalid public key (identity)");
        require(publicKeyX != 0, "Public key X cannot be zero");

        bool isNew = !_registered[msg.sender];

        _publicKeys[msg.sender] = [publicKeyX, publicKeyY];
        _registered[msg.sender] = true;

        if (isNew) {
            _users.push(msg.sender);
            emit UserRegistered(msg.sender, publicKeyX, publicKeyY);
        } else {
            emit UserUpdated(msg.sender, publicKeyX, publicKeyY);
        }
    }

    /// @notice Admin: register a user on their behalf (for onboarding flows)
    function adminRegister(
        address user,
        uint256 publicKeyX,
        uint256 publicKeyY
    ) external onlyOwner {
        require(publicKeyX != 0 || publicKeyY != 1, "Invalid public key");

        bool isNew = !_registered[user];
        _publicKeys[user] = [publicKeyX, publicKeyY];
        _registered[user] = true;

        if (isNew) {
            _users.push(user);
            emit UserRegistered(user, publicKeyX, publicKeyY);
        } else {
            emit UserUpdated(user, publicKeyX, publicKeyY);
        }
    }

    // ─── IVeilRegistry Implementation ─────────────────────────────────

    /// @inheritdoc IVeilRegistry
    function getUserPublicKey(address user)
        external
        view
        override
        returns (uint256[2] memory)
    {
        return _publicKeys[user];
    }

    /// @inheritdoc IVeilRegistry
    function isUserRegistered(address user)
        external
        view
        override
        returns (bool)
    {
        return _registered[user];
    }

    // ─── View Helpers ──────────────────────────────────────────────────

    /// @notice Get total registered users
    function userCount() external view returns (uint256) {
        return _users.length;
    }

    /// @notice Get user at index (for enumeration)
    function userAt(uint256 index) external view returns (address) {
        return _users[index];
    }
}
