import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getMe } from '../../api/auth'
import { getErrorMessage } from '../../api/client'
import { changePassword, withdraw } from '../../api/mypage'
import { useAuth } from '../../features/auth/useAuth'
import type { User } from '../../types'

function formatDate(isoString?: string): string {
  if (!isoString) return '-'
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return isoString
    const formatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const parts = formatter.formatToParts(date)
    const year = parts.find((p) => p.type === 'year')?.value
    const month = parts.find((p) => p.type === 'month')?.value.padStart(2, '0')
    const day = parts.find((p) => p.type === 'day')?.value.padStart(2, '0')
    return `${year}.${month}.${day}`
  } catch {
    return isoString
  }
}

export function MyPage() {
  const { isAuthenticated, isLoading: isAuthLoading, logout } = useAuth()
  const navigate = useNavigate()

  // 1. 내 정보
  const [profile, setProfile] = useState<User | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  // 2. 비밀번호 변경
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // 3. 회원 탈퇴 모달
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false)
  const [withdrawPassword, setWithdrawPassword] = useState('')
  const [withdrawError, setWithdrawError] = useState<string | null>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return

    // 내 정보 조회
    setIsProfileLoading(true)
    getMe()
      .then((data) => {
        setProfile(data)
        setProfileError(null)
      })
      .catch((err) => setProfileError(getErrorMessage(err)))
      .finally(() => setIsProfileLoading(false))
  }, [isAuthenticated])

  if (isAuthLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-xs font-bold text-warm-500">
        불러오는 중...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // 비밀번호 변경 제출
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (!currentPassword) {
      setPasswordError('현재 비밀번호를 입력해 주세요.')
      return
    }

    if (newPassword.length < 8 || newPassword.length > 64) {
      setPasswordError('새 비밀번호는 8~64자여야 합니다.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    try {
      setIsChangingPassword(true)
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess('비밀번호가 변경되었습니다.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
    } catch (err: any) {
      if (err.response?.status === 400) {
        setPasswordError('현재 비밀번호가 올바르지 않습니다.')
      } else {
        setPasswordError(getErrorMessage(err))
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  // 회원 탈퇴 제출
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setWithdrawError(null)

    if (!withdrawPassword.trim()) {
      setWithdrawError('비밀번호를 입력해 주세요.')
      return
    }

    try {
      setIsWithdrawing(true)
      await withdraw(withdrawPassword)
      setIsWithdrawModalOpen(false)
      logout()
      alert('탈퇴가 완료되었습니다.')
      navigate('/')
    } catch (err: any) {
      if (err.response?.status === 400) {
        setWithdrawError('비밀번호가 올바르지 않습니다.')
      } else {
        setWithdrawError(getErrorMessage(err))
      }
    } finally {
      setIsWithdrawing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* 타이틀 헤더 */}
      <div>
        <h1 className="text-2xl font-display font-extrabold text-warm-900 tracking-tight">
          마이페이지
        </h1>
        <p className="text-xs text-warm-500 mt-1">
          내 계정 정보를 확인하고 비밀번호 변경 및 회원 탈퇴를 관리합니다.
        </p>
      </div>

      {/* 1. 내 정보 */}
      <section className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-4">
        <div className="flex items-center justify-between border-b border-warm-100 pb-4">
          <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
            <span>👤</span> 내 정보
          </h2>
          {profile?.role === 'ADMIN' && (
            <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold">
              관리자
            </span>
          )}
        </div>

        {isProfileLoading ? (
          <div className="py-6 text-center text-xs text-warm-400">내 정보를 불러오는 중...</div>
        ) : profileError ? (
          <div className="py-4 text-xs font-bold text-red-600">{profileError}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="bg-warm-50 rounded-2xl p-4 border border-warm-100">
              <span className="text-[11px] font-semibold text-warm-500 block">이메일</span>
              <span className="text-sm font-bold text-warm-900 break-all">{profile?.email}</span>
            </div>
            <div className="bg-warm-50 rounded-2xl p-4 border border-warm-100">
              <span className="text-[11px] font-semibold text-warm-500 block">닉네임</span>
              <span className="text-sm font-bold text-warm-900">{profile?.nickname}</span>
            </div>
            <div className="bg-warm-50 rounded-2xl p-4 border border-warm-100">
              <span className="text-[11px] font-semibold text-warm-500 block">가입일</span>
              <span className="text-sm font-bold text-warm-900">{formatDate(profile?.createdAt)}</span>
            </div>
          </div>
        )}
      </section>

      {/* 2. 비밀번호 변경 */}
      <section className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-4">
        <div className="border-b border-warm-100 pb-4">
          <h2 className="text-base font-bold text-warm-900 flex items-center gap-2">
            <span>🔒</span> 비밀번호 변경
          </h2>
          <p className="text-xs text-warm-500 mt-0.5">
            새 비밀번호는 8~64자로 입력해 주세요.
          </p>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md pt-1">
          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1">
              현재 비밀번호
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              disabled={isChangingPassword}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-arcade-coral/40 focus:border-arcade-coral disabled:bg-warm-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1">
              새 비밀번호
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호 (8~64자)"
              disabled={isChangingPassword}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-arcade-coral/40 focus:border-arcade-coral disabled:bg-warm-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1">
              새 비밀번호 확인
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="새 비밀번호를 한 번 더 입력하세요"
              disabled={isChangingPassword}
              className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-arcade-coral/40 focus:border-arcade-coral disabled:bg-warm-100"
            />
          </div>

          {passwordError && (
            <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              {passwordSuccess}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs font-bold shadow-btn-play transition-all disabled:opacity-50"
            >
              {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </form>
      </section>

      {/* 3. 회원 탈퇴 */}
      <section className="bg-white border border-rose-100 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-4">
        <div className="border-b border-rose-100 pb-4">
          <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
            <span>⚠️</span> 회원 탈퇴
          </h2>
          <p className="text-xs text-warm-500 mt-0.5">
            계정을 삭제하고 탈퇴 처리를 진행합니다. 탈퇴 후 일부 데이터는 보존됩니다.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={() => {
              setWithdrawError(null)
              setWithdrawPassword('')
              setIsWithdrawModalOpen(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition-colors"
          >
            회원 탈퇴
          </button>
        </div>
      </section>

      {/* 회원 탈퇴 모달 */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-warm-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-warm-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-base font-extrabold text-warm-900">회원 탈퇴 확인</h3>
              <p className="text-xs text-warm-600 leading-relaxed mt-2 p-3 bg-rose-50 rounded-xl border border-rose-100">
                탈퇴하면 이 계정으로 다시 로그인할 수 없습니다. 작성한 게시글과 댓글은 남고, 다른 사람에게는 '탈퇴한 유저'로 보입니다. 같은 이메일로 새로 가입할 수는 있습니다.
              </p>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">
                  본인 확인 비밀번호
                </label>
                <input
                  type="password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  disabled={isWithdrawing}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-warm-200 bg-white text-xs text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 disabled:bg-warm-100"
                />
              </div>

              {withdrawError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                  {withdrawError}
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-warm-100">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  disabled={isWithdrawing}
                  className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!withdrawPassword.trim() || isWithdrawing}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {isWithdrawing ? '탈퇴 처리 중...' : '탈퇴'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
