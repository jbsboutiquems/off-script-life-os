import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Plus, Send, Users, LogOut, Trash2, RefreshCw, Hash } from 'lucide-react';

interface RoomSummary {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberCount: number;
  lastAt: string;
}

interface RoomMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  created_at: string;
}

function relativeTime(iso: string): string {
  const ms = Date.now() - Date.parse(iso);
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Group rooms: named channels for crews, krewes, and khaos collectives.
 * Membership-gated; the founder can demolish a room.
 */
export const RoomsView: React.FC<{ myUserId: string }> = ({ myUserId }) => {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [roomOwnerId, setRoomOwnerId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshRooms = async () => {
    try {
      setRooms(await api.getRooms());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load rooms.');
    } finally {
      setLoading(false);
    }
  };

  const openRoom = async (id: string) => {
    setActiveId(id);
    setMessages([]);
    try {
      const { room, messages } = await api.getRoomMessages(id);
      setRoomName(room.name);
      setRoomOwnerId(room.ownerId);
      setMessages(messages);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open that room.');
      setActiveId(null);
    }
  };

  useEffect(() => {
    refreshRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const id = setInterval(async () => {
      try {
        const { messages } = await api.getRoomMessages(activeId);
        setMessages(messages);
      } catch { /* ignore */ }
    }, 10000);
    return () => clearInterval(id);
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const room = await api.createRoom(newName.trim(), newDesc.trim());
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      await refreshRooms();
      openRoom(room.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create that room.');
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeId) return;
    const text = draft.trim();
    setDraft('');
    try {
      const msg = await api.sendRoomMessage(activeId, text);
      setMessages(prev => [...prev, msg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send.');
      setDraft(text);
    }
  };

  const leave = async () => {
    if (!activeId || !window.confirm('Leave this room?')) return;
    try {
      await api.leaveRoom(activeId);
      setActiveId(null);
      refreshRooms();
    } catch { /* ignore */ }
  };

  const demolish = async () => {
    if (!activeId || !window.confirm('Demolish this room for everyone?')) return;
    try {
      await api.deleteRoom(activeId);
      setActiveId(null);
      refreshRooms();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete that room.');
    }
  };

  if (activeId) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setActiveId(null)} className="text-sm font-bold text-stone-500 hover:text-stone-700 dark:hover:text-stone-200">
            ← All rooms
          </button>
          <div className="flex items-center gap-2">
            {roomOwnerId === myUserId ? (
              <button onClick={demolish} title="Demolish room" className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40">
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={leave} title="Leave room" className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <h3 className="text-xl font-black flex items-center gap-2">
          <Hash className="w-5 h-5 text-[#2da2ee]" /> {roomName || 'Room'}
        </h3>
        <div className="bg-white dark:bg-[#02142e] border border-stone-200 dark:border-white/10 rounded-2xl p-4 h-[50vh] overflow-y-auto space-y-3">
          {messages.length === 0 && (
            <p className="text-sm text-stone-400 text-center py-8 italic">No messages yet. Break the silence.</p>
          )}
          {messages.map(m => (
            <div key={m.id} className={`max-w-[85%] ${m.userId === myUserId ? 'ml-auto' : ''}`}>
              <div className={`px-3.5 py-2 rounded-2xl text-sm ${m.userId === myUserId ? 'bg-gradient-to-r from-[#2da2ee] to-[#ea4798] text-white rounded-br-md' : 'bg-stone-100 dark:bg-white/5 text-stone-800 dark:text-stone-100 rounded-bl-md'}`}>
                {m.userId !== myUserId && <div className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-0.5">{m.username}</div>}
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
              <div className={`text-[10px] text-stone-400 mt-0.5 ${m.userId === myUserId ? 'text-right' : ''}`}>{relativeTime(m.created_at)}</div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send} className="flex gap-2">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Message the room…"
            maxLength={2000}
            className="flex-1 px-4 py-2.5 border-2 border-stone-200 dark:border-white/10 rounded-2xl bg-white dark:bg-white/5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2da2ee]"
          />
          <button type="submit" disabled={!draft.trim()} className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#2da2ee] to-[#ea4798] text-white disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
        {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black flex items-center gap-2">
          <Users className="w-5 h-5 text-[#2da2ee]" /> Rooms
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={refreshRooms} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreate(s => !s)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-[#2da2ee] to-[#ea4798] hover:brightness-110"
          >
            <Plus className="w-4 h-4" /> New room
          </button>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={create} className="p-4 rounded-2xl border-2 border-stone-200 dark:border-white/10 space-y-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Room name (e.g. Biloxi Krewe)"
            maxLength={60}
            className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#2da2ee]"
          />
          <input
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="What's this room for? (optional)"
            maxLength={280}
            className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-[#2da2ee]"
          />
          <button type="submit" disabled={!newName.trim()} className="px-4 py-2 rounded-xl text-sm font-black text-white bg-[#2da2ee] hover:brightness-110 disabled:opacity-40">
            Create room
          </button>
        </form>
      )}

      {loading && rooms.length === 0 && <p className="text-sm text-stone-400 text-center py-6">Finding rooms…</p>}
      {!loading && rooms.length === 0 && (
        <div className="text-sm text-stone-500 dark:text-stone-400 border border-dashed border-stone-300 dark:border-white/15 rounded-2xl px-4 py-8 text-center italic">
          No rooms yet. Start one — a krewe, a book club, a conspiracy.
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {rooms.map(r => (
          <button
            key={r.id}
            onClick={() => openRoom(r.id)}
            className="text-left p-4 rounded-2xl border-2 border-stone-200 dark:border-white/10 hover:border-[#2da2ee] dark:hover:border-[#2da2ee] transition bg-white dark:bg-[#02142e]"
          >
            <div className="font-black flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-[#2da2ee]" /> {r.name}
            </div>
            {r.description && <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-2">{r.description}</p>}
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-2">
              {r.memberCount} {r.memberCount === 1 ? 'member' : 'members'} · active {relativeTime(r.lastAt)}
            </p>
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-rose-500 font-bold">{error}</p>}
    </div>
  );
};
