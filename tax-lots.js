// FIFO / 이동평균법 로트 기반 취득원가 계산 — 순수 함수, DOM/Firestore/i18n 의존 없음.
// entries: [{ ts: number(ms), direction: 'in'|'out', qty: number, unitPrice: number, unitPriceKrw?: number }]
// unitPriceKrw는 선택 필드 — 넘기면 원화 기준 취득원가/처분가/손익도 같이 계산됨(각 in 시점 자신의 환율로 환산).
// 어느 한 로트라도 unitPriceKrw가 없으면 그 이후 원화 계산은 조용히 중단(null)됨 — 잘못된 값을 섞어 보여주지 않기 위함.

function sortAsc(entries) {
  return [...entries].sort((a, b) => a.ts - b.ts);
}

export function computeFifoLots(entries) {
  const lots = []; // { ts, qty, unitCost, unitCostKrw } — 앞에서부터 소진(먼저 들어온 것부터)
  const disposals = [];

  for (const e of sortAsc(entries)) {
    if (e.direction === 'in') {
      lots.push({ ts: e.ts, qty: e.qty, unitCost: e.unitPrice, unitCostKrw: e.unitPriceKrw });
      continue;
    }
    // out — 오래된 lot부터 소진
    let remaining = e.qty;
    let costBasis = 0;
    let costBasisKrw = 0;
    let krwOk = true;
    while (remaining > 1e-12 && lots.length) {
      const lot = lots[0];
      const consumed = Math.min(lot.qty, remaining);
      costBasis += consumed * lot.unitCost;
      if (lot.unitCostKrw != null) costBasisKrw += consumed * lot.unitCostKrw;
      else krwOk = false;
      lot.qty -= consumed;
      remaining -= consumed;
      if (lot.qty <= 1e-12) lots.shift();
    }
    const proceeds = e.qty * e.unitPrice;
    const hasKrw = krwOk && e.unitPriceKrw != null;
    const proceedsKrw = hasKrw ? e.qty * e.unitPriceKrw : null;
    disposals.push({
      ts: e.ts,
      qty: e.qty,
      proceeds,
      costBasis,
      gain: proceeds - costBasis,
      proceedsKrw,
      costBasisKrw: hasKrw ? costBasisKrw : null,
      gainKrw: hasKrw ? (proceedsKrw - costBasisKrw) : null,
      shortfall: remaining > 1e-12 ? remaining : 0, // 보유량보다 많이 처분한 경우(데이터 누락 등) — 0이 정상
    });
  }

  return {
    disposals,
    remainingLots: lots.filter(l => l.qty > 1e-12).map(l => ({ ts: l.ts, qty: l.qty, unitCost: l.unitCost, unitCostKrw: l.unitCostKrw })),
  };
}

export function computeMovingAvgLots(entries) {
  let qty = 0;
  let avgCost = 0;
  let avgCostKrw = 0;
  let krwOk = true;
  const disposals = [];

  for (const e of sortAsc(entries)) {
    if (e.direction === 'in') {
      const totalCost = qty * avgCost + e.qty * e.unitPrice;
      if (e.unitPriceKrw == null) krwOk = false;
      const totalCostKrw = krwOk ? (qty * avgCostKrw + e.qty * e.unitPriceKrw) : 0;
      qty += e.qty;
      avgCost = qty > 1e-12 ? totalCost / qty : 0;
      avgCostKrw = (krwOk && qty > 1e-12) ? totalCostKrw / qty : 0;
      continue;
    }
    // out — 평균단가는 처분으로 변하지 않음
    const disposeQty = Math.min(e.qty, qty);
    const costBasis  = disposeQty * avgCost;
    const proceeds   = e.qty * e.unitPrice;
    const hasKrw = krwOk && e.unitPriceKrw != null;
    const costBasisKrw = hasKrw ? disposeQty * avgCostKrw : null;
    const proceedsKrw  = hasKrw ? e.qty * e.unitPriceKrw : null;
    qty -= disposeQty;
    disposals.push({
      ts: e.ts,
      qty: e.qty,
      proceeds,
      costBasis,
      gain: proceeds - costBasis,
      proceedsKrw,
      costBasisKrw,
      gainKrw: hasKrw ? (proceedsKrw - costBasisKrw) : null,
      shortfall: e.qty - disposeQty > 1e-12 ? e.qty - disposeQty : 0,
    });
  }

  return {
    disposals,
    remainingLots: qty > 1e-12 ? { qty, avgCost, avgCostKrw: krwOk ? avgCostKrw : null } : { qty: 0, avgCost: 0, avgCostKrw: 0 },
  };
}
