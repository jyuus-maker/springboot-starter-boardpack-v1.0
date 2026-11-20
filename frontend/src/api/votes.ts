import type { VoteTargetType, VoteType } from '../types'
import api from './client'

export interface VoteResponse {
  myVote: VoteType | null
  recommendCount: number
  notRecommendCount: number
}

/** POST /api/votes → 추천·비추천 토글 */
export async function castVote(
  targetType: VoteTargetType,
  targetId: number,
  voteType: VoteType,
): Promise<VoteResponse> {
  const { data } = await api.post<VoteResponse>('/votes', {
    targetType,
    targetId,
    voteType,
  })
  return data
}
