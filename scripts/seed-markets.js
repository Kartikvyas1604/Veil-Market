const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://litliaewcjjejsmfvhzm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpdGxpYWV3Y2pqZWpzbWZ2aHptIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDUzODgzNCwiZXhwIjoyMTAwMTE0ODM0fQ.juK571vT00jODkGAtd6-c8Pxa1Y97Ix9e1zk3v2OBx8'
);

const now = Date.now();

const markets = [
  {
    market_id: 0,
    contract_address: '0x267d26baa8db42ab48fe14a46c7817d1b8d2874a',
    question: 'Will the Federal Reserve cut rates in January 2026?',
    category: 'Macro',
    resolution_time: new Date(now + 90 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
  {
    market_id: 1,
    contract_address: '0x5623bb61472a3cf50351f179f522ad7b538d1081',
    question: 'Will Bitcoin exceed $150,000 before end of Q1 2026?',
    category: 'Crypto',
    resolution_time: new Date(now + 60 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
  {
    market_id: 2,
    contract_address: '0xcec4ed16f4f662a230de0da133db1fec81774f93',
    question: 'Will SpaceX Starship complete a full orbital mission by March 2026?',
    category: 'Science',
    resolution_time: new Date(now + 45 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
  {
    market_id: 3,
    contract_address: '0xffdbf9c9f35242dec8c106f425b0d658adf252fd',
    question: 'Will AVAX token price exceed $50 by end of Q2 2026?',
    category: 'Crypto',
    resolution_time: new Date(now + 120 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
  {
    market_id: 4,
    contract_address: '0xd3ddee3341d08a15bc6c9a189eb7300518eae45f',
    question: 'Will Apple announce a new AR headset at WWDC 2026?',
    category: 'Tech',
    resolution_time: new Date(now + 75 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
  {
    market_id: 5,
    contract_address: '0x631b2bb1693467c9498582040a61765ecf260016',
    question: 'Will a Solana spot ETF be approved by the SEC in 2026?',
    category: 'Crypto',
    resolution_time: new Date(now + 180 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
  {
    market_id: 6,
    contract_address: '0xbdb5fce61372fb6424dbb3336373842ee27ba59b',
    question: 'Will the US federal government experience a shutdown in 2026?',
    category: 'Politics',
    resolution_time: new Date(now + 200 * 24 * 3600 * 1000).toISOString(),
    min_bet: 0.1,
    max_bet: 1000,
    status: 'active',
    outcome: 'none',
  },
];

async function seed() {
  // Delete any old mock or stale markets
  const { error: delErr } = await supabase
    .from('markets')
    .delete()
    .ilike('contract_address', '0xMockContract%');
  if (delErr) console.error('Delete mock error:', delErr.message);
  else console.log('Cleaned up old mock markets');

  // Delete by market_id range to avoid conflicts
  await supabase.from('markets').delete().in('market_id', [0, 1, 2, 3, 4, 5, 6]);
  console.log('Cleared old market_id range');

  for (const market of markets) {
    const { data, error } = await supabase.from('markets').insert(market).select().single();
    if (error) {
      console.error(`Failed to insert market ${market.market_id}:`, error.message);
    } else {
      console.log(`✓ Market ${market.market_id}: ${market.question.slice(0, 50)}...`);
    }
  }
  console.log('\nDone! Restart your dev server to see fresh markets.');
}

seed().catch(console.error);
