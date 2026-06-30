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
