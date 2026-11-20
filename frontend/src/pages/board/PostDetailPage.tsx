import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePost, getPost, getPublicBoards } from '../../api/board'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'
import { CommentSection } from '../../features/comments/CommentSection'
import { VoteButtons } from '../../features/vote/VoteButtons'
import type { BoardItem, PostItem } from '../../types'
import { PostContentRenderer } from './PostContentRenderer'

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdmin } = useAuth()

  const [post, setPost] = useState<PostItem | null>(null)
  const [board, setBoard] = useState<BoardItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [guestPassword, setGuestPassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (!postId) {
      setPost(null)
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    setLoadError(null)

    Promise.all([getPost(postId), getPublicBoards()])
      .then(([data, boards]) => {
        if (!mounted) return
        setPost(data)
        setBoard(boards.find((b) => b.code.toLowerCase() === data.boardCode.toLowerCase()) ?? null)
      })
      .catch((err) => {
        if (!mounted) return
        setPost(null)
        setLoadError(getErrorMessage(err, '게시글을 불러올 수 없습니다.'))
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [postId, isAuthenticated, isAdmin])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-xs font-bold text-warm-400">
        게시글을 불러오는 중입니다...
      </div>
    )
  }

  if (!post || loadError) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <div className="text-3xl">📄</div>
        <h2 className="font-display font-extrabold text-lg text-warm-900">
          {loadError ?? '게시글을 찾을 수 없습니다.'}
        </h2>
        <Link
          to="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-700"
        >
          목록으로 돌아가기
        </Link>
      </div>
    )
  }

  const isAuthor = Boolean(user && post.userId === user.id)
  const canEdit = !post.deleted && (post.guide ? isAdmin : post.guest ? true : isAuthor)
  const canDelete = !post.deleted && (post.guide ? isAdmin : post.guest ? true : isAuthor || isAdmin)
  const needsGuestPasswordForDelete = post.guest && !isAdmin

  const handleConfirmDelete = async () => {
    if (deleting) return
    setDeleteError(null)
    if (needsGuestPasswordForDelete && !guestPassword.trim()) {
      setDeleteError('작성 시 입력한 비밀번호를 입력해 주세요.')
      return
    }
    setDeleting(true)
    try {
      await deletePost(post.displayId, needsGuestPasswordForDelete ? guestPassword.trim() : undefined)
      navigate(`/boards/${post.boardCode}`)
    } catch (err) {
      setDeleteError(getErrorMessage(err, '삭제에 실패했습니다.'))
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 상단 내비게이션 */}
      <div className="flex items-center justify-between">
        <Link
          to={`/boards/${post.boardCode}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-warm-500 hover:text-warm-900"
        >
          ← {post.boardMenuName} 목록
        </Link>
        <span className="font-mono text-xs font-bold text-warm-400">#{post.displayId}</span>
      </div>

      {/* 본문 카드 */}
      <article className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-6">
        <header className="space-y-3 border-b border-warm-200/80 pb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-warm-100 border border-warm-200 text-[11px] font-bold text-warm-700">
              {post.boardMenuName}
            </span>
            {post.guide && (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700">
                가이드
              </span>
            )}
            {post.isPinned && !post.deleted && !post.guide && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                공지
              </span>
            )}
            {post.isAnswered && !post.deleted && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
                답변완료
              </span>
            )}
          </div>

          <h1
            className={`font-display font-extrabold text-xl sm:text-2xl ${
              post.deleted ? 'text-warm-400 italic' : 'text-warm-900'
            }`}
          >
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-warm-500">
            <div className="flex items-center gap-2">
              {!post.deleted && (
                <span className="font-bold text-warm-800">
                  {post.nickname}
                  {post.guest && <span className="ml-1 text-[11px] text-warm-400">(비회원)</span>}
                </span>
              )}
              <span className="font-mono">{post.createdAt}</span>
              {post.updatedAt && <span className="text-[11px] text-warm-400">(수정됨 {post.updatedAt})</span>}
            </div>

            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => navigate(`/board/${post.displayId}/edit`)}
                  className="px-3 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 font-bold text-xs"
                >
                  수정
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    setGuestPassword('')
                    setDeleteError(null)
                    setDeleteModalOpen(true)
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        </header>

        {!post.deleted ? (
          <>
            <div className="min-h-[120px] text-sm sm:text-base text-warm-800 leading-relaxed">
              <PostContentRenderer content={post.content} />
            </div>
            {!post.guide && post.id !== null && (
              <div className="pt-4 border-t border-warm-100 flex justify-center sm:justify-end">
                <VoteButtons
                  targetType="POST"
                  targetId={post.id}
                  initialRecommendCount={post.recommendCount}
                  initialNotRecommendCount={post.notRecommendCount}
                  initialMyVote={post.myVote}
                  size="md"
                  onNotify={showToast}
                />
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center text-sm text-warm-400 italic">
            삭제된 게시물입니다.
          </div>
        )}
      </article>

      {/* 댓글·대댓글 */}
      <CommentSection
        targetType="POST"
        targetId={post.guide ? post.displayId : post.id}
        commentWriteRole={board?.commentWriteRole ?? 'USER'}
        isGuide={post.guide}
        postDeleted={post.deleted}
        onNotify={showToast}
      />

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-warm-200 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-extrabold text-base text-warm-900">
              게시글을 삭제하시겠습니까?
            </h3>
            {needsGuestPasswordForDelete && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-warm-700">
                  작성 시 입력한 비밀번호
                </label>
                <input
                  type="password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="w-full rounded-xl border border-warm-200 px-3.5 py-2 text-sm"
                />
              </div>
            )}
            {deleteError && (
              <p className="text-xs font-semibold text-rose-600">{deleteError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-warm-100 text-xs font-bold text-warm-700"
              >
                취소
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-warm-900 text-white px-4 py-2.5 text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}
