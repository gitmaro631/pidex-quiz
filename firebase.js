const firebaseConfig = {
  apiKey:            'AIzaSyD7mL96caMFNv6BxJDU21bLx2Xt9f78WI8',
  authDomain:        'pidex-quiz.firebaseapp.com',
  projectId:         'pidex-quiz',
  storageBucket:     'pidex-quiz.firebasestorage.app',
  messagingSenderId: '235433934182',
  appId:             '1:235433934182:web:272e11233e3a077728dca7',
  measurementId:     'G-09T4TKEYMF',
};

let db = null;

export function initFirebase() {
  if (typeof firebase === 'undefined') return;
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
}

// ── 설문 (UID 기반 중복 방지) ─────────────────────────

export async function loadSurveyFromFirestore(uid) {
  if (!db) initFirebase();
  if (!db || !uid) return null;
  try {
    const doc = await db.collection('surveys').doc(uid).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (e) {
    console.warn('설문 로드 실패:', e);
    return null;
  }
}

export async function saveSurveyToFirestore(uid, answers, completedIds) {
  if (!db) initFirebase();
  if (!db || !uid) return;
  try {
    await db.collection('surveys').doc(uid).set({
      uid,
      answers,
      completedIds: [...completedIds],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.warn('설문 저장 실패:', e);
  }
}

// ── 리더보드 (모드별) ─────────────────────────────────

export async function submitLeaderboardScore(username, score, mode) {
  if (!db) initFirebase();
  const col = `leaderboard_${mode}`;
  try {
    await db.collection(col).add({
      username,
      score,
      mode,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('리더보드 등록 실패:', e);
  }
}

export async function fetchLeaderboard(mode, limit = 100) {
  if (!db) initFirebase();
  const col = `leaderboard_${mode}`;
  try {
    const snap = await db.collection(col)
      .orderBy('score', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error('리더보드 조회 실패:', e);
    return [];
  }
}

// ── 설문 집계 통계 조회 (surveys 컬렉션 기반 — UID당 1문서로 중복 없음) ──
export async function fetchSurveyStats() {
  if (!db) return null;
  try {
    const snap = await db.collection('surveys').get();
    const rows = snap.docs.map(d => d.data().answers ?? {});
    return aggregateStats(rows);
  } catch (e) {
    console.error('통계 조회 실패:', e);
    return null;
  }
}

function aggregateStats(rows) {
  if (rows.length === 0) return { total: 0 };

  const count = (field, value) =>
    rows.filter(r => r[field] === value).length;

  const countAny = (field, value) =>
    rows.filter(r => Array.isArray(r[field]) ? r[field].includes(value) : r[field] === value).length;

  const sectionTotal = (field) =>
    rows.filter(r => r[field] !== undefined && r[field] !== null).length;

  const sectionTotalAny = (field) =>
    rows.filter(r => Array.isArray(r[field]) && r[field].length > 0).length;

  // 국가별 크로스탭
  const byCountry = {};
  for (const r of rows) {
    const cc = r.S_COUNTRY;
    if (!cc) continue;
    if (!byCountry[cc]) byCountry[cc] = { total: 0, kycPassed: 0, kycTotal: 0, nodeRunning: 0, nodeTotal: 0 };
    const c = byCountry[cc];
    c.total++;
    if (r.S_KYC)  { c.kycTotal++;  if (r.S_KYC === 'passed')   c.kycPassed++;  }
    if (r.S_NODE) { c.nodeTotal++; if (r.S_NODE === 'running')  c.nodeRunning++; }
  }

  return {
    total: rows.length,
    kyc: {
      passed:     count('S_KYC', 'passed'),
      failed:     count('S_KYC', 'failed'),
      pending:    count('S_KYC', 'pending'),
      notTried:   count('S_KYC', 'notTried'),
      _total:     sectionTotal('S_KYC'),
    },
    node: {
      running:    count('S_NODE', 'running'),
      stopped:    count('S_NODE', 'stopped'),
      planning:   count('S_NODE', 'planning'),
      noInterest: count('S_NODE', 'noInterest'),
      _total:     sectionTotal('S_NODE'),
    },
    tradeExp: {
      p2p:        countAny('S_TRADE_EXP', 'p2p'),
      exchange:   countAny('S_TRADE_EXP', 'exchange'),
      barter:     countAny('S_TRADE_EXP', 'barter'),
      dexApp:     countAny('S_TRADE_EXP', 'dexApp'),
      none:       countAny('S_TRADE_EXP', 'none'),
      _total:     sectionTotalAny('S_TRADE_EXP'),
    },
    byCountry,
    countriesTotal: sectionTotal('S_COUNTRY'),
  };
}
