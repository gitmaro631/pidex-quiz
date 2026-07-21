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

// 컬렉션 전체를 읽어 각 문서의 필드만 배열로 반환 (페이지네이션 자동 처리)
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
    for (const doc of (data.documents || [])) documents.push(decodeFirestoreFields(doc.fields || {}));
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
