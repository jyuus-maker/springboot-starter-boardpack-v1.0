import { useEffect, useState } from 'react'
import { getErrorMessage } from '../../api/client'
import { castVote } from '../../api/votes'
import type { VoteTargetType, VoteType } from '../../types'
import { useAuth } from '../auth/useAuth'

interface VoteButtonsProps {
  targetType: VoteTargetType
  targetId: number
  initialRecommendCount: number
  initialNotRecommendCount: number
  initialMyVote: VoteType | null
  size?: 'sm' | 'md'
  onNotify?: (message: string, type?: 'info' | 'success' | 'warn') => void
}

function ThumbUpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 11v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h3Zm0 0 3.5-7a2 2 0 0 1 3.5 1.3V9h4.6a2 2 0 0 1 1.96 2.4l-1.2 6A2 2 0 0 1 17.4 19H7"
      />
    </svg>
  )
}

function ThumbDownIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 13V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3Zm0 0 3.5 7a2 2 0 0 0 3.5-1.3V15h4.6a2 2 0 0 0 1.96-2.4l-1.2-6A2 2 0 0 0 17.4 5H7"
      />
    </svg>
  )
}

export function VoteButtons({
  targetType,
  targetId,
  initialRecommendCount,
  initialNotRecommendCount,
  initialMyVote,
  size = 'md',
  onNotify,
}: VoteButtonsProps) {
  const { isAuthenticated } = useAuth()
  const [recommendCount, setRecommendCount] = useState(initialRecommendCount)
  const [notRecommendCount, setNotRecommendCount] = useState(initialNotRecommendCount)
  const [myVote, setMyVote] = useState<VoteType | null>(initialMyVote)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setRecommendCount(initialRecommendCount)
    setNotRecommendCount(initialNotRecommendCount)
    setMyVote(initialMyVote)
  }, [targetId, initialRecommendCount, initialNotRecommendCount, initialMyVote])

  const handleVote = async (voteType: VoteType) => {
    if (!isAuthenticated) {
      onNotify?.('로그인 후 추천·비추천할 수 있습니다.', 'warn')
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      const res = await castVote(targetType, targetId, voteType)
      setMyVote(res.myVote)
      setRecommendCount(res.recommendCount)
      setNotRecommendCount(res.notRecommendCount)
    } catch (err) {
      onNotify?.(getErrorMessage(err, '투표 처리에 실패했습니다.'), 'warn')
    } finally {
      setSubmitting(false)
    }
  }

  const isSmall = size === 'sm'
  const iconClass = isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const baseBtn = isSmall
    ? 'inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-bold transition-all disabled:opacity-50'
    : 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-50'

  const recActive = myVote === 'RECOMMEND'
  const notRecActive = myVote === 'NOT_RECOMMEND'

  return (
    <div className="inline-flex items-center gap-1.5 shrink-0">
      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleVote('RECOMMEND')}
        aria-pressed={recActive}
        title="추천"
        className={`${baseBtn} ${
          recActive
            ? 'bg-arcade-coral text-white border-arcade-coral shadow-xs'
            : 'bg-white text-warm-600 border-warm-200 hover:border-arcade-coral/50 hover:text-arcade-coral'
        }`}
      >
        <ThumbUpIcon className={iconClass} />
        {!isSmall && <span>추천</span>}
        <span className="font-mono">{recommendCount}</span>
      </button>

      <button
        type="button"
        disabled={submitting}
        onClick={() => void handleVote('NOT_RECOMMEND')}
        aria-pressed={notRecActive}
        title="비추천"
        className={`${baseBtn} ${
          notRecActive
            ? 'bg-warm-800 text-white border-warm-800 shadow-xs'
            : 'bg-white text-warm-500 border-warm-200 hover:border-warm-400 hover:text-warm-800'
        }`}
      >
        <ThumbDownIcon className={iconClass} />
        {!isSmall && <span>비추천</span>}
        <span className="font-mono">{notRecommendCount}</span>
      </button>
    </div>
  )
}
