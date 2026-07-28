// 골드 경매장 공용 헬퍼 - api/_rpg/*.js(등록/취소/조회)와 api/payments/*.js(예약/체결) 양쪽에서 씀.
// 리스팅은 rpg_gold_listings/{listingId} 문서 하나씩(캐릭터 문서와 별개 컬렉션).
export const RESERVATION_TIMEOUT_MS = 20 * 60 * 1000; // 결제가 이 시간 안에 안 끝나면 예약을 풀고 다시 판매 가능하게

export function goldListingDocPath(listingId) {
  return `rpg_gold_listings/${listingId}`;
}

// status 필드를 그대로 믿지 않고, reserved 상태가 타임아웃을 넘겼으면 open으로 취급(크론 없이
// 읽는 시점에 스스로 풀리는 방식 - 이 프로젝트의 턴포인트 회복과 같은 패턴)
export function effectiveListingStatus(listing) {
  if (!listing) return null;
  if (listing.status === 'reserved' && Date.now() - (listing.reservedAt || 0) > RESERVATION_TIMEOUT_MS) return 'open';
  return listing.status;
}
