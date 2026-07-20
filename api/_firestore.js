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
