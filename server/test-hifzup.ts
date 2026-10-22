import { getDb, calculateNetXp, generateFiveSections, getLocalDateMakassar } from './db';
import { SURAHS_DATA } from '../src/data/surahs';
import { RANKS_DATA, getRankByXp, getRankProgress } from '../src/data/ranks';
import { evaluateInactivityPenalties } from './inactivity';

async function runTests() {
  console.log('=== HIFZUP AUTOMATED VERIFICATION SUITE ===');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`);
      passed++;
    } else {
      console.error(`[FAIL] ${desc}`);
      failed++;
    }
  }

  // 1. Surah Database Verification (Bagian 7 & 22)
  console.log('\n--- 1. Testing 114 Surahs Database ---');
  assert(SURAHS_DATA.length === 114, 'Database has exactly 114 Surahs');
  assert(SURAHS_DATA[0].number === 1 && SURAHS_DATA[0].name === 'Al-Fatihah' && SURAHS_DATA[0].numberOfAyahs === 7, 'Surah 1 is Al-Fatihah with 7 ayahs');
  assert(SURAHS_DATA[113].number === 114 && SURAHS_DATA[113].name === 'An-Nas' && SURAHS_DATA[113].numberOfAyahs === 6, 'Surah 114 is An-Nas with 6 ayahs');
  assert(SURAHS_DATA[1].number === 2 && SURAHS_DATA[1].numberOfAyahs === 286, 'Surah 2 is Al-Baqarah with 286 ayahs');
  assert(SURAHS_DATA[77].number === 78 && SURAHS_DATA[77].numberOfAyahs === 40, 'Surah 78 is An-Naba with 40 ayahs');

  // Verify uniqueness of numbers 1..114
  const nums = new Set(SURAHS_DATA.map(s => s.number));
  assert(nums.size === 114, 'All 114 Surah numbers are unique');

  // 2. Rank System Boundaries (Bagian 11 & 22)
  console.log('\n--- 2. Testing 20 Rank Boundaries ---');
  assert(RANKS_DATA.length === 20, 'Exactly 20 Rank tiers exist');
  assert(getRankByXp(0).name === 'Bronze I', '0 XP is Bronze I');
  assert(getRankByXp(199).name === 'Bronze I', '199 XP is Bronze I');
  assert(getRankByXp(200).name === 'Bronze II', '200 XP is Bronze II');
  assert(getRankByXp(399).name === 'Bronze II', '399 XP is Bronze II');
  assert(getRankByXp(400).name === 'Bronze III', '400 XP is Bronze III');
  assert(getRankByXp(599).name === 'Bronze III', '599 XP is Bronze III');
  assert(getRankByXp(600).name === 'Silver I', '600 XP is Silver I');
  assert(getRankByXp(899).name === 'Silver I', '899 XP is Silver I');
  assert(getRankByXp(900).name === 'Silver II', '900 XP is Silver II');
  assert(getRankByXp(1199).name === 'Silver II', '1199 XP is Silver II');
  assert(getRankByXp(1200).name === 'Silver III', '1200 XP is Silver III');
  assert(getRankByXp(1499).name === 'Silver III', '1499 XP is Silver III');
  assert(getRankByXp(1500).name === 'Gold I', '1500 XP is Gold I');
  assert(getRankByXp(2700).name === 'Platinum I', '2700 XP is Platinum I');
  assert(getRankByXp(4200).name === 'Diamond I', '4200 XP is Diamond I');
  assert(getRankByXp(5999).name === 'Diamond III', '5999 XP is Diamond III');
  assert(getRankByXp(6000).name === 'Heroic', '6000 XP is Heroic');
  assert(getRankByXp(7000).name === 'Elite Heroic', '7000 XP is Elite Heroic');
  assert(getRankByXp(8000).name === 'Master', '8000 XP is Master');
  assert(getRankByXp(9999).name === 'Elite Master', '9999 XP is Elite Master');
  assert(getRankByXp(10000).name === 'Grandmaster', '10000 XP is Grandmaster');
  assert(getRankByXp(15000).name === 'Grandmaster', '15000 XP remains Grandmaster (no upper bound)');

  // 3. Five-Section Partitioning Algorithm (Bagian 8)
  console.log('\n--- 3. Testing 5-Section Partitioning ---');
  const sectionsNaba = generateFiveSections('test-tgt-1', 1, 40);
  assert(sectionsNaba.length === 5, 'Generates exactly 5 sections for An-Naba 1-40');
  assert(sectionsNaba[0].startAyah === 1 && sectionsNaba[4].endAyah === 40, 'Covers complete verse range from 1 to 40');

  // Verify no gaps and no overlaps
  let continuous = true;
  for (let i = 0; i < 4; i++) {
    if (sectionsNaba[i].endAyah + 1 !== sectionsNaba[i + 1].startAyah) {
      continuous = false;
    }
  }
  assert(continuous, 'Sections are contiguous with no gaps or split verses');

  // Verify 4 stages per section with correct XP potential
  const sec1 = sectionsNaba[0];
  assert(sec1.stages.length === 4, 'Section has exactly 4 stages');
  assert(sec1.stages[0].stageNumber === 1 && sec1.stages[0].xpPerRep === 1, 'Stage 1 gives 1 XP/rep');
  assert(sec1.stages[1].stageNumber === 2 && sec1.stages[1].xpPerRep === 2, 'Stage 2 gives 2 XP/rep');
  assert(sec1.stages[2].stageNumber === 3 && sec1.stages[2].xpPerRep === 3, 'Stage 3 gives 3 XP/rep');
  assert(sec1.stages[3].stageNumber === 4 && sec1.stages[3].xpPerRep === 4, 'Stage 4 gives 4 XP/rep');

  // Max XP per section: 5*1 + 5*2 + 5*3 + 5*4 = 5 + 10 + 15 + 20 = 50 XP
  const maxSecXp = sec1.stages.reduce((sum, stg) => sum + (stg.maxRepetitions * stg.xpPerRep), 0);
  assert(maxSecXp === 50, 'Max XP per section is exactly 50 XP');
  const maxTargetXp = 5 * maxSecXp;
  assert(maxTargetXp === 250, 'Max XP per 5-section target is exactly 250 XP');

  // 4. Net XP Calculation & Non-Negative Invariance (Bagian 10 & 13)
  console.log('\n--- 4. Testing Net XP Calculation & Ledger ---');
  const db = getDb();
  const netXpMurid1 = calculateNetXp('usr-murid-1', db);
  assert(netXpMurid1 >= 0, `Net XP for murid1 is non-negative (${netXpMurid1} XP)`);

  // Test net XP never drops below zero even with large penalty
  const testDb = JSON.parse(JSON.stringify(db));
  testDb.xp_transactions.push({
    id: 'test-huge-penalty',
    userId: 'usr-murid-1',
    transactionType: 'sanksi_inaktif',
    amount: -999999,
    reason: 'Test penalty',
    sourceActivity: 'test',
    createdAt: new Date().toISOString()
  });
  const penalizedXp = calculateNetXp('usr-murid-1', testDb);
  assert(penalizedXp === 0, 'Net XP never goes below zero (enforces lower bound 0)');

  // 5. Inactivity Evaluator Testing (Bagian 13)
  console.log('\n--- 5. Testing Inactivity Evaluation ---');
  const evalResult = evaluateInactivityPenalties(db);
  assert(typeof evalResult.penaltiesApplied === 'number', 'Inactivity evaluator runs successfully');

  // 6. Asia/Makassar Timezone check
  const localDate = getLocalDateMakassar();
  assert(/^\d{4}-\d{2}-\d{2}$/.test(localDate), `Asia/Makassar local date format valid: ${localDate}`);

  console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
