# RPG i18n 추출 진행 상황

세션이 끊겨도 여기 보고 이어서 하면 됨. 계획 원본은 이 작업을 시작한 세션의 plan mode 산출물
(`~/.claude/plans/replicated-zooming-clarke.md`, 로컬 파일이라 저장소엔 없음 — 아래 요약이 최신 기준).

## 핵심 설계 (반드시 지킬 것)

- `data/rpg/*.js`의 `name` 필드는 **건드리지 않음** — 그대로 한국어 문자열 유지(폴백 역할).
  객체 리터럴 안에서 `tf()`/`t()`를 직접 호출하면 모듈 로드 시점에 언어가 고정되는 버그가 생김
  (서버리스 함수는 여러 유저 요청에 모듈을 재사용하므로 특히 위험).
- 대신 `locales/ko.js`에 `rpg.xxx.{id}.name` 키를 병렬로 추가하고, `rpg-i18n.js`(신규 파일)의
  `getXxxName(id, lang)` 헬퍼가 그때그때 `lang` 인자를 받아 조회 + 데이터 파일의 `.name`으로 폴백.
- `rpg-combat.js`는 클라이언트/서버 양쪽에서 실행되는 순수 함수 모듈 — `lang`을 파라미터로 명시적으로
  받아서 흘려보내야 함(모듈 전역 상태 금지, `util-i18n.js`의 `currentLang` 싱글턴은 서버에서 쓰면 레이스컨디션 위험).
- 키 네이밍: `rpg.class.{id}.name`, `rpg.skill.{classId}.{skillId}.name`, `rpg.monster.{id}.name`,
  `rpg.item.{id}.name`, `rpg.zone.{id}.name`, `rpg.town.{id}.name`, `rpg.npc.{id}.name`,
  `rpg.mercTemplate.{id}.name`, `rpg.quest.{id}.name`/`.desc`, `rpg.log.{key}`(전투 로그 템플릿,
  `{var}` 플레이스홀더), `rpg.flavor.{arrayName}.{i}`(랜덤 연출 문구), `rpg.ui.{screen}.{element}`(page-rpg.js)

## 체크리스트

- [x] `rpg-i18n.js` 신규 생성: `getClassName`, `getSkillName`, `getMonsterName`, `getMonsterSkillName`, `getItemName`, `getSetBonusName`, `getFullSetName`, `getZoneName`, `getTownName`, `getNpcName`, `getNpcDialogue`, `getMercTemplateName`, `getQuestName`, `getQuestDesc`
- [x] `util-i18n.js`에 `tLang(key, lang, fallback)`, `ti(key, lang, vars, fallback)` 추가(상태 없음, 서버 안전)
- [x] `locales/ko.js`에 `rpg.class.*`/`rpg.skill.*` 키 추가 (classes.js, 44개)
- [x] `locales/ko.js`에 `rpg.item.*`/`rpg.setBonus.*`/`rpg.fullSet.*` 키 추가 (items.js, 391개)
- [x] `locales/ko.js`에 `rpg.monster.*`/`rpg.monsterSkill.*` 키 추가 (monsters.js, 190개)
- [x] `locales/ko.js`에 `rpg.zone.*`/`rpg.town.*` 키 추가 (zones.js/towns.js, 59개)
- [x] `locales/ko.js`에 `rpg.npc.*`(name+dialogue)/`rpg.mercTemplate.*`/`rpg.quest.*`(name+desc) 키 추가 (82개)
- [x] 전수 검증: 모든 id에 대해 `getXxxName(id,'ko')`가 데이터 파일의 원래 `.name`과 정확히 일치하는지 스크립트로 확인 완료(불일치 0), `lang:'en'`(키 없음)일 때 한국어로 정상 폴백도 확인
- [x] `page-rpg.js` **데이터 이름 표시 부분은 전부 완료** — `.name` 직접 참조를 전수 스캔해서 `getXxxName()`류 헬퍼로 교체(직업/스킬/아이템/세트/지역/마을/NPC/대사/영지일자리/부직업 전부). 용병 자기 이름(`m.name`, 유저가 짓거나 랜덤배정)은 의도적으로 그대로 둠(번역 대상 아님). `TERRITORY_JOBS` 이름 키 9개 추가로 발견해서 `locales/ko.js`/`rpg-i18n.js`에 보강.
- [x] `page-rpg.js` **정적 UI 문구**(버튼 라벨/안내문구/토스트 메시지, `t('rpg.ui.*')`) → **완료**. `util-i18n.js`에 클라이언트에서 쓰기 편한 `ti(key, lang, vars)` 변수치환 헬퍼 이미 있음(서버와 공유).
- [x] `rpg-combat.js` 로그 문장(`log.push(...)` 49곳 전부 + 플레이버 배열 7종 28개 + 전투 접미태그 6개) → `ti('rpg.log.*', lang, vars)`/`tLang(...)`로 교체 완료. `resolveCombat`/`buildMonsterInstance`/`buildCombatant`/`performAttack`/`performMonsterAttack`/`applyRoundStartPassives`/`tryUtilitySkill`에 전부 `lang` 파라미터(기본값 `'ko'`) 추가, `resolveCombat` 내부 클로저(`tryMonsterSkill`/`handleMonsterDeath`/메인 라운드 루프)는 `lang`이 스코프에 있어 별도 인자 없이 그대로 씀.
- [x] `api/_rpg/adventure.js`, `preview-zone.js`가 `req.body.lang`을 받아 `resolveCombat`/`buildMonsterInstance`에 넘기도록 수정. `adventure.js` 자체에 있던 서버측 로그(용병보수미지불/마을이동/인벤토리초과/장비파손/골드도둑/용병레벨제한/퇴원 등, 원래 계획에 없던 부분)도 발견해서 같이 로케일화. `preview-zone.js`의 몹 미리보기 이름도 `MONSTERS[id].name` 직접참조하던 걸 `getMonsterName(id, lang)`으로 교체(데이터참조 버그 수정).
- [x] `page-rpg.js`의 `apiPost('adventure'/'preview-zone', ...)` 3곳에 `lang: getLang()` 추가.
- **검증**: 독립 스크립트로 `resolveCombat()`을 `lang:'ko'`/`lang:'en'` 둘 다 20회씩 반복 호출 - 에러 없음, 변수치환/조사(이/가, 을/를 등)/몹이름/스킬이름 전부 정상 출력 확인. `en`은 아직 번역 키가 없어 한국어로 폴백되는 것도 의도대로 확인(실제 번역은 다음 단계).

## 다음 세션이 참고할 메모

- **1단계(데이터 이름 추출) 완전히 끝남 + 검증 완료.** 총 766개 로케일 키가 `locales/ko.js` 끝부분(`admin_msg_load_fail` 다음)에 `rpg.*` 네임스페이스로 추가됨. 값은 전부 원래 한국어 그대로 복사(번역 아님).
- `data/rpg/*.js`의 `name`/`desc`/`dialogue` 필드는 **하나도 안 건드림** — 그대로 한국어, 폴백 역할.
- 새 키를 추가할 땐 `scratch_gen_*.mjs` 같은 1회성 스크립트로 데이터 파일에서 직접 뽑아 `locales/ko.js` 끝(`\n};` 직전)에 밀어넣는 방식을 씀(수작업 타이핑 아님, 정확도 위해). 검증은 `getXxxName(id,'ko') === data[id].name` 전수비교 스크립트로.
- 1단계는 커밋 완료(`0b42886`).
- **2단계 중 "데이터 이름 표시" 부분 완료.** import 추가(`t`, `getLang` from util-i18n.js + `getXxxName` 전부 from rpg-i18n.js), `local const t`/`(t)` 매개변수가 여러 곳에서 i18n의 `t` 함수명과 충돌하고 있던 걸 발견해서 `tmpl`/`town`/`itemType`으로 이름 바꿔서 해결(중요 — 새로 코드 짤 때 `t`를 다른 용도 변수명으로 쓰지 말 것). `data/rpg/mercenaries.js`의 `TERRITORY_JOBS`(영지 일자리 이름)도 원래 계획에 없었는데 발견해서 로케일 키 9개 + `getTerritoryJobName` 헬퍼 추가함. 파일 전체를 `grep -noE "[a-zA-Z_]+\.name\b"`로 두 번 훑어서 남은 게 없는 것까지 확인.
- **정적 UI 문구 진행 상황**: `page-rpg.js`의 `// ── ...` 주석으로 구분된 28개 화면 섹션 중 **완료: 캐릭터선택/직업선택/상태바/탭, 모험탭+성+지역미리보기, 로어알림, 퀘스트행, 의사NPC, 영지탭(휴식/회복), 직업교관, 대장간+장비제작, 선술집+마을탭+게시판(loadBoard), 상점탭(구매+가챠), 마켓탭(안내문구+골드경매+매물목록 loadMarketListings), 창고탭(계좌/캐릭터 보관함 loadStorageBox 전체 — 골드 입출금, 아이템 입출금, 토스트, 로드실패)**. 부상/붕대 관련 문구(치료 토스트, 부상요약 등 여러 섹션에 걸친 것)도 이 김에 같이 정리함. `BODY_PART_NAMES` 상수(모듈로드시 고정되는 버그 패턴)를 `bodyPartName(part)` 함수로 교체(`t()` 호출이라 매번 최신 lang 반영) — 앞으로 이런 소규모 상수 맵도 발견하면 같은 방식으로 함수화할 것. 마켓 매물 구매 버튼은 상점탭과 동일 라벨이라 `rpg.ui.shop.buyBtn` 키를 재사용함(중복 키 생성 안 함).
  - **인벤토리탭+진형 섹션도 완료**: 정렬 드롭다운(`INVENTORY_SORT_MODES`도 `label`→`labelKey`로 바꿔 `t()`로 매번 조회하도록 함, 같은 프리징버그 패턴), 아이템 행 액션 버튼(고정/사용/장착/감정/붕대제작/판매/마켓등록), 가방/포션/붕대 사용 미리보기, 요구스탯 표시, 양손무기 경고, 장착/판매/마켓등록/붕대제작/감정 토스트, `FORMATION_ROW_LABELS` 상수도 `formationRowLabel(row)` 함수로 교체(같은 프리징버그 패턴). 공용 스탯 라벨(`rpg.ui.stat.hp/mp/stamina`)과 `rpg.ui.equip.shield` 키를 새로 만들어 이후 다른 섹션에서도 재사용 가능.
  - **파티섹션/영지현황판/영지탭(용병관리)/부상요약도 완료**: 영지 근무 카드, 영지 경제 요약(수입/지출/식량), 영지 현황판(시설 레벨/진행률/보너스 스탯 라벨), 용병 장비행/전투설정(타겟우선순위/전투역할), 용병 카드(상태줄/입원/해고/일자리 배치), 종자 흡수 섹션, 각종 토스트(해고/입원/배치/개명/종자흡수 등), 부상 요약(부상없음/부상 목록)까지 전부 `t()`/`ti()`로 교체. `facilityDashboardHtml()` 내부의 `STAT_KEY_LABELS`는 함수 내부 지역변수라 프리징버그는 없었지만 마찬가지로 로케일 키로 교체함.
  - **캐릭터탭/장비추천/장비창/부직업선택/탐험일지도 완료**: 전투 스탠스, 스탯포인트, 해제/수리/강화/부직업선택 토스트, 슬롯별 추천 오버레이, 장비창(공격속성 표시 포함 — `ELEMENT_NAMES` 상수도 `elementName()` 함수로 교체, 같은 프리징버그 패턴), 부직업 선택 카드, 탐험일지(제목/잠금표시 + **`entry.title`/`entry.text` 직접 참조하던 걸 `getLoreTitle`/`getLoreText` 헬퍼로 교체 — 1단계에서 놓쳤던 데이터참조 버그**). "포션 자동사용 규칙 편집기" 섹션 주석은 실제 구현이 없는 죽은 마커라 손댈 것 없음.
  - **전체 파일 재검사에서 추가로 발견해서 처리한 것들**:
    - `import { getClassName, ... } from './rpg-i18n.js'`에 `getTerritoryJobName`/`getLoreTitle`/`getLoreText`가 실제로 **누락되어 있었음**(이전 세션들에서 코드는 이미 이 함수들을 호출하고 있었는데 import 안 해서 런타임에서 ReferenceError 날 뻔함 — `node --check`는 구문만 검사해서 못 잡음). import문에 추가해서 수정.
    - 파일 최상단의 `ERROR_MESSAGES`(84개 서버 에러코드→한국어 메시지 매핑, 일부 중복 키 존재 — 원래 동작대로 마지막 값이 이기는 것 그대로 유지)를 `ERROR_MESSAGE_KEYS`(코드→로케일키)+`friendlyError()`가 `t()`로 조회하는 구조로 교체. `level_too_low`만 `{level}` 변수가 있어서 `ti()`로 특별 처리.
    - `renderRpgPage` 진입부의 로딩 문구/일일보너스 토스트, 설문변경/턴리필 안내 오버레이(원래 28개 섹션 목록에 없던 부분, 파일 최상단 300번대 줄) 전부 교체.
    - 인벤토리 초과 시 뜨는 `handleActionError`의 알림창(가방정리 안내)도 교체.
  - **2단계(정적 UI 문구) 전체 완료 확인**: `showToast`/`alert`/`confirm`/`title:`/`bodyHtml:` 패턴으로 한국어 하드코딩 전수 grep 재검사 완료, 남은 것 없음.
  - 패턴: 각 섹션마다 (1) 한글 리터럴 읽고 `rpg.ui.{섹션}.{키}` 이름으로 로케일 키 생성 스크립트(`scratch_add_keysN.mjs` 1회성)로 `locales/ko.js`에 추가 (2) 코드에서 `t('key')` 또는 변수 있으면 `ti('key', getLang(), {vars})`로 교체 (3) `node --check page-rpg.js`
  - "골드"/"버튼" 등 반복되는 단어를 개별 `t()`로 다 안 쪼개고 문장 전체를 하나의 키로 유지하는 지금 방식이 번역 품질상 맞음(단어 단위로 쪼개면 언어별 어순이 안 맞음) — 계속 이 방식 유지할 것
- **3단계(rpg-combat.js 로그 템플릿 + lang 배선) 완료.** 남은 건 실제 번역(영어 등 17개 언어 값 채우기)뿐 — 이건 애초 계획대로 별도 단계로 명시적으로 남겨둠(이번 작업은 "키 구조 추출"까지).
- `BODY_PART_NAMES`(rpg-combat.js에도 별도로 있던 것 - page-rpg.js의 것과 다른 모듈)도 `bodyPartNameFor(part, lang)` 함수로 감쌈(원본 상수는 tLang 폴백용으로 그대로 둠, 프리징버그 없음 - 매번 새 lang 인자를 받는 함수라서).
- 커밋: 1단계, 2단계(데이터 이름), 2단계(정적 UI 전체), 3단계(전투로그+API+lang배선) 모두 로컬 커밋 완료 — 사용자가 명시적으로 요청할 때만 push.
- **영어 번역 완료 (2026-08-03 무렵).** `locales/en.js`에 `rpg.*` 키 1359개 전부 번역 추가 — `ko.js`와 정확히 1:1 매칭(검증: `grep -oE '"rpg\.[^"]+"'`로 양쪽 키 집합 비교, 누락/중복 없음). 직업/스킬/아이템(기본장비+재료+등급별무기방어구+장신구+세트+제작아이템)/몹/몹특수기/세트보너스/지역/마을/NPC대사/용병템플릿/퀘스트/영지일자리/탐험일지/UI전체/에러메시지 85개/전투로그템플릿+플레이버배열까지 전부 포함. 실서버(관리자 테스트슬롯 6번)로 `lang:'en'` 30판 시뮬레이션 돌려서 한국어 누출 0건 확인.
- **폴백 동작 확인**: `util-i18n.js`의 `t()`/`tLang()`는 이미 `T[lang] → T.en → T.ko → key` 순서라, 번역 안 된 언어(아직 손 안 댄 15개 언어)는 자동으로 영어로 표시됨 — 사용자가 "번역 안된 언어는 기본 영어로" 요청했을 때 이미 그렇게 동작 중임을 확인, 코드 변경 불필요했음.
- **알려진 한계 (다음에 손볼 것, 사용자가 "일단 나중에" 하기로 함, 2026-08-03)**: 자기 자신 라벨(`rpg.ui.combat.self`="나"→"Me")이 템플릿의 모든 문법적 위치(주어/목적어/소유격)에 동일하게 꽂히는 구조라, 영어에서 `"Me's Attack found an opening!"` 같은 비문이 생김. 한국어는 조사가 자동으로 붙어 위치 무관하게 자연스러웠지만 영어는 위치별로 I/me/my 형태가 달라야 함. 이 문제는 **격변화가 있는 언어(영어/스페인어/프랑스어/독일어/러시아어 등)에서만** 생기고, 인도네시아어는 한국어처럼 조사/격변화가 없어서(`saya`) 해당 안 됨.
  - 제대로 고치려면: (1) `rpg-combat.js`의 `buildCombatant`가 자기 자신용 라벨을 문법적 위치별로 다르게 만들어주도록 확장, (2) 전투 로그 템플릿(`rpg.log.*`, 약 90개, 특히 `{actor}'s {skill}!` 패턴처럼 템플릿에 `'s`가 하드코딩된 것들)을 훑어서 `{actor}`가 주어/목적어/소유격 중 어디 쓰이는지 판단 후 재구성, (3) 영어 로케일 값들도 그에 맞게 다시 조정 필요. 코드+데이터 양쪽 다 손대는 중간 규모 작업 — 사용자가 나중에 이어서 하자고 함, 착수 전 아님.
- **다음 세션이 할 일**: (a) 인도네시아어(`locales/id.js`) 번역 진행 예정(사용자가 다음 순서로 지정함), (b) 위 "Me's" 영어 문법 이슈 리팩토링(사용자 요청 시), (c) 그 외 15개 언어는 아직 미착수.
