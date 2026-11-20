import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createPost, getPost, getPublicBoards, updatePost } from '../../api/board'
import { getErrorMessage } from '../../api/client'
import { useAuth } from '../../features/auth/useAuth'
import type { BoardItem, BoardWriteRole, PostItem } from '../../types'

export function PostEditPage() {
  const { postId } = useParams<{ postId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin } = useAuth()

  const isEditMode = Boolean(postId)
  const initialBoardCode = searchParams.get('board') ?? ''

  const [boards, setBoards] = useState<BoardItem[]>([])
  const [existingPost, setExistingPost] = useState<PostItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [boardCode, setBoardCode] = useState(initialBoardCode)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestPassword, setGuestPassword] = useState('')
  const [pinned, setPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canWriteRole = (role: BoardWriteRole) => {
    if (role === 'ANONYMOUS') return true
    if (role === 'USER') return isAuthenticated
    return isAdmin
  }

  const writableBoards = useMemo(() => {
    if (existingPost?.guide && isAdmin) {
      return boards
    }
    return boards.filter((b) => canWriteRole(b.postWriteRole))
  }, [boards, existingPost, isAuthenticated, isAdmin])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    const load = async () => {
      try {
        const boardList = await getPublicBoards()
        if (!mounted) return
        setBoards(boardList)

        if (isEditMode && postId) {
          const post = await getPost(postId)
          if (!mounted) return
          setExistingPost(post)
          setBoardCode(post.boardCode)
          setTitle(post.title)
          setContent(post.content)
          setPinned(Boolean(post.isPinned))
        } else {
          const eligible = boardList.filter((b) => {
            if (b.postWriteRole === 'ANONYMOUS') return true
            if (b.postWriteRole === 'USER') return isAuthenticated
            return isAdmin
          })
          const matched = eligible.find(
            (b) => b.code.toLowerCase() === initialBoardCode.toLowerCase(),
          )
          setBoardCode(matched?.code ?? eligible[0]?.code ?? '')
        }
      } catch (err) {
        if (mounted) setError(getErrorMessage(err, '데이터를 불러오지 못했습니다.'))
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [isEditMode, postId, initialBoardCode, isAuthenticated, isAdmin])

  const showGuestCreateFields = !isEditMode && !isAuthenticated
  const showGuestEditPassword = isEditMode && Boolean(existingPost?.guest)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setError(null)
    setSubmitting(true)

    try {
      const payload = {
        boardCode,
        title: title.trim(),
        content: content.trim(),
        ...(showGuestCreateFields ? { guestName: guestName.trim(), guestPassword: guestPassword.trim() } : {}),
        ...(showGuestEditPassword ? { guestPassword: guestPassword.trim() } : {}),
        ...(isAdmin && !existingPost?.guide ? { pinned } : {}),
      }

      if (isEditMode && postId) {
        const updated = await updatePost(postId, payload)
        navigate(`/board/${updated.displayId}`)
      } else {
        const created = await createPost(payload)
        navigate(`/board/${created.displayId}`)
      }
    } catch (err) {
      setError(getErrorMessage(err, '저장에 실패했습니다.'))
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center text-xs font-bold text-warm-400">
        화면을 준비하는 중입니다...
      </div>
    )
  }

  if (!isEditMode && writableBoards.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 bg-white border border-warm-200 rounded-3xl p-8 shadow-warm-card">
        <div className="text-3xl">🔒</div>
        <h2 className="font-display font-extrabold text-lg text-warm-900">
          글쓰기 권한이 있는 게시판이 없습니다
        </h2>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl bg-warm-100 text-xs font-bold text-warm-700"
        >
          돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-warm-200 rounded-3xl p-6 sm:p-8 shadow-warm-card space-y-5"
      >
        <div className="flex items-center justify-between border-b border-warm-200/80 pb-4">
          <h1 className="font-display font-extrabold text-xl text-warm-900">
            {isEditMode ? '게시글 수정' : '새 게시글 작성'}
          </h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3.5 py-1.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-700"
          >
            취소
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1">게시판</label>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={boardCode}
                onChange={(e) => setBoardCode(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-warm-200 px-3.5 py-2.5 text-sm font-bold text-warm-900"
              >
                {writableBoards.map((b) => (
                  <option key={b.id} value={b.code}>
                    {b.menuName}
                  </option>
                ))}
              </select>
              {isAdmin && !existingPost?.guide && (
                <label className="inline-flex items-center gap-2 text-xs font-bold text-warm-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                  />
                  상단 고정 (공지)
                </label>
              )}
            </div>
          </div>

          {showGuestCreateFields && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-warm-50 border border-warm-200">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">작성자</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                  maxLength={50}
                  placeholder="작성자 이름"
                  className="w-full rounded-xl border border-warm-200 bg-white px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">비밀번호 (수정·삭제 시 필요)</label>
                <input
                  type="password"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  required
                  maxLength={100}
                  placeholder="비밀번호"
                  className="w-full rounded-xl border border-warm-200 bg-white px-3.5 py-2 text-sm"
                />
              </div>
            </div>
          )}

          {showGuestEditPassword && (
            <div className="p-4 rounded-2xl bg-warm-50 border border-warm-200">
              <label className="block text-xs font-bold text-warm-700 mb-1">
                작성자 비밀번호 확인 ({existingPost?.nickname})
              </label>
              <input
                type="password"
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                required
                maxLength={100}
                placeholder="작성 시 입력한 비밀번호"
                className="w-full sm:w-72 rounded-xl border border-warm-200 bg-white px-3.5 py-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={200}
              placeholder="제목을 입력해 주세요."
              className="w-full rounded-xl border border-warm-200 px-4 py-2.5 text-sm text-warm-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-700 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={12}
              maxLength={20000}
              placeholder="내용을 입력해 주세요."
              className="w-full rounded-2xl border border-warm-200 px-4 py-3 text-sm text-warm-900 leading-relaxed"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-xs font-bold text-warm-700"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs sm:text-sm font-bold shadow-btn-play disabled:opacity-50"
          >
            {submitting ? '저장 중...' : isEditMode ? '수정 완료' : '등록하기'}
          </button>
        </div>
      </form>
    </div>
  )
}
