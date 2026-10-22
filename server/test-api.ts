async function runApiTests() {
  console.log('=== HIFZUP HTTP ENDPOINTS & RBAC INTEGRATION TESTS ===');
  const BASE = 'http://localhost:3000/api';
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

  try {
    // 1. Murid Login
    const muridLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'murid1', password: 'murid123', expectedRole: 'murid' })
    });
    const muridLoginData = await muridLoginRes.json();
    assert(muridLoginRes.status === 200 && !!muridLoginData.token, 'Murid1 login succeeds and returns JWT token');
    const muridToken = muridLoginData.token;

    // 2. Guru Login
    const guruLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'guru1', password: 'guru123', expectedRole: 'guru' })
    });
    const guruLoginData = await guruLoginRes.json();
    assert(guruLoginRes.status === 200 && guruLoginData.profile.role === 'guru', 'Guru1 login succeeds with role "guru"');
    const guruToken = guruLoginData.token;

    // 3. Admin Login
    const adminLoginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginData.profile.role === 'admin', 'Admin login succeeds with role "admin"');
    const adminToken = adminLoginData.token;

    // 4. RBAC Check: Murid cannot access Teacher endpoint
    const rbacRes = await fetch(`${BASE}/teacher/students`, {
      headers: { 'Authorization': `Bearer ${muridToken}` }
    });
    assert(rbacRes.status === 403, 'Murid is blocked from accessing teacher endpoint (403 Forbidden)');

    // 5. Surah Database Endpoint
    const surahsRes = await fetch(`${BASE}/surahs`);
    const surahsData = await surahsRes.json();
    assert(surahsData.total === 114 && surahsData.surahs.length === 114, 'GET /api/surahs returns all 114 Surahs');

    // 6. Create Target Hafalan
    const targetCreateRes = await fetch(`${BASE}/targets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muridToken}`
      },
      body: JSON.stringify({
        surahNumber: 67, // Al-Mulk
        startAyah: 1,
        endAyah: 30,
        title: 'Target Uji Surah Al-Mulk (1-30)'
      })
    });
    const targetCreateData = await targetCreateRes.json();
    assert(targetCreateRes.status === 201 && targetCreateData.target.sections.length === 5, 'Create Target succeeds with 5 partitions');
    const targetId = targetCreateData.target.id;

    // 7. Record Stage Repetition (Tahap 1 = 1 XP)
    const repRes = await fetch(`${BASE}/targets/${targetId}/stage-rep`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muridToken}`
      },
      body: JSON.stringify({
        sectionNumber: 1,
        stageNumber: 1
      })
    });
    const repData = await repRes.json();
    assert(repRes.status === 200 && repData.xpAwarded === 1, 'Stage 1 rep successfully awards exactly 1 XP');

    // 8. Murajaah Session
    const mrjSessRes = await fetch(`${BASE}/murajaah/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muridToken}`
      },
      body: JSON.stringify({ surahNumber: 78 })
    });
    const mrjSessData = await mrjSessRes.json();
    const sessionId = mrjSessData.session.id;

    // Step to 75
    for (let i = 0; i < 75; i++) {
      await fetch(`${BASE}/murajaah/step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${muridToken}`
        },
        body: JSON.stringify({ sessionId, delta: 1 })
      });
    }

    // Complete 75 Murajaah -> Claims 300 XP
    const compRes = await fetch(`${BASE}/murajaah/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muridToken}`
      },
      body: JSON.stringify({ sessionId })
    });
    const compData = await compRes.json();
    assert(compRes.status === 200 && compData.xpAwarded === 300, 'Completing 75-repetition Murajaah session awards exactly 300 XP');

    // Try completing again (Duplicate prevention check)
    const dupRes = await fetch(`${BASE}/murajaah/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${muridToken}`
      },
      body: JSON.stringify({ sessionId })
    });
    assert(dupRes.status === 400, 'Duplicate completion of same Murajaah session is rejected (400 Bad Request)');

    // 9. Teacher Bonus XP
    const bonusRes = await fetch(`${BASE}/teacher/bonus-xp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${guruToken}`
      },
      body: JSON.stringify({
        studentId: 'usr-murid-1',
        amount: 150,
        reason: 'Uji coba apresiasi makharijul huruf fasih'
      })
    });
    const bonusData = await bonusRes.json();
    assert(bonusRes.status === 200, 'Teacher can award +150 bonus XP with mandatory reason');

    // 10. Admin Summary & Audit Logs
    const adminSumRes = await fetch(`${BASE}/admin/summary`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminSumData = await adminSumRes.json();
    assert(adminSumRes.status === 200 && adminSumData.summary.totalMurid >= 1, 'Admin summary successfully calculates system statistics');

    console.log(`\n=== API INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (err) {
    console.error('API Test Error:', err);
  }
}

runApiTests();
