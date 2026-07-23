// 퀘스트 조건 판정 - 순수함수(입출력 없음), 캐릭터 문서에 이미 있는 필드만으로 판정
export function checkQuestCondition(character, condition) {
  switch (condition.type) {
    case 'hasClass':
      return !!character.classMain;
    case 'level':
      return (character.level || 1) >= condition.target;
    case 'zoneKills':
      return ((character.zoneKillCounts || {})[condition.zoneId] || 0) >= condition.target;
    default:
      return false;
  }
}
