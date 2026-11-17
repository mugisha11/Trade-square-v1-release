import { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import type { MessageThread, UserProfile } from '../../types/workspace';
import { authFetch } from '../../lib/authClient';

interface MessagesViewProps {
  user: UserProfile;
  initialThreadId?: string | null;
}

export function MessagesView({ user, initialThreadId }: MessagesViewProps) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId ?? null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/messages');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to load conversations.');
      }
      const data = await res.json();
      const loaded: MessageThread[] = data.threads ?? [];
      setThreads(loaded);
      setSelectedThreadId((prev) => {
        if (initialThreadId && loaded.some((t) => t.id === initialThreadId)) {
          return initialThreadId;
        }
        if (prev && loaded.some((t) => t.id === prev)) {
          return prev;
        }
        return loaded.length > 0 ? loaded[0].id : null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load conversations.');
    } finally {
      setLoading(false);
    }
  }, [initialThreadId]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const activeThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!activeThread || !draft.trim()) return;
    setSending(true);
    try {
      const res = await authFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.id,
          body: draft.trim(),
        }),
      });
      if (res.ok) {
        setDraft('');
        await loadThreads();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white dark:bg-[#000000] border border-[#E2E8F0] dark:border-[#2F3336] rounded-xl overflow-hidden min-h-[520px] grid grid-cols-1 md:grid-cols-12">
      {/* Thread List */}
      <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-[#E2E8F0] dark:border-[#2F3336] flex flex-col">
        <div className="p-4 border-b border-[#E8EDF2] dark:border-[#2F3336]">
          <h1 className="text-base font-semibold text-[#191919] dark:text-[#E7E9EA]">Messages</h1>
          <p className="text-xs text-[#525866] dark:text-[#71767B] mt-0.5">
            Direct business enquiries &amp; replies
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-xs text-[#525866] dark:text-[#71767B]">
            Loading conversations...
          </div>
        ) : error ? (
          <div className="p-6 text-center my-auto space-y-3">
            <p className="text-xs text-red-700 dark:text-[#F4212E]">{error}</p>
            <button
              type="button"
              onClick={loadThreads}
              className="px-3 py-1.5 rounded-lg border border-[#0A66C2]/30 dark:border-[#1D9BF0]/40 text-xs font-medium text-[#0A66C2] dark:text-[#1D9BF0] hover:bg-[#0A66C2]/5 dark:hover:bg-[#1D9BF0]/10 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div className="p-6 text-center my-auto">
            <MessageSquare className="w-7 h-7 text-[#0A66C2] dark:text-[#1D9BF0] mx-auto mb-2" />
            <p className="text-sm font-medium text-[#191919] dark:text-[#E7E9EA]">
              No conversations yet
            </p>
            <p className="text-xs text-[#525866] dark:text-[#71767B] mt-1">
              Use &ldquo;Contact business&rdquo; on any opportunity or business profile to start a thread.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9] dark:divide-[#2F3336] overflow-y-auto">
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedThreadId(thread.id)}
                className={`w-full text-left p-4 transition-colors cursor-pointer ${
                  thread.id === activeThread?.id
                    ? 'bg-[#0A66C2]/5 dark:bg-[#16181C] dark:border-r-2 dark:border-r-[#1D9BF0]'
                    : 'hover:bg-[#F3F6F8] dark:hover:bg-[#16181C]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA] truncate">
                    {thread.counterpartyBusinessName}
                  </p>
                  <span className="text-[11px] text-[#64748B] dark:text-[#71767B] shrink-0 tabular-nums">
                    {new Date(thread.lastMessageAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#0A66C2] dark:text-[#1D9BF0] truncate mt-0.5">
                  {thread.subject}
                </p>
                <p className="text-xs text-[#525866] dark:text-[#71767B] truncate mt-1">
                  {thread.lastMessagePreview}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Conversation Pane */}
      <div className="md:col-span-8 flex flex-col justify-between bg-[#F8FAFC] dark:bg-[#000000]">
        {activeThread ? (
          <>
            <div className="p-4 bg-white dark:bg-[#000000] border-b border-[#E8EDF2] dark:border-[#2F3336]">
              <h2 className="text-sm font-semibold text-[#191919] dark:text-[#E7E9EA]">
                {activeThread.counterpartyBusinessName}
              </h2>
              <p className="text-xs text-[#525866] dark:text-[#71767B]">
                {activeThread.counterpartyName} · {activeThread.counterpartyLocation} ·{' '}
                {activeThread.subject}
              </p>
            </div>

            <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[380px]">
              {activeThread.messages.map((msg) => {
                const isMine = msg.senderUserId === user.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-[#0A66C2] dark:bg-[#1D9BF0] text-white'
                          : 'bg-white dark:bg-[#2F3336] border border-[#E2E8F0] dark:border-transparent text-[#191919] dark:text-[#E7E9EA]'
                      }`}
                    >
                      {msg.body}
                    </div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#71767B] mt-1 tabular-nums">
                      {msg.senderBusinessName} · {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
            </div>

            <form
              onSubmit={handleSend}
              className="p-3 bg-white dark:bg-[#16181C] border-t border-[#E8EDF2] dark:border-[#2F3336] flex items-center gap-2"
            >
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 min-h-[42px] rounded-full border border-[#CBD5E1] dark:border-[#2F3336] dark:bg-[#000000] dark:text-[#E7E9EA] dark:placeholder:text-[#71767B] px-4 text-sm text-[#191919] focus:outline-none focus:border-[#0A66C2] dark:focus:border-[#1D9BF0]"
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="min-h-[42px] px-4 rounded-full bg-[#0A66C2] hover:bg-[#004182] dark:bg-[#1D9BF0] dark:hover:bg-[#1A8CD8] disabled:opacity-50 text-white text-sm font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-[#525866] dark:text-[#71767B]">
            Select a conversation to view messages.
          </div>
        )}
      </div>
    </div>
  );
}
