import React, { useEffect, useState } from 'react';
import { CURRENCY_ICON, CURRENCY_NAME, getCoinBalance, onCoinsUpdated } from './gameCurrency';

/**
 * Coin balance pill — shown in the world view header so the player can
 * always see it. "Coins" is a placeholder name; what currency buys is
 * Amber's call and hasn't been decided — earning + balance only, no shop.
 */
export const CoinBalance: React.FC = () => {
  const [balance, setBalance] = useState(() => getCoinBalance());
  useEffect(() => onCoinsUpdated(() => setBalance(getCoinBalance())), []);
  return (
    <span
      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 text-sm font-black"
      title={`Your ${CURRENCY_NAME} — earned by playing games. No shop yet; what they buy is Amber's call.`}
    >
      {CURRENCY_ICON} {balance} {CURRENCY_NAME}
    </span>
  );
};
