import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  PiggyBank,
  Zap,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Expenditure, Worksheet } from '../types/family';

interface AIBudgetForecastProps {
  expenditures: Expenditure[];
  worksheets: Worksheet[];
  selectedMonth: string; // YYYY-MM
  monthName: string;
}

interface CategoryForecast {
  category: string;
  current: number;
  projected: number;
  risk: 'low' | 'moderate' | 'high';
  advice: string;
}

interface ForecastData {
  executiveSummary: string;
  projectedTotal: number;
  burnRateDaily: number;
  riskLevel: 'low' | 'moderate' | 'high';
  riskExplanation: string;
  categoryForecasts: CategoryForecast[];
  actionableDirectives: string[];
  savingsPotential: number;
  nextMonthRecommendation: string;
}

export const AIBudgetForecast: React.FC<AIBudgetForecastProps> = ({
  expenditures,
  worksheets,
  selectedMonth,
  monthName,
}) => {
  const [loading, setLoading] = useState(false);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [userTargetBudget, setUserTargetBudget] = useState<number>(0);
  const [scenarioReduction, setScenarioReduction] = useState<number>(0); // 0%, 10%, 20%
  const [showCategoryDetails, setShowCategoryDetails] = useState(true);

  // Reference date calculations
  const now = new Date();
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const isCurrentMonth = now.getFullYear() === yearNum && now.getMonth() + 1 === monthNum;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const currentDay = isCurrentMonth ? Math.min(daysInMonth, Math.max(1, now.getDate())) : daysInMonth;
  const remainingDays = Math.max(0, daysInMonth - currentDay);

  // Total income from worksheets
  const totalIncome = useMemo(() => {
    return worksheets.reduce((s, w) => s + (w.totalAmount || 0), 0);
  }, [worksheets]);

  // Expenditures for this month
  const monthlyExpenditures = useMemo(() => {
    return expenditures.filter(exp =>
      exp.month === selectedMonth ||
      (Array.isArray(exp.dates) && exp.dates.some(d => d.startsWith(selectedMonth))) ||
      (!exp.primaryDate && (!exp.month || exp.month === selectedMonth))
    );
  }, [expenditures, selectedMonth]);

  const currentSpent = useMemo(() => {
    return monthlyExpenditures.reduce((sum, e) => sum + e.amount, 0);
  }, [monthlyExpenditures]);

  // Set initial target budget default if not set
  useEffect(() => {
    if (userTargetBudget === 0) {
      if (totalIncome > 0) {
        setUserTargetBudget(Math.round(totalIncome * 0.7));
      } else {
        setUserTargetBudget(Math.max(25000, Math.round(currentSpent * 1.25)));
      }
    }
  }, [totalIncome, currentSpent, userTargetBudget]);

  // Run or fetch AI forecast
  const fetchForecast = async (target?: number) => {
    setLoading(true);
    const targetToUse = target !== undefined ? target : userTargetBudget;

    try {
      const res = await fetch('/api/budget-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expenditures: monthlyExpenditures,
          totalIncome,
          targetBudget: targetToUse,
          currentMonth: selectedMonth,
        }),
      });

      if (!res.ok) {
        throw new Error('API forecast failed');
      }

      const data = await res.json();
      setForecastData(data);
    } catch (err) {
      console.warn('Backend forecast error, generating mathematical fallback:', err);
      // Client-side robust fallback
      const burnRateDaily = Math.max(0, Math.round(currentSpent / currentDay));
      const projectedTotal = Math.round(currentSpent + burnRateDaily * remainingDays);
      const budgetCap = targetToUse > 0 ? targetToUse : (totalIncome > 0 ? totalIncome * 0.75 : currentSpent * 1.3);

      const catMap: Record<string, number> = {};
      monthlyExpenditures.forEach(e => {
        const c = e.category || 'Other';
        catMap[c] = (catMap[c] || 0) + e.amount;
      });

      const categoryForecasts: CategoryForecast[] = Object.keys(catMap).map(cat => {
        const amt = catMap[cat] || 0;
        const proj = Math.round(amt + (amt / currentDay) * remainingDays);
        return {
          category: cat,
          current: amt,
          projected: proj,
          risk: proj > budgetCap * 0.35 ? 'high' : proj > budgetCap * 0.2 ? 'moderate' : 'low',
          advice: cat === 'Debt'
            ? 'Prioritize principal repayments early to reduce debt compounding.'
            : cat === 'Donation'
            ? 'Charitable giving remains honorable and within planned family values.'
            : cat === 'Transportation'
            ? 'Optimize transit routes and track weekly fuel or commuting costs.'
            : cat === 'Payment'
            ? 'Verify scheduled bills and vendor disbursements on time.'
            : cat === 'Father Giving'
            ? 'Honor monthly family elder contributions and filial commitments.'
            : cat === 'Grocery'
            ? 'Stick to fixed weekly bazaar limits for staples and produce.'
            : 'Track daily receipts to maintain household spending ceiling.'
        };
      });

      const riskLevel = projectedTotal > budgetCap * 1.05 ? 'high' : projectedTotal > budgetCap * 0.9 ? 'moderate' : 'low';

      setForecastData({
        executiveSummary: `At an average spend of ৳${burnRateDaily.toLocaleString()}/day, the projected month-end outflow for ${monthName} is ৳${projectedTotal.toLocaleString()}. ${
          projectedTotal > budgetCap
            ? 'Spending is currently pacing higher than your target limit—streamlining non-critical purchases is recommended.'
            : 'Your household is operating with healthy cashflow margins with room for emergency reserves.'
        }`,
        projectedTotal,
        burnRateDaily,
        riskLevel,
        riskExplanation: riskLevel === 'high'
          ? 'Spending burn rate is currently outpacing the scheduled monthly budget.'
          : riskLevel === 'moderate'
          ? 'Approaching caution margin; moderate grocery and flexible purchases.'
          : 'Spending velocity is safe and within planned family income limits.',
        categoryForecasts,
        actionableDirectives: [
          `Cap flexible grocery and discretionary expenses at ৳${Math.max(250, Math.round(burnRateDaily * 0.8)).toLocaleString()}/day for the remaining ${remainingDays} days.`,
          `Preserve potential surplus by postponing non-urgent household upgrades to next month.`,
          `Ensure recurring commitments like House Rent, Utilities, and Debt are cleared ahead of time.`
        ],
        savingsPotential: Math.max(0, Math.round(projectedTotal * 0.12)),
        nextMonthRecommendation: `Target a baseline operating budget of ৳${Math.round(projectedTotal * 0.95).toLocaleString()} for next month, retaining 15% as a cushion for family projects.`
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount or month change
  useEffect(() => {
    fetchForecast();
  }, [selectedMonth]);

  // Adjusted projection based on scenario reduction
  const effectiveProjectedTotal = useMemo(() => {
    if (!forecastData) return currentSpent;
    if (scenarioReduction === 0) return forecastData.projectedTotal;
    // Apply reduction only to remaining days
    const remainingProj = forecastData.projectedTotal - currentSpent;
    const reducedRemaining = Math.round(remainingProj * (1 - scenarioReduction / 100));
    return currentSpent + reducedRemaining;
  }, [forecastData, scenarioReduction, currentSpent]);

  // Health status
  const budgetCap = userTargetBudget > 0 ? userTargetBudget : (totalIncome > 0 ? totalIncome * 0.75 : currentSpent * 1.3);
  const isOverBudget = effectiveProjectedTotal > budgetCap;
  const variance = effectiveProjectedTotal - budgetCap;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-900/60 overflow-hidden relative">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </span>
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2 text-white">
                <span>AI Budget Forecaster</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Gemini Predictive Engine
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Predictive velocity model for {monthName} • Day {currentDay} of {daysInMonth} ({remainingDays} days remaining)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchForecast()}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-xs font-bold text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing...' : 'Recalculate AI Forecast'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 my-6">
        {/* Spent to date */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Spent to Date</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1 font-mono">
            ৳ {currentSpent.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Across {monthlyExpenditures.length} transactions in {monthName}
          </p>
        </div>

        {/* Daily Velocity / Burn Rate */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Spending Velocity</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
            ৳ {forecastData?.burnRateDaily?.toLocaleString() || Math.round(currentSpent / currentDay).toLocaleString()}
            <span className="text-xs font-normal text-slate-400"> / day</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated over {currentDay} recorded calendar days
          </p>
        </div>

        {/* AI Projected Month-End Total */}
        <div className={`border rounded-2xl p-4 backdrop-blur-xs transition-colors ${
          isOverBudget
            ? 'bg-rose-500/10 border-rose-500/30'
            : 'bg-emerald-500/10 border-emerald-500/30'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={isOverBudget ? 'text-rose-300' : 'text-emerald-300'}>
              AI Month-End Forecast
            </span>
            {isOverBudget ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className={`text-2xl font-black mt-1 font-mono ${
            isOverBudget ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            ৳ {effectiveProjectedTotal.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {isOverBudget
              ? `৳ ${variance.toLocaleString()} above budget target`
              : `৳ ${Math.abs(variance).toLocaleString()} safe surplus buffer`}
          </p>
        </div>

        {/* Target Budget Cap */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xs">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Target Budget Cap</span>
            <PiggyBank className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-indigo-300 mt-1 font-mono">
            ৳ {budgetCap.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
            <span>Income: ৳{totalIncome.toLocaleString()}</span>
            <span className="text-indigo-400 font-semibold">
              {totalIncome > 0 ? `${Math.round((budgetCap / totalIncome) * 100)}% ratio` : 'Self-defined'}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Trajectory Visualization */}
      <div className="relative z-10 bg-black/30 border border-white/10 rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>31-Day Cumulative Outflow Trajectory</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Solid line: Recorded actuals • Dashed line: AI projected curve to Day {daysInMonth}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-[11px] text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-400 rounded-full inline-block" />
              Actuals
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-purple-400 inline-block" />
              AI Projection
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dotted border-rose-400 inline-block" />
              Budget Cap
            </span>
          </div>
        </div>

        {/* Mini SVG Trajectory Chart */}
        <div className="h-32 w-full pt-2">
          {(() => {
            const chartW = 600;
            const chartH = 100;
            const maxVal = Math.max(effectiveProjectedTotal * 1.15, budgetCap * 1.15, 1000);

            // Points for actual spending (day 1 to currentDay)
            const actualPoints: { x: number; y: number }[] = [];
            for (let d = 1; d <= currentDay; d++) {
              const x = (d / daysInMonth) * chartW;
              const spendAtD = (currentSpent / currentDay) * d;
              const y = chartH - (spendAtD / maxVal) * chartH;
              actualPoints.push({ x, y });
            }

            // Points for projected trajectory (currentDay to daysInMonth)
            const projPoints: { x: number; y: number }[] = [];
            for (let d = currentDay; d <= daysInMonth; d++) {
              const x = (d / daysInMonth) * chartW;
              const fraction = remainingDays > 0 ? (d - currentDay) / remainingDays : 1;
              const spendAtD = currentSpent + (effectiveProjectedTotal - currentSpent) * fraction;
              const y = chartH - (spendAtD / maxVal) * chartH;
              projPoints.push({ x, y });
            }

            const capY = chartH - (budgetCap / maxVal) * chartH;
            const actualPathStr = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
            const projPathStr = projPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

            return (
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full overflow-visible">
                {/* Horizontal reference grids */}
                <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="#334155" strokeWidth="1" />
                <line x1="0" y1={chartH * 0.5} x2={chartW} y2={chartH * 0.5} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />

                {/* Target Budget Cap Line */}
                <line
                  x1="0"
                  y1={capY}
                  x2={chartW}
                  y2={capY}
                  stroke="#f43f5e"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text x={chartW - 4} y={Math.max(10, capY - 4)} fill="#f43f5e" fontSize="9" textAnchor="end" fontWeight="bold">
                  Target Cap: ৳{budgetCap.toLocaleString()}
                </text>

                {/* AI Projection Line (Dashed) */}
                <path
                  d={projPathStr}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Actual Spend Line (Solid) */}
                <path
                  d={actualPathStr}
                  fill="none"
                  stroke="#818cf8"
                  strokeWidth="3"
                />

                {/* Current Day Marker */}
                {actualPoints.length > 0 && (
                  <g>
                    <circle
                      cx={actualPoints[actualPoints.length - 1].x}
                      cy={actualPoints[actualPoints.length - 1].y}
                      r="4"
                      fill="#818cf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={actualPoints[actualPoints.length - 1].x}
                      y={actualPoints[actualPoints.length - 1].y - 8}
                      fill="#e2e8f0"
                      fontSize="9"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      Day {currentDay} (৳{currentSpent.toLocaleString()})
                    </text>
                  </g>
                )}

                {/* Month-End Projected Marker */}
                {projPoints.length > 0 && (
                  <g>
                    <circle
                      cx={projPoints[projPoints.length - 1].x}
                      cy={projPoints[projPoints.length - 1].y}
                      r="4"
                      fill="#c084fc"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    <text
                      x={chartW - 4}
                      y={projPoints[projPoints.length - 1].y - 8}
                      fill="#c084fc"
                      fontSize="9"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      Day {daysInMonth} End: ৳{effectiveProjectedTotal.toLocaleString()}
                    </text>
                  </g>
                )}
              </svg>
            );
          })()}
        </div>
      </div>

      {/* Strategic AI Verdict & What-If Controls */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Left 2 Cols: AI Verdict & Actionable Directives */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                AI Strategic Evaluation
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                forecastData?.riskLevel === 'high'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : forecastData?.riskLevel === 'moderate'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                {forecastData?.riskLevel ? `${forecastData.riskLevel.toUpperCase()} RISK` : 'HEALTHY'}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-normal">
              {forecastData?.executiveSummary ||
                `At your current pace of spending, your household will reach approximately ৳${effectiveProjectedTotal.toLocaleString()} by the conclusion of ${monthName}.`}
            </p>

            {forecastData?.riskExplanation && (
              <p className="text-xs text-slate-400 mt-2 italic">
                Insight: {forecastData.riskExplanation}
              </p>
            )}

            {/* Directives */}
            <div className="mt-4 pt-3 border-t border-white/10">
              <span className="text-xs font-bold text-white mb-2 block flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>AI Recommended Spending Directives</span>
              </span>
              <ul className="space-y-1.5">
                {(forecastData?.actionableDirectives || [
                  `Cap discretionary bazaar and snack spend at ৳${Math.round(currentSpent / currentDay * 0.85).toLocaleString()}/day.`,
                  `Audit recurring utilities and subscription outlays before month end.`,
                  `Set aside ৳${Math.round(currentSpent * 0.1).toLocaleString()} into an untouched emergency buffer.`
                ]).map((dir, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-black/20 p-2 rounded-xl">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{dir}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {forecastData?.nextMonthRecommendation && (
            <div className="mt-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200">
              <strong className="text-white">Upcoming Month Outlook:</strong> {forecastData.nextMonthRecommendation}
            </div>
          )}
        </div>

        {/* Right Col: Interactive What-If Scenario Planner */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                What-If Scenario Simulator
              </h4>
            </div>

            {/* Target Budget Slider/Input */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-300 mb-1">
                <span>Custom Target Budget:</span>
                <span className="font-mono font-bold text-indigo-300">৳ {userTargetBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={10000}
                max={Math.max(100000, totalIncome > 0 ? totalIncome * 1.5 : 80000)}
                step={1000}
                value={userTargetBudget}
                onChange={e => setUserTargetBudget(Number(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>৳ 10K</span>
                <span>Current: ৳{userTargetBudget.toLocaleString()}</span>
                <span>৳ {Math.max(100000, totalIncome * 1.5).toLocaleString()}</span>
              </div>
            </div>

            {/* Spending Reduction Simulator */}
            <div className="mb-4">
              <label className="text-xs text-slate-300 block mb-1">
                Simulate Daily Outflow Reduction:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 10, 20].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setScenarioReduction(pct)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                      scenarioReduction === pct
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {pct === 0 ? 'Normal Pace' : `-${pct}% Spend`}
                  </button>
                ))}
              </div>
            </div>

            {/* Scenario Result Box */}
            <div className="bg-black/30 p-3 rounded-xl border border-white/10 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400">
                <span>Baseline Month-End:</span>
                <span className="font-mono text-slate-300">
                  ৳ {(forecastData?.projectedTotal || currentSpent).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between font-bold text-white">
                <span>Simulated Month-End:</span>
                <span className="font-mono text-emerald-400">
                  ৳ {effectiveProjectedTotal.toLocaleString()}
                </span>
              </div>
              {scenarioReduction > 0 && (
                <div className="flex justify-between text-emerald-300 pt-1 border-t border-white/10 text-[11px]">
                  <span>Extra Potential Savings:</span>
                  <span className="font-mono font-bold">
                    +৳ {((forecastData?.projectedTotal || currentSpent) - effectiveProjectedTotal).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => fetchForecast(userTargetBudget)}
            className="w-full mt-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply Target to AI Model</span>
          </button>
        </div>
      </div>

      {/* Category Breakdown Table / Risk Radar */}
      {forecastData?.categoryForecasts && forecastData.categoryForecasts.length > 0 && (
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xs">
          <div
            onClick={() => setShowCategoryDetails(!showCategoryDetails)}
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Category Risk Radar & Forecast Breakdown ({forecastData.categoryForecasts.length} Categories)
              </h4>
            </div>
            <button className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
              <span>{showCategoryDetails ? 'Hide Details' : 'Show Details'}</span>
              {showCategoryDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showCategoryDetails && (
            <div className="overflow-x-auto border-t border-white/10">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-black/30 text-slate-400 font-semibold border-b border-white/10">
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Current Spent</th>
                    <th className="px-4 py-2.5 text-right">AI Projected Total</th>
                    <th className="px-4 py-2.5 text-center">Risk Status</th>
                    <th className="px-4 py-2.5">AI Strategic Directive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {forecastData.categoryForecasts.map((cat, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                        {cat.category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300 whitespace-nowrap">
                        ৳ {cat.current.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-300 whitespace-nowrap">
                        ৳ {cat.projected.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          cat.risk === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : cat.risk === 'moderate'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {cat.risk.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300 text-xs">
                        {cat.advice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
