import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Minus,
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit3,
  Sparkles,
  Zap,
  ArrowUpDown,
  Check,
  Search,
  Layers,
  Receipt,
  CreditCard,
  ShoppingCart,
  GraduationCap,
  HeartHandshake,
  Car,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  History,
  TrendingDown,
  AlertCircle,
  Square,
  CheckSquare,
  Coins,
  ArrowRight,
  Filter,
  FolderPlus,
  Home,
  Heart,
  Activity,
  ShoppingBag,
  Gift,
  Briefcase,
  Tag,
} from 'lucide-react';
import {
  Project,
  UpcomingExpenditureCategory,
  UpcomingPaymentHistory,
  Expenditure,
} from '../types/family';

interface ProjectSectionProps {
  projects: Project[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddExpenditure?: (exp: Expenditure) => void;
}

// ----------------------------------------------------
// THE 7 UPCOMING EXPENDITURE CATEGORIES
// ----------------------------------------------------
export const UPCOMING_EXP_CATEGORIES_META: Record<
  UpcomingExpenditureCategory,
  {
    id: UpcomingExpenditureCategory;
    title: string;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    clearedLabel: string;
    realizedCategory: string;
    theme: {
      cardBg: string;
      iconBg: string;
      progressBar: string;
      badge: string;
      btnBg: string;
      accentText: string;
      lightBg: string;
    };
    payChips: number[];
  }
> = {
  payable_debt: {
    id: 'payable_debt',
    title: '1. Payable Debt',
    label: 'Payable Debt',
    desc: 'Money borrowed from relatives, friends, lenders, or shopkeeper credit to pay off',
    icon: Receipt,
    clearedLabel: 'Debt Paid / Cleared',
    realizedCategory: 'Debt',
    theme: {
      cardBg: 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-200/80 hover:border-rose-400',
      iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
      progressBar: 'bg-rose-500',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
      accentText: 'text-rose-800',
      lightBg: 'bg-rose-50',
    },
    payChips: [500, 1000, 2000, 5000],
  },
  payment: {
    id: 'payment',
    title: '2. Payment',
    label: 'Upcoming Payments',
    desc: 'House rent, electricity, internet, gas bills, vendor fees, credit installments',
    icon: CreditCard,
    clearedLabel: 'Payment Cleared',
    realizedCategory: 'Payment',
    theme: {
      cardBg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-200/80 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      progressBar: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      accentText: 'text-blue-800',
      lightBg: 'bg-blue-50',
    },
    payChips: [1000, 2000, 5000, 10000],
  },
  grocery: {
    id: 'grocery',
    title: '3. Grocery',
    label: 'Upcoming Grocery',
    desc: 'Planned monthly bazaar, rice sacks, cooking oil, spices & household bulk food supply',
    icon: ShoppingCart,
    clearedLabel: 'Grocery Covered',
    realizedCategory: 'Grocery',
    theme: {
      cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/80 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      progressBar: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      accentText: 'text-emerald-800',
      lightBg: 'bg-emerald-50',
    },
    payChips: [500, 1000, 2000, 3000],
  },
  mega_project: {
    id: 'mega_project',
    title: '4. Mega Project',
    label: 'Mega Projects',
    desc: 'Capital investments: home renovation, computer setup, land acquisition, wedding, appliances',
    icon: Sparkles,
    clearedLabel: 'Project Completed',
    realizedCategory: 'Other',
    theme: {
      cardBg: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-200/80 hover:border-purple-400',
      iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
      progressBar: 'bg-purple-500',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
      accentText: 'text-purple-800',
      lightBg: 'bg-purple-50',
    },
    payChips: [5000, 10000, 20000, 50000],
  },
  father_giving: {
    id: 'father_giving',
    title: '5. Father Giving',
    label: 'Father Giving',
    desc: 'Committed monthly pocket allowance, medications, clothing, and festive gifts for parents',
    icon: HeartHandshake,
    clearedLabel: 'Given to Father',
    realizedCategory: 'Father Giving',
    theme: {
      cardBg: 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-200/80 hover:border-indigo-400',
      iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      progressBar: 'bg-indigo-500',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      accentText: 'text-indigo-800',
      lightBg: 'bg-indigo-50',
    },
    payChips: [1000, 2000, 5000, 10000],
  },
  education: {
    id: 'education',
    title: '6. Education',
    label: 'Upcoming Education',
    desc: 'Upcoming tuition fees, college admission, exam registrations, coaching batches & books',
    icon: GraduationCap,
    clearedLabel: 'Education Fee Cleared',
    realizedCategory: 'Education',
    theme: {
      cardBg: 'bg-teal-500/5 hover:bg-teal-500/10 border-teal-200/80 hover:border-teal-400',
      iconBg: 'bg-teal-100 text-teal-700 border-teal-200',
      progressBar: 'bg-teal-500',
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      btnBg: 'bg-teal-600 hover:bg-teal-700 text-white',
      accentText: 'text-teal-800',
      lightBg: 'bg-teal-50',
    },
    payChips: [1000, 2000, 3000, 5000],
  },
  transportation: {
    id: 'transportation',
    title: '7. Transportation',
    label: 'Upcoming Transportation',
    desc: 'Future travel tickets (train, bus, air), vehicle maintenance, fuel & monthly commute budget',
    icon: Car,
    clearedLabel: 'Travel / Fare Cleared',
    realizedCategory: 'Transportation',
    theme: {
      cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-200/80 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      progressBar: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      accentText: 'text-amber-800',
      lightBg: 'bg-amber-50',
    },
    payChips: [500, 1000, 2000, 5000],
  },
};

const CATEGORY_KEYS: UpcomingExpenditureCategory[] = [
  'payable_debt',
  'payment',
  'grocery',
  'mega_project',
  'father_giving',
  'education',
  'transportation',
];

export interface CustomUpcomingCategory {
  id: string;
  name: string;
  desc: string;
  iconName: string;
  themeColor: string;
  payChips: number[];
}

export const getCustomThemeClasses = (color: string) => {
  switch (color) {
    case 'emerald':
      return {
        cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/80 hover:border-emerald-400',
        iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        progressBar: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        accentText: 'text-emerald-800',
        lightBg: 'bg-emerald-50',
      };
    case 'rose':
      return {
        cardBg: 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-200/80 hover:border-rose-400',
        iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
        progressBar: 'bg-rose-500',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
        accentText: 'text-rose-800',
        lightBg: 'bg-rose-50',
      };
    case 'amber':
      return {
        cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-200/80 hover:border-amber-400',
        iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
        progressBar: 'bg-amber-500',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        accentText: 'text-amber-800',
        lightBg: 'bg-amber-50',
      };
    case 'purple':
      return {
        cardBg: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-200/80 hover:border-purple-400',
        iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
        progressBar: 'bg-purple-500',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
        accentText: 'text-purple-800',
        lightBg: 'bg-purple-50',
      };
    case 'cyan':
      return {
        cardBg: 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-200/80 hover:border-cyan-400',
        iconBg: 'bg-cyan-100 text-cyan-700 border-cyan-200',
        progressBar: 'bg-cyan-500',
        badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
        btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white',
        accentText: 'text-cyan-800',
        lightBg: 'bg-cyan-50',
      };
    case 'blue':
      return {
        cardBg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-200/80 hover:border-blue-400',
        iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
        progressBar: 'bg-blue-500',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
        accentText: 'text-blue-800',
        lightBg: 'bg-blue-50',
      };
    default:
      return {
        cardBg: 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-200/80 hover:border-indigo-400',
        iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
        progressBar: 'bg-indigo-500',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
        accentText: 'text-indigo-800',
        lightBg: 'bg-indigo-50',
      };
  }
};

export const resolveCategoryIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Home': return Home;
    case 'Activity': return Activity;
    case 'Heart': return Heart;
    case 'ShoppingBag': return ShoppingBag;
    case 'Gift': return Gift;
    case 'Briefcase': return Briefcase;
    case 'Coins': return Coins;
    case 'Sparkles': return Sparkles;
    case 'Receipt': return Receipt;
    default: return Tag;
  }
};

export const getUpcomingCategoryMeta = (
  cat: string,
  customCats: CustomUpcomingCategory[] = []
) => {
  if (cat in UPCOMING_EXP_CATEGORIES_META) {
    return {
      ...UPCOMING_EXP_CATEGORIES_META[cat as UpcomingExpenditureCategory],
      isCustom: false,
    };
  }
  const custom = customCats.find(c => c.id === cat || c.name.toLowerCase() === cat.toLowerCase());
  if (custom) {
    return {
      id: custom.id,
      title: custom.name,
      label: custom.name,
      desc: custom.desc || 'Custom upcoming expenditure category',
      icon: resolveCategoryIcon(custom.iconName),
      clearedLabel: 'Cleared in Full',
      realizedCategory: custom.name,
      theme: getCustomThemeClasses(custom.themeColor),
      payChips: custom.payChips || [500, 1000, 2000, 5000],
      isCustom: true,
    };
  }
  return {
    id: cat,
    title: cat,
    label: cat,
    desc: 'Upcoming expenditure commitment',
    icon: Tag,
    clearedLabel: 'Cleared in Full',
    realizedCategory: cat,
    theme: getCustomThemeClasses('indigo'),
    payChips: [500, 1000, 2000, 5000],
    isCustom: false,
  };
};

type HorizonFilter = 'all' | 'this_month' | 'next_month' | 'later' | 'undated' | string;
type StatusFilter = 'all' | 'pending' | 'completed';
type SortField = 'date' | 'amount' | 'initial' | 'title' | 'category';

// Helper: Real-time countdown timer calculation
function calculateTimeLeft(targetStr: string) {
  if (!targetStr) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: false };
  }
  const targetIso = targetStr.includes('T') ? targetStr : `${targetStr}T23:59:59`;
  const targetTime = new Date(targetIso).getTime();
  const nowTime = Date.now();
  const diff = targetTime - nowTime;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isPast: false };
}

// Sub-component: Live Countdown Timer for Mega Projects
const MegaProjectTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPast) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Deadline Overdue</span>
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-mono font-bold shadow-xs">
      <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span>{timeLeft.days}d</span>
      <span className="text-slate-500">:</span>
      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
      <span className="text-slate-500">:</span>
      <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
      <span className="text-slate-500">:</span>
      <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
    </div>
  );
};

export const ProjectSection: React.FC<ProjectSectionProps> = ({
  projects,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddExpenditure,
}) => {
  // Current date reference in local timezone
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  const currentMonthStr = `${todayYear}-${todayMonth}`;
  const currentMonthDate = new Date(todayYear, now.getMonth(), 1);
  const currentMonthName = currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const nextMonthDate = new Date(todayYear, now.getMonth() + 1, 1);
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthName = nextMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Rolling 24 month options (November, December, January, or further)
  const upcomingMonthOptions = useMemo(() => {
    const list: { key: string; label: string; shortLabel: string; isCurrent: boolean; isNext: boolean }[] = [];
    const currentM = `${todayYear}-${todayMonth}`;
    for (let i = 0; i < 24; i++) {
      const d = new Date(todayYear, now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const isCurrent = key === currentM;
      const isNext = key === nextMonthStr;
      let label = monthName;
      if (isCurrent) label += ' (This Month)';
      else if (isNext) label += ' (Next Month)';

      list.push({ key, label, shortLabel, isCurrent, isNext });
    }
    return list;
  }, [todayYear, todayMonth, now, nextMonthStr]);

  // Tab views
  const [activeTab, setActiveTab] = useState<'category_ledger' | 'itemized'>('category_ledger');
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Custom Categories state (persisted in localStorage)
  const [customCategories, setCustomCategories] = useState<CustomUpcomingCategory[]>(() => {
    try {
      const saved = localStorage.getItem('family_diary_custom_upcoming_categories_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading custom upcoming categories:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('family_diary_custom_upcoming_categories_v1', JSON.stringify(customCategories));
    } catch (e) {
      console.warn('Error saving custom upcoming categories:', e);
    }
  }, [customCategories]);

  // Modal: Create New Category
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Tag');
  const [newCatColor, setNewCatColor] = useState('indigo');

  // Modal: Add / Edit Commitment
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [formCategory, setFormCategory] = useState<string>('payable_debt');
  const [formTitle, setFormTitle] = useState('');
  const [formInitialAmount, setFormInitialAmount] = useState('');
  const [formIsUndated, setFormIsUndated] = useState(false);
  const [formExpectedDate, setFormExpectedDate] = useState(todayStr);
  const [formHorizon, setFormHorizon] = useState<'this_month' | 'next_month' | 'later' | string>('this_month');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formMilestonesStr, setFormMilestonesStr] = useState('');

  // Modal: Pay Down / Decrease Amount Modal
  const [paydownItem, setPaydownItem] = useState<Project | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payDate, setPayDate] = useState(todayStr);
  const [payNote, setPayNote] = useState('');
  const [syncToRealizedExpenditure, setSyncToRealizedExpenditure] = useState(true);

  // Modal: Payment History View
  const [historyItem, setHistoryItem] = useState<Project | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------------------
  // NORMALIZE ITEMS: Support backwards compatibility & decreasing math
  // -------------------------------------------------------------------------
  const normalizedItems = useMemo(() => {
    return projects.map((p): Project => {
      const cat = (p.category || 'mega_project') as UpcomingExpenditureCategory;
      const initial = Number(p.initialAmount ?? p.expectedAmount ?? 0);
      const paid = Number(p.paidAmount ?? 0);
      const remaining = Number(p.amount ?? Math.max(0, initial - paid));
      const isUndated = Boolean(p.isUndated || !p.expectedDate);
      const isCompleted = p.status === 'completed' || remaining === 0;

      return {
        ...p,
        category: cat,
        initialAmount: initial,
        paidAmount: paid,
        amount: remaining,
        expectedAmount: remaining,
        isUndated,
        status: isCompleted ? 'completed' : 'pending',
        targetHorizon: p.targetHorizon || (isUndated ? 'later' : 'this_month'),
        targetMonth: p.targetMonth || (p.expectedDate ? p.expectedDate.slice(0, 7) : currentMonthStr),
        paymentHistory: Array.isArray(p.paymentHistory) ? p.paymentHistory : [],
      };
    });
  }, [projects, currentMonthStr]);

  // Overall Statistics
  const totalRemaining = useMemo(() => {
    return normalizedItems
      .filter(i => i.status !== 'completed')
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [normalizedItems]);

  const totalPaid = useMemo(() => {
    return normalizedItems.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
  }, [normalizedItems]);

  const totalInitial = useMemo(() => {
    return normalizedItems.reduce((sum, i) => sum + (i.initialAmount || 0), 0);
  }, [normalizedItems]);

  const overallPercentPaid = totalInitial > 0 ? Math.round((totalPaid / totalInitial) * 100) : 0;

  // Horizon Breakdown
  const thisMonthRemaining = useMemo(() => {
    return normalizedItems
      .filter(i => i.status !== 'completed' && !i.isUndated && i.targetMonth === currentMonthStr)
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [normalizedItems, currentMonthStr]);

  const nextMonthRemaining = useMemo(() => {
    return normalizedItems
      .filter(i => i.status !== 'completed' && !i.isUndated && i.targetMonth === nextMonthStr)
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [normalizedItems, nextMonthStr]);

  const undatedRemaining = useMemo(() => {
    return normalizedItems
      .filter(i => i.status !== 'completed' && i.isUndated)
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [normalizedItems]);

  const laterRemaining = useMemo(() => {
    return normalizedItems
      .filter(i => i.status !== 'completed' && !i.isUndated && i.targetMonth !== currentMonthStr && i.targetMonth !== nextMonthStr)
      .reduce((sum, i) => sum + (i.amount || 0), 0);
  }, [normalizedItems, currentMonthStr, nextMonthStr]);

  // Unified list of all category keys (standard 7 + custom categories)
  const allCategoryKeys = useMemo(() => {
    const list: string[] = [...CATEGORY_KEYS];
    customCategories.forEach(c => {
      if (!list.includes(c.id)) list.push(c.id);
    });
    normalizedItems.forEach(p => {
      if (p.category && !list.includes(p.category)) {
        list.push(p.category);
      }
    });
    return list;
  }, [customCategories, normalizedItems]);

  // Steppers and month label for prominent month selection
  const handlePrevHorizonMonth = () => {
    let currentRef: Date;
    if (horizonFilter.startsWith('20')) {
      const [y, m] = horizonFilter.split('-').map(Number);
      currentRef = new Date(y, m - 1, 1);
    } else if (horizonFilter === 'next_month') {
      currentRef = nextMonthDate;
    } else {
      currentRef = currentMonthDate;
    }
    const prev = new Date(currentRef.getFullYear(), currentRef.getMonth() - 1, 1);
    const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
    setHorizonFilter(prevKey);
  };

  const handleNextHorizonMonth = () => {
    let currentRef: Date;
    if (horizonFilter.startsWith('20')) {
      const [y, m] = horizonFilter.split('-').map(Number);
      currentRef = new Date(y, m - 1, 1);
    } else if (horizonFilter === 'next_month') {
      currentRef = nextMonthDate;
    } else {
      currentRef = currentMonthDate;
    }
    const next = new Date(currentRef.getFullYear(), currentRef.getMonth() + 1, 1);
    const nextKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    setHorizonFilter(nextKey);
  };

  const activeHorizonLabel = useMemo(() => {
    if (horizonFilter === 'all') return 'All Times';
    if (horizonFilter === 'this_month') return `This Month (${currentMonthName})`;
    if (horizonFilter === 'next_month') return `Next Month (${nextMonthName})`;
    if (horizonFilter === 'later') return 'Later / Future';
    if (horizonFilter === 'undated') return '⚡ Skip Date / Open Horizon';
    const opt = upcomingMonthOptions.find(o => o.key === horizonFilter);
    if (opt) return opt.label;
    return horizonFilter;
  }, [horizonFilter, currentMonthName, nextMonthName, upcomingMonthOptions]);

  // Custom Category creation and deletion handlers
  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showToast('Please enter a category name');
      return;
    }
    const id = `cat_${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;
    const newCat: CustomUpcomingCategory = {
      id,
      name: trimmed,
      desc: newCatDesc.trim() || 'Custom upcoming commitment category',
      iconName: newCatIcon || 'Tag',
      themeColor: newCatColor || 'indigo',
      payChips: [1000, 2000, 5000, 10000],
    };
    setCustomCategories(prev => [...prev, newCat]);
    setIsCategoryModalOpen(false);
    setNewCatName('');
    setNewCatDesc('');
    showToast(`Created category "${trimmed}"!`);
  };

  const handleDeleteCustomCategory = (catId: string) => {
    const meta = getUpcomingCategoryMeta(catId, customCategories);
    if (confirm(`Remove custom category "${meta.label}"? Existing commitments will retain their values.`)) {
      setCustomCategories(prev => prev.filter(c => c.id !== catId));
      showToast(`Removed custom category "${meta.label}"`);
    }
  };

  // Category statistics for Category Quick Ledger (filtered by active horizon!)
  const categoryStats = useMemo(() => {
    return allCategoryKeys.map(cat => {
      const meta = getUpcomingCategoryMeta(cat, customCategories);

      // Filter items for this category based on active horizonFilter!
      const catItems = normalizedItems.filter(i => {
        if (i.category !== cat) return false;

        // Apply active horizon filter so Category Ledger reacts directly to month selection
        if (horizonFilter === 'this_month') {
          return !i.isUndated && i.targetMonth === currentMonthStr;
        } else if (horizonFilter === 'next_month') {
          return !i.isUndated && i.targetMonth === nextMonthStr;
        } else if (horizonFilter === 'later') {
          return !i.isUndated && i.targetMonth !== currentMonthStr && i.targetMonth !== nextMonthStr;
        } else if (horizonFilter === 'undated') {
          return Boolean(i.isUndated);
        } else if (horizonFilter !== 'all') {
          const itemM =
            i.targetMonth ||
            (i.expectedDate ? i.expectedDate.slice(0, 7) : '') ||
            (i.targetHorizon && i.targetHorizon.startsWith('20') ? i.targetHorizon : '');
          return itemM === horizonFilter;
        }
        return true;
      });

      const pendingItems = catItems.filter(i => i.status !== 'completed');
      const catRemaining = pendingItems.reduce((sum, i) => sum + (i.amount || 0), 0);
      const catPaid = catItems.reduce((sum, i) => sum + (i.paidAmount || 0), 0);
      const catInitial = catItems.reduce((sum, i) => sum + (i.initialAmount || 0), 0);
      const percentPaid = catInitial > 0 ? Math.round((catPaid / catInitial) * 100) : 0;

      return {
        category: cat,
        meta,
        catItems,
        pendingItems,
        catRemaining,
        catPaid,
        catInitial,
        percentPaid,
        isCustom: meta.isCustom,
      };
    });
  }, [allCategoryKeys, customCategories, normalizedItems, horizonFilter, currentMonthStr, nextMonthStr]);

  // Filtered Items for Itemized Table
  const filteredItems = useMemo(() => {
    return normalizedItems
      .filter(item => {
        // Category filter
        if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;

        // Status filter
        if (statusFilter === 'pending' && item.status === 'completed') return false;
        if (statusFilter === 'completed' && item.status !== 'completed') return false;

        // Horizon filter
        if (horizonFilter === 'this_month') {
          if (item.isUndated || item.targetMonth !== currentMonthStr) return false;
        } else if (horizonFilter === 'next_month') {
          if (item.isUndated || item.targetMonth !== nextMonthStr) return false;
        } else if (horizonFilter === 'later') {
          if (item.isUndated || item.targetMonth === currentMonthStr || item.targetMonth === nextMonthStr) return false;
        } else if (horizonFilter === 'undated') {
          if (!item.isUndated) return false;
        } else if (horizonFilter !== 'all') {
          // Specific month key (e.g. '2026-11', '2026-12', '2027-01')
          const itemMonth =
            item.targetMonth ||
            (item.expectedDate ? item.expectedDate.slice(0, 7) : '') ||
            (item.targetHorizon && item.targetHorizon.startsWith('20') ? item.targetHorizon : '');
          if (itemMonth !== horizonFilter) return false;
        }

        // Search
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.amount?.toString().includes(q) ||
          item.initialAmount?.toString().includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'amount') {
          cmp = (a.amount || 0) - (b.amount || 0);
        } else if (sortField === 'initial') {
          cmp = (a.initialAmount || 0) - (b.initialAmount || 0);
        } else if (sortField === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else if (sortField === 'category') {
          cmp = (a.category || '').localeCompare(b.category || '');
        } else {
          // Date sort with undated at end
          if (a.isUndated && !b.isUndated) return 1;
          if (!a.isUndated && b.isUndated) return -1;
          cmp = (a.expectedDate || '').localeCompare(b.expectedDate || '');
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
  }, [
    normalizedItems,
    selectedCategoryFilter,
    statusFilter,
    horizonFilter,
    currentMonthStr,
    nextMonthStr,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  // -------------------------------------------------------------------------
  // HANDLERS: PAYDOWN / DECREASE AMOUNT (CORE REQUIREMENT)
  // -------------------------------------------------------------------------
  const openPaydownModal = (item: Project, prefillAmount?: number) => {
    setPaydownItem(item);
    setPayAmountStr(prefillAmount ? String(prefillAmount) : '');
    setPayDate(todayStr);
    setPayNote('');
    setSyncToRealizedExpenditure(true);
  };

  const handleConfirmPaydown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paydownItem) return;

    const payAmt = parseFloat(payAmountStr);
    if (isNaN(payAmt) || payAmt <= 0) {
      showToast('Please enter a valid payment amount');
      return;
    }

    const currentPaid = Number(paydownItem.paidAmount || 0);
    const currentInitial = Number(paydownItem.initialAmount || paydownItem.expectedAmount || paydownItem.amount || 0);
    const newPaid = currentPaid + payAmt;
    const newRemaining = Math.max(0, currentInitial - newPaid);
    const isNowCompleted = newRemaining === 0;

    const newHistoryEntry: UpcomingPaymentHistory = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      amount: payAmt,
      date: payDate || todayStr,
      note: payNote.trim() || 'Paid installment',
      createdAt: new Date().toISOString(),
    };

    const updatedItem: Project = {
      ...paydownItem,
      paidAmount: newPaid,
      amount: newRemaining,
      expectedAmount: newRemaining,
      status: isNowCompleted ? 'completed' : 'pending',
      targetDeadline: paydownItem.targetDeadline || '',
      expectedDate: paydownItem.expectedDate || '',
      completedAt: isNowCompleted ? new Date().toISOString() : (paydownItem.completedAt || ''),
      paymentHistory: [newHistoryEntry, ...(paydownItem.paymentHistory || [])],
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updatedItem);

    // Optionally sync payment into Realized Expenditure
    if (syncToRealizedExpenditure && onAddExpenditure) {
      const meta = UPCOMING_EXP_CATEGORIES_META[paydownItem.category || 'payable_debt'];
      const newExp: Expenditure = {
        id: `exp_from_up_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: paydownItem.userId || 'guest',
        dates: [payDate || todayStr],
        primaryDate: payDate || todayStr,
        month: (payDate || todayStr).slice(0, 7),
        amount: payAmt,
        description: `${paydownItem.title}: Paid ৳${payAmt.toLocaleString()} (${newRemaining > 0 ? `৳${newRemaining.toLocaleString()} remaining` : 'Cleared in full!'}) • ${payNote.trim() || ''}`,
        category: meta.realizedCategory,
        createdAt: new Date().toISOString(),
      };
      onAddExpenditure(newExp);
    }

    showToast(
      `Paid ৳${payAmt.toLocaleString()}! Remaining due is now ৳${newRemaining.toLocaleString()}${
        isNowCompleted ? ' (Cleared in full! 🎉)' : ''
      }`
    );
    setPaydownItem(null);
  };

  // 1-Click Complete / Tick Checkbox
  const handleToggleComplete = (item: Project) => {
    if (item.status === 'completed') {
      // Reopen item
      const initial = item.initialAmount || item.expectedAmount || 0;
      const paid = item.paidAmount || 0;
      const remaining = Math.max(0, initial - paid) || initial;
      const updated: Project = {
        ...item,
        status: 'pending',
        amount: remaining,
        expectedAmount: remaining,
        targetDeadline: item.targetDeadline || '',
        expectedDate: item.expectedDate || '',
        completedAt: '',
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updated);
      showToast(`Reopened "${item.title}"`);
    } else {
      // Mark as cleared in full
      const remainingBefore = item.amount || 0;
      const currentPaid = item.paidAmount || 0;
      const totalInitial = item.initialAmount || currentPaid + remainingBefore;

      const completionEntry: UpcomingPaymentHistory = {
        id: `pay_${Date.now()}`,
        amount: remainingBefore,
        date: todayStr,
        note: 'Marked as Cleared / Paid in Full',
        createdAt: new Date().toISOString(),
      };

      const updated: Project = {
        ...item,
        status: 'completed',
        amount: 0,
        expectedAmount: 0,
        paidAmount: totalInitial,
        targetDeadline: item.targetDeadline || '',
        expectedDate: item.expectedDate || '',
        completedAt: new Date().toISOString(),
        paymentHistory: remainingBefore > 0 ? [completionEntry, ...(item.paymentHistory || [])] : (item.paymentHistory || []),
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updated);
      showToast(`🎉 "${item.title}" cleared in full!`);
    }
  };

  // Direct Paydown Chip on Category Card
  const handleDirectCategoryPaydown = (cat: string, payAmount: number) => {
    const meta = getUpcomingCategoryMeta(cat, customCategories);
    const catItems = normalizedItems.filter(i => i.category === cat && i.status !== 'completed');
    if (catItems.length === 0) {
      showToast(`No pending items in ${meta.label} to pay down.`);
      return;
    }

    // If only 1 pending item, prefill and open paydown modal
    if (catItems.length === 1) {
      openPaydownModal(catItems[0], payAmount);
    } else {
      // Multiple items: open paydown modal on highest amount item
      const highest = [...catItems].sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
      openPaydownModal(highest, payAmount);
    }
  };

  // -------------------------------------------------------------------------
  // HANDLERS: ADD / EDIT UPCOMING EXPENDITURE
  // -------------------------------------------------------------------------
  const openCreateModal = (preselectedCat?: string) => {
    setEditingItem(null);
    setFormCategory(preselectedCat || 'payable_debt');
    setFormTitle('');
    setFormInitialAmount('');
    setFormIsUndated(false);
    setFormExpectedDate(todayStr);
    setFormHorizon('this_month');
    setFormDescription('');
    setFormDeadline('');
    setFormMilestonesStr('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (item: Project) => {
    setEditingItem(item);
    setFormCategory(item.category || 'mega_project');
    setFormTitle(item.title);
    setFormInitialAmount(String(item.initialAmount ?? item.expectedAmount ?? item.amount ?? ''));
    setFormIsUndated(Boolean(item.isUndated));
    setFormExpectedDate(item.expectedDate || todayStr);
    setFormHorizon(item.targetHorizon || (item.targetMonth && item.targetMonth.startsWith('20') ? item.targetMonth : 'this_month'));
    setFormDescription(item.description);
    setFormDeadline(item.targetDeadline || item.expectedDate || '');
    setFormMilestonesStr(item.milestones?.map(m => m.title).join('\n') || '');
    setIsFormModalOpen(true);
  };

  const handleSaveFormModal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmt = parseFloat(formInitialAmount);
    if (!formTitle.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter a valid title and commitment amount');
      return;
    }

    const expectedDate = formIsUndated ? '' : formExpectedDate;
    const targetMonth = formIsUndated
      ? (formHorizon.startsWith('20')
          ? formHorizon
          : formHorizon === 'this_month'
          ? currentMonthStr
          : formHorizon === 'next_month'
          ? nextMonthStr
          : 'later')
      : expectedDate.slice(0, 7) || (formHorizon.startsWith('20') ? formHorizon : currentMonthStr);

    const milestones = formMilestonesStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)
      .map(title => ({
        id: `ms_${Math.random().toString(36).substring(2, 6)}`,
        title,
        completed: false,
      }));

    if (editingItem) {
      const currentPaid = Number(editingItem.paidAmount || 0);
      const newRemaining = Math.max(0, parsedAmt - currentPaid);

      const updated: Project = {
        ...editingItem,
        category: formCategory,
        title: formTitle.trim(),
        initialAmount: parsedAmt,
        amount: newRemaining,
        expectedAmount: newRemaining,
        expectedDate: expectedDate || '',
        isUndated: formIsUndated,
        targetHorizon: formHorizon,
        targetMonth: targetMonth || '',
        description: formDescription.trim(),
        targetDeadline: (formCategory === 'mega_project' && (formDeadline || expectedDate)) ? (formDeadline || expectedDate) : '',
        milestones: milestones.length > 0 ? milestones : (editingItem.milestones || []),
        completedAt: editingItem.completedAt || '',
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updated);
      showToast(`Updated "${formTitle.trim()}"`);
    } else {
      const newProj: Project = {
        id: `up_exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: 'guest',
        category: formCategory,
        title: formTitle.trim(),
        initialAmount: parsedAmt,
        amount: parsedAmt, // starts at full liability
        paidAmount: 0,
        expectedAmount: parsedAmt,
        expectedDate: expectedDate || '',
        isUndated: formIsUndated,
        targetHorizon: formHorizon,
        targetMonth: targetMonth || '',
        description: formDescription.trim(),
        status: 'pending',
        targetDeadline: (formCategory === 'mega_project' && (formDeadline || expectedDate)) ? (formDeadline || expectedDate) : '',
        milestones: milestones.length > 0 ? milestones : [],
        paymentHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onAddProject(newProj);
      showToast(`Added upcoming commitment "${formTitle.trim()}" (৳${parsedAmt.toLocaleString()})`);
    }

    setIsFormModalOpen(false);
  };

  const handleDeleteItem = (item: Project) => {
    onDeleteProject(item.id);
    showToast(`✓ Deleted "${item.title}"`);
    if (editingItem && editingItem.id === item.id) {
      setIsFormModalOpen(false);
      setEditingItem(null);
    }
    if (paydownItem && paydownItem.id === item.id) {
      setPaydownItem(null);
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected upcoming expenditures?`)) return;

    selectedIds.forEach(id => onDeleteProject(id));
    showToast(`Deleted ${selectedIds.size} items`);
    setSelectedIds(new Set());
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Upcoming Expenditure
            </h2>
            <span className="text-[11px] font-extrabold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Future Liabilities & Paydown
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Commitments to expend in future • Decrease remaining balance as you make payments
          </p>
        </div>

        {/* Action Controls & Sub-Tab Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sub-Tabs: Category Quick Ledger vs Itemized */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
            <button
              onClick={() => setActiveTab('category_ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'category_ledger'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category Quick Ledger</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  activeTab === 'category_ledger' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                }`}
              >
                7 Sections
              </span>
            </button>
            <button
              onClick={() => setActiveTab('itemized')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'itemized'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Itemized Commitments</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                {normalizedItems.length}
              </span>
            </button>
          </div>

          {/* + Create Category Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-bold shadow-2xs active:scale-95 transition-all"
            title="Create a new custom upcoming expenditure category"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>+ Create Category</span>
          </button>

          {/* + Add Commitment Button */}
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs shadow-indigo-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Commitment</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* PROMINENT MONTH & TIMING HORIZON SELECTION BAR                   */}
      {/* (Allows user to select This Month, Next Month, Later, or any     */}
      {/* specific month name e.g. November, December, January or further) */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Expenditure Horizon:
                </span>
                <span className="text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                  {activeHorizonLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Filter commitments for next month or even further into future months
              </p>
            </div>
          </div>

          {/* Steppers & Month Name Select Dropdown */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 rounded-xl p-0.5 border border-slate-200">
              <button
                onClick={handlePrevHorizonMonth}
                className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <select
                  value={horizonFilter.startsWith('20') ? horizonFilter : ''}
                  onChange={e => {
                    if (e.target.value) setHorizonFilter(e.target.value);
                  }}
                  className="appearance-none pl-2 pr-6 py-1 bg-transparent text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden"
                >
                  <option value="">🗓️ Pick Month Name ▾</option>
                  {upcomingMonthOptions.map(m => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
              </div>
              <button
                onClick={handleNextHorizonMonth}
                className="p-1.5 hover:bg-white text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {horizonFilter !== 'all' && (
              <button
                onClick={() => setHorizonFilter('all')}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                ✕ Clear to All
              </button>
            )}
          </div>
        </div>

        {/* Quick Month Shortcut Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <button
            onClick={() => setHorizonFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
              horizonFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Times ({normalizedItems.filter(i => i.status !== 'completed').length})
          </button>
          <button
            onClick={() => setHorizonFilter('this_month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
              horizonFilter === 'this_month'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            This Month ({currentMonthName})
          </button>
          <button
            onClick={() => setHorizonFilter('next_month')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
              horizonFilter === 'next_month'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Next Month ({nextMonthName})
          </button>
          <button
            onClick={() => setHorizonFilter('later')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
              horizonFilter === 'later'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Later / Future
          </button>
          <button
            onClick={() => setHorizonFilter('undated')}
            className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
              horizonFilter === 'undated'
                ? 'bg-amber-500 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            ⚡ Skip Date (Tentative)
          </button>

          {/* Quick Month shortcuts (first 5 forward months) */}
          {upcomingMonthOptions.slice(0, 5).map(m => (
            <button
              key={m.key}
              onClick={() => setHorizonFilter(m.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                horizonFilter === m.key
                  ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {m.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Highlight Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Remaining Liability */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
              Total Remaining Upcoming Expenditure
            </span>
            <div className="text-3xl font-black tracking-tight mt-1 font-mono">
              ৳ {totalRemaining.toLocaleString()}
            </div>
            <div className="mt-2 text-xs text-indigo-200 flex items-center justify-between">
              <span>Paid so far: ৳{totalPaid.toLocaleString()}</span>
              <span className="font-bold text-emerald-300 font-mono">{overallPercentPaid}% Paid Off</span>
            </div>
          </div>
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Horizon Breakdown */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expenditure Timing Horizon
            </span>
            <div className="mt-2 space-y-1.5 text-xs font-semibold">
              <div className="flex items-center justify-between text-slate-700">
                <span>Due This Month ({currentMonthName}):</span>
                <span className="font-mono font-bold text-slate-900">৳{thisMonthRemaining.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Due Next Month ({nextMonthName}):</span>
                <span className="font-mono font-bold text-slate-900">৳{nextMonthRemaining.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-amber-700">
                <span>⚡ No Specific Date (Tentative):</span>
                <span className="font-mono font-bold">৳{undatedRemaining.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Flexible scheduling</span>
            <span className="text-indigo-600 font-bold">Decreasing Debt Tracking</span>
          </div>
        </div>

        {/* Mechanics & Quick Tip Banner */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Decrease / Paydown Mechanics
            </span>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              When you pay an amount (e.g. ৳2,000 on a ৳10,000 debt), the remaining amount automatically decreases to ৳8,000 and can be logged into your Realized Expenditure!
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tick when cleared
            </span>
            <button
              onClick={() => openCreateModal('mega_project')}
              className="text-indigo-600 hover:text-indigo-800 font-bold"
            >
              + Mega Project Timer
            </button>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* VIEW 1: CATEGORY QUICK LEDGER (THE 7 CATEGORIES)                  */}
      {/* ================================================================= */}
      {activeTab === 'category_ledger' && (
        <div className="space-y-6">
          {/* Quick Explanatory Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {allCategoryKeys.length} Categorised Upcoming Expenditures
                </h3>
                <p className="text-xs text-slate-500">
                  Standard categories & custom categories • Decrease liability as you pay
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsCategoryModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-all flex items-center gap-1"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Create Category</span>
              </button>
              <button
                onClick={() => openCreateModal('payable_debt')}
                className="px-3 py-1.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 text-xs font-bold transition-all"
              >
                + Add Debt
              </button>
              <button
                onClick={() => openCreateModal('mega_project')}
                className="px-3 py-1.5 rounded-xl border border-purple-300 bg-purple-50 text-purple-800 hover:bg-purple-100 text-xs font-bold transition-all"
              >
                + Add Mega Project
              </button>
            </div>
          </div>

          {/* THE CATEGORY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
            {categoryStats.map(stat => {
              const { category, meta, pendingItems, catRemaining, catPaid, catInitial, percentPaid } = stat;
              const Icon = meta.icon;
              const theme = meta.theme;
              const isExpanded = expandedCategory === category;

              return (
                <div
                  key={category}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${theme.cardBg}`}
                >
                  <div>
                    {/* Header: Icon + Title + Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs ${theme.iconBg}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                            {meta.title}
                          </h4>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {pendingItems.length} active {pendingItems.length === 1 ? 'due' : 'dues'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${theme.badge}`}>
                          {percentPaid}% Paid
                        </span>
                        {stat.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomCategory(category)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete this custom category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Amount Display: Remaining Liability */}
                    <div className="mt-2 mb-2">
                      <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                        ৳ {catRemaining.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                        <span>Paid: ৳{catPaid.toLocaleString()}</span>
                        <span>Total: ৳{catInitial.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Progress Bar (Paid Down Percentage) */}
                    <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${theme.progressBar}`}
                        style={{ width: `${Math.min(100, Math.max(0, percentPaid))}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-3">
                      {meta.desc}
                    </p>

                    {/* Direct Paydown / Decrease Chips (-৳500, -৳1k, etc.) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Quick Paydown / Decrease:
                      </span>
                      <div className="grid grid-cols-4 gap-1">
                        {meta.payChips.map(chip => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleDirectCategoryPaydown(category, chip)}
                            className="px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-800 shadow-2xs hover:scale-105 active:scale-95 transition-all text-center"
                            title={`Pay down ৳${chip.toLocaleString()} from ${meta.title}`}
                          >
                            -৳{chip >= 1000 ? `${chip / 1000}k` : chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                    <button
                      onClick={() => openCreateModal(category)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all ${theme.btnBg}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add to {meta.label}</span>
                    </button>

                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 flex items-center justify-between transition-colors"
                    >
                      <span>Entries ({stat.catItems.length})</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Expanded list of entries in this category */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2.5 max-h-80 overflow-y-auto">
                      {stat.catItems.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3 italic">
                          No commitments in this category.
                        </p>
                      ) : (
                        stat.catItems.map(item => {
                          const isCompleted = item.status === 'completed';

                          return (
                            <div
                              key={item.id}
                              className={`bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-2 hover:border-slate-300 transition-all ${
                                isCompleted ? 'bg-slate-50/60 opacity-60' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    {/* Tick / Complete Checkbox */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleComplete(item)}
                                      className={`p-0.5 rounded transition-colors ${
                                        isCompleted ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-500'
                                      }`}
                                      title={isCompleted ? 'Reopen commitment' : `Tick: ${meta.clearedLabel}`}
                                    >
                                      {isCompleted ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                    <span
                                      className={`font-bold text-slate-900 truncate ${
                                        isCompleted ? 'line-through text-slate-400' : ''
                                      }`}
                                    >
                                      {item.title}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6">
                                    {item.description || 'Upcoming expenditure item'}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <div className="font-black font-mono text-slate-900 text-sm">
                                    ৳{item.amount?.toLocaleString()}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Paid: ৳{(item.paidAmount || 0).toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              {/* Timing & Countdown Timer for Mega Project */}
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 flex-wrap gap-1">
                                <div>
                                  {item.isUndated ? (
                                    <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                      ⚡ No specific date
                                    </span>
                                  ) : (
                                    <span className="font-mono text-slate-500 text-[10px]">
                                      Target: {item.expectedDate}
                                    </span>
                                  )}
                                </div>

                                {/* Mega project timer */}
                                {category === 'mega_project' && item.expectedDate && !isCompleted && (
                                  <MegaProjectTimer targetDate={item.targetDeadline || item.expectedDate} />
                                )}
                              </div>

                              {/* Actions Bar */}
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {!isCompleted && (
                                    <button
                                      onClick={() => openPaydownModal(item)}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200 active:scale-95 transition-all cursor-pointer"
                                      title="Pay down / decrease remaining amount"
                                    >
                                      <Minus className="w-3 h-3" />
                                      <span>Decrease / Pay</span>
                                    </button>
                                  )}

                                  {/* Direct Delete Button - No need to complete or decrease */}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200 active:scale-95 transition-all shadow-2xs cursor-pointer"
                                    title="Delete this task / commitment directly"
                                  >
                                    <Trash2 className="w-3 h-3 text-rose-600" />
                                    <span>Delete</span>
                                  </button>

                                  {/* Payment History View Button */}
                                  {item.paymentHistory && item.paymentHistory.length > 0 && (
                                    <button
                                      onClick={() => setHistoryItem(item)}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold"
                                      title="View payment installments history"
                                    >
                                      <History className="w-3 h-3" />
                                      <span>({item.paymentHistory.length})</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded flex items-center gap-1 text-[11px]"
                                    title="Edit item"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* VIEW 2: ITEMIZED COMMITMENTS & DUE LIST                           */}
      {/* ================================================================= */}
      {activeTab === 'itemized' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search upcoming expenditures by title, category, description, amount..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                  <select
                    value={sortField}
                    onChange={e => setSortField(e.target.value as SortField)}
                    className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs"
                  >
                    <option value="date">Sort: Date</option>
                    <option value="amount">Sort: Remaining</option>
                    <option value="initial">Sort: Initial Amount</option>
                    <option value="title">Sort: Title</option>
                    <option value="category">Sort: Category</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="ml-1 p-1 text-slate-500 hover:text-slate-800"
                    title="Toggle Asc/Desc"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>

                {/* Batch Delete */}
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete ({selectedIds.size})</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter toolbar: Category + Horizon + Status */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategoryFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    selectedCategoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All {allCategoryKeys.length} Categories ({normalizedItems.length})
                </button>
                {allCategoryKeys.map(cat => {
                  const count = normalizedItems.filter(r => r.category === cat).length;
                  const meta = getUpcomingCategoryMeta(cat, customCategories);
                  const isSelected = selectedCategoryFilter === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? `${meta.theme.btnBg} shadow-2xs`
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      <span>{meta.label}</span>
                      <span className="text-[10px] font-mono opacity-80 font-normal">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Timing Horizon Filter */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-xs">
                  <button
                    onClick={() => setHorizonFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      horizonFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    All Times
                  </button>
                  <button
                    onClick={() => setHorizonFilter('this_month')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      horizonFilter === 'this_month' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => setHorizonFilter('next_month')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      horizonFilter === 'next_month' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Next Month
                  </button>
                  <button
                    onClick={() => setHorizonFilter('later')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      horizonFilter === 'later' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Later
                  </button>
                  <button
                    onClick={() => setHorizonFilter('undated')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      horizonFilter === 'undated' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ⚡ Skip Date
                  </button>
                </div>

                {/* Specific Month Name Select Dropdown (Nov, Dec, Jan, Feb, or further) */}
                <div className="relative">
                  <select
                    value={
                      horizonFilter !== 'all' &&
                      horizonFilter !== 'this_month' &&
                      horizonFilter !== 'next_month' &&
                      horizonFilter !== 'later' &&
                      horizonFilter !== 'undated'
                        ? horizonFilter
                        : ''
                    }
                    onChange={e => {
                      if (e.target.value) {
                        setHorizonFilter(e.target.value);
                      }
                    }}
                    className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      horizonFilter !== 'all' &&
                      horizonFilter !== 'this_month' &&
                      horizonFilter !== 'next_month' &&
                      horizonFilter !== 'later' &&
                      horizonFilter !== 'undated'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <option value="">🗓️ Select Month Name ▾</option>
                    {upcomingMonthOptions.map(m => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className={`w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${
                      horizonFilter !== 'all' &&
                      horizonFilter !== 'this_month' &&
                      horizonFilter !== 'next_month' &&
                      horizonFilter !== 'later' &&
                      horizonFilter !== 'undated'
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  />
                </div>
              </div>

              {/* Status Filter Toggle */}
              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-xs">
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    statusFilter === 'pending' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Due / Active
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    statusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cleared
                </button>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    statusFilter === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedIds.size === filteredItems.length) {
                          setSelectedIds(new Set());
                        } else {
                          setSelectedIds(new Set(filteredItems.map(r => r.id)));
                        }
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {selectedIds.size > 0 && selectedIds.size === filteredItems.length ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Tick</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title / Commitment</th>
                  <th className="py-3 px-4">Target Timing / Countdown</th>
                  <th className="py-3 px-4 text-right">Initial (৳)</th>
                  <th className="py-3 px-4 text-right">Paid (৳)</th>
                  <th className="py-3 px-4 text-right">Remaining Due (৳)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <p className="text-sm font-semibold">No upcoming expenditures match filter</p>
                      <p className="text-xs mt-1">
                        Click "+ Add Commitment" to track debt, payments, grocery, mega projects, etc.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const meta = getUpcomingCategoryMeta(item.category || 'payable_debt', customCategories);
                    const isSelected = selectedIds.has(item.id);
                    const isCompleted = item.status === 'completed';

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        } ${isCompleted ? 'opacity-60 bg-slate-50/40' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={e => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(item.id);
                              else next.delete(item.id);
                              setSelectedIds(next);
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(item)}
                            className={`p-1 rounded transition-colors ${
                              isCompleted ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'
                            }`}
                            title={isCompleted ? 'Reopen' : `Mark as ${meta.clearedLabel}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${meta.theme.badge}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div
                            className={`font-bold text-slate-900 ${
                              isCompleted ? 'line-through text-slate-400' : ''
                            }`}
                          >
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-slate-500 truncate max-w-xs">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.isUndated ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200">
                              ⚡ No specific date
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className="font-mono text-slate-600 block">{item.expectedDate}</span>
                              {item.category === 'mega_project' && !isCompleted && (
                                <MegaProjectTimer targetDate={item.targetDeadline || item.expectedDate} />
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-500">
                          ৳{(item.initialAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600 font-bold">
                          ৳{(item.paidAmount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          ৳{(item.amount || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isCompleted && (
                              <button
                                onClick={() => openPaydownModal(item)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold border border-indigo-200 transition-all cursor-pointer"
                                title="Pay down / decrease remaining amount"
                              >
                                <Minus className="w-3 h-3" />
                                <span>Decrease</span>
                              </button>
                            )}

                            {/* Direct Delete Button - No need to complete or decrease */}
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                              title="Delete this task / commitment directly"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Delete</span>
                            </button>

                            {item.paymentHistory && item.paymentHistory.length > 0 && (
                              <button
                                onClick={() => setHistoryItem(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg"
                                title="View payment history"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                              title="Edit item"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: ADD / EDIT UPCOMING COMMITMENT                           */}
      {/* ================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    getUpcomingCategoryMeta(formCategory, customCategories).theme.iconBg
                  }`}
                >
                  {React.createElement(getUpcomingCategoryMeta(formCategory, customCategories).icon, {
                    className: 'w-5 h-5',
                  })}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingItem ? 'Edit Upcoming Expenditure' : '+ Add Upcoming Expenditure'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Track commitments that will decrease as you make partial payments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormModal} className="mt-5 space-y-4">
              {/* Category Pills Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Select Category:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>+ New Category</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-0.5">
                  {allCategoryKeys.map(cat => {
                    const meta = getUpcomingCategoryMeta(cat, customCategories);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormCategory(cat)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all text-center border ${
                          formCategory === cat
                            ? `${meta.theme.btnBg} border-transparent shadow-xs`
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Commitment Title / Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={
                    formCategory === 'payable_debt'
                      ? 'e.g. Loan from Uncle Rafiq, Shopkeeper Credit...'
                      : formCategory === 'payment'
                      ? 'e.g. November House Rent, DESCO Electricity Bill...'
                      : formCategory === 'grocery'
                      ? 'e.g. Monthly Rice & Cooking Oil Ration...'
                      : formCategory === 'mega_project'
                      ? 'e.g. Home Living Room Renovation, New Workstation PC...'
                      : formCategory === 'father_giving'
                      ? 'e.g. Monthly Pocket Allowance for Father...'
                      : formCategory === 'education'
                      ? 'e.g. Semester Final Admission Fee...'
                      : 'e.g. Train Tickets for Annual Family Vacation...'
                  }
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Initial Amount Input */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Total Commitment Amount in Taka (৳): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    min={1}
                    required
                    placeholder="e.g. 10000"
                    value={formInitialAmount}
                    onChange={e => setFormInitialAmount(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-lg font-mono font-bold rounded-xl border border-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  This balance will decrease as you make partial payments (e.g. 10,000 → 8,000 → 0).
                </p>
              </div>

              {/* DATE & HORIZON OPTIONS (INCLUDING SKIP DATE) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="skip_date_toggle"
                    className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-2"
                  >
                    <input
                      id="skip_date_toggle"
                      type="checkbox"
                      checked={formIsUndated}
                      onChange={e => setFormIsUndated(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>⚡ Skip date / No specific date (Tentative)</span>
                  </label>
                  {formIsUndated && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Open Date
                    </span>
                  )}
                </div>

                {formIsUndated ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Expected Horizon:
                    </label>
                    <select
                      value={formHorizon}
                      onChange={e => setFormHorizon(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="this_month">This Month ({currentMonthName})</option>
                      <option value="next_month">Next Month ({nextMonthName})</option>
                      <option value="later">Even Later / Future</option>
                      <optgroup label="Select Specific Month Name">
                        {upcomingMonthOptions.map(m => (
                          <option key={m.key} value={m.key}>
                            {m.label}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Target Payment / Deadline Date: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required={!formIsUndated}
                      value={formExpectedDate}
                      onChange={e => setFormExpectedDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Mega Project Specific Countdown Details */}
              {formCategory === 'mega_project' && (
                <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Mega Project Timer & Milestones:</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Countdown Target Date & Time (Optional):
                    </label>
                    <input
                      type="datetime-local"
                      value={formDeadline}
                      onChange={e => setFormDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                    />
                    <p className="text-[11px] text-purple-700/80 mt-1">
                      Powers the live days : hours : minutes countdown timer!
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Milestones / Tasks (One per line):
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g.&#10;1. Buy raw materials&#10;2. Finish electrical wiring&#10;3. Final inspection"
                      value={formMilestonesStr}
                      onChange={e => setFormMilestonesStr(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Description Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Description / Context (Optional):
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Loan given by Uncle for hospital expenses, agreed to repay in 4 parts..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  {editingItem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(editingItem)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors shadow-2xs"
                      title="Delete this task / commitment completely"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Delete Commitment</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingItem ? 'Save Changes' : '+ Set Upcoming Commitment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: PAY DOWN / DECREASE AMOUNT MODAL (KEY FEATURE)           */}
      {/* ================================================================= */}
      {paydownItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Minus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Pay Down / Decrease Balance
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-[240px]">
                    {paydownItem.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPaydownItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPaydown} className="mt-5 space-y-4">
              {/* Current Status Box */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Current Remaining Due:
                  </span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    ৳{(paydownItem.amount || 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Original:
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    ৳{(paydownItem.initialAmount || paydownItem.amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Quick Paydown Preset Chips */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Amount Presets:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[500, 1000, 2000, 5000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPayAmountStr(String(amt))}
                      className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-700 font-mono font-bold text-xs transition-all active:scale-95 text-center"
                    >
                      -৳{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
                {/* Pay Full Remaining button */}
                <button
                  type="button"
                  onClick={() => setPayAmountStr(String(paydownItem.amount || 0))}
                  className="w-full mt-1.5 py-1 text-xs font-bold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  Pay Full Remaining (৳{(paydownItem.amount || 0).toLocaleString()})
                </button>
              </div>

              {/* Amount to Pay */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Amount to Pay / Decrease (৳): <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                    ৳
                  </span>
                  <input
                    type="number"
                    step="any"
                    min={1}
                    max={paydownItem.amount || undefined}
                    required
                    autoFocus
                    placeholder="e.g. 2000"
                    value={payAmountStr}
                    onChange={e => setPayAmountStr(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-lg font-mono font-bold rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                </div>

                {/* 1-Click Quick Amount Presets */}
                <div className="mt-2 pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Zap className="w-3 h-3 text-amber-500" />
                    Quick Preset Amounts:
                  </span>
                  <div className="grid grid-cols-5 gap-1">
                    {[50, 100, 200, 500, 1000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setPayAmountStr(Math.min(paydownItem.amount || amt, amt).toString())}
                        className="px-1.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-800 font-mono font-bold text-xs transition-all active:scale-95 text-center shadow-2xs"
                        title={`Select ৳${amt}`}
                      >
                        ৳{amt >= 1000 ? '1k' : amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Remaining Balance Preview */}
                {parseFloat(payAmountStr) > 0 && (
                  <p className="text-[11px] font-bold text-slate-600 mt-1 flex items-center justify-between">
                    <span>New Remaining Balance:</span>
                    <span className="font-mono text-rose-700">
                      ৳{Math.max(0, (paydownItem.amount || 0) - (parseFloat(payAmountStr) || 0)).toLocaleString()}
                    </span>
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Payment Date: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              {/* Note / Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Payment Note (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid via bKash / Bank / Cash in hand..."
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              {/* Auto-record to Realized Expenditure */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                  <input
                    type="checkbox"
                    checked={syncToRealizedExpenditure}
                    onChange={e => setSyncToRealizedExpenditure(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    Also record this payment in Realized Expenditure (
                    {UPCOMING_EXP_CATEGORIES_META[paydownItem.category || 'payable_debt'].realizedCategory})
                  </span>
                </label>
                <p className="text-[10px] text-emerald-700/80 mt-0.5 ml-6">
                  Saves entering it twice and keeps your monthly expenditure fully accurate!
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPaydownItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(paydownItem)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors shadow-2xs cursor-pointer"
                    title="Directly delete this task completely without decreasing or completing"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Delete Task</span>
                  </button>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Paydown</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: PAYMENT INSTALLMENTS HISTORY VIEW                        */}
      {/* ================================================================= */}
      {historyItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Payment Installment History
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-[240px]">
                    {historyItem.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHistoryItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span>Original: ৳{(historyItem.initialAmount || 0).toLocaleString()}</span>
                <span>Paid: ৳{(historyItem.paidAmount || 0).toLocaleString()}</span>
                <span className="font-bold text-slate-900">Remaining: ৳{(historyItem.amount || 0).toLocaleString()}</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pt-1">
                {(!historyItem.paymentHistory || historyItem.paymentHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 text-center py-6 italic">
                    No payment installments recorded yet.
                  </p>
                ) : (
                  historyItem.paymentHistory.map(entry => (
                    <div
                      key={entry.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold font-mono text-emerald-700">
                          -৳{entry.amount.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {entry.date} {entry.note ? `• ${entry.note}` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Paid
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 text-right">
                <button
                  type="button"
                  onClick={() => setHistoryItem(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE NEW UPCOMING EXPENDITURE CATEGORY                   */}
      {/* ================================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Create New Category
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add a dedicated category to upcoming commitments
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCategory} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Category Name: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Medical & Healthcare, Home Renovation, Eid Shopping..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Description / Purpose (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Committed future pharmacy bills, doctor checkups & diagnostic fees"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Icon:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'Activity', label: 'Health', Icon: Activity },
                    { id: 'Home', label: 'Home', Icon: Home },
                    { id: 'ShoppingBag', label: 'Shopping', Icon: ShoppingBag },
                    { id: 'Heart', label: 'Family', Icon: Heart },
                    { id: 'Gift', label: 'Gift', Icon: Gift },
                    { id: 'Briefcase', label: 'Work', Icon: Briefcase },
                    { id: 'Coins', label: 'Cash', Icon: Coins },
                    { id: 'Sparkles', label: 'Special', Icon: Sparkles },
                    { id: 'Receipt', label: 'Bill', Icon: Receipt },
                    { id: 'Tag', label: 'General', Icon: Tag },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewCatIcon(item.id)}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all text-center ${
                        newCatIcon === item.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-2xs font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <item.Icon className="w-4 h-4" />
                      <span className="text-[10px] truncate max-w-full">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Theme Color:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
                    { id: 'rose', label: 'Rose', bg: 'bg-rose-600' },
                    { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
                    { id: 'purple', label: 'Purple', bg: 'bg-purple-600' },
                    { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-600' },
                    { id: 'blue', label: 'Blue', bg: 'bg-blue-600' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCatColor(c.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        newCatColor === c.id
                          ? 'border-slate-900 bg-slate-100 text-slate-900 shadow-2xs ring-2 ring-slate-400'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs shadow-indigo-600/30"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in slide-in-from-bottom-3 border border-slate-800">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
