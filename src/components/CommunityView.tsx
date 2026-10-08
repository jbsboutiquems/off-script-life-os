import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ChaosWallView } from './ChaosWallView';
import { RoomsView } from './RoomsView';
import { Megaphone, Users } from 'lucide-react';

/**
 * The WALL folder: the Chaos Wall plus group rooms, side by side.
 */
export const CommunityView: React.FC<{ user: UserProfile; myUserId: string }> = ({ user, myUserId }) => {
  const [tab, setTab] = useState<'wall' | 'rooms'>('wall');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 p-1 rounded-2xl bg-stone-100 dark:bg-white/5 w-fit">
        {(
          [
            { id: 'wall', label: 'Chaos Wall', icon: Megaphone },
            { id: 'rooms', label: 'Rooms', icon: Users },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition ${tab === id ? 'bg-white dark:bg-white/10 shadow text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>
      {tab === 'wall' ? (
        <ChaosWallView user={user} myUserId={myUserId} />
      ) : (
        <RoomsView myUserId={myUserId} />
      )}
    </div>
  );
};
