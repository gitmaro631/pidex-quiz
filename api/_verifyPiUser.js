// Pi 플랫폼 API로 accessToken을 검증해 진짜 로그인된 username을 돌려준다.
// 클라이언트가 보낸 username 문자열은 절대 신뢰하지 말고, 이 함수가 돌려주는 값만 신뢰할 것.
export async function verifyPiUser(accessToken) {
  const result = await verifyPiUserFull(accessToken);
  return result ? result.username : null;
}

// username뿐 아니라 uid(Pi 내부 고유 ID)도 같이 필요할 때 씀(설문 완료 여부는 uid 기준으로
// firebase.js/saveSurveyToFirestore가 저장하기 때문 - username과는 다른 식별자라 별도로 검증해서 받음)
export async function verifyPiUserFull(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') return null;
  try {
    const res = await fetch('https://api.minepi.com/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-API-Key': process.env.PI_NETWORK_API_KEY ?? '',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.username) return null;
    return { username: data.username, uid: data.uid || null };
  } catch {
    return null;
  }
}
