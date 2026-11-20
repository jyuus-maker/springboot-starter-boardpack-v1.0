import type {
  BoardItem,
  CommentItem,
  CommentTargetType,
  PostItem,
} from '../types'
import api from './client'

export interface PostPayload {
  boardCode: string
  title: string
  content: string
  guestName?: string
  guestPassword?: string
  pinned?: boolean
}

export interface CommentPayload {
  targetType: CommentTargetType
  targetId?: number | null
  parentId?: number | null
  content: string
}

/** GET /api/boards → 노출 중인 게시판 목록 */
export async function getPublicBoards(): Promise<BoardItem[]> {
  const { data } = await api.get<BoardItem[]>('/boards')
  return data
}

/** GET /api/posts → 게시글 전체 또는 게시판별 목록 */
export async function getPosts(boardCode?: string): Promise<PostItem[]> {
  const params = boardCode ? { boardCode } : undefined
  const { data } = await api.get<PostItem[]>('/posts', { params })
  return data
}

/** GET /api/posts/{id} → 게시글 상세 (숫자 ID 또는 ex1 등) */
export async function getPost(postId: string | number): Promise<PostItem> {
  const { data } = await api.get<PostItem>(`/posts/${postId}`)
  return data
}

/** POST /api/posts → 게시글 작성 */
export async function createPost(body: PostPayload): Promise<PostItem> {
  const { data } = await api.post<PostItem>('/posts', body)
  return data
}

/** PUT /api/posts/{id} → 게시글 수정 */
export async function updatePost(postId: string | number, body: PostPayload): Promise<PostItem> {
  const { data } = await api.put<PostItem>(`/posts/${postId}`, body)
  return data
}

/** DELETE /api/posts/{id} → 게시글 삭제 */
export async function deletePost(postId: string | number, guestPassword?: string): Promise<void> {
  await api.delete(`/posts/${postId}`, {
    data: guestPassword ? { guestPassword } : undefined,
  })
}

/** GET /api/comments → 댓글·대댓글 트리 목록 */
export async function getComments(
  targetType: CommentTargetType,
  targetId?: string | number | null,
): Promise<CommentItem[]> {
  const params: Record<string, string | number> = { targetType }
  if (targetId !== undefined && targetId !== null) {
    params.targetId = targetId
  }
  const { data } = await api.get<CommentItem[]>('/comments', { params })
  return data
}

/** POST /api/comments → 댓글·대댓글 작성 */
export async function createComment(body: CommentPayload): Promise<CommentItem[]> {
  const { data } = await api.post<CommentItem[]>('/comments', body)
  return data
}

/** PUT /api/comments/{id} → 댓글·대댓글 수정 */
export async function updateComment(commentId: number, content: string): Promise<void> {
  await api.put(`/comments/${commentId}`, { content })
}

/** DELETE /api/comments/{id} → 댓글·대댓글 삭제 */
export async function deleteComment(commentId: number): Promise<void> {
  await api.delete(`/comments/${commentId}`)
}

export { api }
