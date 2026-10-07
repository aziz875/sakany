'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

interface DirectMessageModalProps {
  recipientId: string;
  recipientName: string;
  listingTitle?: string;
  buttonLabel?: string;
  buttonClassName?: string;
}

export function DirectMessageModal({
  recipientId,
  recipientName,
  listingTitle,
  buttonLabel = 'Envoyer un message',
  buttonClassName,
}: DirectMessageModalProps) {
  const { user, token } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(
    listingTitle
      ? `Bonjour ${recipientName}, je suis très intéressé(e) par votre logement "${listingTitle}". Est-il toujours disponible ?`
      : `Bonjour ${recipientName}, j'ai vu ton profil colocataire sur Sakany et je pense que nos critères correspondent !`,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const [createdConvId, setCreatedConvId] = useState<string | null>(null);

  const handleOpen = () => {
    if (!user || !token) {
      router.push('/auth/login');
      return;
    }
    if (user.id === recipientId) {
      alert('Vous ne pouvez pas vous envoyer un message à vous-même.');
      return;
    }
    setIsOpen(true);
    setSent(false);
    setError(null);
    setCreatedConvId(null);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !token) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId,
          content: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Erreur lors de l'envoi du message.");
      }

      setSent(true);
      if (data.conversationId) {
        setCreatedConvId(data.conversationId);
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={
          buttonClassName ||
          'inline-flex items-center justify-center gap-2 rounded-xl bg-door px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-door-deep focus-visible:outline-door'
        }
      >
        <MessageSquare size={17} />
        <span>{buttonLabel}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl border border-sand bg-white p-6 shadow-2xl">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-ink-soft hover:bg-sand/40 hover:text-ink transition"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-sand pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-door/10 text-door font-bold text-lg">
                {recipientName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-semibold text-ink text-base">
                  Contacter {recipientName}
                </h3>
                <p className="text-xs text-ink-soft">
                  {listingTitle ? `Logement : ${listingTitle}` : 'Discussion Colocation directe'}
                </p>
              </div>
            </div>

            {/* Success View */}
            {sent ? (
              <div className="my-8 flex flex-col items-center justify-center text-center">
                <CheckCircle2 size={48} className="text-emerald-500 animate-bounce" />
                <h4 className="mt-3 text-base font-bold text-ink">Message envoyé avec succès !</h4>
                <p className="mt-1 text-xs text-ink-soft">
                  {recipientName} recevra votre message et une notification instantanée.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setSent(false);
                    }}
                    className="rounded-full border border-sand px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-sand/30"
                  >
                    Fermer
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      router.push(
                        createdConvId
                          ? `/messages?conversationId=${createdConvId}`
                          : '/messages'
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-door px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-door-deep"
                  >
                    <span>Ouvrir la discussion</span>
                    <MessageSquare size={13} />
                  </button>
                </div>
              </div>
            ) : (
              /* Message Form */
              <form onSubmit={handleSend} className="mt-5 space-y-4">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">
                    Votre message
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="Écris ton message ici..."
                    className="w-full rounded-2xl border border-sand bg-sand/10 p-3.5 text-sm text-ink outline-none transition focus:border-door focus:bg-white"
                  />
                  <span className="block text-right text-[11px] text-ink-soft mt-1">
                    {message.length} / 2000 caractères
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-sand/30"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-door px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-door-deep disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Envoyer</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
