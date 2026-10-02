import React, { useState } from 'react';
import { FlightCrewContact } from '../types';
import { Users, Plus, Pencil, Trash2, X, Check, Phone } from 'lucide-react';

interface FlightCrewViewProps {
  contacts: FlightCrewContact[];
  onAdd: (data: Omit<FlightCrewContact, 'id' | 'created_at'>) => Promise<void>;
  onUpdate: (id: string, updates: Partial<FlightCrewContact>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ROLE_SUGGESTIONS = [
  'Co-conspirator',
  'Accountability gremlin',
  'Emergency contact',
  'Hype squad',
  'Voice of reason',
  'Chaos witness',
  'No-advice listener',
];

export const FlightCrewView: React.FC<FlightCrewViewProps> = ({ contacts, onAdd, onUpdate, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState(ROLE_SUGGESTIONS[0]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setRole(ROLE_SUGGESTIONS[0]);
    setNotes('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (c: FlightCrewContact) => {
    setEditingId(c.id);
    setName(c.name);
    setRole(c.role);
    setNotes(c.notes);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await onUpdate(editingId, { name: name.trim(), role, notes: notes.trim() });
      } else {
        await onAdd({ name: name.trim(), role, notes: notes.trim() });
      }
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-stone-300 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-500 text-white flex items-center justify-center border border-stone-800">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold font-serif-display text-lg text-slate-900">Flight Crew</h3>
              <p className="text-xs text-stone-500">
                The humans in your corner. {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} on the manifest.
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add contact
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mt-5 border-2 border-dashed border-stone-300 rounded-2xl p-4 space-y-3 bg-stone-50/60">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono-code uppercase tracking-wider text-stone-500 font-bold">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Blake"
                  className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-rose-400"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono-code uppercase tracking-wider text-stone-500 font-bold">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-rose-400"
                >
                  {ROLE_SUGGESTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-mono-code uppercase tracking-wider text-stone-500 font-bold">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why they're on the crew. Boundaries, inside jokes, how they help."
                rows={2}
                className="mt-1 w-full border border-stone-300 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-rose-400 resize-y"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> {editingId ? 'Save changes' : 'Add to crew'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-300 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {contacts.length === 0 ? (
        <div className="bg-white border border-stone-300 rounded-2xl p-10 text-center text-stone-500">
          <Phone className="w-8 h-8 mx-auto mb-2 text-stone-300" />
          <p className="text-sm font-medium">No crew members yet.</p>
          <p className="text-xs mt-1 italic font-serif-display">Every unruly pilot needs a ground team. Add yours.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white border border-stone-300 rounded-2xl p-4 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">{c.name}</div>
                  <div className="text-[11px] font-mono-code uppercase tracking-wider text-teal-700 font-bold mt-0.5">{c.role}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => startEdit(c)}
                    className="p-1.5 text-stone-400 hover:text-slate-900 rounded-lg hover:bg-stone-100 transition-colors"
                    title="Edit contact"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => { if (window.confirm(`Remove ${c.name} from the flight crew?`)) onDelete(c.id); }}
                    className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove contact"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {c.notes && <p className="mt-2 text-xs text-stone-600 leading-relaxed">{c.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
