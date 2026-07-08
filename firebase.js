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

export async function submitLeaderboardScore(username, score, mode, country = '') {
  if (!db) initFirebase();
  const col    = `leaderboard_${mode}`;
  const docRef = db.collection(col).doc(username);
  try {
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists || score > doc.data().score) {
        tx.set(docRef, {
          username,
          score,
          mode,
          country,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
  } catch (e) {
    console.error('리더보드 등록 실패:', e);
  }
}

export async function updateLeaderboardCountry(username, country) {
  if (!db) initFirebase();
  if (!username || !country) return;
  const modes = ['miner', 'pioneer', 'validator'];
  await Promise.all(modes.map(async (m) => {
    const docRef = db.collection(`leaderboard_${m}`).doc(username);
    try {
      const doc = await docRef.get();
      if (doc.exists && !doc.data().country) {
        await docRef.update({ country });
      }
    } catch (e) {
      console.warn(`country 업데이트 실패(${m}):`, e);
    }
  }));
}

export async function fetchLeaderboard(mode, limit = 100) {
  if (!db) initFirebase();
  const col = `leaderboard_${mode}`;
  try {
    const snap = await db.collection(col)
      .orderBy('score', 'desc')
      .limit(limit)
      .get();
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // 기존 중복 데이터 클라이언트 중복 제거 (username별 최고점수만)
    const seen = new Map();
    for (const row of rows) {
      if (!seen.has(row.username) || row.score > seen.get(row.username).score) {
        seen.set(row.username, row);
      }
    }
    return [...seen.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (e) {
    console.error('리더보드 조회 실패:', e);
    return [];
  }
}

export async function migrateLeaderboard() {
  if (!db) initFirebase();
  const modes = ['miner', 'pioneer', 'validator'];
  for (const mode of modes) {
    const col  = `leaderboard_${mode}`;
    const snap = await db.collection(col).get();
    if (snap.empty) continue;

    // username별 최고점수 doc 찾기
    const best = new Map();
    for (const doc of snap.docs) {
      const { username, score } = doc.data();
      if (!username) continue;
      if (!best.has(username) || score > best.get(username).score) {
        best.set(username, { ...doc.data(), _docId: doc.id });
      }
    }

    // username을 doc ID로 최고점수 저장
    for (const [username, data] of best) {
      const { _docId, ...fields } = data;
      await db.collection(col).doc(username).set({
        ...fields,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    }

    // auto-generated ID 문서(구형 중복 데이터) 삭제
    const toDelete = snap.docs.filter(doc => doc.id !== doc.data().username);
    for (let i = 0; i < toDelete.length; i += 500) {
      const batch = db.batch();
      toDelete.slice(i, i + 500).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }
  }
}

// ── 앱 의견 ──────────────────────────────────────────
export async function submitOpinion(username, text) {
  if (!db) initFirebase();
  await db.collection('quiz_opinions').add({
    author:    username,
    text,
    likes:     0,
    likedBy:   [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function fetchOpinions() {
  if (!db) initFirebase();
  const snap = await db.collection('quiz_opinions')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOpinion(docId, text) {
  if (!db) initFirebase();
  await db.collection('quiz_opinions').doc(docId).update({ text });
}

export async function deleteOpinion(docId) {
  if (!db) initFirebase();
  await db.collection('quiz_opinions').doc(docId).delete();
}

export async function toggleOpinionLike(docId, username, isLiked) {
  if (!db) initFirebase();
  const ref = db.collection('quiz_opinions').doc(docId);
  await ref.update({
    likes:   firebase.firestore.FieldValue.increment(isLiked ? -1 : 1),
    likedBy: isLiked
      ? firebase.firestore.FieldValue.arrayRemove(username)
      : firebase.firestore.FieldValue.arrayUnion(username),
  });
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
