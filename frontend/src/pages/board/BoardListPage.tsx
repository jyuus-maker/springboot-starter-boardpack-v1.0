import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPosts, getPublicBoards } from '../../api/board'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'
import type { BoardItem, BoardWriteRole, PostItem } from '../../types'

type BoardSortType = 'LATEST' | 'COMMENTS'
const PAGE_SIZE = 10

export function BoardListPage() {
  const navigate = useNavigate()
  const { boardCode } = useParams<{ boardCode?: string }>()
  const { isAuthenticated, isAdmin } = useAuth()

  const [boards, setBoards] = useState<BoardItem[]>([])
  const [posts, setPosts] = useState<PostItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<BoardSortType>('LATEST')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [adminOnlyNoticeOpen, setAdminOnlyNoticeOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setLoadError(null)

    Promise.all([getPublicBoards(), getPosts(boardCode)])
      .then(([boardList, postList]) => {
        if (!mounted) return
        setBoards(boardList)
        setPosts(postList)
      })
      .catch((err) => {
        if (!mounted) return
        setLoadError(getErrorMessage(err, '게시글 목록을 불러오지 못했습니다.'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [boardCode, isAuthenticated, isAdmin])

  const currentBoard = useMemo(() => {
    if (!boardCode) return null
    return boards.find((b) => b.code.toLowerCase() === boardCode.toLowerCase()) ?? null
  }, [boards, boardCode])

  const canWriteRole = (role: BoardWriteRole) => {
    if (role === 'ANONYMOUS') return true
    if (role === 'USER') return isAuthenticated
    return isAdmin
  }

  const handleWriteClick = () => {
    if (currentBoard) {
      if (canWriteRole(currentBoard.postWriteRole)) {
        navigate(`/board/write?board=${encodeURIComponent(currentBoard.code)}`)
        return
      }
      if (!isAuthenticated) {
        setAuthModalOpen(true)
        return
      }
      setAdminOnlyNoticeOpen(true)
      return
    }

    const writableBoard = boards.find((b) => canWriteRole(b.postWriteRole))
    if (writableBoard) {
      navigate(`/board/write?board=${encodeURIComponent(writableBoard.code)}`)
      return
    }
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }
    setAdminOnlyNoticeOpen(true)
  }

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const list = posts.filter((post) => {
      if (!q) return true
      const title = post.title.toLowerCase()
      const author = (post.nickname ?? '').toLowerCase()
      return title.includes(q) || author.includes(q)
    })

    if (sortBy === 'COMMENTS') {
      return [...list].sort((a, b) => {
        if (a.guide !== b.guide) return a.guide ? -1 : 1
        if (Boolean(a.isPinned) !== Boolean(b.isPinned)) return a.isPinned ? -1 : 1
        return b.commentCount - a.commentCount
      })
    }
    return list
  }, [posts, searchQuery, sortBy])

  useEffect(() => {
    setCurrentPage(1)
  }, [boardCode, searchQuery, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedPosts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredPosts.slice(start, start + PAGE_SIZE)
  }, [filteredPosts, safePage])

  const headerTitle = currentBoard ? currentBoard.menuName : '전체 게시글'
  const headerDesc = currentBoard
    ? `${currentBoard.menuName} 게시판의 글 목록입니다.`
    : '노출 중인 모든 게시판의 게시글을 한눈에 확인하세요.'

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <section className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-5">
        {/* 상단 타이틀 & 글쓰기 버튼 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📝</span>
              <h1 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 tracking-tight">
                {headerTitle}
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">{headerDesc}</p>
          </div>

          <button
            type="button"
            onClick={handleWriteClick}
            className="px-5 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-bold text-xs sm:text-sm shadow-btn-play transition-all self-start sm:self-auto"
          >
            + 글쓰기
          </button>
        </div>

        {/* 게시판 필터 탭 + 검색/정렬 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
          <div className="inline-flex flex-wrap rounded-xl bg-warm-100 p-1 border border-warm-200/60 text-xs font-bold gap-1 self-start">
            <button
              type="button"
              onClick={() => navigate('/')}
              className={`px-3.5 py-2 rounded-lg transition-all ${
                !boardCode
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'text-warm-600 hover:text-warm-900'
              }`}
            >
              전체
            </button>
            {boards.map((board) => {
              const active = boardCode?.toLowerCase() === board.code.toLowerCase()
              return (
                <button
                  key={board.id}
                  type="button"
                  onClick={() => navigate(`/boards/${board.code}`)}
                  className={`px-3.5 py-2 rounded-lg transition-all ${
                    active
                      ? 'bg-arcade-coral text-white shadow-xs'
                      : 'text-warm-600 hover:text-warm-900'
                  }`}
                >
                  {board.menuName}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목·작성자 검색"
              className="w-44 sm:w-56 rounded-xl border border-warm-200 bg-warm-50/70 px-3.5 py-2 text-xs text-warm-800 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-arcade-coral/30 focus:border-arcade-coral"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as BoardSortType)}
              className="rounded-xl border border-warm-200 bg-warm-50/70 px-3 py-2 text-xs font-bold text-warm-700"
            >
              <option value="LATEST">최신순</option>
              <option value="COMMENTS">댓글 많은순</option>
            </select>
          </div>
        </div>
      </section>

      {/* 게시글 목록 테이블 */}
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-warm-400">
            게시글을 불러오는 중입니다...
          </div>
        ) : loadError ? (
          <div className="py-16 text-center text-sm font-bold text-rose-600">{loadError}</div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <div className="text-2xl">📭</div>
            <div className="font-display font-bold text-sm text-warm-700">
              등록된 게시글이 없습니다.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-warm-200/80">
            {pagedPosts.map((post) => (
              <div
                key={post.displayId}
                onClick={() => navigate(`/board/${post.displayId}`)}
                className={`px-5 sm:px-7 py-4 hover:bg-warm-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                  post.guide || post.isPinned ? 'bg-amber-50/30' : ''
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold text-warm-400">
                      #{post.displayId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-warm-100 border border-warm-200 text-[10px] font-bold text-warm-700">
                      {post.boardMenuName}
                    </span>
                    {post.guide && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                        가이드
                      </span>
                    )}
                    {post.isPinned && !post.deleted && !post.guide && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                        공지
                      </span>
                    )}
                    {post.isAnswered && !post.deleted && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                        답변완료
                      </span>
                    )}
                    <h2
                      className={`text-sm sm:text-base truncate ${
                        post.deleted ? 'text-warm-400 italic' : 'text-warm-900'
                      }`}
                    >
                      {post.title}
                    </h2>
                    {post.commentCount > 0 && (
                      <span className="text-xs font-bold text-arcade-coral">
                        [{post.commentCount}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-warm-500 shrink-0">
                  {!post.deleted && (
                    <span className="font-semibold text-warm-700">
                      {post.nickname}
                      {post.guest && (
                        <span className="ml-1 text-[10px] text-warm-400">(비회원)</span>
                      )}
                    </span>
                  )}
                  <span className="font-mono text-[11px] text-warm-400">{post.createdAt}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 페이지네이션 (1페이지당 10개, 가이드 게시물 포함) */}
      {!loading && !loadError && filteredPosts.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-600 hover:bg-warm-100 disabled:opacity-40"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              onClick={() => setCurrentPage(pageNum)}
              className={`min-w-8 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                pageNum === safePage
                  ? 'bg-arcade-coral text-white shadow-xs'
                  : 'border border-warm-200 bg-white text-warm-600 hover:bg-warm-100'
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-warm-200 bg-white text-xs font-bold text-warm-600 hover:bg-warm-100 disabled:opacity-40"
          >
            다음
          </button>
        </div>
      )}

      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-warm-200 rounded-3xl p-6 shadow-xl space-y-4 text-center">
            <h3 className="font-display font-extrabold text-base text-warm-900">
              로그인이 필요합니다
            </h3>
            <p className="text-xs text-warm-600">
              이 게시판에 글을 작성하려면 로그인해 주세요.
            </p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setAuthModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-warm-100 text-xs font-bold text-warm-700"
              >
                닫기
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-arcade-coral text-xs font-bold text-white"
              >
                로그인하기
              </button>
            </div>
          </div>
        </div>
      )}

      {adminOnlyNoticeOpen && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-warm-200 rounded-3xl p-6 shadow-xl space-y-4 text-center">
            <h3 className="font-display font-extrabold text-base text-warm-900">
              작성 권한이 없습니다
            </h3>
            <p className="text-xs text-warm-600">
              관리자만 작성할 수 있는 게시판입니다.
            </p>
            <button
              type="button"
              onClick={() => setAdminOnlyNoticeOpen(false)}
              className="px-4 py-2 rounded-xl bg-warm-100 text-xs font-bold text-warm-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
