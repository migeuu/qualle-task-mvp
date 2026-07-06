import { useState } from 'react'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useAddComment } from '../hooks/useComments'
import { formatDate } from '../lib/date'
import type { Comment } from '../types'

const commentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be 1000 characters or less'),
})

interface CommentSectionProps {
  taskId: string
  comments: Comment[]
}

export function CommentSection({ taskId, comments }: CommentSectionProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const addComment = useAddComment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validation = commentSchema.safeParse({ content })
    if (!validation.success) {
      setError(validation.error.issues[0].message)
      return
    }

    try {
      await addComment.mutateAsync({ taskId, content: validation.data.content })
      setContent('')
      toast.success('Comment added')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add comment'
      toast.error(message)
    }
  }

  const isEnabled = content.trim().length > 0 && content.trim().length <= 1000

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>Comments</h3>

      {comments.length === 0 ? (
        <p style={{ color: '#888', fontSize: 14, fontStyle: 'italic' }}>No comments yet</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {comments.map((comment) => (
            <div key={comment.id} style={{ padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>
                  {comment.author?.name ?? comment.author?.email ?? 'Unknown'}
                </span>
                <span style={{ fontSize: 12, color: '#888' }}>{formatDate(comment.createdAt, true)}</span>
              </div>
              <p style={{ margin: 0, fontSize: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            setError(null)
          }}
          placeholder="Write a comment..."
          rows={2}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 4,
            border: error ? '1px solid #e53e3e' : '1px solid #ccc',
            fontSize: 14,
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={addComment.isPending || !isEnabled}
          style={{
            padding: '8px 20px',
            borderRadius: 4,
            border: 'none',
            background: '#1a1a2e',
            color: 'white',
            cursor: addComment.isPending || !isEnabled ? 'not-allowed' : 'pointer',
            fontSize: 14,
            alignSelf: 'flex-end',
            opacity: addComment.isPending || !isEnabled ? 0.5 : 1,
          }}
        >
          {addComment.isPending ? 'Sending...' : 'Send'}
        </button>
      </form>
      {error && (
        <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#e53e3e' }}>{error}</p>
      )}
    </div>
  )
}
