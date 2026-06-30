export let currentUser = null;

export function initPiSDK() {
  Pi.init({ version: '2.0', sandbox: true });
}

export async function authenticate() {
  return new Promise((resolve, reject) => {
    Pi.authenticate(['username'], onIncompletePaymentFound)
      .then(auth => { currentUser = auth.user; resolve(auth); })
      .catch(reject);
  });
}

function onIncompletePaymentFound(payment) {
  console.warn('미완료 결제 발견:', payment.identifier);
}

export function createDonation(amount) {
  if (typeof Pi === 'undefined') {
    return Promise.reject(new Error('Pi SDK를 찾을 수 없어요. Pi Browser에서 실행해주세요.'));
  }
  return new Promise((resolve, reject) => {
    Pi.createPayment(
      {
        amount,
        memo: `pidex 유틸 후원 ${amount}π`,
        metadata: { app: 'pidex_quiz', type: 'donation' },
      },
      {
        onReadyForServerApproval: (paymentId) => {
          // 프로덕션: 백엔드 서버에서 /v2/payments/{paymentId}/approve 호출 필요
          console.log('[Donation] ready for approval:', paymentId);
        },
        onReadyForServerCompletion: (paymentId, txid) => {
          // 프로덕션: 백엔드 서버에서 /v2/payments/{paymentId}/complete 호출 필요
          console.log('[Donation] complete:', paymentId, txid);
          resolve({ paymentId, txid });
        },
        onCancel: () => reject(new Error('cancelled')),
        onError: (err) => reject(err),
      }
    );
  });
}
