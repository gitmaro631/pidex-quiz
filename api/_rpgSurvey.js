// 설문조사 전체 완료 여부 확인 - 설문(퀴즈 앱)은 Firebase 클라이언트 SDK로 surveys/{uid} 문서에
// { answers, completedIds }를 저장함(firebase.js의 saveSurveyToFirestore 참고). RPG 서버는 이 문서를
// 읽어서 "지금 정의된 설문 문항을 전부 답했는지"를 판정함 - 조건부 하위문항(showIf)까지 정확히 반영해서,
// 그 조건이 실제로 만족된 사용자에게만 그 하위문항 응답을 요구함(안 그러면 애초에 화면에 뜨지도 않은
// 질문 때문에 영원히 "미완료" 처리되는 문제가 생김)
import { firestoreGetDoc } from './_firestore.js';
import { encodeFirestorePathSegment } from './_firestore.js';
import { surveyQuestions } from '../data/survey.js';

export async function fetchSurveyCompletion(uid) {
  if (!uid) return null;
  try {
    return await firestoreGetDoc(`surveys/${encodeFirestorePathSegment(uid)}`);
  } catch {
    return null;
  }
}

// 설문 문항 정의(surveyQuestions)를 기준으로, 지금 존재하는 문항을 전부 답했는지 확인.
// 문항이 새로 추가되거나 내용이 바뀌면(id가 바뀌는 경우) 예전 completedIds에는 그 id가 없을 테니
// 자동으로 "미완료"가 되어 재설문이 필요해짐(버전 필드 따로 안 둬도 자연히 처리됨)
export function isSurveyFullyComplete(completedIds, answers) {
  const done = new Set(completedIds || []);
  const ans = answers || {};
  for (const q of surveyQuestions) {
    if (q.type === 'grouped' && Array.isArray(q.subQuestions)) {
      for (const sub of q.subQuestions) {
        if (sub.showIf && !sub.showIf.values.includes(ans[sub.showIf.id])) continue; // 조건 미충족 - 표시 안 된 질문
        if (!done.has(sub.id)) return false;
      }
    } else if (!done.has(q.id)) {
      return false;
    }
  }
  return true;
}
