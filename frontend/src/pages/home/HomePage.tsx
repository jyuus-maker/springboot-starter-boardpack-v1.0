import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const [health, setHealth] = useState<'ok' | 'loading' | 'error'>('loading')

  useEffect(() => {
    api
      .get<string>('/health')
      .then((res) => setHealth(res.data === 'ok' ? 'ok' : 'error'))
      .catch(() => setHealth('error'))
  }, [])

  return (
    <div className="max-w-5xl mx-auto pt-4 space-y-6">
      <section className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border ${
              health === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-warm-100 text-warm-500 border-warm-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                health === 'ok' ? 'bg-emerald-500' : 'bg-warm-400'
              }`}
            />
            API: {health === 'ok' ? '정상 연결' : health === 'loading' ? '확인 중' : '오프라인'}
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-warm-900 tracking-tight">
            커뮤니티 게시판
          </h1>
          <p className="text-xs sm:text-sm text-warm-600 leading-relaxed">
            자유게시판, 문의게시판, FAQ 공지 및 댓글·대댓글 기능을 이용할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Link
            to="/board"
            className="px-5 py-3 rounded-2xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-display font-bold text-sm shadow-btn-play transition-all"
          >
            게시판 바로가기 →
          </Link>
          {isAuthenticated ? (
            <Link
              to="/mypage"
              className="px-4 py-3 rounded-2xl bg-warm-100 hover:bg-warm-200 border border-warm-200 text-warm-800 font-bold text-xs sm:text-sm transition-all"
            >
              마이페이지
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-4 py-3 rounded-2xl bg-warm-100 hover:bg-warm-200 border border-warm-200 text-warm-800 font-bold text-xs sm:text-sm transition-all"
            >
              로그인
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
