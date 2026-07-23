import crypto from 'crypto';

const PROJECT_ID = 'pidex-quiz';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

async function getFirestoreAccessToken() {
  const keyB64 = process.env.FIRESTORE_SA_KEY_B64;
  if (!keyB64) throw new Error('FIRESTORE_SA_KEY_B64 not configured');
  const key = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(key.private_key).toString('base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error('Firestore auth failed');
  return data.access_token;
}

function decodeFirestoreValue(v) {
  if (!v || v.nullValue !== undefined) return null;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(decodeFirestoreValue);
  if (v.mapValue !== undefined) return decodeFirestoreFields(v.mapValue.fields || {});
  return null;
}

function decodeFirestoreFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeFirestoreValue(v);
  return out;
}

function encodeFirestoreValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeFirestoreValue) } };
  if (typeof v === 'object') return { mapValue: { fields: encodeFirestoreFields(v) } };
  return { nullValue: null };
}

function encodeFirestoreFields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = encodeFirestoreValue(v);
  return out;
}

// 컬렉션 전체를 읽어 각 문서의 필드를 배열로 반환 (페이지네이션 자동 처리)
// 문서 ID는 `id` 필드로 함께 반환(필드에 별도 id가 없는 컬렉션에서도 항상 참조 가능하게)
export async function firestoreListCollection(collectionPath) {
  const token = await getFirestoreAccessToken();
  const documents = [];
  let pageToken;
  do {
    const url = new URL(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}`);
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Firestore list failed: ${res.status}`);
    const data = await res.json();
    for (const doc of (data.documents || [])) {
      const id = (doc.name || '').split('/').pop();
      documents.push({ id, ...decodeFirestoreFields(doc.fields || {}) });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return documents;
}

export async function firestoreGetDoc(docPath) {
  const token = await getFirestoreAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Firestore get failed: ${res.status}`);
  const data = await res.json();
  return decodeFirestoreFields(data.fields || {});
}

// 문서를 통째로 덮어씀 (merge 아님)
export async function firestoreSetDoc(docPath, data) {
  const token = await getFirestoreAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: encodeFirestoreFields(data) }),
  });
  if (!res.ok) throw new Error(`Firestore set failed: ${res.status}`);
  return res.json();
}

// firestoreGetDoc과 동일하지만, 낙관적 동시성 제어에 쓸 updateTime도 함께 반환
export async function firestoreGetDocWithMeta(docPath) {
  const token = await getFirestoreAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return { fields: null, updateTime: null };
  if (!res.ok) throw new Error(`Firestore get failed: ${res.status}`);
  const data = await res.json();
  return { fields: decodeFirestoreFields(data.fields || {}), updateTime: data.updateTime };
}

// currentDocument.updateTime precondition을 건 커밋 — 그 사이 문서가 바뀌었으면 실패(409/412)
export async function firestoreCommitUpdate(docPath, data, expectedUpdateTime) {
  const token = await getFirestoreAccessToken();
  const name = `projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`;
  const currentDocument = expectedUpdateTime
    ? { updateTime: expectedUpdateTime }
    : { exists: false };
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: [{
        update: { name, fields: encodeFirestoreFields(data) },
        currentDocument,
      }],
    }),
  });
  if (res.status === 409 || res.status === 412) {
    const err = new Error('Firestore precondition failed (document changed concurrently)');
    err.code = 'PRECONDITION_FAILED';
    throw err;
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Firestore commit failed: ${res.status} ${bodyText}`);
  }
  return res.json();
}

// 읽기 -> updateFn(현재값)로 다음 상태 계산 -> precondition 걸어 커밋 -> 충돌시 재시도
// 골드/턴포인트/아이템 등 실질 가치가 있는 자원의 모든 변경은 이 헬퍼를 통해서만 수행할 것
export async function withFirestoreTransaction(docPath, updateFn, { maxRetries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { fields, updateTime } = await firestoreGetDocWithMeta(docPath);
    const nextData = await updateFn(fields);
    if (nextData === null || nextData === undefined) return fields; // 변경 없음
    try {
      await firestoreCommitUpdate(docPath, nextData, updateTime);
      return nextData;
    } catch (err) {
      lastErr = err;
      if (err.code !== 'PRECONDITION_FAILED') throw err;
      // 재시도 전 짧게 대기(동시 요청 몰림 완화)
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
    }
  }
  throw lastErr || new Error('Firestore transaction failed after retries');
}

// 여러 문서를 한 :commit 호출에 담아 원자적으로 커밋 - Firestore commit은 transaction 없이도
// 같은 요청 안의 writes 전체가 원자적으로 적용됨(부분 반영 없음). 마켓 거래처럼 문서 여러 개를
// 동시에 바꿔야 하는 경우(리스팅+구매자+판매자) 이 헬퍼로 정합성을 보장한다.
async function firestoreCommitMulti(writes) {
  const token = await getFirestoreAccessToken();
  const body = {
    writes: writes.map(({ docPath, data, expectedUpdateTime }) => ({
      update: { name: `projects/${PROJECT_ID}/databases/(default)/documents/${docPath}`, fields: encodeFirestoreFields(data) },
      currentDocument: expectedUpdateTime ? { updateTime: expectedUpdateTime } : { exists: false },
    })),
  };
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.status === 409 || res.status === 412) {
    const err = new Error('Firestore precondition failed (document changed concurrently)');
    err.code = 'PRECONDITION_FAILED';
    throw err;
  }
  if (!res.ok) {
    const bodyText = await res.text().catch(() => '');
    throw new Error(`Firestore multi-commit failed: ${res.status} ${bodyText}`);
  }
  return res.json();
}

// docPaths 전부를 읽어 updateFn({docPath: fields|null})에 넘기고, updateFn이 반환한
// {docPath: nextData|null}(null이면 그 문서는 변경 없음)을 한 번에 원자적으로 커밋. 충돌시 재시도.
export async function withMultiDocTransaction(docPaths, updateFn, { maxRetries = 3 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const metaByPath = {};
    const fieldsByPath = {};
    for (const p of docPaths) {
      const { fields, updateTime } = await firestoreGetDocWithMeta(p);
      metaByPath[p] = updateTime;
      fieldsByPath[p] = fields;
    }
    const patchByPath = await updateFn(fieldsByPath);
    const writes = docPaths
      .filter((p) => patchByPath[p] !== null && patchByPath[p] !== undefined)
      .map((p) => ({ docPath: p, data: patchByPath[p], expectedUpdateTime: metaByPath[p] }));
    if (!writes.length) return patchByPath; // 변경 없음(에러/조건불충족 등)
    try {
      await firestoreCommitMulti(writes);
      return patchByPath;
    } catch (err) {
      lastErr = err;
      if (err.code !== 'PRECONDITION_FAILED') throw err;
      await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
    }
  }
  throw lastErr || new Error('Firestore multi-doc transaction failed after retries');
}

export async function setOpinionAdminHiddenServer(docId, hide) {
  const token = await getFirestoreAccessToken();
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/quiz_opinions/${encodeURIComponent(docId)}?updateMask.fieldPaths=adminHidden`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { adminHidden: { booleanValue: !!hide } } }),
  });
  if (!res.ok) throw new Error(`Firestore update failed: ${res.status}`);
  return res.json();
}
