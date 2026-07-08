export let currentUser = null;

async function serverApprove(paymentId) {
  const res = await fetch('/api/payments/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId }),
  });
  if (!res.ok) throw new Error(`approve failed: ${res.status}`);
}

async function serverComplete(paymentId, txid, username) {
  const res = await fetch('/api/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, txid, username }),
  });
  if (!res.ok) throw new Error(`complete failed: ${res.status}`);
}

export async function syncSubscription(username) {
  try {
    const res = await fetch(`/api/subscription/status?username=${encodeURIComponent(username)}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.active && data.expiry) {
      localStorage.setItem('quiz_sub_expiry', data.expiry);
      window.dispatchEvent(new CustomEvent('sub:synced'));
    } else if (!data.active) {
      // 서버에 없고 로컬에 유효한 구독이 있으면 서버에 등록 (마이그레이션)
      const localExpiry = localStorage.getItem('quiz_sub_expiry');
      if (localExpiry && new Date(localExpiry) > new Date()) {
        await fetch('/api/subscription/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, expiry: localExpiry }),
        });
        const confirm = await fetch(`/api/subscription/status?username=${encodeURIComponent(username)}`).then(r => r.json());
        if (confirm.active && confirm.expiry) {
          localStorage.setItem('quiz_sub_expiry', confirm.expiry);
          window.dispatchEvent(new CustomEvent('sub:synced'));
        }
      }
    }
  } catch { }
}

async function onIncompletePaymentFound(payment) {
  console.warn('미완료 결제 처리 중:', payment.identifier);
  try {
    if (payment.transaction == null) {
      await serverApprove(payment.identifier);
    } else {
      await serverComplete(payment.identifier, payment.transaction.txid);
    }
  } catch (err) {
    console.error('미완료 결제 처리 실패:', err);
  }
}

export async function initPiSDK() {
  await Pi.init({ version: '2.0', sandbox: false });
}

export async function authenticate() {
  return new Promise((resolve, reject) => {
    Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)
      .then(auth => {
        currentUser = auth.user;
        const username = currentUser?.username;
        if (username) syncSubscription(username);
        resolve(auth);
      })
      .catch(reject);
  });
}

export function createSubscriptionPayment() {
  if (typeof Pi === 'undefined') {
    return Promise.reject(new Error('Pi SDK를 찾을 수 없어요. Pi Browser에서 실행해주세요.'));
  }
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      { amount: 1, memo: 'PiDEX 퀴즈 1개월 이용권', metadata: { app: 'quizpi', type: 'subscription' } },
      {
        onReadyForServerApproval: async (paymentId) => {
          try { await serverApprove(paymentId); } catch (err) { reject(err); }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            await serverComplete(paymentId, txid, currentUser?.username);
            resolve({ paymentId, txid });
          } catch (err) { reject(err); }
        },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}

export function createDonation(amount) {
  if (typeof Pi === 'undefined') {
    return Promise.reject(new Error('Pi SDK를 찾을 수 없어요. Pi Browser에서 실행해주세요.'));
  }
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      {
        amount,
        memo: `퀴즈파이 후원 ${amount}π`,
        metadata: { app: 'quizpi', type: 'donation' },
      },
      {
        onReadyForServerApproval: async (paymentId) => {
          try {
            await serverApprove(paymentId);
          } catch (err) {
            reject(err);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          try {
            await serverComplete(paymentId, txid);
            resolve({ paymentId, txid });
          } catch (err) {
            reject(err);
          }
        },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}
