// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "forge-std/Script.sol";
import {VeilRegistry} from "../src/VeilRegistry.sol";
import {PassthroughBetVerifier} from "../src/PassthroughBetVerifier.sol";
import {VeilFactory} from "../src/VeilFactory.sol";
import {ThresholdDecryption} from "../src/ThresholdDecryption.sol";

/// @title DeployVeil
/// @notice End-to-end deployment script for VEIL on Fuji testnet
///
/// Usage:
///   export PRIVATE_KEY=0x...
///   forge script script/DeployVeil.s.sol \
///     --rpc-url https://api.avax-test.network/ext/bc/C/rpc \
///     --broadcast \
///     --verify \
///     -vvvv
///
///  After deployment, copy the logged addresses to .env.local
contract DeployVeil is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("=== VEIL Deployment ===");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("Block:", block.number);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // ── 1. Deploy Registry ──────────────────────────────────────────
        VeilRegistry registry = new VeilRegistry();
        console.log("VeilRegistry:", address(registry));

        // ── 2. Deploy Passthrough Verifier (testnet only) ───────────────
        PassthroughBetVerifier verifier = new PassthroughBetVerifier();
        console.log("PassthroughBetVerifier:", address(verifier));

        // Fuji USDC address
        address fujiUsdc = 0x5425890298aed601595a70AB815c96711a31Bc65;

        // ── 3. Deploy Factory ───────────────────────────────────────────
        VeilFactory factory = new VeilFactory(address(registry), address(verifier), fujiUsdc);
        console.log("VeilFactory:", address(factory));

        // ── 4. Deploy ThresholdDecryption (standalone, for reference) ───
        address[] memory committeeMembers = new address[](3);
        committeeMembers[0] = deployer;
        committeeMembers[1] = deployer; // Single-key committee for testnet
        committeeMembers[2] = deployer;
        // Note: for testnet we use the deployer as all committee members.
        // In production, each member holds a separate key share.
        ThresholdDecryption tdec = new ThresholdDecryption(committeeMembers);
        console.log("ThresholdDecryption:", address(tdec));

        // ── 5. Committee (same address for all 3 on testnet) ────────────
        address[] memory committee = new address[](3);
        committee[0] = deployer;
        committee[1] = deployer;
        committee[2] = deployer;

        // ── 6. Seed Markets ─────────────────────────────────────────────
        console.log("");
        console.log("=== Seeding Markets ===");

        address m1 = factory.createMarket(
            "Will the Federal Reserve cut rates in January 2026?",
            "Macro",
            block.timestamp + 90 days,
            1e17,    // 0.1 token min
            1000e18, // 1000 token max
            committee
        );
        console.log("Market 0 (Fed Rate):", m1);

        address m2 = factory.createMarket(
            "Will Bitcoin exceed $150,000 before end of Q1 2026?",
            "Crypto",
            block.timestamp + 60 days,
            1e17,
            1000e18,
            committee
        );
        console.log("Market 1 (BTC 150k):", m2);

        address m3 = factory.createMarket(
            "Will SpaceX Starship complete a full orbital mission by March 2026?",
            "Science",
            block.timestamp + 45 days,
            1e17,
            1000e18,
            committee
        );
        console.log("Market 2 (SpaceX):", m3);

        address m4 = factory.createMarket(
            "Will AVAX token price exceed $50 by end of Q2 2026?",
            "Crypto",
            block.timestamp + 120 days,
            1e17,
            1000e18,
            committee
        );
        console.log("Market 3 (AVAX $50):", m4);

        address m5 = factory.createMarket(
            "Will Apple announce a new AR headset at WWDC 2026?",
            "Tech",
            block.timestamp + 75 days,
            1e17,
            1000e18,
            committee
        );
        console.log("Market 4 (Apple AR):", m5);

        address m6 = factory.createMarket(
            "Will a Solana spot ETF be approved by the SEC in 2026?",
            "Crypto",
            block.timestamp + 180 days,
            1e17,
            1000e18,
            committee
        );
        console.log("Market 5 (SOL ETF):", m6);

        address m7 = factory.createMarket(
            "Will the US federal government experience a shutdown in 2026?",
            "Politics",
            block.timestamp + 200 days,
            1e17,
            1000e18,
            committee
        );
        console.log("Market 6 (Gov Shutdown):", m7);

        vm.stopBroadcast();

        // ── 7. Print env block ──────────────────────────────────────────
        console.log("");
        console.log("=== Copy to .env.local ===");
        console.log("NEXT_PUBLIC_VEIL_FACTORY_ADDRESS=%s", address(factory));
        console.log("NEXT_PUBLIC_REGISTRAR_ADDRESS=%s", address(registry));
        console.log("NEXT_PUBLIC_THRESHOLD_DECRYPTION_ADDRESS=%s", address(tdec));
        console.log("NEXT_PUBLIC_BET_VERIFIER_ADDRESS=%s", address(verifier));
        console.log("COMMITTEE_ADDRESS=%s", "0xd5b9Ed9E3c7b72e97fDbe8De818B072901eEB098");
    }
}
