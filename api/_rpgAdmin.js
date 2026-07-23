// 관리자 계정 식별 - 테스트 목적으로 턴포인트 한도 제외 + 골드 랭킹보드에서 제외
export const ADMIN_USERNAME = 'cam1998pi';

export function isAdminUsername(username) {
  return username === ADMIN_USERNAME;
}
