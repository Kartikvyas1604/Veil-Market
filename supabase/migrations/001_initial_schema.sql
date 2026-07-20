-- VEIL Database Schema
-- Supabase migration for the VEIL prediction market backend
--
-- SECURITY INVARIANT (must be documented in every table):
-- No table in this database may store plaintext bet amounts or directions.
-- The only plaintext bet data exists in:
--   1. The user's browser during bet placement (their key)
--   2. The on-chain auditor-settlement flow after resolution
-- If a plaintext bet amount ever touches this database, that is a CRITICAL BUG.

-- ─── Extension Setup ───────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ─────────────────────────────────────────────────────────

CREATE TYPE market_status AS ENUM ('active', 'resolution_pending', 'resolved', 'disputed');
CREATE TYPE outcome AS ENUM ('none', 'yes', 'no');

-- ─── Users (SIWE-authenticated) ────────────────────────────────────
-- Stores only wallet addresses. No passwords, no emails, no PII.
-- Authentication is handled by SIWE + Supabase Auth.

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_address TEXT UNIQUE NOT NULL,
    chain_id INTEGER NOT NULL DEFAULT 43114,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);

-- ─── Raw Events (staging table for chain events) ───────────────────
-- This is the audit trail. Raw chain events land here first,
-- then get projected into the clean tables below.
-- This makes it safe to replay from an earlier block if projection
-- logic has a bug.

CREATE TABLE raw_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_name TEXT NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash TEXT NOT NULL,
    log_index INTEGER NOT NULL,
    contract_address TEXT NOT NULL,
    args JSONB NOT NULL,
    indexed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    UNIQUE(transaction_hash, log_index)
);

CREATE INDEX idx_raw_events_unprocessed ON raw_events(processed) WHERE NOT processed;
CREATE INDEX idx_raw_events_block ON raw_events(block_number);

-- ─── Markets (mirrored from on-chain) ──────────────────────────────
-- Market metadata for fast reads. The source of truth is the
-- VeilFactory contract on-chain.

CREATE TABLE markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id BIGINT UNIQUE NOT NULL,
    contract_address TEXT NOT NULL,
    question TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    resolution_time TIMESTAMPTZ NOT NULL,
    min_bet NUMERIC NOT NULL DEFAULT 0,
    max_bet NUMERIC NOT NULL DEFAULT 1000000,
    status market_status NOT NULL DEFAULT 'active',
    outcome outcome NOT NULL DEFAULT 'none',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_markets_status ON markets(status);
CREATE INDEX idx_markets_category ON markets(category);
CREATE INDEX idx_markets_resolution ON markets(resolution_time);
CREATE INDEX idx_markets_question_search ON markets USING gin(to_tsvector('english', question));

-- ─── Odds Snapshots (from threshold decryption) ────────────────────
-- Published odds from the threshold decryption mechanism.
-- Only aggregate totals are stored — never individual bet amounts.

CREATE TABLE odds_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id BIGINT NOT NULL REFERENCES markets(market_id),
    round INTEGER NOT NULL,
    yes_total NUMERIC NOT NULL,
    no_total NUMERIC NOT NULL,
    total_bets INTEGER NOT NULL DEFAULT 0,
    yes_odds NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN (yes_total + no_total) > 0
            THEN (yes_total / (yes_total + no_total)) * 100
            ELSE 50
        END
    ) STORED,
    no_odds NUMERIC GENERATED ALWAYS AS (
        CASE
            WHEN (yes_total + no_total) > 0
            THEN (no_total / (yes_total + no_total)) * 100
            ELSE 50
        END
    ) STORED,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(market_id, round)
);

CREATE INDEX idx_odds_market ON odds_snapshots(market_id, round DESC);

-- ─── Position Commitments ──────────────────────────────────────────
-- A commitment proving someone placed a bet in a market.
-- Contains NO amount or direction — only a hash commitment.
-- Row-level security ensures users can only see their own commitments.

CREATE TABLE position_commitments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    market_id BIGINT NOT NULL REFERENCES markets(market_id),
    commitment_hash TEXT NOT NULL,
    nullifier TEXT NOT NULL,
    side INTEGER NOT NULL CHECK (side IN (1, 2)),  -- 1=YES, 2=NO
    block_number BIGINT NOT NULL,
    transaction_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(nullifier)
);

CREATE INDEX idx_commitments_user ON position_commitments(user_id);
CREATE INDEX idx_commitments_market ON position_commitments(market_id);
CREATE INDEX idx_commitments_nullifier ON position_commitments(nullifier);

-- ─── Market Activity Feed ──────────────────────────────────────────
-- Public activity feed for the frontend. No sensitive data.

CREATE TABLE market_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id BIGINT NOT NULL REFERENCES markets(market_id),
    event_type TEXT NOT NULL,  -- 'bet_placed', 'odds_updated', 'resolved', etc.
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_market ON market_activity(market_id, created_at DESC);

-- ─── Row-Level Security Policies ───────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_activity ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own record
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Raw events: only service role can read/write (indexer only)
CREATE POLICY "Service role manages raw events"
    ON raw_events FOR ALL
    USING (auth.role() = 'service_role');

-- Markets: public read, service role write
CREATE POLICY "Markets are publicly readable"
    ON markets FOR SELECT
    USING (true);

CREATE POLICY "Service role manages markets"
    ON markets FOR ALL
    USING (auth.role() = 'service_role');

-- Odds snapshots: public read, service role write
CREATE POLICY "Odds are publicly readable"
    ON odds_snapshots FOR SELECT
    USING (true);

CREATE POLICY "Service role manages odds"
    ON odds_snapshots FOR ALL
    USING (auth.role() = 'service_role');

-- Position commitments: users can only read their own
CREATE POLICY "Users can read own commitments"
    ON position_commitments FOR SELECT
    USING (
        user_id IN (
            SELECT id FROM users
            WHERE wallet_address = (
                SELECT raw->>'wallet_address'
                FROM auth.jwt() AS raw
            )
        )
    );

CREATE POLICY "Service role manages commitments"
    ON position_commitments FOR ALL
    USING (auth.role() = 'service_role');

-- Market activity: public read, service role write
CREATE POLICY "Activity feed is publicly readable"
    ON market_activity FOR SELECT
    USING (true);

CREATE POLICY "Service role manages activity"
    ON market_activity FOR ALL
    USING (auth.role() = 'service_role');

-- ─── Realtime Subscriptions ────────────────────────────────────────
-- Enable realtime for odds updates and activity feed

ALTER PUBLICATION supabase_realtime ADD TABLE odds_snapshots;
ALTER PUBLICATION supabase_realtime ADD TABLE market_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE markets;

-- ─── Helper Functions ──────────────────────────────────────────────

-- Get latest odds for a market
CREATE OR REPLACE FUNCTION get_latest_odds(p_market_id BIGINT)
RETURNS TABLE (
    yes_odds NUMERIC,
    no_odds NUMERIC,
    yes_total NUMERIC,
    no_total NUMERIC,
    total_bets INTEGER,
    published_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        os.yes_odds,
        os.no_odds,
        os.yes_total,
        os.no_total,
        os.total_bets,
        os.published_at
    FROM odds_snapshots os
    WHERE os.market_id = p_market_id
    ORDER BY os.round DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all markets with latest odds (for listing page)
CREATE OR REPLACE FUNCTION get_markets_with_odds()
RETURNS TABLE (
    market_id BIGINT,
    contract_address TEXT,
    question TEXT,
    category TEXT,
    resolution_time TIMESTAMPTZ,
    status market_status,
    outcome outcome,
    yes_odds NUMERIC,
    no_odds NUMERIC,
    total_pool NUMERIC,
    total_bets INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.market_id,
        m.contract_address,
        m.question,
        m.category,
        m.resolution_time,
        m.status,
        m.outcome,
        COALESCE(latest.yes_odds, 50) as yes_odds,
        COALESCE(latest.no_odds, 50) as no_odds,
        COALESCE(latest.yes_total + latest.no_total, 0) as total_pool,
        COALESCE(latest.total_bets, 0) as total_bets
    FROM markets m
    LEFT JOIN LATERAL (
        SELECT os.yes_odds, os.no_odds, os.yes_total, os.no_total, os.total_bets
        FROM odds_snapshots os
        WHERE os.market_id = m.market_id
        ORDER BY os.round DESC
        LIMIT 1
    ) latest ON true
    ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
