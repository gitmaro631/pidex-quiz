// 던전 성 점령전 - 한 지역을 100회 공략 성공하면 그 지역의 "성"에 도전할 수 있음. 성이 비어있으면
// 바로 차지하고, 누가 차지하고 있으면 그 사람이 점령한 시점의 파티 스냅샷(전력치)과 전력치 비교로
// 승패를 가름(실제 턴제 전투가 아니라 확률 판정 - claim-castle.js 참고). 이기면 성주가 바뀌고,
// 성주는 매일 접속시 지역 등급(tier)에 비례한 골드를 받으며, 고등급 지역은 결정/강화석도 일부 받음.
export const CASTLE_CLEAR_REQUIREMENT = 100;
export const CASTLE_ROLL_VARIANCE = [0.85, 1.15]; // 전력치에 곱해지는 판정 시 무작위 범위(양쪽 다 적용)

export const GOLD_INCOME_PER_TIER = 200; // 성주 일일 수입 = 지역 tier x 이 값 (지역이 11단계까지 늘어나며 함께 상향)
export const MATERIAL_BONUS_MIN_TIER = 3; // 이 tier 이상 지역의 성주는 결정/강화석도 추가로 받음
export const MATERIAL_BONUS_QTY = 3;

export function castleDocPath(zoneId) {
  return `rpg_castles/${zoneId}`;
}
