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
- [~] `page-rpg.js` **정적 UI 문구**(버튼 라벨/안내문구/토스트 메시지, `t('rpg.ui.*')`) → **진행중**, 최소 250개 이상 중 약 60개 완료(아래 메모의 섹션 목록 기준 1~2번 완료). `util-i18n.js`에 클라이언트에서 쓰기 편한 `ti(key, lang, vars)` 변수치환 헬퍼 이미 있음(서버와 공유).
- [ ] `rpg-combat.js` 로그 문장(`log.push(...)` 49곳 + 플레이버 배열 약 200개) → `ti('rpg.log.*', lang, vars)` 로 교체, 관련 함수 시그니처에 `lang` 파라미터 추가 (아직 시작 안 함)
- [ ] `api/_rpg/adventure.js`, `preview-zone.js` 등 `resolveCombat` 호출부가 `req.body.lang`을 받아서 넘기도록 수정 (아직 시작 안 함)
- [ ] `page-rpg.js`의 `apiPost` 호출부(전투 관련)에 `lang: getLang()` 추가 (아직 시작 안 함)

## 다음 세션이 참고할 메모

- **1단계(데이터 이름 추출) 완전히 끝남 + 검증 완료.** 총 766개 로케일 키가 `locales/ko.js` 끝부분(`admin_msg_load_fail` 다음)에 `rpg.*` 네임스페이스로 추가됨. 값은 전부 원래 한국어 그대로 복사(번역 아님).
- `data/rpg/*.js`의 `name`/`desc`/`dialogue` 필드는 **하나도 안 건드림** — 그대로 한국어, 폴백 역할.
- 새 키를 추가할 땐 `scratch_gen_*.mjs` 같은 1회성 스크립트로 데이터 파일에서 직접 뽑아 `locales/ko.js` 끝(`\n};` 직전)에 밀어넣는 방식을 씀(수작업 타이핑 아님, 정확도 위해). 검증은 `getXxxName(id,'ko') === data[id].name` 전수비교 스크립트로.
- 1단계는 커밋 완료(`0b42886`).
- **2단계 중 "데이터 이름 표시" 부분 완료.** import 추가(`t`, `getLang` from util-i18n.js + `getXxxName` 전부 from rpg-i18n.js), `local const t`/`(t)` 매개변수가 여러 곳에서 i18n의 `t` 함수명과 충돌하고 있던 걸 발견해서 `tmpl`/`town`/`itemType`으로 이름 바꿔서 해결(중요 — 새로 코드 짤 때 `t`를 다른 용도 변수명으로 쓰지 말 것). `data/rpg/mercenaries.js`의 `TERRITORY_JOBS`(영지 일자리 이름)도 원래 계획에 없었는데 발견해서 로케일 키 9개 + `getTerritoryJobName` 헬퍼 추가함. 파일 전체를 `grep -noE "[a-zA-Z_]+\.name\b"`로 두 번 훑어서 남은 게 없는 것까지 확인.
- **정적 UI 문구 진행 상황**: `page-rpg.js`의 `// ── ...` 주석으로 구분된 28개 화면 섹션 중 **1~2번(캐릭터선택/직업선택/상태바/탭, 모험탭+성+지역미리보기) 완료**. 나머지 섹션은 줄 번호 기준(주석 검색 `grep -n "^// ──" page-rpg.js`으로 항상 최신 목록 확인):
  - 927줄 이후: 로어알림/퀘스트행/의사NPC/영지탭(회복)/직업교관/대장간/선술집/마을탭/상점탭/마켓탭/창고탭/게시판/인벤토리탭/파티섹션/영지현황판/영지탭(용병관리)/부상요약/캐릭터탭/장비추천/장비창/부직업선택/탐험일지/포션자동사용 — **아직 하나도 안 건드림**
  - 패턴: 각 섹션마다 (1) 한글 리터럴 읽고 `rpg.ui.{섹션}.{키}` 이름으로 로케일 키 생성 스크립트(`scratch_add_keysN.mjs` 1회성)로 `locales/ko.js`에 추가 (2) 코드에서 `t('key')` 또는 변수 있으면 `ti('key', getLang(), {vars})`로 교체 (3) `node --check page-rpg.js`
  - "골드"/"버튼" 등 반복되는 단어를 개별 `t()`로 다 안 쪼개고 문장 전체를 하나의 키로 유지하는 지금 방식이 번역 품질상 맞음(단어 단위로 쪼개면 언어별 어순이 안 맞음) — 계속 이 방식 유지할 것
- 3단계(rpg-combat.js 로그 템플릿)는 아직 착수 전 — 구조적으로 제일 큼(lang 파라미터를 resolveCombat부터 전 함수에 실어날라야 함).
- 커밋: 1단계, 2단계(데이터 이름) 완료. 2단계(정적 UI, 섹션 1~2)는 이번에 커밋 예정 — 사용자가 명시적으로 요청할 때만 push.
