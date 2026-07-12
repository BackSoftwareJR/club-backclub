import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useClubId } from '@/hooks/useAuth'
import { useToast } from '@/providers/ToastProvider'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function SommelierChat() {
  const clubId = useClubId()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await api.aiChat(clubId, text)
      const reply = response.message.trim()
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: reply || 'I could not generate a response right now.',
        },
      ])
    } catch (err) {
      toast({
        title: 'Sommelier unavailable',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          aria-label="Open Sommelier chat"
          className="glass-panel fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border-primary/30 text-primary shadow-2xl transition hover:scale-105 hover:border-primary/50"
          onClick={() => setOpen(true)}
          type="button"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="glass-panel fixed bottom-6 right-6 z-40 flex h-[min(70vh,520px)] w-[min(92vw,380px)] flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Sommelier</p>
              <p className="text-sm text-white/60">Ask for recommendations</p>
            </div>
            <button
              aria-label="Close chat"
              className="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" ref={listRef}>
            {messages.length === 0 && !loading && (
              <p className="text-center text-sm text-white/40">
                Ask about pairings, club favorites, or what to try tonight.
              </p>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary/20 text-white'
                      : 'border border-white/10 bg-black/30 text-white/90',
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white/50">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              void send()
            }}
          >
            <input
              className="glass-panel flex-1 rounded-xl border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-primary/30"
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the Sommelier…"
              value={input}
            />
            <Button disabled={loading || !input.trim()} size="icon" type="submit">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
