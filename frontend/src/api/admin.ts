import type { BoardItem, BoardWriteRole, UserRole, UserStatus } from '../types'
import api from './client'

export interface AdminUserResponse {
  id: number
  email: string
  nickname: string
  role: UserRole
  status: UserStatus
  isMock: boolean
  createdAt: string
  withdrawnAt: string | null
}

export interface AdminBoardPayload {
  menuName: string
  code: string
  visible: boolean
  adminOnly: boolean
  postWriteRole: BoardWriteRole
  commentWriteRole: BoardWriteRole
}

export async function getAdminUsers(): Promise<AdminUserResponse[]> {
  const { data } = await api.get<AdminUserResponse[]>('/admin/users')
  return data
}

export async function promoteAdminUser(id: number): Promise<AdminUserResponse> {
  const { data } = await api.post<AdminUserResponse>(`/admin/users/${id}/promote`)
  return data
}

export async function suspendAdminUser(id: number): Promise<AdminUserResponse> {
  const { data } = await api.post<AdminUserResponse>(`/admin/users/${id}/suspend`)
  return data
}

export async function activateAdminUser(id: number): Promise<AdminUserResponse> {
  const { data } = await api.post<AdminUserResponse>(`/admin/users/${id}/activate`)
  return data
}

export async function getAdminBoards(): Promise<BoardItem[]> {
  const { data } = await api.get<BoardItem[]>('/admin/boards')
  return data
}

export async function createAdminBoard(payload: AdminBoardPayload): Promise<BoardItem> {
  const { data } = await api.post<BoardItem>('/admin/boards', payload)
  return data
}

export async function updateAdminBoard(boardId: number, payload: AdminBoardPayload): Promise<BoardItem> {
  const { data } = await api.put<BoardItem>(`/admin/boards/${boardId}`, payload)
  return data
}

export async function resetAdminBoard(boardId: number, mode: 'ALL' | 'COMMENTS_ONLY'): Promise<void> {
  await api.post(`/admin/boards/${boardId}/reset`, { mode })
}

export async function deleteAdminBoard(boardId: number): Promise<void> {
  await api.delete(`/admin/boards/${boardId}`)
}

export { api }
