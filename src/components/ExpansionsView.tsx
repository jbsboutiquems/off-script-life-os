import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExpansionProduct } from '../types';
import { Sparkles, RefreshCw, Check, Clock, PartyPopper, MoonStar, Heart, Users } from 'lucide-react';

function price(n: number): string {
  return `$${n.toFixed(2).replace(/\.00$/, '')}`;
}

function term(days: number): string {
  return days >= 365 ? 'year' : 'month';
}

const KIND_ICON: Record<string, React.ReactNode> = {
  theme: <Sparkles className="w-5 h-5 text-[#2da2ee]" />,
  holiday: <PartyPopper className="w-5 h-5 text-amber-500" />,
  zodiac: <MoonStar className="w-5 h-5 text-violet-400" />,
  wedding: <Heart className="w-5 h-5 text-[#ea4798]" />,
};

const ProductCard: React.FC<{
  product: ExpansionProduct;
  onBought: () => void;
}> = ({ product, onBought }) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buy = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.purchaseExpansion(product.product_id);
      onBought();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete that.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`p-4 rounded-2xl border-2 bg-white dark:bg-[#02142e] ${product.owned ? 'border-emerald-400 dark:border-emerald-400/50' : product.expired ? 'border-amber-400 dark:border-amber-400/50' : 'border-stone-200 dark:border-white/10'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {KIND_ICON[product.kind]}
          <h4 className="font-black">{product.title}</h4>
        </div>
        <span className="font-black text-[#ea4798] whitespace-nowrap">{price(product.price)}<span className="text-xs font-bold text-stone-400">/{term(product.days)}</span></span>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{product.blurb}</p>
      {product.link_url && (
        <a
          href={product.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-1.5 text-xs font-black text-[#2da2ee] hover:underline"
        >
          <Users className="w-3.5 h-3.5" /> {product.link_label || 'Open'}
        </a>
      )}
      <div className="mt-2.5">
        {product.owned ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400">
            <Check className="w-3.5 h-3.5" /> Active
            {product.days_left !== null && (
              <span className="font-bold text-stone-400">· {product.days_left}d left</span>
            )}
          </span>
        ) : product.expired ? (
          <button
            onClick={buy}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-amber-500 hover:brightness-110 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
            {busy ? 'Renewing…' : `Renew — ${price(product.price)}`}
          </button>
        ) : (
          <button
            onClick={buy}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#2da2ee] to-[#ea4798] hover:brightness-110 disabled:opacity-50"
          >
            {busy ? '…' : `Get — ${price(product.price)}/${term(product.days)}`}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-rose-500 font-bold mt-1.5">{error}</p>}
    </div>
  );
};

/**
 * The expansion shop: monthly themes, holiday specials, zodiac packs,
 * and the wedding arc. Everything expires; renewals are manual.
 * Anything the user wrote while an expansion was active stays readable forever.
 */
export const ExpansionsView: React.FC = () => {
  const [products, setProducts] = useState<ExpansionProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      setProducts(await api.getExpansions());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  const groups: { kind: string; title: string; sub: string }[] = [
    { kind: 'theme', title: 'Monthly Themes', sub: '$0.99/month — a fresh khaos theme, every month' },
    { kind: 'holiday', title: 'Holiday Specials', sub: '$0.99/month — seasonal spreads and rituals' },
    { kind: 'zodiac', title: 'Zodiac Expansions', sub: '$5/year per sign — a full year in that sign\'s flavor' },
    { kind: 'wedding', title: 'Wedding', sub: '$10/year — the full 365-day bride arc' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#ea4798]" /> Expansions
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1 max-w-lg">
          Paid extras for the app. Everything runs 30 days or 365 days from purchase —
          when it ends, renew or let it go. <span className="font-bold">Anything you wrote while an expansion was active stays yours forever.</span>
        </p>
        <p className="text-[11px] text-stone-400 mt-1 italic">Test mode: purchases grant instantly. Card payments get wired before launch.</p>
      </div>

      {loading && <p className="text-sm text-stone-400 text-center py-8">Loading the shop…</p>}

      {groups.map(g => {
        const items = products.filter(p => p.kind === g.kind);
        if (!loading && items.length === 0) return null;
        return (
          <section key={g.kind}>
            <h3 className="font-black uppercase tracking-wider text-sm mb-1">{g.title}</h3>
            <p className="text-xs text-stone-400 mb-2.5">{g.sub}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map(p => <ProductCard key={p.product_id} product={p} onBought={refresh} />)}
            </div>
          </section>
        );
      })}

      {!loading && products.some(p => p.expired) && (
        <p className="text-xs text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Something expired — renew above to pick it back up.
        </p>
      )}
    </div>
  );
};
