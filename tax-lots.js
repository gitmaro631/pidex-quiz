// FIFO / 이동평균법 로트 기반 취득원가 계산 — 순수 함수, DOM/Firestore/i18n 의존 없음.
// entries: [{ ts: number(ms), direction: 'in'|'out', qty: number, unitPrice: number }] (오름차순 정렬은 함수 내부에서 처리)

function sortAsc(entries) {
  return [...entries].sort((a, b) => a.ts - b.ts);
}

export function computeFifoLots(entries) {
  const lots = []; // { ts, qty, unitCost } — 앞에서부터 소진(먼저 들어온 것부터)
  const disposals = [];

  for (const e of sortAsc(entries)) {
    if (e.direction === 'in') {
      lots.push({ ts: e.ts, qty: e.qty, unitCost: e.unitPrice });
      continue;
    }
    // out — 오래된 lot부터 소진
    let remaining = e.qty;
    let costBasis = 0;
    while (remaining > 1e-12 && lots.length) {
      const lot = lots[0];
      const consumed = Math.min(lot.qty, remaining);
      costBasis += consumed * lot.unitCost;
      lot.qty -= consumed;
      remaining -= consumed;
      if (lot.qty <= 1e-12) lots.shift();
    }
    const proceeds = e.qty * e.unitPrice;
    disposals.push({
      ts: e.ts,
      qty: e.qty,
      proceeds,
      costBasis,
      gain: proceeds - costBasis,
      shortfall: remaining > 1e-12 ? remaining : 0, // 보유량보다 많이 처분한 경우(데이터 누락 등) — 0이 정상
    });
  }

  return {
    disposals,
    remainingLots: lots.filter(l => l.qty > 1e-12).map(l => ({ ts: l.ts, qty: l.qty, unitCost: l.unitCost })),
  };
}

export function computeMovingAvgLots(entries) {
  let qty = 0;
  let avgCost = 0;
  const disposals = [];

  for (const e of sortAsc(entries)) {
    if (e.direction === 'in') {
      const totalCost = qty * avgCost + e.qty * e.unitPrice;
      qty += e.qty;
      avgCost = qty > 1e-12 ? totalCost / qty : 0;
      continue;
    }
    // out — 평균단가는 처분으로 변하지 않음
    const disposeQty = Math.min(e.qty, qty);
    const costBasis  = disposeQty * avgCost;
    const proceeds   = e.qty * e.unitPrice;
    qty -= disposeQty;
    disposals.push({
      ts: e.ts,
      qty: e.qty,
      proceeds,
      costBasis,
      gain: proceeds - costBasis,
      shortfall: e.qty - disposeQty > 1e-12 ? e.qty - disposeQty : 0,
    });
  }

  return {
    disposals,
    remainingLots: qty > 1e-12 ? { qty, avgCost } : { qty: 0, avgCost: 0 },
  };
}
