import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  Calculator,
  Filter,
  Eye,
  Sliders,
  Maximize2,
  Boxes,
  HelpCircle,
  Download,
  Info,
  Calendar,
} from 'lucide-react';
import { Worksheet, Expenditure, Project } from '../types/family';

interface DeepAnalyticsStudioProps {
  worksheets: Worksheet[];
  expenditures: Expenditure[];
  projects: Project[];
}

type StudioTab = '3d-bar' | 'column' | 'pie' | 'ogive' | 'statistics';
type TimeFilter = 'all' | 'oct2026' | 'last30' | 'recent7';
type MetricChoice = 'expenditure' | 'income' | 'comparison';

const CATEGORY_COLORS: Record<string, { bg: string; fill: string; light: string; dark: string }> = {
  Grocery: { bg: 'bg-emerald-500', fill: '#10b981', light: '#34d399', dark: '#047857' },
  Education: { bg: 'bg-blue-500', fill: '#3b82f6', light: '#60a5fa', dark: '#1d4ed8' },
  Utilities: { bg: 'bg-cyan-500', fill: '#06b6d4', light: '#22d3ee', dark: '#0e7490' },
  'House Rent': { bg: 'bg-indigo-500', fill: '#6366f1', light: '#818cf8', dark: '#4338ca' },
  Health: { bg: 'bg-rose-500', fill: '#f43f5e', light: '#fb7185', dark: '#be123c' },
  Shopping: { bg: 'bg-pink-500', fill: '#ec4899', light: '#f472b6', dark: '#be185d' },
  Transportation: { bg: 'bg-sky-500', fill: '#0ea5e9', light: '#38bdf8', dark: '#0369a1' },
  Payment: { bg: 'bg-violet-500', fill: '#8b5cf6', light: '#a78bfa', dark: '#6d28d9' },
  'Father Giving': { bg: 'bg-teal-500', fill: '#14b8a6', light: '#2dd4bf', dark: '#0f766e' },
  Debt: { bg: 'bg-amber-500', fill: '#f59e0b', light: '#fbbf24', dark: '#b45309' },
  Donation: { bg: 'bg-purple-500', fill: '#a855f7', light: '#c084fc', dark: '#7e22ce' },
  Tuition: { bg: 'bg-emerald-600', fill: '#059669', light: '#10b981', dark: '#065f46' },
  'Father Salary': { bg: 'bg-teal-600', fill: '#0d9488', light: '#14b8a6', dark: '#115e59' },
  'Selling Product': { bg: 'bg-sky-600', fill: '#0284c7', light: '#38bdf8', dark: '#0369a1' },
  'Others Help': { bg: 'bg-violet-600', fill: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
  Others: { bg: 'bg-slate-500', fill: '#64748b', light: '#94a3b8', dark: '#334155' },
  Other: { bg: 'bg-slate-500', fill: '#64748b', light: '#94a3b8', dark: '#334155' },
};

function getCatColor(cat: string) {
  return CATEGORY_COLORS[cat] || {
    bg: 'bg-indigo-500',
    fill: '#6366f1',
    light: '#818cf8',
    dark: '#4338ca',
  };
}

export const DeepAnalyticsStudio: React.FC<DeepAnalyticsStudioProps> = ({
  worksheets,
  expenditures,
  projects,
}) => {
  // Studio Interactive States
  const [activeTab, setActiveTab] = useState<StudioTab>('3d-bar');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [metricChoice, setMetricChoice] = useState<MetricChoice>('expenditure');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

  // 3D Bar Specific States
  const [tiltAngle, setTiltAngle] = useState<'low' | 'iso' | 'high'>('iso');
  const [barHoverIndex, setBarHoverIndex] = useState<number | null>(null);

  // Column Chart Specific States
  const [columnMode, setColumnMode] = useState<'grouped' | 'stacked'>('grouped');

  // Pie Chart Specific States
  const [pieMode, setPieMode] = useState<'donut' | 'solid'>('donut');
  const [pieHoverIndex, setPieHoverIndex] = useState<number | null>(null);

  // Ogive Specific States
  const [ogiveType, setOgiveType] = useState<'less' | 'both'>('both');
  const [ogiveScrubIndex, setOgiveScrubIndex] = useState<number | null>(null);

  // 1. Filtered Data according to Time Scope
  const filteredExpenditures = useMemo(() => {
    return expenditures.filter(exp => {
      if (activeCategoryFilter !== 'all' && (exp.category || 'Other') !== activeCategoryFilter) {
        return false;
      }
      if (timeFilter === 'all') return true;
      if (timeFilter === 'oct2026') return exp.month === '2026-10';
      if (timeFilter === 'last30') {
        const primary = exp.primaryDate || exp.createdAt.slice(0, 10);
        return primary >= '2026-09-12';
      }
      if (timeFilter === 'recent7') {
        const primary = exp.primaryDate || exp.createdAt.slice(0, 10);
        return primary >= '2026-10-05';
      }
      return true;
    });
  }, [expenditures, timeFilter, activeCategoryFilter]);

  // Aggregate Category Totals for Expenditures
  const expenseCatData = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    filteredExpenditures.forEach(e => {
      const cat = e.category || 'Other';
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += e.amount;
      map[cat].count += 1;
    });
    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        amount: data.total,
        count: data.count,
        color: getCatColor(cat),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenditures]);

  // Aggregate Income Totals
  const incomeCatData = useMemo(() => {
    const catMap: Record<string, string> = {
      tution: 'Tuition',
      father_salary: 'Father Salary',
      selling_product: 'Selling Product',
      others_help: 'Others Help',
    };
    const map: Record<string, { total: number; count: number }> = {};
    worksheets.forEach(w => {
      const label = catMap[w.category] || w.title || 'Other Income';
      if (!map[label]) map[label] = { total: 0, count: 0 };
      map[label].total += w.totalAmount || 0;
      map[label].count += w.rows.length;
    });
    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        amount: data.total,
        count: data.count,
        color: getCatColor(cat),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [worksheets]);

  // Totals
  const totalExpense = useMemo(
    () => filteredExpenditures.reduce((s, e) => s + e.amount, 0),
    [filteredExpenditures]
  );
  const totalIncome = useMemo(
    () => worksheets.reduce((s, w) => s + (w.totalAmount || 0), 0),
    [worksheets]
  );
  const totalProjectBudget = useMemo(
    () => projects.reduce((s, p) => s + p.expectedAmount, 0),
    [projects]
  );

  // Available Categories for filtering
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    expenditures.forEach(e => set.add(e.category || 'Other'));
    return Array.from(set);
  }, [expenditures]);

  // ==========================================
  // STATISTICAL CALCULATIONS
  // ==========================================
  const statistics = useMemo(() => {
    const values = filteredExpenditures.map(e => e.amount).sort((a, b) => a - b);
    const n = values.length;
    if (n === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        mode: 0,
        variance: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        range: 0,
        q1: 0,
        q3: 0,
        iqr: 0,
        cv: 0,
        gini: 0,
      };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / n;

    // Median
    const mid = Math.floor(n / 2);
    const median = n % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;

    // Mode
    const freq: Record<number, number> = {};
    let maxFreq = 0;
    let mode = values[0];
    values.forEach(v => {
      freq[v] = (freq[v] || 0) + 1;
      if (freq[v] > maxFreq) {
        maxFreq = freq[v];
        mode = v;
      }
    });

    // Quartiles
    const q1Idx = Math.floor(n * 0.25);
    const q3Idx = Math.floor(n * 0.75);
    const q1 = values[q1Idx] || 0;
    const q3 = values[q3Idx] || 0;
    const iqr = q3 - q1;

    // Variance & Standard Deviation
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // Min & Max
    const min = values[0];
    const max = values[n - 1];
    const range = max - min;

    // Gini Coefficient (Inequality of spending)
    let diffSum = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        diffSum += Math.abs(values[i] - values[j]);
      }
    }
    const gini = sum > 0 ? diffSum / (2 * n * sum) : 0;

    return {
      count: n,
      mean: Math.round(mean),
      median,
      mode,
      variance: Math.round(variance),
      stdDev: Math.round(stdDev),
      min,
      max,
      range,
      q1,
      q3,
      iqr,
      cv: Math.round(cv),
      gini: Number(gini.toFixed(3)),
    };
  }, [filteredExpenditures]);

  // Frequency Bins for Histogram
  const histogramBins = useMemo(() => {
    const bins = [
      { label: '< ৳500', min: 0, max: 500, count: 0, total: 0 },
      { label: '৳500 - 1.5K', min: 500, max: 1500, count: 0, total: 0 },
      { label: '৳1.5K - 5K', min: 1500, max: 5000, count: 0, total: 0 },
      { label: '৳5K - 15K', min: 5000, max: 15000, count: 0, total: 0 },
      { label: '> ৳15K', min: 15000, max: Infinity, count: 0, total: 0 },
    ];
    filteredExpenditures.forEach(e => {
      const b = bins.find(bin => e.amount >= bin.min && e.amount < bin.max);
      if (b) {
        b.count += 1;
        b.total += e.amount;
      }
    });
    return bins;
  }, [filteredExpenditures]);

  // ==========================================
  // OGIVE (AZIVE) CUMULATIVE FREQUENCY DATA
  // ==========================================
  const ogiveData = useMemo(() => {
    if (filteredExpenditures.length === 0) return [];
    // Sort transactions chronologically or by amount
    const sorted = [...filteredExpenditures].sort((a, b) => {
      const da = a.primaryDate || a.createdAt;
      const db = b.primaryDate || b.createdAt;
      return da.localeCompare(db);
    });

    const total = sorted.reduce((s, e) => s + e.amount, 0);
    let runningCumulative = 0;

    return sorted.map((item, idx) => {
      runningCumulative += item.amount;
      const pct = total > 0 ? (runningCumulative / total) * 100 : 0;
      const moreThanPct = 100 - pct;
      return {
        id: item.id,
        date: item.primaryDate || 'Undated',
        description: item.description,
        amount: item.amount,
        cumulativeAmount: runningCumulative,
        percentage: Number(pct.toFixed(1)),
        moreThanPercentage: Number(moreThanPct.toFixed(1)),
        index: idx + 1,
      };
    });
  }, [filteredExpenditures]);

  // Export CSV summary of currently analyzed dataset
  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Dataset Scope', timeFilter],
      ['Total Records', statistics.count.toString()],
      ['Total Expenditure (BDT)', totalExpense.toString()],
      ['Total Income (BDT)', totalIncome.toString()],
      ['Net Reserve (BDT)', (totalIncome - totalExpense).toString()],
      ['Mean Expense', statistics.mean.toString()],
      ['Median Expense', statistics.median.toString()],
      ['Standard Deviation', statistics.stdDev.toString()],
      ['Interquartile Range (IQR)', statistics.iqr.toString()],
      ['Gini Concentration', statistics.gini.toString()],
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.join(',')).join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Family_Analytics_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3D Perspective Offsets
  const pOffset = useMemo(() => {
    if (tiltAngle === 'low') return { dx: 8, dy: 6 };
    if (tiltAngle === 'high') return { dx: 22, dy: 16 };
    return { dx: 14, dy: 10 }; // isometric
  }, [tiltAngle]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-6">
      {/* Studio Header & Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/30">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
                Deep Analytics Studio
              </h3>
              <p className="text-xs text-slate-500">
                Statistical modeling, 3D isometric bar engine, Ogive curves, column comparisons & pie distributions
              </p>
            </div>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Time Filter Segmented Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter('oct2026')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'oct2026'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Oct 2026
            </button>
            <button
              onClick={() => setTimeFilter('last30')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeFilter === 'last30'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeCategoryFilter}
              onChange={e => setActiveCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-hidden text-xs font-semibold text-slate-800"
            >
              <option value="all">All Categories</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export Stats</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Stats Pill Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
          <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-600 block">
            Sample Mean (Avg Expense)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-indigo-950">
              ৳ {statistics.mean.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-indigo-500 font-medium">
            Median: ৳ {statistics.median.toLocaleString()}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 block">
            Net Surplus (Savings)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-emerald-950">
              ৳ {(totalIncome - totalExpense).toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            Margin: {totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0}%
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
          <span className="text-[10px] uppercase tracking-wider font-bold text-rose-600 block">
            Standard Deviation (σ)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-rose-950">
              ৳ {statistics.stdDev.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-rose-500 font-medium">
            CV Volatility: {statistics.cv}%
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100">
          <span className="text-[10px] uppercase tracking-wider font-bold text-purple-700 block">
            Interquartile Range (IQR)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-lg font-black font-mono text-purple-950">
              ৳ {statistics.iqr.toLocaleString()}
            </span>
          </div>
          <span className="text-[10px] text-purple-600 font-medium">
            Q1: ৳{statistics.q1} • Q3: ৳{statistics.q3}
          </span>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('3d-bar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === '3d-bar'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-indigo-600" />
          <span>3D Bar Chart Engine</span>
        </button>

        <button
          onClick={() => setActiveTab('column')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'column'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
          <span>Column Comparison Chart</span>
        </button>

        <button
          onClick={() => setActiveTab('pie')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pie'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-rose-600" />
          <span>Interactive Pie & Donut</span>
        </button>

        <button
          onClick={() => setActiveTab('ogive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ogive'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
          <span>Ogive (Azive) Cumulative Line</span>
        </button>

        <button
          onClick={() => setActiveTab('statistics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'statistics'
              ? 'bg-white text-indigo-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          <span>Statistical Distributions & Benchmarks</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. 3D BAR CHART VIEW */}
      {/* ========================================================= */}
      {activeTab === '3d-bar' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">
                True Isometric 3D Bar Extrusion (Front, Top & Shaded Facets)
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Metric Switcher */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-medium">Metric:</span>
                <button
                  onClick={() => setMetricChoice('expenditure')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    metricChoice === 'expenditure'
                      ? 'bg-rose-100 text-rose-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Expenses
                </button>
                <button
                  onClick={() => setMetricChoice('income')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    metricChoice === 'income'
                      ? 'bg-emerald-100 text-emerald-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* 3D Tilt Selector */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 font-medium">Angle:</span>
                <button
                  onClick={() => setTiltAngle('low')}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    tiltAngle === 'low' ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-700 border'
                  }`}
                >
                  15° Low
                </button>
                <button
                  onClick={() => setTiltAngle('iso')}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    tiltAngle === 'iso' ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-700 border'
                  }`}
                >
                  30° Iso
                </button>
                <button
                  onClick={() => setTiltAngle('high')}
                  className={`px-2 py-1 rounded-md text-[11px] ${
                    tiltAngle === 'high' ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-700 border'
                  }`}
                >
                  45° High
                </button>
              </div>
            </div>
          </div>

          {/* 3D Render Area */}
          <div className="bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-inner relative overflow-hidden">
            {/* Background Isometric Floor Grid Pattern */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <svg width="100%" height="100%">
                <defs>
                  <pattern id="grid3d" width="40" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 0 10 L 20 0 L 40 10 L 20 20 Z" fill="none" stroke="#6366f1" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid3d)" />
              </svg>
            </div>

            {/* SVG 3D Bars */}
            {(() => {
              const data = metricChoice === 'expenditure' ? expenseCatData : incomeCatData;
              if (data.length === 0) {
                return (
                  <div className="py-20 text-center text-slate-400">
                    <p className="text-sm font-semibold">No data records found for current filter.</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add records in income worksheets or expenditures to view 3D projection.
                    </p>
                  </div>
                );
              }

              const maxAmount = Math.max(...data.map(d => d.amount), 1);
              const svgWidth = 840;
              const svgHeight = 360;
              const baseY = 300;
              const barWidth = Math.min(54, (svgWidth - 120) / data.length - 20);
              const { dx, dy } = pOffset;

              return (
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto max-h-[420px] select-none"
                  >
                    <defs>
                      {data.map((item, idx) => (
                        <linearGradient
                          key={`grad-${idx}`}
                          id={`barGrad-${idx}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={item.color.light} />
                          <stop offset="100%" stopColor={item.color.fill} />
                        </linearGradient>
                      ))}
                    </defs>

                    {/* 3D Isometric Base Plane Shadow */}
                    <polygon
                      points={`40,${baseY} ${svgWidth - 40},${baseY} ${svgWidth - 40 + dx * 2},${
                        baseY - dy * 2
                      } ${40 + dx * 2},${baseY - dy * 2}`}
                      fill="#0f172a"
                      stroke="#1e293b"
                      strokeWidth="1.5"
                    />

                    {/* Ground reference lines */}
                    {[0.25, 0.5, 0.75, 1.0].map(ratio => {
                      const h = (svgHeight - 110) * ratio;
                      const y = baseY - h;
                      return (
                        <g key={ratio} opacity="0.25">
                          <line
                            x1="50"
                            y1={y}
                            x2={svgWidth - 30}
                            y2={y}
                            stroke="#94a3b8"
                            strokeDasharray="4 4"
                          />
                          <text x="35" y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                            ৳{Math.round(maxAmount * ratio).toLocaleString()}
                          </text>
                        </g>
                      );
                    })}

                    {/* Render each 3D Extruded Bar */}
                    {data.map((item, idx) => {
                      const x = 70 + idx * ((svgWidth - 140) / data.length);
                      const barHeight = Math.max(8, (item.amount / maxAmount) * (svgHeight - 120));
                      const y = baseY - barHeight;
                      const isHovered = barHoverIndex === idx;

                      // Polygon Points
                      // Front face: (x, y) to (x + barWidth, y) to (x + barWidth, baseY) to (x, baseY)
                      // Top face: (x, y) to (x + dx, y - dy) to (x + barWidth + dx, y - dy) to (x + barWidth, y)
                      // Right face: (x + barWidth, y) to (x + barWidth + dx, y - dy) to (x + barWidth + dx, baseY - dy) to (x + barWidth, baseY)

                      return (
                        <g
                          key={item.category}
                          onMouseEnter={() => setBarHoverIndex(idx)}
                          onMouseLeave={() => setBarHoverIndex(null)}
                          className="cursor-pointer transition-all duration-300"
                          transform={isHovered ? `translate(0, -6)` : ''}
                        >
                          {/* Ground Reflection / Contact Shadow */}
                          <ellipse
                            cx={x + barWidth / 2}
                            cy={baseY + 4}
                            rx={barWidth * 0.7}
                            ry="4"
                            fill="#000000"
                            opacity={isHovered ? '0.7' : '0.4'}
                          />

                          {/* 1. FRONT FACE */}
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={`url(#barGrad-${idx})`}
                            rx="2"
                            stroke={isHovered ? '#ffffff' : item.color.dark}
                            strokeWidth={isHovered ? '1.5' : '0.8'}
                          />

                          {/* 2. TOP FACE (Lighter tint) */}
                          <polygon
                            points={`${x},${y} ${x + dx},${y - dy} ${x + barWidth + dx},${
                              y - dy
                            } ${x + barWidth},${y}`}
                            fill={item.color.light}
                            stroke={isHovered ? '#ffffff' : item.color.dark}
                            strokeWidth={isHovered ? '1.5' : '0.8'}
                          />

                          {/* 3. RIGHT SIDE FACE (Darker Shadow facet) */}
                          <polygon
                            points={`${x + barWidth},${y} ${x + barWidth + dx},${y - dy} ${
                              x + barWidth + dx
                            },${baseY - dy} ${x + barWidth},${baseY}`}
                            fill={item.color.dark}
                            stroke={isHovered ? '#ffffff' : item.color.dark}
                            strokeWidth={isHovered ? '1.5' : '0.8'}
                            opacity="0.9"
                          />

                          {/* Category Label at bottom */}
                          <text
                            x={x + barWidth / 2}
                            y={baseY + 20}
                            fill={isHovered ? '#ffffff' : '#94a3b8'}
                            fontSize="11"
                            fontWeight={isHovered ? 'bold' : 'normal'}
                            textAnchor="middle"
                          >
                            {item.category.length > 9 ? item.category.slice(0, 8) + '..' : item.category}
                          </text>

                          {/* Value on Top in 3D */}
                          <text
                            x={x + barWidth / 2 + dx / 2}
                            y={y - dy - 6}
                            fill={isHovered ? '#38bdf8' : '#e2e8f0'}
                            fontSize="10"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            ৳{Math.round(item.amount).toLocaleString()}
                          </text>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Active Bar Hover Card Floating Overlay */}
                  {barHoverIndex !== null && data[barHoverIndex] && (
                    <div className="absolute top-4 right-4 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl text-xs space-y-1 z-20 min-w-[200px] animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-indigo-300">
                          {data[barHoverIndex].category}
                        </span>
                        <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                          {metricChoice === 'expenditure'
                            ? `${Math.round((data[barHoverIndex].amount / totalExpense) * 100)}% of total`
                            : `${Math.round((data[barHoverIndex].amount / (totalIncome || 1)) * 100)}% of total`}
                        </span>
                      </div>
                      <div className="pt-1 text-slate-300 flex justify-between">
                        <span>Allocated Total:</span>
                        <strong className="font-mono text-emerald-400 text-sm">
                          ৳ {data[barHoverIndex].amount.toLocaleString()}
                        </strong>
                      </div>
                      <div className="text-slate-400 flex justify-between text-[11px]">
                        <span>Frequency count:</span>
                        <span>{data[barHoverIndex].count} entries</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. COLUMN COMPARISON CHART VIEW */}
      {/* ========================================================= */}
      {activeTab === 'column' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-800">
                Multi-Series Column Chart: Income vs. Expenditure & Net Cash
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-0.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setColumnMode('grouped')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    columnMode === 'grouped'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setColumnMode('stacked')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    columnMode === 'stacked'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Stacked Comparison
                </button>
              </div>
            </div>
          </div>

          {/* Column Chart Visualization Area */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                  <span className="text-slate-700">Total Income (৳ {totalIncome.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                  <span className="text-slate-700">Total Expenses (৳ {totalExpense.toLocaleString()})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-indigo-500 inline-block" />
                  <span className="text-slate-700">
                    Net Reserve (৳ {(totalIncome - totalExpense).toLocaleString()})
                  </span>
                </div>
              </div>

              <div className="text-xs font-bold text-slate-500">
                Target Project Demand: ৳ {totalProjectBudget.toLocaleString()}
              </div>
            </div>

            {/* SVG Multi-Series Columns */}
            {(() => {
              const svgW = 800;
              const svgH = 320;
              const maxVal = Math.max(totalIncome, totalExpense, totalProjectBudget, 1000);
              const baselineY = 260;

              // Series Data
              const series = [
                {
                  label: 'Overall Cashflow',
                  income: totalIncome,
                  expense: totalExpense,
                  net: Math.max(0, totalIncome - totalExpense),
                  project: totalProjectBudget,
                },
                ...expenseCatData.slice(0, 5).map(cat => ({
                  label: cat.category,
                  income: 0,
                  expense: cat.amount,
                  net: 0,
                  project: 0,
                })),
              ];

              const groupWidth = svgW / series.length;
              const singleBarW = columnMode === 'grouped' ? 24 : 36;

              return (
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
                  {/* Grid Lines */}
                  {[0.25, 0.5, 0.75, 1.0].map(r => {
                    const y = baselineY - (baselineY - 40) * r;
                    return (
                      <g key={r} opacity="0.5">
                        <line x1="30" y1={y} x2={svgW - 20} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
                        <text x="25" y={y + 3} fill="#94a3b8" fontSize="9" textAnchor="end">
                          ৳{Math.round(maxVal * r).toLocaleString()}
                        </text>
                      </g>
                    );
                  })}

                  {/* Base axis */}
                  <line x1="30" y1={baselineY} x2={svgW - 20} y2={baselineY} stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Columns */}
                  {series.map((item, i) => {
                    const cx = 60 + i * groupWidth + groupWidth / 4;

                    if (columnMode === 'grouped') {
                      const hInc = (item.income / maxVal) * (baselineY - 40);
                      const hExp = (item.expense / maxVal) * (baselineY - 40);
                      const hNet = (item.net / maxVal) * (baselineY - 40);

                      return (
                        <g key={item.label} className="group cursor-pointer">
                          {/* Income Column */}
                          {item.income > 0 && (
                            <rect
                              x={cx - singleBarW * 1.5}
                              y={baselineY - hInc}
                              width={singleBarW}
                              height={hInc}
                              rx="3"
                              fill="#10b981"
                              className="hover:opacity-85 transition-opacity"
                            />
                          )}

                          {/* Expense Column */}
                          <rect
                            x={cx - singleBarW * 0.5}
                            y={baselineY - hExp}
                            width={singleBarW}
                            height={hExp}
                            rx="3"
                            fill="#f43f5e"
                            className="hover:opacity-85 transition-opacity"
                          />

                          {/* Net Column */}
                          {item.net > 0 && (
                            <rect
                              x={cx + singleBarW * 0.5}
                              y={baselineY - hNet}
                              width={singleBarW}
                              height={hNet}
                              rx="3"
                              fill="#6366f1"
                              className="hover:opacity-85 transition-opacity"
                            />
                          )}

                          {/* Label */}
                          <text
                            x={cx}
                            y={baselineY + 22}
                            fill="#475569"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                          >
                            {item.label}
                          </text>

                          {/* Hover Tooltip Amount */}
                          <text
                            x={cx}
                            y={baselineY - Math.max(hInc, hExp, hNet) - 8}
                            fill="#0f172a"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ৳{Math.round(item.expense || item.income).toLocaleString()}
                          </text>
                        </g>
                      );
                    } else {
                      // Stacked Mode
                      const totalBar = item.income + item.expense;
                      const hInc = (item.income / maxVal) * (baselineY - 40);
                      const hExp = (item.expense / maxVal) * (baselineY - 40);

                      return (
                        <g key={item.label} className="group cursor-pointer">
                          {/* Bottom Stack: Expense */}
                          <rect
                            x={cx - singleBarW / 2}
                            y={baselineY - hExp}
                            width={singleBarW}
                            height={hExp}
                            rx="2"
                            fill="#f43f5e"
                          />

                          {/* Top Stack: Income */}
                          {item.income > 0 && (
                            <rect
                              x={cx - singleBarW / 2}
                              y={baselineY - hExp - hInc}
                              width={singleBarW}
                              height={hInc}
                              rx="2"
                              fill="#10b981"
                            />
                          )}

                          <text
                            x={cx}
                            y={baselineY + 22}
                            fill="#475569"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                          >
                            {item.label}
                          </text>

                          <text
                            x={cx}
                            y={baselineY - hExp - hInc - 8}
                            fill="#0f172a"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            ৳{Math.round(totalBar).toLocaleString()}
                          </text>
                        </g>
                      );
                    }
                  })}
                </svg>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. INTERACTIVE PIE & DONUT CHART VIEW */}
      {/* ========================================================= */}
      {activeTab === 'pie' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold text-slate-800">
                Categorical Budget Share (SVG Slices, Interactive Explosion & Centroid Metrics)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPieMode('donut')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  pieMode === 'donut' ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-700 border'
                }`}
              >
                Donut Ring
              </button>
              <button
                onClick={() => setPieMode('solid')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  pieMode === 'solid' ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-slate-700 border'
                }`}
              >
                Solid Pie
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* SVG Pie Chart Canvas */}
            <div className="md:col-span-6 flex justify-center relative">
              {(() => {
                const data = expenseCatData;
                if (data.length === 0 || totalExpense === 0) {
                  return (
                    <div className="py-16 text-center text-slate-400">
                      <p className="text-xs font-bold">No expenditure recorded yet.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Create an expenditure entry to render pie slices.
                      </p>
                    </div>
                  );
                }

                const cx = 160;
                const cy = 160;
                const radius = 120;
                const innerRadius = pieMode === 'donut' ? 70 : 0;

                let cumulativeAngle = 0;

                const slices = data.map((item, idx) => {
                  const fraction = item.amount / totalExpense;
                  const angle = fraction * 2 * Math.PI;
                  const startAngle = cumulativeAngle;
                  const endAngle = cumulativeAngle + angle;
                  cumulativeAngle += angle;

                  const midAngle = (startAngle + endAngle) / 2;
                  const isHovered = pieHoverIndex === idx;
                  const explodeDist = isHovered ? 8 : 0;
                  const shiftX = Math.cos(midAngle) * explodeDist;
                  const shiftY = Math.sin(midAngle) * explodeDist;

                  const x1 = cx + radius * Math.cos(startAngle);
                  const y1 = cy + radius * Math.sin(startAngle);
                  const x2 = cx + radius * Math.cos(endAngle);
                  const y2 = cy + radius * Math.sin(endAngle);

                  const ix1 = cx + innerRadius * Math.cos(startAngle);
                  const iy1 = cy + innerRadius * Math.sin(startAngle);
                  const ix2 = cx + innerRadius * Math.cos(endAngle);
                  const iy2 = cy + innerRadius * Math.sin(endAngle);

                  const largeArc = angle > Math.PI ? 1 : 0;

                  const path =
                    innerRadius > 0
                      ? `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
                      : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                  return {
                    ...item,
                    path,
                    shiftX,
                    shiftY,
                    pct: Math.round(fraction * 100),
                    idx,
                  };
                });

                return (
                  <div className="relative">
                    <svg width="320" height="320" viewBox="0 0 320 320" className="select-none">
                      {slices.map(slice => (
                        <path
                          key={slice.category}
                          d={slice.path}
                          fill={slice.color.fill}
                          stroke="#ffffff"
                          strokeWidth="2"
                          transform={`translate(${slice.shiftX}, ${slice.shiftY})`}
                          onMouseEnter={() => setPieHoverIndex(slice.idx)}
                          onMouseLeave={() => setPieHoverIndex(null)}
                          className="cursor-pointer transition-transform duration-200 hover:opacity-90"
                        />
                      ))}
                    </svg>

                    {/* Donut Center Display */}
                    {pieMode === 'donut' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {pieHoverIndex !== null ? data[pieHoverIndex].category : 'Total Expense'}
                        </span>
                        <span className="text-base font-black font-mono text-slate-900">
                          ৳{' '}
                          {pieHoverIndex !== null
                            ? data[pieHoverIndex].amount.toLocaleString()
                            : totalExpense.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">
                          {pieHoverIndex !== null
                            ? `${Math.round((data[pieHoverIndex].amount / totalExpense) * 100)}% of total`
                            : `${data.length} categories`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Pie Interactive Legend & Percentage Table */}
            <div className="md:col-span-6 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Expenditure Share by Category
              </h4>
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-2">
                {expenseCatData.map((cat, idx) => {
                  const pct = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0;
                  const isHovered = pieHoverIndex === idx;

                  return (
                    <div
                      key={cat.category}
                      onMouseEnter={() => setPieHoverIndex(idx)}
                      onMouseLeave={() => setPieHoverIndex(null)}
                      className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer text-xs ${
                        isHovered ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color.fill }} />
                        <span className="font-semibold text-slate-800">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 text-[11px]">{Math.round(pct)}%</span>
                        <strong className="text-slate-900 font-bold">
                          ৳ {cat.amount.toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. OGIVE (AZIVE) CUMULATIVE LINE CHART */}
      {/* ========================================================= */}
      {activeTab === 'ogive' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold text-slate-800">
                  Statistical Ogive Curve (Azive Cumulative Frequency Polygon)
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Displays the cumulative rate of household outflow over time, identifying quartiles (Q1, Median Q2, Q3) and percentile thresholds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOgiveType('less')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  ogiveType === 'less' ? 'bg-purple-600 text-white font-bold' : 'bg-white text-slate-700 border'
                }`}
              >
                Less-Than Ogive
              </button>
              <button
                onClick={() => setOgiveType('both')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  ogiveType === 'both' ? 'bg-purple-600 text-white font-bold' : 'bg-white text-slate-700 border'
                }`}
              >
                Dual Ogive Intersection
              </button>
            </div>
          </div>

          {/* SVG Ogive Plot */}
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 text-white shadow-inner space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-purple-400 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  Less-Than Cumulative Outflow (%)
                </span>
                {ogiveType === 'both' && (
                  <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    More-Than Remaining Reserve (%)
                  </span>
                )}
              </div>

              <div className="text-[11px] font-mono text-slate-400">
                Sample Size: <strong className="text-white">{ogiveData.length} records</strong>
              </div>
            </div>

            {(() => {
              if (ogiveData.length < 2) {
                return (
                  <div className="py-20 text-center text-slate-500">
                    <p className="text-sm font-semibold">At least 2 expenditure entries needed to construct Ogive curve.</p>
                    <p className="text-xs text-slate-600 mt-1">
                      Add a few expenditures across different dates to trace the cumulative accumulation line.
                    </p>
                  </div>
                );
              }

              const svgW = 820;
              const svgH = 340;
              const paddingLeft = 50;
              const paddingBottom = 40;
              const plotW = svgW - paddingLeft - 30;
              const plotH = svgH - paddingBottom - 30;

              // Compute SVG points for Less-Than Ogive
              const pointsLess = ogiveData.map((d, i) => {
                const x = paddingLeft + (i / (ogiveData.length - 1)) * plotW;
                const y = 30 + plotH - (d.percentage / 100) * plotH;
                return { x, y, ...d };
              });

              // Compute SVG points for More-Than Ogive
              const pointsMore = ogiveData.map((d, i) => {
                const x = paddingLeft + (i / (ogiveData.length - 1)) * plotW;
                const y = 30 + plotH - (d.moreThanPercentage / 100) * plotH;
                return { x, y, ...d };
              });

              const pathLess = `M ${pointsLess.map(p => `${p.x},${p.y}`).join(' L ')}`;
              const pathMore = `M ${pointsMore.map(p => `${p.x},${p.y}`).join(' L ')}`;

              return (
                <div className="relative">
                  <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none">
                    {/* Horizontal Percentile Reference Grid Lines */}
                    {[25, 50, 75, 100].map(pct => {
                      const y = 30 + plotH - (pct / 100) * plotH;
                      return (
                        <g key={pct} opacity="0.3">
                          <line x1={paddingLeft} y1={y} x2={svgW - 20} y2={y} stroke="#64748b" strokeDasharray="3 3" />
                          <text x={paddingLeft - 8} y={y + 3} fill="#94a3b8" fontSize="10" textAnchor="end">
                            {pct}%
                          </text>
                        </g>
                      );
                    })}

                    {/* Median 50% Intersection Benchmark Line */}
                    <line
                      x1={paddingLeft}
                      y1={30 + plotH - 0.5 * plotH}
                      x2={svgW - 20}
                      y2={30 + plotH - 0.5 * plotH}
                      stroke="#a855f7"
                      strokeWidth="1"
                      strokeDasharray="4 2"
                      opacity="0.6"
                    />
                    <text
                      x={svgW - 24}
                      y={30 + plotH - 0.5 * plotH - 4}
                      fill="#c084fc"
                      fontSize="9"
                      textAnchor="end"
                      fontWeight="bold"
                    >
                      Median (50% Milestone)
                    </text>

                    {/* Less-Than Ogive Curve */}
                    <path
                      d={pathLess}
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* More-Than Ogive Curve */}
                    {ogiveType === 'both' && (
                      <path
                        d={pathMore}
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                      />
                    )}

                    {/* Interactive Points on Less-Than Curve */}
                    {pointsLess.map((p, idx) => (
                      <g
                        key={p.id}
                        onMouseEnter={() => setOgiveScrubIndex(idx)}
                        onMouseLeave={() => setOgiveScrubIndex(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={ogiveScrubIndex === idx ? '6' : '3.5'}
                          fill={ogiveScrubIndex === idx ? '#38bdf8' : '#a855f7'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Scrubber Tooltip */}
                  {ogiveScrubIndex !== null && pointsLess[ogiveScrubIndex] && (
                    <div className="absolute top-2 left-16 bg-slate-800/95 border border-purple-500/50 backdrop-blur-md p-3 rounded-2xl shadow-xl text-xs space-y-1 z-20 min-w-[220px]">
                      <div className="text-[10px] text-purple-300 font-mono">
                        Date: {pointsLess[ogiveScrubIndex].date}
                      </div>
                      <div className="font-bold text-white text-sm">
                        {pointsLess[ogiveScrubIndex].description}
                      </div>
                      <div className="pt-1 flex justify-between text-slate-300">
                        <span>Transaction:</span>
                        <strong className="text-rose-400 font-mono">
                          ৳ {pointsLess[ogiveScrubIndex].amount.toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Cumulative Outflow:</span>
                        <strong className="text-purple-300 font-mono">
                          ৳ {pointsLess[ogiveScrubIndex].cumulativeAmount.toLocaleString()} ({pointsLess[ogiveScrubIndex].percentage}%)
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. STATISTICAL DISTRIBUTIONS & BENCHMARKS VIEW */}
      {/* ========================================================= */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-800">
                Parametric Descriptive Statistics & Frequency Histogram Bins
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Evaluated on {statistics.count} active records
            </span>
          </div>

          {/* Histogram Bins & Frequency Chart */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Expenditure Amount Frequency Distribution (Bins)
              </h4>
              <span className="text-xs text-slate-500 font-semibold">
                Gini Concentration Index: <strong className="text-indigo-600 font-mono">{statistics.gini}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {histogramBins.map(bin => {
                const pct = statistics.count > 0 ? (bin.count / statistics.count) * 100 : 0;
                return (
                  <div key={bin.label} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      {bin.label}
                    </span>
                    <div className="w-full h-18 bg-slate-200/60 rounded-xl overflow-hidden flex flex-col justify-end p-1">
                      <div
                        className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-lg transition-all"
                        style={{ height: `${Math.max(8, pct)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-baseline text-xs font-mono">
                      <strong className="text-indigo-950 font-bold">{bin.count} items</strong>
                      <span className="text-slate-500 text-[10px]">{Math.round(pct)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comprehensive Parameter Matrix Table */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs overflow-x-auto">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              Parametric Summary Ledger
            </h4>
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Statistical Measure</th>
                  <th className="py-2.5 px-3">Calculated Value</th>
                  <th className="py-2.5 px-3">Household Meaning & Interpretation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Arithmetic Mean (μ)</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">৳ {statistics.mean.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Average spending per registered transaction.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Median (50th Percentile)</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">৳ {statistics.median.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">50% of your transactions are below this amount.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Standard Deviation (σ)</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-rose-700">৳ {statistics.stdDev.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Dispersion measure: how much individual expenses deviate from the mean.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Variance (σ²)</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">{statistics.variance.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Squared deviation across all recorded family purchases.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Coefficient of Variation (CV)</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">{statistics.cv}%</td>
                  <td className="py-2.5 px-3 text-slate-500">Relative volatility index of household budget.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Quartile 1 (Q1, 25%)</td>
                  <td className="py-2.5 px-3 font-mono text-purple-700">৳ {statistics.q1.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Lower quartile cutoff for small routine expenditures.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Quartile 3 (Q3, 75%)</td>
                  <td className="py-2.5 px-3 font-mono text-purple-700">৳ {statistics.q3.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Upper quartile cutoff separating regular vs larger bulk expenses.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Interquartile Range (IQR)</td>
                  <td className="py-2.5 px-3 font-mono text-purple-700">৳ {statistics.iqr.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-slate-500">Middle 50% core spending dispersion ($Q_3 - Q_1$).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">Gini Concentration Index</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700">{statistics.gini}</td>
                  <td className="py-2.5 px-3 text-slate-500">0 represents identical spend sizes; 1 represents high expense concentration.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
