import api from './client'

/** PATCH /api/mypage/password : 비밀번호 변경 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/mypage/password', { currentPassword, newPassword })
}

/** POST /api/mypage/withdraw : 회원 탈퇴 */
export async function withdraw(password: string): Promise<void> {
  await api.post('/mypage/withdraw', { password })
}

export { api }
