import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Flame,
  Award,
  ChevronRight,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  Activity,
  ArrowUpRight,
  Sparkles,
  Info,
  DollarSign,
  Maximize2,
  CalendarRange,
  Zap,
} from 'lucide-react';
import { Expenditure, Project } from '../types/family';

interface SpendingTrendsDashboardProps {
  expenditures: Expenditure[];
  projects?: Project[];
  onNavigateToExpense?: () => void;
  className?: string;
}

export interface MonthlyCategoryRecord {
  monthKey: string;
  label: string;
  fullLabel: string;
  total: number;
  [category: string]: string | number;
}

export const CATEGORY_PALETTE: Record<string, { color: string; bg: string; border: string }> = {
  Grocery: { color: '#10b981', bg: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-200' },
  Education: { color: '#3b82f6', bg: 'bg-blue-50 text-blue-700', border: 'border-blue-200' },
  Utilities: { color: '#06b6d4', bg: 'bg-cyan-50 text-cyan-700', border: 'border-cyan-200' },
  'House Rent': { color: '#6366f1', bg: 'bg-indigo-50 text-indigo-700', border: 'border-indigo-200' },
  Health: { color: '#f43f5e', bg: 'bg-rose-50 text-rose-700', border: 'border-rose-200' },
  Shopping: { color: '#ec4899', bg: 'bg-pink-50 text-pink-700', border: 'border-pink-200' },
  Transportation: { color: '#0ea5e9', bg: 'bg-sky-50 text-sky-700', border: 'border-sky-200' },
  Payment: { color: '#8b5cf6', bg: 'bg-violet-50 text-violet-700', border: 'border-violet-200' },
  'Father Giving': { color: '#14b8a6', bg: 'bg-teal-50 text-teal-700', border: 'border-teal-200' },
  Debt: { color: '#f59e0b', bg: 'bg-amber-50 text-amber-700', border: 'border-amber-200' },
  Donation: { color: '#a855f7', bg: 'bg-purple-50 text-purple-700', border: 'border-purple-200' },
  Others: { color: '#64748b', bg: 'bg-slate-100 text-slate-700', border: 'border-slate-300' },
};

const DEFAULT_CATEGORY_COLOR = '#64748b';

// Realistic sample historical data to let users test trends if they only have 0-1 months recorded
const SAMPLE_HISTORICAL_EXPENDITURES: Expenditure[] = [
  // May 2026
  { id: 's_1', userId: 'sample', amount: 14000, category: 'Grocery', month: '2026-05', primaryDate: '2026-05-04', dates: ['2026-05-04'], description: 'Monthly Family Grocery', createdAt: '2026-05-04' },
  { id: 's_2', userId: 'sample', amount: 12000, category: 'House Rent', month: '2026-05', primaryDate: '2026-05-01', dates: ['2026-05-01'], description: 'May House Rent', createdAt: '2026-05-01' },
  { id: 's_3', userId: 'sample', amount: 3500, category: 'Utilities', month: '2026-05', primaryDate: '2026-05-10', dates: ['2026-05-10'], description: 'Electricity & Gas', createdAt: '2026-05-10' },
  { id: 's_4', userId: 'sample', amount: 4500, category: 'Education', month: '2026-05', primaryDate: '2026-05-15', dates: ['2026-05-15'], description: 'Books and Term Exam Fees', createdAt: '2026-05-15' },
  // June 2026 (Moderate month)
  { id: 's_5', userId: 'sample', amount: 15500, category: 'Grocery', month: '2026-06', primaryDate: '2026-06-03', dates: ['2026-06-03'], description: 'Bazaar & Kitchen Supplies', createdAt: '2026-06-03' },
  { id: 's_6', userId: 'sample', amount: 12000, category: 'House Rent', month: '2026-06', primaryDate: '2026-06-01', dates: ['2026-06-01'], description: 'June House Rent', createdAt: '2026-06-01' },
  { id: 's_7', userId: 'sample', amount: 4200, category: 'Utilities', month: '2026-06', primaryDate: '2026-06-12', dates: ['2026-06-12'], description: 'Summer AC Electricity', createdAt: '2026-06-12' },
  { id: 's_8', userId: 'sample', amount: 6000, category: 'Shopping', month: '2026-06', primaryDate: '2026-06-18', dates: ['2026-06-18'], description: 'Family Eid Shopping', createdAt: '2026-06-18' },
  { id: 's_9', userId: 'sample', amount: 5000, category: 'Father Giving', month: '2026-06', primaryDate: '2026-06-20', dates: ['2026-06-20'], description: 'Support for Grandparents', createdAt: '2026-06-20' },
  // July 2026 (PEAK MONTH 1 - Annual school fees + health checkup)
  { id: 's_10', userId: 'sample', amount: 17000, category: 'Grocery', month: '2026-07', primaryDate: '2026-07-02', dates: ['2026-07-02'], description: 'Bulk Meat & Rice provisions', createdAt: '2026-07-02' },
  { id: 's_11', userId: 'sample', amount: 12000, category: 'House Rent', month: '2026-07', primaryDate: '2026-07-01', dates: ['2026-07-01'], description: 'July House Rent', createdAt: '2026-07-01' },
  { id: 's_12', userId: 'sample', amount: 11000, category: 'Education', month: '2026-07', primaryDate: '2026-07-08', dates: ['2026-07-08'], description: 'Annual Admission & Uniforms', createdAt: '2026-07-08' },
  { id: 's_13', userId: 'sample', amount: 8500, category: 'Health', month: '2026-07', primaryDate: '2026-07-16', dates: ['2026-07-16'], description: 'Diagnostic Tests & Medicine', createdAt: '2026-07-16' },
  { id: 's_14', userId: 'sample', amount: 5000, category: 'Debt', month: '2026-07', primaryDate: '2026-07-25', dates: ['2026-07-25'], description: 'Quarterly Loan Paydown', createdAt: '2026-07-25' },
  // August 2026 (Leaner month)
  { id: 's_15', userId: 'sample', amount: 14500, category: 'Grocery', month: '2026-08', primaryDate: '2026-08-04', dates: ['2026-08-04'], description: 'Monthly Grocery Essentials', createdAt: '2026-08-04' },
  { id: 's_16', userId: 'sample', amount: 12000, category: 'House Rent', month: '2026-08', primaryDate: '2026-08-01', dates: ['2026-08-01'], description: 'August House Rent', createdAt: '2026-08-01' },
  { id: 's_17', userId: 'sample', amount: 3800, category: 'Utilities', month: '2026-08', primaryDate: '2026-08-11', dates: ['2026-08-11'], description: 'DESCO Electricity & Water', createdAt: '2026-08-11' },
  { id: 's_18', userId: 'sample', amount: 3000, category: 'Transportation', month: '2026-08', primaryDate: '2026-08-19', dates: ['2026-08-19'], description: 'CNG & Metro Commute passes', createdAt: '2026-08-19' },
  // September 2026 (Moderate)
  { id: 's_19', userId: 'sample', amount: 15000, category: 'Grocery', month: '2026-09', primaryDate: '2026-09-02', dates: ['2026-09-02'], description: 'Monthly Provisions', createdAt: '2026-09-02' },
  { id: 's_20', userId: 'sample', amount: 12000, category: 'House Rent', month: '2026-09', primaryDate: '2026-09-01', dates: ['2026-09-01'], description: 'September House Rent', createdAt: '2026-09-01' },
  { id: 's_21', userId: 'sample', amount: 4800, category: 'Transportation', month: '2026-09', primaryDate: '2026-09-14', dates: ['2026-09-14'], description: 'Outstation Family Travel', createdAt: '2026-09-14' },
  { id: 's_22', userId: 'sample', amount: 5500, category: 'Payment', month: '2026-09', primaryDate: '2026-09-22', dates: ['2026-09-22'], description: 'Home Appliance Repair', createdAt: '2026-09-22' },
  // October 2026 (Current Active Month / High spend)
  { id: 's_23', userId: 'sample', amount: 18500, category: 'Grocery', month: '2026-10', primaryDate: '2026-10-02', dates: ['2026-10-02'], description: 'Supermarket Provisions & Oil', createdAt: '2026-10-02' },
  { id: 's_24', userId: 'sample', amount: 12000, category: 'House Rent', month: '2026-10', primaryDate: '2026-10-01', dates: ['2026-10-01'], description: 'October House Rent', createdAt: '2026-10-01' },
  { id: 's_25', userId: 'sample', amount: 9200, category: 'Shopping', month: '2026-10', primaryDate: '2026-10-12', dates: ['2026-10-12'], description: 'Winter Clothing & Bedding', createdAt: '2026-10-12' },
  { id: 's_26', userId: 'sample', amount: 4100, category: 'Utilities', month: '2026-10', primaryDate: '2026-10-08', dates: ['2026-10-08'], description: 'Internet & Utilities', createdAt: '2026-10-08' },
  { id: 's_27', userId: 'sample', amount: 6000, category: 'Education', month: '2026-10', primaryDate: '2026-10-14', dates: ['2026-10-14'], description: 'Specialized Coaching Semester', createdAt: '2026-10-14' },
];

export const SpendingTrendsDashboard: React.FC<SpendingTrendsDashboardProps> = ({
  expenditures,
  projects = [],
  onNavigateToExpense,
  className = '',
}) => {
  // Chart visual preferences
  const [chartType, setChartType] = useState<'area' | 'stacked_bar' | 'grouped_bar' | 'line'>('area');
  const [timeFilter, setTimeFilter] = useState<'all' | '6m' | '12m'>('all');
  const [selectedMonthDrilldown, setSelectedMonthDrilldown] = useState<string | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [useSampleData, setUseSampleData] = useState<boolean>(false);

  // Determine active dataset
  // If user has fewer than 2 distinct months of expenditure, automatically suggest or allow sample data
  const realMonthsCount = useMemo(() => {
    const s = new Set<string>();
    expenditures.forEach(e => {
      const m = e.month || e.primaryDate?.slice(0, 7) || e.createdAt?.slice(0, 7);
      if (m) s.add(m);
    });
    return s.size;
  }, [expenditures]);

  const activeExpenditures = useMemo(() => {
    if (useSampleData || (expenditures.length === 0 && realMonthsCount === 0)) {
      return SAMPLE_HISTORICAL_EXPENDITURES;
    }
    return expenditures;
  }, [expenditures, useSampleData, realMonthsCount]);

  // Extract all unique categories present in the data
  const presentCategories = useMemo(() => {
    const set = new Set<string>();
    activeExpenditures.forEach(e => {
      const cat = e.category || 'Others';
      set.add(cat);
    });
    return Array.from(set);
  }, [activeExpenditures]);

  // Aggregate expenditures by month and category
  const monthlyData = useMemo(() => {
    const map: Record<string, Record<string, number> & { total: number }> = {};

    activeExpenditures.forEach(exp => {
      const monthKey = exp.month || exp.primaryDate?.slice(0, 7) || exp.createdAt?.slice(0, 7);
      if (!monthKey || monthKey.length < 7) return;

      const cat = exp.category || 'Others';
      const amt = Number(exp.amount) || 0;

      if (!map[monthKey]) {
        map[monthKey] = { total: 0 };
      }
      map[monthKey][cat] = (map[monthKey][cat] || 0) + amt;
      map[monthKey].total += amt;
    });

    // Sort chronologically
    let sortedKeys = Object.keys(map).sort();

    // Apply time horizon filter
    if (timeFilter === '6m') {
      sortedKeys = sortedKeys.slice(-6);
    } else if (timeFilter === '12m') {
      sortedKeys = sortedKeys.slice(-12);
    }

    return sortedKeys.map(key => {
      const [year, monthNum] = key.split('-');
      const dateObj = new Date(Number(year), Number(monthNum) - 1, 1);
      const formattedLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const fullLabel = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const record: MonthlyCategoryRecord = {
        ...map[key],
        monthKey: key,
        label: formattedLabel,
        fullLabel,
        total: map[key].total,
      };

      return record;
    });
  }, [activeExpenditures, timeFilter]);

  // Calculate Peak Spending Month and Detailed Peak Analysis
  const peakAnalysis = useMemo(() => {
    if (monthlyData.length === 0) {
      return null;
    }

    let peak = monthlyData[0];
    let lowest = monthlyData[0];
    let sumTotal = 0;

    monthlyData.forEach(item => {
      sumTotal += item.total;
      if (item.total > peak.total) {
        peak = item;
      }
      if (item.total < lowest.total) {
        lowest = item;
      }
    });

    const averageMonthlySpend = Math.round(sumTotal / monthlyData.length);
    const peakVariancePct = averageMonthlySpend > 0
      ? Math.round(((peak.total - averageMonthlySpend) / averageMonthlySpend) * 100)
      : 0;

    // Identify which categories drove the peak month
    const peakCategoriesBreakdown: { category: string; amount: number; percentage: number }[] = [];
    Object.keys(peak).forEach(k => {
      if (k !== 'monthKey' && k !== 'label' && k !== 'fullLabel' && k !== 'total') {
        const amt = Number(peak[k]) || 0;
        if (amt > 0) {
          peakCategoriesBreakdown.push({
            category: k,
            amount: amt,
            percentage: peak.total > 0 ? Math.round((amt / peak.total) * 100) : 0,
          });
        }
      }
    });
    peakCategoriesBreakdown.sort((a, b) => b.amount - a.amount);

    // Identify largest Month-over-Month spike
    let largestMoMSpike: {
      fromMonth: string;
      toMonth: string;
      increaseAmt: number;
      increasePct: number;
    } | null = null;

    for (let i = 1; i < monthlyData.length; i++) {
      const prev = monthlyData[i - 1];
      const curr = monthlyData[i];
      const diff = curr.total - prev.total;
      if (diff > 0) {
        const pct = prev.total > 0 ? Math.round((diff / prev.total) * 100) : 100;
        if (!largestMoMSpike || diff > largestMoMSpike.increaseAmt) {
          largestMoMSpike = {
            fromMonth: prev.label,
            toMonth: curr.label,
            increaseAmt: diff,
            increasePct: pct,
          };
        }
      }
    }

    // Ranked months for leaderboard
    const rankedMonths = [...monthlyData].sort((a, b) => b.total - a.total);

    return {
      peakMonth: peak,
      lowestMonth: lowest,
      averageMonthlySpend,
      peakVariancePct,
      topDriver: peakCategoriesBreakdown[0] || null,
      secondDriver: peakCategoriesBreakdown[1] || null,
      peakBreakdown: peakCategoriesBreakdown,
      largestMoMSpike,
      rankedMonths,
    };
  }, [monthlyData]);

  // Category Distribution for Selected Month or All Time
  const activeDrilldownMonth = selectedMonthDrilldown || peakAnalysis?.peakMonth.monthKey || null;

  const monthCategoryPieData = useMemo(() => {
    if (!activeDrilldownMonth) return [];

    const monthRecord = monthlyData.find(m => m.monthKey === activeDrilldownMonth);
    if (!monthRecord) return [];

    const pieItems: { name: string; value: number; color: string; pct: number }[] = [];
    Object.keys(monthRecord).forEach(k => {
      if (k !== 'monthKey' && k !== 'label' && k !== 'fullLabel' && k !== 'total') {
        const amt = Number(monthRecord[k]) || 0;
        if (amt > 0) {
          const colorObj = CATEGORY_PALETTE[k];
          pieItems.push({
            name: k,
            value: amt,
            color: colorObj ? colorObj.color : DEFAULT_CATEGORY_COLOR,
            pct: monthRecord.total > 0 ? Math.round((amt / monthRecord.total) * 100) : 0,
          });
        }
      }
    });

    return pieItems.sort((a, b) => b.value - a.value);
  }, [monthlyData, activeDrilldownMonth]);

  // Formatter helper for Currency
  const formatTaka = (val: number) => `৳ ${Number(val).toLocaleString()}`;

  // Custom Recharts Tooltip for rich presentation
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentMonthItem = monthlyData.find(m => m.label === label);
      const isPeak = peakAnalysis?.peakMonth.label === label;
      const totalSpend = currentMonthItem?.total || 0;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 min-w-[220px] text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <span className="font-bold text-slate-200">{currentMonthItem?.fullLabel || label}</span>
            {isPeak && (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 animate-pulse">
                <Flame className="w-3 h-3 text-amber-400" />
                PEAK MONTH
              </span>
            )}
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {payload
              .filter((p: any) => p.value > 0)
              .sort((a: any, b: any) => b.value - a.value)
              .map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: p.color || p.fill }}
                    />
                    <span className="text-slate-300 truncate max-w-[110px]">{p.name}:</span>
                  </div>
                  <span className="font-mono font-bold text-white">
                    ৳ {Number(p.value).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between font-black text-emerald-400">
            <span>Total Month Spend:</span>
            <span className="font-mono text-sm">৳ {totalSpend.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner & Context Bar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Spending Trends & Peak Month Detector</span>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                  Recharts Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Visualize multi-month category spending trajectories and pinpoint peak household expenditure surges
              </p>
            </div>
          </div>
        </div>

        {/* Controls Bar: Time Filter, Chart Type & Sample Data Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time range selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('12m')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeFilter === '12m'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              12 Months
            </button>
            <button
              onClick={() => setTimeFilter('6m')}
              className={`px-3 py-1 rounded-lg transition-all ${
                timeFilter === '6m'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              Last 6 Months
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setChartType('area')}
              title="Stacked Area Chart"
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                chartType === 'area'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              onClick={() => setChartType('stacked_bar')}
              title="Stacked Bars"
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                chartType === 'stacked_bar'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stacked Bar</span>
            </button>
            <button
              onClick={() => setChartType('grouped_bar')}
              title="Grouped Bars"
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                chartType === 'grouped_bar'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grouped</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Multi-Category Lines"
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                chartType === 'line'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lines</span>
            </button>
          </div>

          {/* Sample Data Toggle Button */}
          <button
            onClick={() => setUseSampleData(!useSampleData)}
            className={`text-xs px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
              useSampleData
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Toggle realistic multi-month test data to inspect peak trends"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{useSampleData ? 'Using Demo Data' : 'Try Demo Trends'}</span>
          </button>
        </div>
      </div>

      {/* PEAK SPENDING MONTH CALLOUT HERO */}
      {peakAnalysis && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Peak Month Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-indigo-800/70 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/25 to-rose-500/25 text-amber-300 px-3 py-1 rounded-full text-xs font-extrabold border border-amber-400/40">
                  <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                  <span>IDENTIFIED PEAK SPENDING MONTH</span>
                </div>

                <div className="text-[11px] font-semibold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  Analyzed {monthlyData.length} active month{monthlyData.length === 1 ? '' : 's'}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mt-1">
                <div>
                  <h3 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                    {peakAnalysis.peakMonth.fullLabel}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Highest recorded household outlay across all logged expenditures.
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl font-mono font-black text-amber-400">
                    ৳ {peakAnalysis.peakMonth.total.toLocaleString()}
                  </div>
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1 sm:justify-end">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +{peakAnalysis.peakVariancePct}% above average
                  </span>
                </div>
              </div>

              {/* Peak Drivers Breakdown */}
              <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {peakAnalysis.topDriver && (
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Primary Surge Driver
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">
                        {peakAnalysis.topDriver.category}
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        ৳ {peakAnalysis.topDriver.amount.toLocaleString()} ({peakAnalysis.topDriver.percentage}%)
                      </span>
                    </div>
                  </div>
                )}

                {peakAnalysis.largestMoMSpike ? (
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Sharpest Month-over-Month Spike
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">
                        {peakAnalysis.largestMoMSpike.fromMonth} → {peakAnalysis.largestMoMSpike.toMonth}
                      </span>
                      <span className="font-mono font-bold text-rose-400">
                        +৳ {peakAnalysis.largestMoMSpike.increaseAmt.toLocaleString()} (+{peakAnalysis.largestMoMSpike.increasePct}%)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                      Secondary Driver
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">
                        {peakAnalysis.secondDriver?.category || 'General Outlay'}
                      </span>
                      <span className="font-mono font-bold text-amber-200">
                        ৳ {peakAnalysis.secondDriver?.amount.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Background decorative glow */}
            <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Key Stat Cards (Avg Spend & Leanest Month) */}
          <div className="flex flex-col gap-4">
            {/* Average Spend */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Monthly Baseline Average
                </span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono text-slate-900">
                  ৳ {peakAnalysis.averageMonthlySpend.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Expected monthly benchmark across all recorded periods.
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Peak vs Baseline Gap</span>
                <span className="font-mono font-bold text-slate-700">
                  +৳ {(peakAnalysis.peakMonth.total - peakAnalysis.averageMonthlySpend).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Leanest / Lowest Month */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Most Economical (Leanest) Month
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black font-mono text-emerald-600">
                  ৳ {peakAnalysis.lowestMonth.total.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Recorded in <strong className="text-slate-800">{peakAnalysis.lowestMonth.fullLabel}</strong>
                </p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Peak-to-Low Ratio</span>
                <span className="font-mono font-bold text-emerald-700">
                  {peakAnalysis.lowestMonth.total > 0
                    ? (peakAnalysis.peakMonth.total / peakAnalysis.lowestMonth.total).toFixed(1) + 'x'
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VISUALIZATION: RECHARTS CANVAS */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Category Outlay Over Time</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click on any month to examine its detailed category distribution and itemized weight
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              All Categories
            </button>
            {presentCategories.slice(0, 6).map(cat => {
              const pal = CATEGORY_PALETTE[cat];
              const isSelected = selectedCategoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategoryFilter(isSelected ? 'all' : cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-bold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-1.5"
                    style={{ backgroundColor: pal?.color || DEFAULT_CATEGORY_COLOR }}
                  />
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="w-full h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart
                data={monthlyData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const mk = e.activePayload[0].payload.monthKey;
                    setSelectedMonthDrilldown(mk);
                  }
                }}
              >
                <defs>
                  {presentCategories.map(cat => {
                    const color = CATEGORY_PALETTE[cat]?.color || DEFAULT_CATEGORY_COLOR;
                    return (
                      <linearGradient key={cat} id={`grad_${cat}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.7} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `৳${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
                />

                {/* Average Spending Benchmark Reference Line */}
                {peakAnalysis && (
                  <ReferenceLine
                    y={peakAnalysis.averageMonthlySpend}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg: ৳${peakAnalysis.averageMonthlySpend.toLocaleString()}`,
                      fill: '#64748b',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                )}

                {/* Render Areas */}
                {presentCategories
                  .filter(cat => selectedCategoryFilter === 'all' || selectedCategoryFilter === cat)
                  .map(cat => {
                    const color = CATEGORY_PALETTE[cat]?.color || DEFAULT_CATEGORY_COLOR;
                    return (
                      <Area
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        name={cat}
                        stackId={selectedCategoryFilter === 'all' ? '1' : undefined}
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#grad_${cat})`}
                      />
                    );
                  })}
              </AreaChart>
            ) : chartType === 'stacked_bar' ? (
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const mk = e.activePayload[0].payload.monthKey;
                    setSelectedMonthDrilldown(mk);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `৳${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
                />
                {peakAnalysis && (
                  <ReferenceLine
                    y={peakAnalysis.averageMonthlySpend}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                  />
                )}
                {presentCategories
                  .filter(cat => selectedCategoryFilter === 'all' || selectedCategoryFilter === cat)
                  .map(cat => {
                    const color = CATEGORY_PALETTE[cat]?.color || DEFAULT_CATEGORY_COLOR;
                    return (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        name={cat}
                        stackId="a"
                        fill={color}
                        radius={[2, 2, 0, 0]}
                      />
                    );
                  })}
              </BarChart>
            ) : chartType === 'grouped_bar' ? (
              <BarChart
                data={monthlyData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const mk = e.activePayload[0].payload.monthKey;
                    setSelectedMonthDrilldown(mk);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `৳${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
                />
                {presentCategories
                  .filter(cat => selectedCategoryFilter === 'all' || selectedCategoryFilter === cat)
                  .map(cat => {
                    const color = CATEGORY_PALETTE[cat]?.color || DEFAULT_CATEGORY_COLOR;
                    return <Bar key={cat} dataKey={cat} name={cat} fill={color} radius={[3, 3, 0, 0]} />;
                  })}
              </BarChart>
            ) : (
              <LineChart
                data={monthlyData}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    const mk = e.activePayload[0].payload.monthKey;
                    setSelectedMonthDrilldown(mk);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={val => `৳${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 11, paddingBottom: 12 }}
                />
                {presentCategories
                  .filter(cat => selectedCategoryFilter === 'all' || selectedCategoryFilter === cat)
                  .map(cat => {
                    const color = CATEGORY_PALETTE[cat]?.color || DEFAULT_CATEGORY_COLOR;
                    return (
                      <Line
                        key={cat}
                        type="monotone"
                        dataKey={cat}
                        name={cat}
                        stroke={color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: color }}
                        activeDot={{ r: 6 }}
                      />
                    );
                  })}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend / Tip */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Click any data point to highlight and inspect that month's category allocation.</span>
          </div>
          {peakAnalysis && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                <Flame className="w-3 h-3 text-amber-600" />
                Peak Month: {peakAnalysis.peakMonth.label} (৳{peakAnalysis.peakMonth.total.toLocaleString()})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* LOWER SECTION: DRILL-DOWN DONUT + RANKED MONTHS LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Months Leaderboard */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Peak Spending Months Leaderboard
                  </h3>
                  <p className="text-xs text-slate-500">
                    All months sorted from highest peak spending to most frugal
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-slate-400">
                {peakAnalysis?.rankedMonths.length || 0} periods
              </span>
            </div>

            {/* List of Months */}
            <div className="space-y-2.5">
              {peakAnalysis?.rankedMonths.map((item, idx) => {
                const isSelected = activeDrilldownMonth === item.monthKey;
                const isPeak = idx === 0;
                const maxSpend = peakAnalysis.peakMonth.total || 1;
                const pctOfMax = Math.round((item.total / maxSpend) * 100);

                let rankBadge = (
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                );

                if (idx === 0) {
                  rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                      🥇
                    </span>
                  );
                } else if (idx === 1) {
                  rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center shrink-0">
                      🥈
                    </span>
                  );
                } else if (idx === 2) {
                  rankBadge = (
                    <span className="w-6 h-6 rounded-full bg-amber-700/80 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      🥉
                    </span>
                  );
                }

                return (
                  <div
                    key={item.monthKey}
                    onClick={() => setSelectedMonthDrilldown(item.monthKey)}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-indigo-400 bg-indigo-50/50 shadow-xs'
                        : isPeak
                        ? 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/60'
                        : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {rankBadge}
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">{item.fullLabel}</span>
                            {isPeak && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-amber-500 text-white uppercase tracking-wider">
                                Peak
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {pctOfMax}% of peak volume
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-black text-slate-900 text-sm">
                          ৳ {item.total.toLocaleString()}
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            item.total >= peakAnalysis.averageMonthlySpend
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}
                        >
                          {item.total >= peakAnalysis.averageMonthlySpend ? '▲' : '▼'}{' '}
                          {Math.abs(
                            Math.round(
                              ((item.total - peakAnalysis.averageMonthlySpend) /
                                peakAnalysis.averageMonthlySpend) *
                                100
                            )
                          )}
                          % vs avg
                        </span>
                      </div>
                    </div>

                    {/* Proportional Bar */}
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isPeak ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${pctOfMax}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {onNavigateToExpense && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Want to log new expenses for this month?</span>
              <button
                onClick={onNavigateToExpense}
                className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Add Expenditure</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Drill-Down Donut for Selected Month */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <PieIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Category Breakdown
                  </h3>
                  <p className="text-xs text-slate-500">
                    {monthlyData.find(m => m.monthKey === activeDrilldownMonth)?.fullLabel ||
                      'Selected Month'}
                  </p>
                </div>
              </div>
            </div>

            {/* Donut Chart */}
            <div className="h-48 sm:h-52 relative flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthCategoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {monthCategoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`৳ ${Number(value).toLocaleString()}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Total in Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="font-mono font-black text-slate-900 text-xs sm:text-sm">
                  ৳{' '}
                  {monthlyData
                    .find(m => m.monthKey === activeDrilldownMonth)
                    ?.total.toLocaleString() || '0'}
                </span>
              </div>
            </div>

            {/* Category breakdown item list */}
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto pr-1">
              {monthCategoryPieData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-slate-800 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">
                      ৳ {item.value.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 w-8 text-right font-sans">
                      ({item.pct}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Selected Period:</span>
            <strong className="text-slate-700 font-bold">
              {monthlyData.find(m => m.monthKey === activeDrilldownMonth)?.fullLabel}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
