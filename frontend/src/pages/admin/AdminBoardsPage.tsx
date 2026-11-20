import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  createAdminBoard,
  deleteAdminBoard,
  getAdminBoards,
  resetAdminBoard,
  updateAdminBoard,
} from '../../api/admin'
import { getErrorMessage } from '../../api/client'
import type { BoardItem, BoardWriteRole } from '../../types'

const ROLE_LABELS: Record<BoardWriteRole, string> = {
  ANONYMOUS: '비로그인',
  USER: '사용자',
  ADMIN: '관리자',
}

export function AdminBoardsPage() {
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; kind: 'success' | 'warn' } | null>(null)

  const [editingBoard, setEditingBoard] = useState<BoardItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [menuName, setMenuName] = useState('')
  const [code, setCode] = useState('')
  const [sameAsMenu, setSameAsMenu] = useState(true)
  const [visible, setVisible] = useState(true)
  const [adminOnly, setAdminOnly] = useState(false)
  const [postWriteRole, setPostWriteRole] = useState<BoardWriteRole>('USER')
  const [commentWriteRole, setCommentWriteRole] = useState<BoardWriteRole>('USER')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [resetTarget, setResetTarget] = useState<BoardItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BoardItem | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const showToast = useCallback((msg: string, kind: 'success' | 'warn') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const notifyBoardsUpdated = () => {
    window.dispatchEvent(new Event('boards-updated'))
  }

  const loadBoards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminBoards()
      setBoards(data)
    } catch (err) {
      setError(getErrorMessage(err, '게시판 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBoards()
  }, [loadBoards])

  const openCreateForm = () => {
    setEditingBoard(null)
    setMenuName('')
    setCode('')
    setSameAsMenu(true)
    setVisible(true)
    setAdminOnly(false)
    setPostWriteRole('USER')
    setCommentWriteRole('USER')
    setFormError(null)
    setShowForm(true)
  }

  const openEditForm = (board: BoardItem) => {
    setEditingBoard(board)
    setMenuName(board.menuName)
    setCode(board.code)
    setSameAsMenu(board.menuName === board.code)
    setVisible(board.visible)
    setAdminOnly(board.adminOnly)
    setPostWriteRole(board.postWriteRole)
    setCommentWriteRole(board.commentWriteRole)
    setFormError(null)
    setShowForm(true)
  }

  const handleMenuNameChange = (val: string) => {
    setMenuName(val)
    if (sameAsMenu && !editingBoard?.systemDefault) {
      setCode(val)
    }
  }

  const handleSameAsMenuToggle = (checked: boolean) => {
    setSameAsMenu(checked)
    if (checked && !editingBoard?.systemDefault) {
      setCode(menuName)
    }
  }

  const handleAdminOnlyToggle = (checked: boolean) => {
    setAdminOnly(checked)
    if (checked) {
      setVisible(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)
    const payload = {
      menuName: menuName.trim(),
      code: (editingBoard?.systemDefault ? editingBoard.code : sameAsMenu ? menuName : code).trim(),
      visible: editingBoard?.systemDefault ? true : adminOnly ? false : visible,
      adminOnly: editingBoard?.systemDefault ? false : adminOnly,
      postWriteRole,
      commentWriteRole,
    }
    try {
      if (editingBoard) {
        await updateAdminBoard(editingBoard.id, payload)
        showToast(`"${payload.menuName}" 게시판이 수정되었습니다.`, 'success')
      } else {
        await createAdminBoard(payload)
        showToast(`"${payload.menuName}" 게시판이 생성되었습니다.`, 'success')
      }
      setShowForm(false)
      await loadBoards()
      notifyBoardsUpdated()
    } catch (err) {
      setFormError(getErrorMessage(err, '저장에 실패했습니다.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleVisible = async (board: BoardItem) => {
    if (board.systemDefault || board.adminOnly) return
    setBusyId(board.id)
    try {
      await updateAdminBoard(board.id, {
        menuName: board.menuName,
        code: board.code,
        visible: !board.visible,
        adminOnly: board.adminOnly,
        postWriteRole: board.postWriteRole,
        commentWriteRole: board.commentWriteRole,
      })
      await loadBoards()
      notifyBoardsUpdated()
    } catch (err) {
      showToast(getErrorMessage(err, '노출 설정 변경에 실패했습니다.'), 'warn')
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleAdminOnly = async (board: BoardItem) => {
    if (board.systemDefault) return
    const nextAdminOnly = !board.adminOnly
    setBusyId(board.id)
    try {
      await updateAdminBoard(board.id, {
        menuName: board.menuName,
        code: board.code,
        visible: nextAdminOnly ? false : board.visible,
        adminOnly: nextAdminOnly,
        postWriteRole: board.postWriteRole,
        commentWriteRole: board.commentWriteRole,
      })
      await loadBoards()
      notifyBoardsUpdated()
    } catch (err) {
      showToast(getErrorMessage(err, '관리자 전용 설정 변경에 실패했습니다.'), 'warn')
    } finally {
      setBusyId(null)
    }
  }

  const handleReset = async (mode: 'ALL' | 'COMMENTS_ONLY') => {
    if (!resetTarget) return
    setBusyId(resetTarget.id)
    try {
      await resetAdminBoard(resetTarget.id, mode)
      showToast(
        mode === 'ALL'
          ? `"${resetTarget.menuName}" 게시판이 전체 초기화되었습니다.`
          : `"${resetTarget.menuName}" 게시판의 댓글·대댓글이 초기화되었습니다.`,
        'success',
      )
      setResetTarget(null)
    } catch (err) {
      showToast(getErrorMessage(err, '초기화에 실패했습니다.'), 'warn')
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setBusyId(deleteTarget.id)
    try {
      await deleteAdminBoard(deleteTarget.id)
      showToast(`"${deleteTarget.menuName}" 게시판이 삭제되었습니다.`, 'success')
      setDeleteTarget(null)
      await loadBoards()
      notifyBoardsUpdated()
    } catch (err) {
      showToast(getErrorMessage(err, '삭제에 실패했습니다.'), 'warn')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      <section className="bg-white border border-warm-200 rounded-3xl shadow-warm-card overflow-hidden">
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-5 border-b border-warm-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🗂️</span>
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-warm-900 tracking-tight">
                게시판 관리
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-warm-500 mt-1">
              게시판 생성·수정·노출 설정·권한·초기화·삭제를 관리합니다. (FREE 기본 게시판은 삭제/숨김 불가)
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="px-4 py-2.5 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white font-bold text-xs shadow-btn-play transition-all self-start sm:self-auto"
          >
            + 새 게시판 만들기
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-bold text-warm-400">
            게시판 목록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="py-16 text-center text-sm font-bold text-rose-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-warm-200 bg-warm-50/70 text-warm-500 font-bold">
                  <th className="py-3.5 pl-6 pr-3">메뉴명 / 코드명</th>
                  <th className="py-3.5 px-3">아티클 작성</th>
                  <th className="py-3.5 px-3">댓글 작성</th>
                  <th className="py-3.5 px-3">메뉴 노출</th>
                  <th className="py-3.5 px-3">관리자 전용</th>
                  <th className="py-3.5 pl-3 pr-6 text-right">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/80">
                {boards.map((board) => {
                  const busy = busyId === board.id
                  return (
                    <tr key={board.id} className="hover:bg-warm-50/60 transition-colors">
                      <td className="py-4 pl-6 pr-3 align-middle">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-warm-900">{board.menuName}</span>
                          {board.systemDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              기본
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-warm-400 mt-0.5">{board.code}</div>
                      </td>
                      <td className="py-4 px-3 align-middle font-bold text-warm-700">
                        {ROLE_LABELS[board.postWriteRole]}
                      </td>
                      <td className="py-4 px-3 align-middle font-bold text-warm-700">
                        {ROLE_LABELS[board.commentWriteRole]}
                      </td>
                      <td className="py-4 px-3 align-middle">
                        <button
                          type="button"
                          disabled={busy || board.systemDefault || board.adminOnly}
                          onClick={() => handleToggleVisible(board)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors disabled:opacity-50 ${
                            board.visible
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-warm-100 text-warm-500 border-warm-200'
                          }`}
                        >
                          {board.visible ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td className="py-4 px-3 align-middle">
                        <button
                          type="button"
                          disabled={busy || board.systemDefault}
                          onClick={() => handleToggleAdminOnly(board)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border transition-colors disabled:opacity-50 ${
                            board.adminOnly
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-warm-100 text-warm-500 border-warm-200'
                          }`}
                        >
                          {board.adminOnly ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td className="py-4 pl-3 pr-6 align-middle text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openEditForm(board)}
                            className="px-2.5 py-1.5 rounded-lg bg-warm-100 hover:bg-warm-200 text-warm-700 font-bold transition-colors"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setResetTarget(board)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold transition-colors"
                          >
                            초기화
                          </button>
                          <button
                            type="button"
                            disabled={busy || board.systemDefault}
                            onClick={() => setDeleteTarget(board)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-colors disabled:opacity-40"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 생성/수정 모달 */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg bg-white border border-warm-200 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4"
          >
            <h3 className="font-display font-extrabold text-lg text-warm-900">
              {editingBoard ? `게시판 수정 (${editingBoard.menuName})` : '새 게시판 만들기'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">메뉴명</label>
                <input
                  type="text"
                  value={menuName}
                  onChange={(e) => handleMenuNameChange(e.target.value)}
                  required
                  maxLength={50}
                  className="w-full rounded-xl border border-warm-200 px-3.5 py-2 text-sm text-warm-900"
                />
              </div>

              {!editingBoard?.systemDefault && (
                <label className="flex items-center gap-2 text-xs font-bold text-warm-700">
                  <input
                    type="checkbox"
                    checked={sameAsMenu}
                    onChange={(e) => handleSameAsMenuToggle(e.target.checked)}
                  />
                  메뉴명과 코드명 동일하게 사용
                </label>
              )}

              <div>
                <label className="block text-xs font-bold text-warm-700 mb-1">
                  코드명 (영문·숫자·-·_ 2~30자)
                </label>
                <input
                  type="text"
                  value={editingBoard?.systemDefault ? editingBoard.code : sameAsMenu ? menuName : code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={Boolean(editingBoard?.systemDefault) || sameAsMenu}
                  required
                  maxLength={30}
                  className="w-full rounded-xl border border-warm-200 px-3.5 py-2 text-sm font-mono text-warm-900 disabled:bg-warm-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1">아티클 작성권한</label>
                  <select
                    value={postWriteRole}
                    onChange={(e) => setPostWriteRole(e.target.value as BoardWriteRole)}
                    className="w-full rounded-xl border border-warm-200 px-3 py-2 text-xs font-bold text-warm-800"
                  >
                    <option value="ANONYMOUS">비로그인</option>
                    <option value="USER">사용자</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 mb-1">댓글·대댓글 작성권한</label>
                  <select
                    value={commentWriteRole}
                    onChange={(e) => setCommentWriteRole(e.target.value as BoardWriteRole)}
                    className="w-full rounded-xl border border-warm-200 px-3 py-2 text-xs font-bold text-warm-800"
                  >
                    <option value="ANONYMOUS">비로그인</option>
                    <option value="USER">사용자</option>
                    <option value="ADMIN">관리자</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-warm-700">
                  <input
                    type="checkbox"
                    checked={editingBoard?.systemDefault ? true : adminOnly ? false : visible}
                    disabled={Boolean(editingBoard?.systemDefault) || adminOnly}
                    onChange={(e) => setVisible(e.target.checked)}
                  />
                  메뉴 노출 ON
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-warm-700">
                  <input
                    type="checkbox"
                    checked={editingBoard?.systemDefault ? false : adminOnly}
                    disabled={Boolean(editingBoard?.systemDefault)}
                    onChange={(e) => handleAdminOnlyToggle(e.target.checked)}
                  />
                  관리자 전용
                </label>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-arcade-coral hover:bg-arcade-coralHover text-white text-xs font-bold disabled:opacity-50"
              >
                {submitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 초기화 선택 모달 */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-warm-200 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-extrabold text-base text-warm-900">
              &ldquo;{resetTarget.menuName}&rdquo; 게시판 초기화
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed">
              초기화 범위를 선택해 주세요. 삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={busyId === resetTarget.id}
                onClick={() => handleReset('ALL')}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                전체 초기화 (게시글·댓글·대댓글 모두 삭제)
              </button>
              <button
                type="button"
                disabled={busyId === resetTarget.id}
                onClick={() => handleReset('COMMENTS_ONLY')}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
              >
                댓글만 초기화 (게시글은 남기고 댓글·대댓글만 삭제)
              </button>
              <button
                type="button"
                onClick={() => setResetTarget(null)}
                className="w-full py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-warm-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-warm-200 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-display font-extrabold text-base text-warm-900">
              &ldquo;{deleteTarget.menuName}&rdquo; 게시판 삭제
            </h3>
            <p className="text-xs text-warm-600 leading-relaxed">
              게시판과 소속된 모든 게시글·댓글 데이터가 함께 삭제됩니다. 계속하시겠습니까?
            </p>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-700 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="button"
                disabled={busyId === deleteTarget.id}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                삭제 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-xs font-bold shadow-lg border ${
            toast.kind === 'success'
              ? 'bg-emerald-600 text-white border-emerald-700'
              : 'bg-rose-600 text-white border-rose-700'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  )
}
