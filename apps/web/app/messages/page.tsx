'use client';

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  MessageSquare,
  Send,
  Search,
  User,
  ArrowLeft,
  Loader2,
  CheckCheck,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { ConversationSummary, ChatMessage } from '@sakany/shared';

function timeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'À l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(dateString).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
}

function MessagesContent() {
  const { user, token, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get('conversationId');
  const recipientIdParam = searchParams.get('recipientId');

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileShowChat, setMobileShowChat] = useState(!!initialConvId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeConvIdRef = useRef<string | null>(activeConvId);
  activeConvIdRef.current = activeConvId;

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // 1. Fetch conversations list
  const fetchConversations = useCallback(async (selectFirst = false) => {
    if (!token) return;
    try {
      const res = await fetch('/api/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const list: ConversationSummary[] = Array.isArray(data) ? data : data.data || [];
      setConversations(list);

      // Handle recipientId param if conversation doesn't exist yet
      if (recipientIdParam && !activeConvIdRef.current) {
        const found = list.find((c) => c.otherUser.id === recipientIdParam);
        if (found) {
          setActiveConvId(found.id);
          setMobileShowChat(true);
        }
      } else if (selectFirst && !activeConvIdRef.current && list.length > 0 && window.innerWidth >= 768) {
        setActiveConvId(list[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [token, recipientIdParam]);

  // 2. Fetch messages for active conversation
  const fetchMessages = useCallback(async (convId: string, isPolling = false) => {
    if (!token || !convId) return;
    if (!isPolling) setLoadingMessages(true);

    try {
      const res = await fetch(`/api/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const newMessages: ChatMessage[] = data.messages || [];

      setMessages((prev) => {
        if (prev.length !== newMessages.length || (prev[prev.length - 1]?.id !== newMessages[newMessages.length - 1]?.id)) {
          setTimeout(() => scrollToBottom(!isPolling), 50);
          return newMessages;
        }
        return prev;
      });

      // Clear unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!isPolling) setLoadingMessages(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/auth/login?redirect=/messages');
      return;
    }
    fetchConversations(true);
  }, [user, authLoading, token, router, fetchConversations]);

  // Switch conversation
  useEffect(() => {
    if (activeConvId) {
      fetchMessages(activeConvId, false);
      setMobileShowChat(true);
    } else {
      setMessages([]);
    }
  }, [activeConvId, fetchMessages]);

  // Poll conversations & active messages only when tab is visible
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      fetchConversations(false);
      if (activeConvIdRef.current) {
        fetchMessages(activeConvIdRef.current, true);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [token, fetchConversations, fetchMessages]);

  // Send message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || !token || sending) return;

    setSending(true);

    try {
      let targetConvId = activeConvId;

      if (!targetConvId && recipientIdParam) {
        // Create new conversation on first send
        const createRes = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: recipientIdParam,
            content: trimmed,
          }),
        });

        if (!createRes.ok) throw new Error('Erreur création conversation');
        const createData = await createRes.json();
        targetConvId = createData.conversationId;
        setActiveConvId(targetConvId);
        setInputText('');
        fetchConversations(false);
        if (targetConvId) fetchMessages(targetConvId, false);
        return;
      }

      if (!targetConvId) return;

      // Optimistic message
      const optimisticMsg: ChatMessage = {
        id: `temp-${Date.now()}`,
        conversationId: targetConvId,
        senderId: user?.id || '',
        content: trimmed,
        createdAt: new Date().toISOString(),
        sender: { id: user?.id || '', fullName: user?.fullName || 'Moi' },
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setInputText('');
      setTimeout(() => scrollToBottom(true), 20);

      const res = await fetch(`/api/conversations/${targetConvId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.ok) {
        fetchMessages(targetConvId, true);
        fetchConversations(false);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  if (authLoading || (loadingConversations && conversations.length === 0)) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-sand/10">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={36} className="animate-spin text-door" />
          <p className="text-sm font-semibold text-ink-soft">Chargement de votre messagerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-73px)] overflow-hidden bg-[#FBF9F5] flex flex-col">
      <div className="flex-1 flex overflow-hidden max-w-7xl w-full mx-auto sm:my-3 sm:px-4 lg:px-6">
        <div className="flex-1 flex overflow-hidden rounded-2xl sm:border border-sand/70 bg-white shadow-sm">

          {/* ── LEFT PANE: Conversations List ── */}
          <div
            className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-sand/60 bg-sand/5 ${
              mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-sand/60 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold font-display text-ink flex items-center gap-2">
                  <span>Discussions</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-door/10 text-door">
                    {conversations.length}
                  </span>
                </h1>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une personne..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-sand bg-sand/20 text-ink placeholder:text-ink-soft/70 outline-none transition focus:border-door focus:bg-white"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-sand/30">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-ink-soft">
                  <MessageSquare size={36} className="mx-auto mb-2 opacity-25" />
                  <p className="text-xs font-medium">Aucune discussion trouvée</p>
                  <p className="text-[11px] text-ink-soft/70 mt-1">
                    Contactez un propriétaire ou un colocataire depuis une annonce pour démarrer une discussion.
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  const initial = conv.otherUser?.fullName?.charAt(0).toUpperCase() || 'U';

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => {
                        setActiveConvId(conv.id);
                        setMobileShowChat(true);
                      }}
                      className={`w-full text-left p-3.5 transition flex items-start gap-3 hover:bg-sand/30 ${
                        isActive ? 'bg-door/10 border-l-4 border-door' : 'bg-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-door/15 text-door font-bold text-base shadow-2xs">
                          {initial}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm font-semibold truncate ${isActive ? 'text-door' : 'text-ink'}`}>
                            {conv.otherUser.fullName}
                          </p>
                          {conv.lastMessage && (
                            <span className="text-[10px] text-ink-soft shrink-0">
                              {timeAgo(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs text-ink-soft truncate">
                          {conv.lastMessage ? (
                            conv.lastMessage.senderId === user?.id ? (
                              <span>Vous : {conv.lastMessage.content}</span>
                            ) : (
                              conv.lastMessage.content
                            )
                          ) : (
                            <span className="italic text-ink-soft/60">Nouvelle discussion</span>
                          )}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {conv.unreadCount > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-door px-1.5 text-[10px] font-bold text-white shadow-xs">
                          {conv.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT PANE: Active Chat ── */}
          <div
            className={`flex-1 flex flex-col bg-white overflow-hidden ${
              !mobileShowChat ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConvId || recipientIdParam ? (
              <>
                {/* Chat Top Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-sand/60 bg-white shadow-2xs z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setMobileShowChat(false)}
                      className="p-1.5 md:hidden text-ink-soft hover:bg-sand/30 rounded-lg"
                      aria-label="Retour aux discussions"
                    >
                      <ArrowLeft size={18} />
                    </button>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-door/15 text-door font-bold text-base shadow-2xs">
                      {activeConversation?.otherUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-ink truncate">
                        {activeConversation?.otherUser?.fullName || 'Discussion'}
                      </h2>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>En ligne sur Sakany</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-1 text-xs text-ink-soft bg-sand/30 rounded-full px-3 py-1 border border-sand">
                      <ShieldCheck size={13} className="text-door" />
                      <span>Échanges sécurisés</span>
                    </div>
                  </div>
                </div>

                {/* Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-sand/[0.06]">
                  {loadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-door" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="my-12 flex flex-col items-center justify-center text-center text-ink-soft">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-door/10 text-door mb-3">
                        <Sparkles size={26} />
                      </div>
                      <h3 className="text-sm font-bold text-ink">Démarrez votre conversation</h3>
                      <p className="mt-1 text-xs max-w-xs text-ink-soft leading-relaxed">
                        Posez vos questions sur le logement, la disponibilité, les charges ou convenez d&apos;une visite.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isMe = msg.senderId === user?.id;
                      const showDateHeader =
                        index === 0 ||
                        new Date(msg.createdAt).toDateString() !==
                          new Date(messages[index - 1].createdAt).toDateString();

                      return (
                        <div key={msg.id} className="space-y-2">
                          {showDateHeader && (
                            <div className="flex justify-center my-4">
                              <span className="rounded-full bg-sand/50 px-3 py-0.5 text-[10px] font-semibold text-ink-soft">
                                {new Date(msg.createdAt).toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          )}

                          <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-door/10 text-door text-xs font-bold mb-1">
                                {msg.sender?.fullName?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}

                            <div
                              className={`max-w-[78%] sm:max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-xs break-words ${
                                isMe
                                  ? 'bg-door text-white rounded-br-xs'
                                  : 'bg-white text-ink border border-sand/70 rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                              <div
                                className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                                  isMe ? 'text-white/80' : 'text-ink-soft/70'
                                }`}
                              >
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {isMe && <CheckCheck size={12} className="text-white/80" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Box */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 sm:p-4 border-t border-sand/60 bg-white flex items-end gap-2"
                >
                  <div className="flex-1 rounded-2xl border border-sand/80 bg-sand/15 focus-within:border-door focus-within:bg-white transition-all">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Écrivez votre message... (Entrée pour envoyer)"
                      rows={1}
                      className="w-full resize-none bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-soft/70 outline-none max-h-32 min-h-[44px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-door text-white transition hover:bg-door-deep disabled:opacity-40 disabled:hover:bg-door shadow-sm"
                    aria-label="Envoyer le message"
                  >
                    {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </>
            ) : (
              /* No Conversation Selected Placeholder */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-sand/[0.04]">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-door/10 text-door mb-4 shadow-sm">
                  <MessageSquare size={32} />
                </div>
                <h2 className="text-base font-bold text-ink">Vos messages Sakany</h2>
                <p className="mt-1 text-xs text-ink-soft max-w-sm leading-relaxed">
                  Sélectionnez une conversation sur la gauche pour lire vos échanges ou répondre à vos demandes de logement.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-sand/10">
          <Loader2 size={36} className="animate-spin text-door" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
