import React, { useState } from 'react';
import { MonthlyMoneyMap, MoneyExpense } from '../types';
import { DollarSign, Plus, Trash2, Save, TrendingUp } from 'lucide-react';

interface MonthlyMoneyMapViewProps {
  onSaveMoneyMap?: (map: MonthlyMoneyMap) => void;
  initialMonth?: number;
}

export const MonthlyMoneyMapView: React.FC<MonthlyMoneyMapViewProps> = ({
  onSaveMoneyMap,
  initialMonth = 1
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth);
  const [incomeStreams, setIncomeStreams] = useState([
    { id: "inc_1", source: "Primary Sovereign Work", amount: 4800 },
    { id: "inc_2", source: "Unscripted Advisory & Projects", amount: 1200 }
  ]);
  const [fixedExpenses, setFixedExpenses] = useState<MoneyExpense[]>([
    { id: "exp_1", name: "Sanctuary / Studio Rent", amount: 1600, paid: true },
    { id: "exp_2", name: "Fuel & Nourishment", amount: 650, paid: true },
    { id: "exp_3", name: "Digital Tools & Hardware", amount: 120, paid: false }
  ]);
  const [oneSurprise, setOneSurprise] = useState("A spontaneous client referral paid faster than anticipated.");
  const [onePattern, setOnePattern] = useState("Notice when the impulse to buy books is actually an impulse to feel productive without working.");
  const [financialCommitment, setFinancialCommitment] = useState("Keep the $500 monthly Chaos Discretionary Fund strictly guilt-free.");
  const [noShameRecap, setNoShameRecap] = useState("I spent more on take-out during the high-stress sprint week, and that's okay.");
  const [isSaved, setIsSaved] = useState(false);

  const totalIncome = incomeStreams.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalFixed = fixedExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const remainingSovereignty = totalIncome - totalFixed;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveMoneyMap) {
      onSaveMoneyMap({
        id: `moneymap_2027_${selectedMonth}`,
        month: selectedMonth,
        year: 2027,
        income_sources: incomeStreams,
        fixed_expenses: fixedExpenses,
        variable_logs: [],
        one_surprise: oneSurprise,
        one_pattern: onePattern,
        financial_commitment: financialCommitment,
        no_shame_recap: noShameRecap,
        updated_at: new Date().toISOString()
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const addIncome = () => {
    setIncomeStreams([...incomeStreams, { id: `inc_${Date.now()}`, source: "New Stream", amount: 0 }]);
  };

  const removeIncome = (id: string) => {
    setIncomeStreams(incomeStreams.filter(i => i.id !== id));
  };

  const addExpense = () => {
    setFixedExpenses([...fixedExpenses, { id: `exp_${Date.now()}`, name: "New Expense", amount: 0, paid: false }]);
  };

  const removeExpense = (id: string) => {
    setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
  };

  const togglePaid = (id: string) => {
    setFixedExpenses(fixedExpenses.map(e => e.id === id ? { ...e, paid: !e.paid } : e));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-2 border-stone-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-emerald-600 text-white text-[10px] font-mono-code font-bold uppercase px-2 py-0.5 rounded tracking-wider">
                FINANCIAL SOVEREIGNTY
              </span>
              <span className="text-xs text-stone-500 font-mono-code">MONTHLY MONEY MAP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-slate-900 mt-1">
              Monthly Money Map (2027)
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Money is energy for sovereignty, not moral validation. Track incoming currents, fixed survival drains, and emotional spending awareness with zero shame.
            </p>
          </div>

          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs font-mono-code font-bold bg-stone-50 focus:outline-teal-600"
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  Month {i + 1} (2027)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Flow summary pills */}
        <div className="mt-5 pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <span className="text-emerald-800 font-mono-code font-bold block text-[10px] uppercase">
              Total Inflow Current:
            </span>
            <span className="text-xl font-bold font-mono-code text-emerald-900">
              ${totalIncome.toLocaleString()}
            </span>
          </div>

          <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
            <span className="text-stone-600 font-mono-code font-bold block text-[10px] uppercase">
              Fixed Survival Drain:
            </span>
            <span className="text-xl font-bold font-mono-code text-slate-800">
              ${totalFixed.toLocaleString()}
            </span>
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
            <span className="text-amber-800 font-mono-code font-bold block text-[10px] uppercase">
              Free Sovereign Surplus:
            </span>
            <span className="text-xl font-bold font-mono-code text-amber-900">
              ${remainingSovereignty.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Income Streams */}
          <div className="bg-white rounded-2xl border border-stone-300 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-xs uppercase font-display-punch text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Income Currents</span>
              </h3>
              <button
                type="button"
                onClick={addIncome}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Stream</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {incomeStreams.map((stream) => (
                <div key={stream.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={stream.source}
                    onChange={(e) => {
                      setIncomeStreams(incomeStreams.map(i => i.id === stream.id ? { ...i, source: e.target.value } : i));
                    }}
                    placeholder="Income Source"
                    className="flex-1 px-2.5 py-1.5 border border-stone-200 rounded-lg bg-stone-50/50"
                  />
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 w-28">
                    <span className="text-stone-400 font-mono-code mr-1">$</span>
                    <input
                      type="number"
                      value={stream.amount}
                      onChange={(e) => {
                        setIncomeStreams(incomeStreams.map(i => i.id === stream.id ? { ...i, amount: Number(e.target.value) } : i));
                      }}
                      className="w-full bg-transparent font-mono-code font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeIncome(stream.id)}
                    className="text-stone-300 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Fixed Outflows */}
          <div className="bg-white rounded-2xl border border-stone-300 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <h3 className="font-bold text-xs uppercase font-display-punch text-slate-900 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-stone-600" />
                <span>Fixed Non-Negotiables</span>
              </h3>
              <button
                type="button"
                onClick={addExpense}
                className="text-[11px] font-bold text-stone-700 hover:text-slate-900 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {fixedExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={expense.paid}
                    onChange={() => togglePaid(expense.id)}
                    title={expense.paid ? 'Mark unpaid' : 'Mark paid'}
                    className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={expense.name}
                    onChange={(e) => {
                      setFixedExpenses(fixedExpenses.map(exp => exp.id === expense.id ? { ...exp, name: e.target.value } : exp));
                    }}
                    placeholder="Expense Name"
                    className={`flex-1 px-2.5 py-1.5 border border-stone-200 rounded-lg bg-stone-50/50 ${expense.paid ? 'line-through text-stone-400' : ''}`}
                  />
                  <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 w-28">
                    <span className="text-stone-400 font-mono-code mr-1">$</span>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => {
                        setFixedExpenses(fixedExpenses.map(exp => exp.id === expense.id ? { ...exp, amount: Number(e.target.value) } : exp));
                      }}
                      className="w-full bg-transparent font-mono-code font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExpense(expense.id)}
                    className="text-stone-300 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Psychological Money Reflections */}
        <div className="bg-[#fffdf9] border-2 border-stone-300 rounded-2xl p-5 shadow-xs space-y-4">
          <h4 className="font-bold text-xs uppercase font-display-punch text-slate-900">
            Psychological Reflections &amp; No-Shame Awareness
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                One Financial Surprise this month:
              </label>
              <textarea
                value={oneSurprise}
                onChange={(e) => setOneSurprise(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-stone-300 rounded-xl bg-white focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                One Emotional Spending Pattern Noticed:
              </label>
              <textarea
                value={onePattern}
                onChange={(e) => setOnePattern(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-stone-300 rounded-xl bg-white focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                One Concrete Financial Commitment:
              </label>
              <textarea
                value={financialCommitment}
                onChange={(e) => setFinancialCommitment(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-stone-300 rounded-xl bg-white focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="block text-slate-800 font-bold mb-1">
                No-Shame Recap (Compassionate truth):
              </label>
              <textarea
                value={noShameRecap}
                onChange={(e) => setNoShameRecap(e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-stone-300 rounded-xl bg-white focus:outline-teal-600"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaved ? 'Money Map Saved!' : 'Save Money Map'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
