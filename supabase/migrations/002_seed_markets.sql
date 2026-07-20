-- VEIL Database Seed — Migration 002
-- Seeds initial markets so the app is not empty on first demo.
-- These are mirrored from what the deploy script creates on Fuji.
-- If real on-chain data is available, the indexer will overwrite these.

-- Insert seed markets
INSERT INTO markets (market_id, contract_address, question, category, resolution_time, min_bet, max_bet, status, outcome)
VALUES
    (0, '0x0000000000000000000000000000000000000001',
     'Will the Federal Reserve cut rates in January 2026?',
     'Macro',
     NOW() + INTERVAL '90 days',
     0.1, 1000.0, 'active', 'none'),

    (1, '0x0000000000000000000000000000000000000002',
     'Will Bitcoin exceed $150,000 before end of Q1 2026?',
     'Crypto',
     NOW() + INTERVAL '60 days',
     0.1, 1000.0, 'active', 'none'),

    (2, '0x0000000000000000000000000000000000000003',
     'Will SpaceX Starship complete a full orbital mission by March 2026?',
     'Science',
     NOW() + INTERVAL '45 days',
     0.1, 1000.0, 'active', 'none'),

    (3, '0x0000000000000000000000000000000000000004',
     'Will AVAX token price exceed $50 by end of Q2 2026?',
     'Crypto',
     NOW() + INTERVAL '120 days',
     0.1, 1000.0, 'active', 'none'),

    (4, '0x0000000000000000000000000000000000000005',
     'Will Apple announce a new AR headset at WWDC 2026?',
     'Tech',
     NOW() + INTERVAL '75 days',
     0.1, 1000.0, 'active', 'none'),

    (5, '0x0000000000000000000000000000000000000006',
     'Will a Solana spot ETF be approved by the SEC in 2026?',
     'Crypto',
     NOW() + INTERVAL '180 days',
     0.1, 1000.0, 'active', 'none'),

    (6, '0x0000000000000000000000000000000000000007',
     'Will the US federal government experience a shutdown in 2026?',
     'Politics',
     NOW() + INTERVAL '200 days',
     0.1, 1000.0, 'active', 'none'),

    (7, '0x0000000000000000000000000000000000000008',
     'Will an AI-related research team win a Nobel Prize in 2026?',
     'Science',
     NOW() + INTERVAL '270 days',
     0.1, 1000.0, 'active', 'none'),

    (8, '0x0000000000000000000000000000000000000009',
     'Will El Salvador increase its Bitcoin reserve by 50% in 2026?',
     'Macro',
     NOW() + INTERVAL '150 days',
     0.1, 1000.0, 'active', 'none')

ON CONFLICT (market_id) DO NOTHING;

-- Seed initial odds snapshots (50/50 starting odds — committees haven't decrypted yet)
INSERT INTO odds_snapshots (market_id, round, yes_total, no_total, total_bets)
VALUES
    (0, 0, 50, 50, 0),
    (1, 0, 50, 50, 0),
    (2, 0, 50, 50, 0),
    (3, 0, 50, 50, 0),
    (4, 0, 50, 50, 0),
    (5, 0, 50, 50, 0),
    (6, 0, 50, 50, 0),
    (7, 0, 50, 50, 0),
    (8, 0, 50, 50, 0)
ON CONFLICT (market_id, round) DO NOTHING;

-- Seed activity feed entries
INSERT INTO market_activity (market_id, event_type, description)
VALUES
    (0, 'market_created', 'Market created: Fed Rate Jan 2026'),
    (1, 'market_created', 'Market created: BTC $150k Q1'),
    (2, 'market_created', 'Market created: SpaceX Starship'),
    (3, 'market_created', 'Market created: AVAX $50 Q2'),
    (4, 'market_created', 'Market created: Apple AR WWDC'),
    (5, 'market_created', 'Market created: SOL ETF'),
    (6, 'market_created', 'Market created: Gov Shutdown'),
    (7, 'market_created', 'Market created: AI Nobel Prize'),
    (8, 'market_created', 'Market created: El Salvador BTC');
