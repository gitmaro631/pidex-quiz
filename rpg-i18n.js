// RPG 표시용 이름 조회 헬퍼 - 로케일 키(locales/ko.js의 rpg.* 항목)를 우선 쓰고, 키가 없으면
// data/rpg/*.js에 원래 있던 한국어 name 필드로 자동 폴백(번역이 아직 안 들어간 언어/항목도 안전).
// rpg-combat.js(클라이언트+서버 양쪽에서 실행)와 page-rpg.js(클라이언트) 양쪽에서 이 파일을 씀 -
// 절대 모듈 전역 상태를 두지 않고 매번 lang을 인자로 받는다(util-i18n.js의 tLang 참고).
import { tLang } from './util-i18n.js';
import { CLASSES } from './data/rpg/classes.js';
import { ITEMS, SET_BONUSES, FULL_SET_DEFS } from './data/rpg/items.js';
import { MONSTERS } from './data/rpg/monsters.js';
import { ZONES } from './data/rpg/zones.js';
import { TOWNS } from './data/rpg/towns.js';
import { NPCS } from './data/rpg/npcs.js';
import { MERCENARY_TEMPLATES, TERRITORY_JOBS } from './data/rpg/mercenaries.js';
import { QUESTS } from './data/rpg/quests.js';

export function getClassName(classId, lang) {
  const cls = CLASSES[classId];
  return tLang(`rpg.class.${classId}.name`, lang, cls ? cls.name : classId);
}

export function getSkillName(classId, skillId, lang) {
  const cls = CLASSES[classId];
  const skill = cls && cls.skills.find((s) => s.id === skillId);
  return tLang(`rpg.skill.${classId}.${skillId}.name`, lang, skill ? skill.name : skillId);
}

export function getMonsterName(monsterId, lang) {
  const monster = MONSTERS[monsterId];
  return tLang(`rpg.monster.${monsterId}.name`, lang, monster ? monster.name : monsterId);
}

export function getMonsterSkillName(monsterId, skillId, lang) {
  const monster = MONSTERS[monsterId];
  const skill = monster && (monster.skills || []).find((s) => s.id === skillId);
  return tLang(`rpg.monsterSkill.${monsterId}.${skillId}.name`, lang, skill ? skill.name : skillId);
}

export function getItemName(itemId, lang) {
  const item = ITEMS[itemId];
  return tLang(`rpg.item.${itemId}.name`, lang, item ? item.name : itemId);
}

export function getSetBonusName(setId, lang) {
  const def = SET_BONUSES[setId];
  return tLang(`rpg.setBonus.${setId}.name`, lang, def ? def.name : setId);
}

export function getFullSetName(setId, lang) {
  const def = FULL_SET_DEFS[setId];
  return tLang(`rpg.fullSet.${setId}.name`, lang, def ? def.name : setId);
}

export function getZoneName(zoneId, lang) {
  const zone = ZONES[zoneId];
  return tLang(`rpg.zone.${zoneId}.name`, lang, zone ? zone.name : zoneId);
}

export function getTownName(townId, lang) {
  const town = TOWNS[townId];
  return tLang(`rpg.town.${townId}.name`, lang, town ? town.name : townId);
}

export function getNpcName(npcId, lang) {
  const npc = NPCS[npcId];
  return tLang(`rpg.npc.${npcId}.name`, lang, npc ? npc.name : npcId);
}

export function getNpcDialogue(npcId, lang) {
  const npc = NPCS[npcId];
  const lines = (npc && npc.dialogue) || [];
  return lines.map((line, i) => tLang(`rpg.npc.${npcId}.dialogue.${i}`, lang, line));
}

export function getMercTemplateName(templateId, lang) {
  const template = MERCENARY_TEMPLATES[templateId];
  return tLang(`rpg.mercTemplate.${templateId}.name`, lang, template ? template.name : templateId);
}

export function getTerritoryJobName(jobId, lang) {
  const job = TERRITORY_JOBS[jobId];
  return tLang(`rpg.territoryJob.${jobId}.name`, lang, job ? job.name : jobId);
}

export function getQuestName(questId, lang) {
  const quest = QUESTS[questId];
  return tLang(`rpg.quest.${questId}.name`, lang, quest ? quest.name : questId);
}

export function getQuestDesc(questId, lang) {
  const quest = QUESTS[questId];
  return tLang(`rpg.quest.${questId}.desc`, lang, quest ? quest.desc : '');
}
