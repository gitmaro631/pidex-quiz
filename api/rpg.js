// RPG 기능 전체를 단일 서버리스 함수로 통합한 디스패처.
// Vercel Hobby 플랜은 배포당 서버리스 함수 12개까지만 허용하는데, RPG 엔드포인트를 각각 파일로
// 만들면 그것만으로 한도를 넘어버려서(실제로 빌드 실패 발생) api/_rpg/*.js(밑줄 접두사 - 라우팅
// 제외)로 옮기고 이 파일 하나로 action 기반 라우팅을 한다. 새 RPG 기능을 추가할 땐 새 파일을
// 만들지 말고 api/_rpg/에 로직을 추가한 뒤 여기 ROUTES에 등록할 것.
import character from './_rpg/character.js';
import adventure from './_rpg/adventure.js';
import shopBuy from './_rpg/shop-buy.js';
import sellItem from './_rpg/sell-item.js';
import equip from './_rpg/equip.js';
import unequip from './_rpg/unequip.js';
import useItem from './_rpg/use-item.js';
import chooseClass from './_rpg/choose-class.js';
import chooseSubclass from './_rpg/choose-subclass.js';
import allocateStat from './_rpg/allocate-stat.js';
import setStance from './_rpg/set-stance.js';
import setPotionRules from './_rpg/set-potion-rules.js';
import claimDailyBonus from './_rpg/claim-daily-bonus.js';
import claimQuest from './_rpg/claim-quest.js';
import listCharacters from './_rpg/list-characters.js';
import createCharacter from './_rpg/create-character.js';
import goldLeaderboard from './_rpg/gold-leaderboard.js';
import marketList from './_rpg/market-list.js';
import marketBuy from './_rpg/market-buy.js';
import marketBrowse from './_rpg/market-browse.js';
import accountStorage from './_rpg/account-storage.js';
import characterStorage from './_rpg/character-storage.js';
import boardPost from './_rpg/board-post.js';
import boardBrowse from './_rpg/board-browse.js';
import openRandomBox from './_rpg/open-random-box.js';

const ROUTES = {
  character, adventure,
  'shop-buy': shopBuy, 'sell-item': sellItem, equip, unequip, 'use-item': useItem,
  'choose-class': chooseClass, 'choose-subclass': chooseSubclass,
  'allocate-stat': allocateStat, 'set-stance': setStance, 'set-potion-rules': setPotionRules,
  'claim-daily-bonus': claimDailyBonus, 'claim-quest': claimQuest,
  'list-characters': listCharacters, 'create-character': createCharacter,
  'gold-leaderboard': goldLeaderboard,
  'market-list': marketList, 'market-buy': marketBuy, 'market-browse': marketBrowse,
  'account-storage': accountStorage, 'character-storage': characterStorage,
  'board-post': boardPost, 'board-browse': boardBrowse,
  'open-random-box': openRandomBox,
};

export default async function handler(req, res) {
  const action = (req.method === 'GET' ? req.query.action : req.body?.action);
  const fn = ROUTES[action];
  if (!fn) return res.status(400).json({ error: 'unknown_action' });
  return fn(req, res);
}
