// 영지 시설(facilityDays/facilityLevels)은 계정 단위로 공유 - 같은 유저의 일반 캐릭터(1~MAX_CHARACTER_SLOTS)가
// 전부 같은 시설 등급을 씀(용병 배치/작업 배정은 그대로 캐릭터별 - 시설 "등급"만 공유). account-storage.js
// (이송상자)와 같은 원칙으로 캐릭터 문서와 별개의 계정 문서(rpg_account_facilities/{username})에 저장.
// 단, 관리자 테스트슬롯(MAX_CHARACTER_SLOTS를 넘는 슬롯)은 일반 슬롯들과 완전히 분리된 별도 문서를 씀 -
// 테스트 플레이가 실제 계정의 공유 시설 진행도를 건드리면 안 되기 때문
import { encodeFirestorePathSegment } from './_firestore.js';
import { MAX_CHARACTER_SLOTS } from './_rpgCharacter.js';

export function accountFacilitiesDocPath(username, slot) {
  const isTestSlot = Number(slot) > MAX_CHARACTER_SLOTS;
  const suffix = isTestSlot ? `__test${slot}` : '';
  return `rpg_account_facilities/${encodeFirestorePathSegment(username)}${suffix}`;
}

const FACILITY_IDS = ['clearing', 'training', 'ramparts', 'farm', 'hospital', 'morale', 'sanctum', 'basics'];

export function defaultAccountFacilities() {
  const facilityDays = {};
  const facilityLevels = {};
  for (const id of FACILITY_IDS) { facilityDays[id] = 0; facilityLevels[id] = 0; }
  return { facilityDays, facilityLevels };
}
