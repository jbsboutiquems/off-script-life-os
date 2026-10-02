import React, { useEffect, useState } from 'react';
import { Mail, Phone, Trash2, UserPlus } from 'lucide-react';
import { CONTACT_CATEGORIES, type AddressBookContact, type ContactCategory } from '../../data/frontmatter';
import { FM_KEYS, loadFrontMatter, saveFrontMatter } from './storage';
import { SectionCard } from './SectionCard';
import type { FrontMatterSectionProps } from './props';

/** 10 — My People. Address book of anchors and co-conspirators, persisted per-user. */
export const PeopleSection: React.FC<FrontMatterSectionProps> = ({ user, onToast }) => {
  const [contacts, setContacts] = useState<AddressBookContact[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<ContactCategory>('Inner Circle');

  useEffect(() => {
    const saved = loadFrontMatter<AddressBookContact[]>(user.id, FM_KEYS.contacts);
    if (saved) setContacts(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const persist = (updated: AddressBookContact[]) => {
    setContacts(updated);
    saveFrontMatter(user.id, FM_KEYS.contacts, updated);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      if (onToast) onToast('Give the contact a name first.');
      return;
    }
    persist([
      ...contacts,
      {
        id: `contact_${Date.now()}`,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        category
      }
    ]);
    setName('');
    setPhone('');
    setEmail('');
    if (onToast) onToast('Contact added to My People.');
  };

  const handleDelete = (id: string) => persist(contacts.filter((c) => c.id !== id));

  return (
    <SectionCard badge="10 — MY PEOPLE" badgeClass="bg-[#2da2ee]" kicker="KEEP YOUR PEOPLE CLOSE">
      <div className="border-b border-stone-200 dark:border-white/10 pb-3">
        <h3 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 dark:text-cream-canvas">
          Address Book &amp; Anchors
        </h3>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
          Names. Numbers. The humans who actually matter. Your support system and co-conspirators.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[#faf8f4] dark:bg-white/5 border border-stone-300 dark:border-white/10 space-y-3">
        <span className="text-xs font-mono-code font-bold text-slate-900 dark:text-cream-canvas uppercase block">
          + Add key contact or emergency anchor
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Name / Role"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2.5 rounded-xl border border-stone-300 dark:border-white/10 text-xs bg-white dark:bg-white/5 dark:text-stone-200"
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="p-2.5 rounded-xl border border-stone-300 dark:border-white/10 text-xs bg-white dark:bg-white/5 dark:text-stone-200"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2.5 rounded-xl border border-stone-300 dark:border-white/10 text-xs bg-white dark:bg-white/5 dark:text-stone-200"
          />
        </div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategory)}
            className="p-2 rounded-xl border border-stone-300 dark:border-white/10 text-xs bg-white dark:bg-white/5 dark:text-stone-200 font-mono-code"
          >
            {CONTACT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAdd}
            className="px-4 py-2 bg-stone-900 hover:bg-black dark:bg-[#ea4798] dark:hover:bg-[#d63a85] text-white text-xs font-mono-code font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Save Contact</span>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {contacts.length === 0 && (
          <p className="text-xs text-stone-500 dark:text-stone-400 italic font-sans p-4 rounded-xl border border-dashed border-stone-300 dark:border-white/10 text-center">
            Nobody here yet. Add the humans who keep you grounded — your inner circle, creative allies, grounding anchors, and co-conspirators.
          </p>
        )}
        {contacts.map((c) => (
          <div
            key={c.id}
            className="p-3.5 rounded-xl border border-stone-200 dark:border-white/10 bg-[#fdfbf7] dark:bg-white/5 flex items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <span className="font-bold text-xs text-slate-900 dark:text-cream-canvas">{c.name}</span>
                <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-[#2da2ee]/10 text-[#2da2ee] border border-[#2da2ee]/30">
                  {c.category}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] text-stone-500 dark:text-stone-400 font-mono-code mt-1 flex-wrap">
                {c.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-stone-400" /> {c.phone}
                  </span>
                )}
                {c.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-400" /> {c.email}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(c.id)}
              className="text-stone-400 hover:text-[#ea4798] p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Remove contact"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </SectionCard>
  );
};
