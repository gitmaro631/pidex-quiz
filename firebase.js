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

// ── 설문 응답 저장 ────────────────────────────────────
export async function submitSurveyAnswers(answers) {
  if (!db) return;
  try {
    await db.collection('survey_responses').add({
      ...answers,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('설문 저장 실패:', e);
  }
}

// ── 설문 집계 통계 조회 ───────────────────────────────
export async function fetchSurveyStats() {
  if (!db) return null;
  try {
    const snap = await db.collection('survey_responses').get();
    const rows = snap.docs.map(d => d.data());
    return aggregateStats(rows);
  } catch (e) {
    console.error('통계 조회 실패:', e);
    return null;
  }
}

function aggregateStats(rows) {
  const total = rows.length;
  if (total === 0) return { total: 0 };

  const count = (field, value) =>
    rows.filter(r => r[field] === value).length;

  const countAny = (field, value) =>
    rows.filter(r => Array.isArray(r[field]) ? r[field].includes(value) : r[field] === value).length;

  return {
    total,
    kyc: {
      passed:     count('kyc', 'passed'),
      failed:     count('kyc', 'failed'),
      pending:    count('kyc', 'pending'),
      notTried:   count('kyc', 'notTried'),
    },
    node: {
      running:    count('node', 'running'),
      stopped:    count('node', 'stopped'),
      planning:   count('node', 'planning'),
      noInterest: count('node', 'noInterest'),
    },
    tradeExp: {
      p2p:        countAny('tradeExp', 'p2p'),
      exchange:   countAny('tradeExp', 'exchange'),
      barter:     countAny('tradeExp', 'barter'),
      dex:        countAny('tradeExp', 'dex'),
      none:       countAny('tradeExp', 'none'),
    },
    // 국가 집계는 별도 처리
    countries: rows.reduce((acc, r) => {
      if (r.country) acc[r.country] = (acc[r.country] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
