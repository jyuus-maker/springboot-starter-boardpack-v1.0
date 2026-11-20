import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { getPublicBoards } from '../api/board'
import { useAuth } from '../features/auth/useAuth'
import type { BoardItem } from '../types'

export function MainLayout() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const [boards, setBoards] = useState<BoardItem[]>([])

  const loadBoards = useCallback(async () => {
    try {
      const list = await getPublicBoards()
      setBoards(list)
    } catch {
      // 메뉴 로딩 실패 시 빈 목록 유지
    }
  }, [])

  useEffect(() => {
    void loadBoards()
  }, [loadBoards, isAuthenticated, isAdmin])

  useEffect(() => {
    const onUpdated = () => void loadBoards()
    window.addEventListener('boards-updated', onUpdated)
    return () => window.removeEventListener('boards-updated', onUpdated)
  }, [loadBoards])

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3.5 py-1.5 rounded-xl text-xs sm:text-sm transition-colors ${
      isActive
        ? 'text-arcade-coral bg-rose-50 font-bold'
        : 'text-warm-600 font-semibold hover:text-warm-900 hover:bg-warm-100'
    }`

  return (
    <div className="min-h-screen bg-warm-50 text-warm-800 flex flex-col font-sans antialiased">
      {/* GNB (Global Navigation Bar) */}
      <header className="bg-white border-b border-warm-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Global Nav */}
          <div className="flex items-center gap-4 sm:gap-7 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-arcade-coral to-amber-400 flex items-center justify-center text-white font-black text-xl shadow-md transform group-hover:scale-105 transition-transform">
                💬
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-tight text-warm-900 group-hover:text-arcade-coral transition-colors">
                  Tiny <span className="text-arcade-coral">Board</span>
                </span>
              </div>
            </Link>

            {/* Menu Tabs */}
            <nav className="flex items-center gap-1 overflow-x-auto">
              {boards.map((board) => (
                <NavLink key={board.id} to={`/boards/${board.code}`} className={navLinkClass}>
                  {board.menuName}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Right Auth Area */}
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <NavLink
                to="/admin/users"
                className="rounded-xl bg-amber-100 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-200 transition-colors"
              >
                관리 메뉴
              </NavLink>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 pl-3 border-l border-warm-200">
                <Link
                  to="/mypage"
                  className="flex items-center gap-2.5 group"
                  title="마이페이지로 이동"
                >
                  <div className="w-8 h-8 rounded-full bg-warm-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center font-bold text-sm text-warm-700">
                    🧑‍💻
                  </div>
                  <div className="text-left text-xs leading-tight">
                    <div className="font-bold text-warm-900 group-hover:text-arcade-coral transition-colors">
                      {user?.nickname}
                    </div>
                    <div className="text-[10px] text-warm-500 font-mono">마이페이지</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="ml-1 text-xs font-semibold text-warm-400 hover:text-warm-700 px-2 py-1 rounded-lg hover:bg-warm-100 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-warm-700 hover:bg-warm-100 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-arcade-coral hover:bg-arcade-coralHover shadow-btn-play transition-all"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}
