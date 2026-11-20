import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
} from '../../api/board'
import { getErrorMessage } from '../../api/client'
import type { BoardWriteRole, CommentItem, CommentTargetType } from '../../types'
import { useAuth } from '../auth/useAuth'
import { VoteButtons } from '../vote/VoteButtons'

interface CommentSectionProps {
  targetType: CommentTargetType
  targetId?: string | number | null
  commentWriteRole?: BoardWriteRole
  isGuide?: boolean
  postDeleted?: boolean
  initialComments?: CommentItem[]
  onNotify?: (message: string, type?: 'info' | 'success' | 'warn') => void
  onCommentsChange?: (totalCount: number) => void
}

// 댓글·대댓글 (원본 Warm/Coral 카드 UI 보존 + 대댓글 1단계·가이드·삭제 규칙 지원)
export function CommentSection({
  targetType,
  targetId = null,
  commentWriteRole = 'USER',
  isGuide = false,
  postDeleted = false,
  initialComments,
  onNotify,
  onCommentsChange,
}: CommentSectionProps) {
  const { user, isAuthenticated, isAdmin } = useAuth()
  const [comments, setComments] = useState<CommentItem[]>(initialComments ?? [])
  const [content, setContent] = useState('')
  const [replyTarget, setReplyTarget] = useState<{ id: number; nickname: string } | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const onCommentsChangeRef = useRef(onCommentsChange)

  useEffect(() => {
    onCommentsChangeRef.current = onCommentsChange
  })

  const computeTotal = (list: CommentItem[]) =>
    list.reduce((sum, item) => sum + 1 + (item.replies ? item.replies.length : 0), 0)

  const loadComments = useCallback(async () => {
    try {
      const data = await getComments(targetType, targetId)
      setComments(data)
      onCommentsChangeRef.current?.(computeTotal(data))
    } catch {
      if (initialComments) {
        setComments(initialComments)
      }
    }
  }, [targetType, targetId, initialComments])

  useEffect(() => {
    setReplyTarget(null)
    setEditingId(null)
    setContent('')
  }, [targetType, targetId])

  useEffect(() => {
    void loadComments()
  }, [loadComments])

  const totalCount = computeTotal(comments)

  const canWriteComment = (() => {
    if (isGuide || postDeleted) return false
    if (commentWriteRole === 'ADMIN') return isAdmin
    if (commentWriteRole === 'USER') return isAuthenticated
    return isAuthenticated
  })()

  const handleReplyClick = (commentId: number, nickname: string) => {
    if (!canWriteComment) {
      onNotify?.('댓글 작성 권한이 없습니다.', 'warn')
      return
    }
    setReplyTarget({ id: commentId, nickname })
    textareaRef.current?.focus()
    onNotify?.(`@${nickname} 님에게 답글 입력 모드로 전환되었습니다.`, 'info')
  }

  const handleSubmit = async () => {
    if (!canWriteComment || !user) {
      onNotify?.('댓글 작성 권한이 없습니다.', 'warn')
      return
    }
    const numericId = typeof targetId === 'number' ? targetId : Number(targetId)
    if (!Number.isFinite(numericId)) return

    const trimmed = content.trim()
    if (!trimmed) {
      onNotify?.('댓글 내용을 입력해주세요.', 'warn')
      return
    }

    setSubmitting(true)
    try {
      const updatedList = await createComment({
        targetType,
        targetId: numericId,
        parentId: replyTarget ? replyTarget.id : null,
        content: trimmed,
      })
      setComments(updatedList)
      onCommentsChangeRef.current?.(computeTotal(updatedList))
      const wasReply = Boolean(replyTarget)
      setReplyTarget(null)
      setContent('')
      onNotify?.(
        wasReply ? '답글이 등록되었습니다!' : '댓글이 성공적으로 등록되었습니다!',
        'success',
      )
    } catch (err) {
      onNotify?.(getErrorMessage(err, '댓글 등록에 실패했습니다.'), 'warn')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (commentId: number, currentContent: string) => {
    setEditingId(commentId)
    setEditingContent(currentContent)
  }

  const handleSaveEdit = async (commentId: number) => {
    const trimmed = editingContent.trim()
    if (!trimmed) {
      onNotify?.('댓글 내용을 입력해주세요.', 'warn')
      return
    }
    try {
      await updateComment(commentId, trimmed)
      setEditingId(null)
      setEditingContent('')
      await loadComments()
      onNotify?.('댓글이 수정되었습니다.', 'success')
    } catch (err) {
      onNotify?.(getErrorMessage(err, '댓글 수정에 실패했습니다.'), 'warn')
    }
  }

  const handleDelete = async (commentId: number) => {
    try {
      await deleteComment(commentId)
      await loadComments()
      onNotify?.('댓글이 삭제되었습니다.', 'info')
    } catch (err) {
      onNotify?.(getErrorMessage(err, '댓글 삭제에 실패했습니다.'), 'warn')
    }
  }

  return (
    <div className="bg-white border border-warm-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-warm-card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-base sm:text-lg text-warm-900 flex items-center gap-2">
            <span>💬 댓글 & 의견 나누기</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-warm-100 text-warm-600 font-bold">
              {totalCount}
            </span>
          </h3>
        </div>
      </div>

      {/* Write Comment */}
      {!isGuide && !postDeleted && (
        canWriteComment && user ? (
          <div className="space-y-2.5">
            {replyTarget && (
              <div className="flex items-center justify-between rounded-xl bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs text-arcade-coral font-semibold">
                <span>@{replyTarget.nickname} 님에게 답글 작성 중...</span>
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="text-warm-500 hover:text-warm-800 underline"
                >
                  취소
                </button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                replyTarget
                  ? `@${replyTarget.nickname} 님에게 답글을 남겨보세요!`
                  : '게시글에 대한 의견이나 질문, 답변을 자유롭게 남겨보세요!'
              }
              className="w-full bg-warm-50 border border-warm-200 rounded-2xl p-3 text-xs sm:text-sm text-warm-800 placeholder-warm-400 focus:outline-none focus:bg-white focus:border-arcade-coral focus:ring-2 focus:ring-arcade-coral/10 transition-all resize-none"
            />
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-warm-400">
                작성자: <strong className="text-warm-700">{user.nickname}</strong>
              </span>
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-warm-900 text-white font-bold text-xs hover:bg-warm-800 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                {submitting ? '등록 중...' : replyTarget ? '답글 등록' : '댓글 등록'}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-warm-50 border border-warm-200 px-4 py-3.5 flex items-center justify-between gap-3 text-xs text-warm-600">
            <span>
              {commentWriteRole === 'ADMIN'
                ? '이 게시판은 관리자만 댓글·대댓글을 작성할 수 있습니다.'
                : '댓글·대댓글 작성은 로그인한 회원만 이용할 수 있습니다.'}
            </span>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="shrink-0 px-3.5 py-1.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-bold transition-colors"
              >
                로그인
              </Link>
            )}
          </div>
        )
      )}

      {/* Comments Feed */}
      <div className="space-y-3 pt-1">
        {comments.length === 0 ? (
          <div className="py-8 text-center rounded-2xl bg-warm-50/70 border border-dashed border-warm-200 text-xs text-warm-400">
            아직 등록된 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </div>
        ) : (
          comments.map((comment) => {
            const isWithdrawn = comment.userStatus === 'WITHDRAWN'
            const isMyComment = Boolean(user && user.id === comment.userId && !comment.deleted)
            const canDelete = !comment.guide && !comment.deleted && (isMyComment || isAdmin)

            return (
              <div
                key={comment.id}
                className="p-3.5 rounded-2xl bg-warm-50 border border-warm-100 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {!comment.deleted && (
                      <span
                        className={`font-bold ${
                          isWithdrawn
                            ? 'text-warm-500'
                            : comment.isAdmin || isMyComment
                              ? 'text-arcade-coral'
                              : 'text-warm-800'
                        }`}
                      >
                        {isWithdrawn
                          ? '탈퇴한계정'
                          : isMyComment
                            ? `${comment.nickname} (나)`
                            : comment.nickname}
                      </span>
                    )}
                    {comment.guide && (
                      <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                        사용가이드
                      </span>
                    )}
                    {comment.isAdmin && !comment.deleted && (
                      <span className="px-1.5 py-0.5 rounded bg-warm-900 text-white text-[9px] font-bold">
                        운영진 답변
                      </span>
                    )}
                    <span className="text-[10px] text-warm-400">{comment.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {canDelete && editingId !== comment.id && (
                      <div className="flex items-center gap-2 text-[11px] text-warm-400">
                        {isMyComment && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(comment.id, comment.content)}
                            className="hover:text-warm-700 font-semibold"
                          >
                            수정
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="hover:text-rose-600 font-semibold"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {editingId === comment.id ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full bg-white border border-warm-300 rounded-xl p-2.5 text-xs sm:text-sm text-warm-800 focus:outline-none focus:border-arcade-coral resize-none"
                    />
                    <div className="flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 rounded-lg bg-warm-200 text-warm-700 font-bold"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        className="px-3 py-1 rounded-lg bg-arcade-coral text-white font-bold"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      comment.deleted
                        ? 'text-warm-400 italic'
                        : isWithdrawn
                          ? 'text-warm-600'
                          : 'text-warm-700'
                    }`}
                  >
                    {comment.content}
                  </p>
                )}

                {!comment.deleted && !comment.guide && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    {!isWithdrawn && canWriteComment ? (
                      <button
                        type="button"
                        onClick={() => handleReplyClick(comment.id, comment.nickname ?? '사용자')}
                        className="text-xs text-warm-400 hover:text-arcade-coral font-semibold transition-colors"
                      >
                        답글 달기
                      </button>
                    ) : (
                      <span />
                    )}
                    <div className="ml-auto">
                      <VoteButtons
                        targetType="COMMENT"
                        targetId={comment.id}
                        initialRecommendCount={comment.recommendCount}
                        initialNotRecommendCount={comment.notRecommendCount}
                        initialMyVote={comment.myVote}
                        size="sm"
                        onNotify={onNotify}
                      />
                    </div>
                  </div>
                )}

                {/* 1-Level Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-3 pl-3 border-l-2 border-warm-200 pt-1.5 space-y-1.5">
                    {comment.replies.map((reply) => {
                      const replyWithdrawn = reply.userStatus === 'WITHDRAWN'
                      const isMyReply = Boolean(user && user.id === reply.userId && !reply.deleted)
                      const replyCanDelete = !reply.guide && !reply.deleted && (isMyReply || isAdmin)

                      return (
                        <div
                          key={reply.id}
                          className="p-2.5 rounded-xl bg-white border border-warm-200/80"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {!reply.deleted && (
                                <span
                                  className={`font-bold ${
                                    replyWithdrawn
                                      ? 'text-warm-500'
                                      : reply.isAdmin || isMyReply
                                        ? 'text-arcade-coral'
                                        : 'text-warm-800'
                                  }`}
                                >
                                  {replyWithdrawn
                                    ? '탈퇴한계정'
                                    : isMyReply
                                      ? `${reply.nickname} (나)`
                                      : reply.nickname}
                                </span>
                              )}
                              {reply.guide && (
                                <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[9px] font-bold">
                                  사용가이드
                                </span>
                              )}
                              {reply.isAdmin && !reply.deleted && (
                                <span className="px-1.5 py-0.5 rounded bg-warm-900 text-white text-[9px] font-bold">
                                  운영진 답변
                                </span>
                              )}
                              <span className="text-[10px] text-warm-400">{reply.createdAt}</span>
                            </div>

                            {replyCanDelete && editingId !== reply.id && (
                              <div className="flex items-center gap-2 text-[11px] text-warm-400">
                                {isMyReply && (
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(reply.id, reply.content)}
                                    className="hover:text-warm-700 font-semibold"
                                  >
                                    수정
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDelete(reply.id)}
                                  className="hover:text-rose-600 font-semibold"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </div>

                          {editingId === reply.id ? (
                            <div className="space-y-2 pt-1.5">
                              <textarea
                                rows={2}
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full bg-warm-50 border border-warm-300 rounded-xl p-2 text-xs text-warm-800 focus:outline-none focus:border-arcade-coral resize-none"
                              />
                              <div className="flex justify-end gap-2 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-2.5 py-1 rounded-lg bg-warm-200 text-warm-700 font-bold"
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(reply.id)}
                                  className="px-2.5 py-1 rounded-lg bg-arcade-coral text-white font-bold"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              className={`text-xs mt-1 ${
                                reply.deleted ? 'text-warm-400 italic' : 'text-warm-600'
                              }`}
                            >
                              {reply.content}
                            </p>
                          )}

                          {!reply.deleted && !reply.guide && (
                            <div className="flex justify-end pt-1.5">
                              <VoteButtons
                                targetType="COMMENT"
                                targetId={reply.id}
                                initialRecommendCount={reply.recommendCount}
                                initialNotRecommendCount={reply.notRecommendCount}
                                initialMyVote={reply.myVote}
                                size="sm"
                                onNotify={onNotify}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
