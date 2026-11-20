export type UserRole = 'USER' | 'ADMIN'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'WITHDRAWN'

export interface User {
  id: number
  email: string
  nickname: string
  role: UserRole
  status: UserStatus
  createdAt?: string
}

export type BoardWriteRole = 'ANONYMOUS' | 'USER' | 'ADMIN'
export type CommentTargetType = 'POST'
export type VoteType = 'RECOMMEND' | 'NOT_RECOMMEND'
export type VoteTargetType = 'POST' | 'COMMENT'

export interface BoardItem {
  id: number
  code: string
  menuName: string
  visible: boolean
  adminOnly: boolean
  postWriteRole: BoardWriteRole
  commentWriteRole: BoardWriteRole
  systemDefault: boolean
  sortOrder: number
}

export interface PostItem {
  id: number | null
  displayId: string
  guide: boolean
  boardId: number | null
  boardCode: string
  boardMenuName: string
  userId: number | null
  nickname: string | null
  userRole: UserRole | null
  userStatus: UserStatus | null
  guest: boolean
  deleted: boolean
  title: string
  content: string
  commentCount: number
  recommendCount: number
  notRecommendCount: number
  myVote: VoteType | null
  isAnswered?: boolean | null
  isPinned?: boolean
  createdAt: string
  updatedAt?: string | null
}

export interface CommentReplyItem {
  id: number
  parentId: number
  userId: number | null
  nickname: string | null
  userStatus: UserStatus | null
  isAdmin?: boolean
  deleted: boolean
  guide: boolean
  content: string
  recommendCount: number
  notRecommendCount: number
  myVote: VoteType | null
  createdAt: string
}

export interface CommentItem {
  id: number
  targetType: CommentTargetType
  targetId: number | null
  userId: number | null
  nickname: string | null
  userStatus: UserStatus | null
  isAdmin?: boolean
  deleted: boolean
  guide: boolean
  content: string
  recommendCount: number
  notRecommendCount: number
  myVote: VoteType | null
  createdAt: string
  replies?: CommentReplyItem[]
}
