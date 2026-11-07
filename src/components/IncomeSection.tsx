import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Briefcase,
  Store,
  HeartHandshake,
  Plus,
  Layers,
  Receipt,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Search,
  ArrowUpDown,
  CheckSquare,
  Square,
  X,
  Clock,
  TrendingUp,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  Coins,
  Sparkles,
  AlertCircle,
  FolderPlus,
  Home,
  Heart,
  Activity,
  ShoppingBag,
  Gift,
  Tag,
} from 'lucide-react';
import {
  Worksheet,
  IncomeCategory,
  CurrentIncomeCategory,
  UpcomingIncomeCategory,
  IncomeRecord,
  UpcomingIncomeItem,
  RowData,
} from '../types/family';
import { getCategoryDefaultColumns, DEFAULT_WORKSHEETS } from '../services/dbService';

interface IncomeSectionProps {
  worksheets: Worksheet[];
  initialSubSection?: 'current' | 'upcoming';
  onSubSectionChange?: (sub: 'current' | 'upcoming') => void;
  onSaveWorksheet: (ws: Worksheet) => void;
  onDeleteWorksheet: (id: string) => void;
  onCreateWorksheet?: (category: IncomeCategory, title: string) => Promise<string> | void;
}

// ----------------------------------------------------
// METADATA: 4 CURRENT REALIZED INCOME CATEGORIES
// ----------------------------------------------------
export const CURRENT_INCOME_CATEGORIES_META: Record<
  CurrentIncomeCategory,
  {
    id: CurrentIncomeCategory;
    title: string;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    theme: {
      cardBg: string;
      iconBg: string;
      progressBar: string;
      accentText: string;
      badge: string;
      btnBg: string;
      lightBg: string;
    };
    quickChips: number[];
  }
> = {
  tution: {
    id: 'tution',
    title: '1. Tuition Income',
    label: 'Tuition Fees',
    desc: 'Private tutoring batches, school & college student coaching fees',
    icon: GraduationCap,
    theme: {
      cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/80 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      progressBar: 'bg-emerald-500',
      accentText: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      lightBg: 'bg-emerald-50',
    },
    quickChips: [1000, 2000, 3000, 5000],
  },
  father_salary: {
    id: 'father_salary',
    title: '2. Father Salary',
    label: 'Father Salary',
    desc: 'Monthly office salary, house rent allowances, bonuses & overtime pay',
    icon: Briefcase,
    theme: {
      cardBg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-200/80 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      progressBar: 'bg-blue-500',
      accentText: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      lightBg: 'bg-blue-50',
    },
    quickChips: [5000, 10000, 20000, 30000],
  },
  selling_product: {
    id: 'selling_product',
    title: '3. Selling Product',
    label: 'Product Sales',
    desc: 'Honey, crafts, farm commodities, dairy & commercial retail product sales',
    icon: Store,
    theme: {
      cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-200/80 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      progressBar: 'bg-amber-500',
      accentText: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      lightBg: 'bg-amber-50',
    },
    quickChips: [500, 1000, 2000, 5000],
  },
  others_help: {
    id: 'others_help',
    title: '4. Others Help',
    label: 'Others Help / Gifts',
    desc: 'Financial assistance from relatives, festive gifts, scholarships & support',
    icon: HeartHandshake,
    theme: {
      cardBg: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-200/80 hover:border-purple-400',
      iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
      progressBar: 'bg-purple-500',
      accentText: 'text-purple-800',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
      lightBg: 'bg-purple-50',
    },
    quickChips: [1000, 2000, 5000, 10000],
  },
};

const CURRENT_CATEGORY_KEYS: CurrentIncomeCategory[] = [
  'tution',
  'father_salary',
  'selling_product',
  'others_help',
];

// ----------------------------------------------------
// METADATA: 3 UPCOMING FUTURE/DUE INCOME CATEGORIES
// ----------------------------------------------------
export const UPCOMING_CATEGORIES_META: Record<
  UpcomingIncomeCategory,
  {
    id: UpcomingIncomeCategory;
    title: string;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
    sheetCategory: IncomeCategory;
    theme: {
      cardBg: string;
      iconBg: string;
      progressBar: string;
      accentText: string;
      badge: string;
      btnBg: string;
      lightBg: string;
    };
    quickChips: number[];
  }
> = {
  tution: {
    id: 'tution',
    title: '1. Tuition (Upcoming)',
    label: 'Upcoming Tuition',
    desc: 'Expected coaching & student fees arriving later this month, next month, or undated',
    icon: GraduationCap,
    sheetCategory: 'upcoming_tution',
    theme: {
      cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/80 hover:border-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      progressBar: 'bg-emerald-500',
      accentText: 'text-emerald-800',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      lightBg: 'bg-emerald-50',
    },
    quickChips: [1000, 2000, 3000, 5000],
  },
  father_salary: {
    id: 'father_salary',
    title: '2. Father Salary (Upcoming)',
    label: 'Upcoming Salary',
    desc: 'Pending salary, allowances, bonus, or company payroll due to arrive later',
    icon: Briefcase,
    sheetCategory: 'upcoming_father_salary',
    theme: {
      cardBg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-200/80 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
      progressBar: 'bg-blue-500',
      accentText: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
      btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
      lightBg: 'bg-blue-50',
    },
    quickChips: [5000, 10000, 20000, 30000],
  },
  due_debt: {
    id: 'due_debt',
    title: '3. Due Debt (Receivable)',
    label: 'Due Debt Recovery',
    desc: 'Money owed to the family by individuals, relatives, or borrowers expected back',
    icon: Coins,
    sheetCategory: 'upcoming_due_debt',
    theme: {
      cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-200/80 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
      progressBar: 'bg-amber-500',
      accentText: 'text-amber-800',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      lightBg: 'bg-amber-50',
    },
    quickChips: [1000, 2000, 5000, 10000],
  },
};

const UPCOMING_CATEGORY_KEYS: UpcomingIncomeCategory[] = ['tution', 'father_salary', 'due_debt'];

export interface CustomIncomeCategory {
  id: string;
  name: string;
  desc: string;
  iconName: string;
  themeColor: string;
  target: 'realized' | 'upcoming' | 'both';
  quickChips: number[];
}

export const getCustomIncomeThemeClasses = (color: string) => {
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
        cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/80 hover:border-emerald-400',
        iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        progressBar: 'bg-emerald-500',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        accentText: 'text-emerald-800',
        lightBg: 'bg-emerald-50',
      };
  }
};

export const resolveIncomeCategoryIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Briefcase': return Briefcase;
    case 'GraduationCap': return GraduationCap;
    case 'Store': return Store;
    case 'HeartHandshake': return HeartHandshake;
    case 'Coins': return Coins;
    case 'Sparkles': return Sparkles;
    case 'Receipt': return Receipt;
    case 'Home': return Home;
    case 'Activity': return Activity;
    case 'Heart': return Heart;
    case 'ShoppingBag': return ShoppingBag;
    case 'Gift': return Gift;
    default: return Tag;
  }
};

export const getCurrentIncomeCategoryMeta = (
  cat: string,
  customCats: CustomIncomeCategory[] = []
) => {
  if (cat in CURRENT_INCOME_CATEGORIES_META) {
    return {
      ...CURRENT_INCOME_CATEGORIES_META[cat as CurrentIncomeCategory],
      isCustom: false,
    };
  }
  const custom = customCats.find(c => c.id === cat || c.name.toLowerCase() === cat.toLowerCase());
  if (custom) {
    return {
      id: custom.id as CurrentIncomeCategory,
      title: custom.name,
      label: custom.name,
      desc: custom.desc || 'Custom income category',
      icon: resolveIncomeCategoryIcon(custom.iconName),
      theme: getCustomIncomeThemeClasses(custom.themeColor),
      quickChips: custom.quickChips || [1000, 2000, 5000, 10000],
      isCustom: true,
    };
  }
  return {
    id: cat as CurrentIncomeCategory,
    title: cat.replace(/_/g, ' '),
    label: cat.replace(/_/g, ' '),
    desc: 'Custom income category',
    icon: Tag,
    theme: getCustomIncomeThemeClasses('emerald'),
    quickChips: [1000, 2000, 5000, 10000],
    isCustom: true,
  };
};

export const getUpcomingIncomeCategoryMeta = (
  cat: string,
  customCats: CustomIncomeCategory[] = []
) => {
  if (cat in UPCOMING_CATEGORIES_META) {
    return {
      ...UPCOMING_CATEGORIES_META[cat as UpcomingIncomeCategory],
      isCustom: false,
    };
  }
  const custom = customCats.find(c => c.id === cat || c.name.toLowerCase() === cat.toLowerCase());
  if (custom) {
    return {
      id: custom.id as UpcomingIncomeCategory,
      title: `${custom.name} (Upcoming)`,
      label: custom.name,
      desc: custom.desc || 'Custom upcoming income stream',
      icon: resolveIncomeCategoryIcon(custom.iconName),
      sheetCategory: `upcoming_${custom.id}` as IncomeCategory,
      theme: getCustomIncomeThemeClasses(custom.themeColor),
      quickChips: custom.quickChips || [1000, 2000, 5000, 10000],
      isCustom: true,
    };
  }
  return {
    id: cat as UpcomingIncomeCategory,
    title: `${cat.replace(/_/g, ' ')} (Upcoming)`,
    label: cat.replace(/_/g, ' '),
    desc: 'Custom upcoming income stream',
    icon: Tag,
    sheetCategory: `upcoming_${cat}` as IncomeCategory,
    theme: getCustomIncomeThemeClasses('emerald'),
    quickChips: [1000, 2000, 5000, 10000],
    isCustom: true,
  };
};

type IncomeSortField = 'date' | 'amount' | 'category' | 'title';
type IncomeSortOrder = 'asc' | 'desc';
type CurrentQuickFilter = 'all' | CurrentIncomeCategory;
type UpcomingTimeFilter = 'all' | 'this_month' | 'next_month' | 'undated' | string;
type UpcomingCategoryFilter = 'all' | UpcomingIncomeCategory;

export const IncomeSection: React.FC<IncomeSectionProps> = ({
  worksheets,
  initialSubSection = 'current',
  onSubSectionChange,
  onSaveWorksheet,
  onDeleteWorksheet,
}) => {
  // Current date reference in local timezone
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  // Next month string reference (YYYY-MM)
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

  // -------------------------------------------------------------------------
  // TOP-LEVEL SECTION SWITCHER: 'current' vs 'upcoming'
  // -------------------------------------------------------------------------
  const [sectionType, setSectionType] = useState<'current' | 'upcoming'>(
    initialSubSection || 'current'
  );

  React.useEffect(() => {
    if (initialSubSection) {
      setSectionType(initialSubSection);
    }
  }, [initialSubSection]);

  const handleSectionSwitch = (type: 'current' | 'upcoming') => {
    setSectionType(type);
    if (onSubSectionChange) {
      onSubSectionChange(type);
    }
  };

  // Month navigation calculations for Current Income
  const [selectedMonth, setSelectedMonth] = useState(`${todayYear}-${todayMonth}`); // YYYY-MM
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(yearNum, monthNum - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    const prev = new Date(yearNum, monthNum - 2, 1);
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prev.getFullYear()}-${m}`);
    setSelectedCurrentIds(new Set());
  };

  const handleNextMonth = () => {
    const next = new Date(yearNum, monthNum, 1);
    const m = String(next.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${next.getFullYear()}-${m}`);
    setSelectedCurrentIds(new Set());
  };

  // -------------------------------------------------------------------------
  // CURRENT INCOME VIEW STATES
  // -------------------------------------------------------------------------
  const [currentActiveTab, setCurrentActiveTab] = useState<'category_ledger' | 'itemized'>('category_ledger');
  const [currentTimeScope, setCurrentTimeScope] = useState<'month' | 'all_time'>('month');
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [currentFilter, setCurrentFilter] = useState<CurrentQuickFilter>('all');
  const [currentSortField, setCurrentSortField] = useState<IncomeSortField>('date');
  const [currentSortOrder, setCurrentSortOrder] = useState<IncomeSortOrder>('desc');
  const [expandedCurrentCategory, setExpandedCurrentCategory] = useState<CurrentIncomeCategory | null>(null);
  const [selectedCurrentIds, setSelectedCurrentIds] = useState<Set<string>>(new Set());

  // Modal State for Current Income Add / Edit
  const [activeCurrentModalCat, setActiveCurrentModalCat] = useState<CurrentIncomeCategory | null>(null);
  const [editingCurrentRecord, setEditingCurrentRecord] = useState<IncomeRecord | null>(null);
  const [currentFormAmountStr, setCurrentFormAmountStr] = useState<string>('');
  const [currentFormDate, setCurrentFormDate] = useState<string>(todayStr);

  // Current inputs:
  const [formTuitionName, setFormTuitionName] = useState<string>('');
  const [formStudentClass, setFormStudentClass] = useState<string>('');
  const [formSubject, setFormSubject] = useState<string>('');
  const [formJob, setFormJob] = useState<string>('');
  const [formSalaryNote, setFormSalaryNote] = useState<string>('');
  const [formProductName, setFormProductName] = useState<string>('');
  const [formProductQuantity, setFormProductQuantity] = useState<string>('');
  const [formWhoHelp, setFormWhoHelp] = useState<string>('');
  const [formHelpOccasion, setFormHelpOccasion] = useState<string>('');

  // -------------------------------------------------------------------------
  // UPCOMING INCOME VIEW STATES
  // -------------------------------------------------------------------------
  const [upcomingActiveTab, setUpcomingActiveTab] = useState<'category_ledger' | 'itemized'>('category_ledger');
  const [upcomingTimeFilter, setUpcomingTimeFilter] = useState<UpcomingTimeFilter>('all');
  const [upcomingCategoryFilter, setUpcomingCategoryFilter] = useState<UpcomingCategoryFilter>('all');
  const [upcomingSearchQuery, setUpcomingSearchQuery] = useState('');
  const [upcomingSortField, setUpcomingSortField] = useState<IncomeSortField>('date');
  const [upcomingSortOrder, setUpcomingSortOrder] = useState<IncomeSortOrder>('desc');
  const [expandedUpcomingCategory, setExpandedUpcomingCategory] = useState<UpcomingIncomeCategory | null>(null);
  const [selectedUpcomingIds, setSelectedUpcomingIds] = useState<Set<string>>(new Set());

  // Modal State for Upcoming Income Add / Edit
  const [activeUpcomingModalCat, setActiveUpcomingModalCat] = useState<UpcomingIncomeCategory | null>(null);
  const [editingUpcomingItem, setEditingUpcomingItem] = useState<UpcomingIncomeItem | null>(null);
  const [upcomingFormAmountStr, setUpcomingFormAmountStr] = useState<string>('');
  const [upcomingIsUndated, setUpcomingIsUndated] = useState<boolean>(false);
  const [upcomingFormDate, setUpcomingFormDate] = useState<string>(todayStr);
  const [upcomingTargetHorizon, setUpcomingTargetHorizon] = useState<string>(selectedMonth);

  // Upcoming inputs:
  const [upcomingStudentName, setUpcomingStudentName] = useState<string>('');
  const [upcomingStudentClass, setUpcomingStudentClass] = useState<string>('');
  const [upcomingSubject, setUpcomingSubject] = useState<string>('');
  const [upcomingJob, setUpcomingJob] = useState<string>('');
  const [upcomingSalaryPeriod, setUpcomingSalaryPeriod] = useState<string>('');
  const [upcomingDebtorName, setUpcomingDebtorName] = useState<string>('');
  const [upcomingDebtReason, setUpcomingDebtReason] = useState<string>('');
  const [upcomingGeneralNote, setUpcomingGeneralNote] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Custom Income Categories State persisted in localStorage
  const [customIncomeCategories, setCustomIncomeCategories] = useState<CustomIncomeCategory[]>(() => {
    try {
      const saved = localStorage.getItem('family_diary_custom_income_categories_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(
        'family_diary_custom_income_categories_v1',
        JSON.stringify(customIncomeCategories)
      );
    } catch (e) {
      console.error('Error saving custom income categories:', e);
    }
  }, [customIncomeCategories]);

  // Combined Category keys
  const allCurrentCategoryKeys = useMemo(() => {
    const customKeys = customIncomeCategories
      .filter(c => c.target === 'realized' || c.target === 'both')
      .map(c => c.id as CurrentIncomeCategory);
    return [...CURRENT_CATEGORY_KEYS, ...customKeys];
  }, [customIncomeCategories]);

  const allUpcomingCategoryKeys = useMemo(() => {
    const customKeys = customIncomeCategories
      .filter(c => c.target === 'upcoming' || c.target === 'both')
      .map(c => c.id as UpcomingIncomeCategory);
    return [...UPCOMING_CATEGORY_KEYS, ...customKeys];
  }, [customIncomeCategories]);

  // Modal State for Custom Category Creation
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Briefcase');
  const [newCatColor, setNewCatColor] = useState('emerald');
  const [newCatTarget, setNewCatTarget] = useState<'both' | 'realized' | 'upcoming'>('both');

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const trimmed = newCatName.trim();
    const id = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Avoid duplicate IDs
    if (
      CURRENT_CATEGORY_KEYS.includes(id as any) ||
      UPCOMING_CATEGORY_KEYS.includes(id as any) ||
      customIncomeCategories.some(c => c.id === id)
    ) {
      showToast(`Category "${trimmed}" already exists or reserved.`);
      return;
    }

    const newCategory: CustomIncomeCategory = {
      id,
      name: trimmed,
      desc: newCatDesc.trim() || `Custom ${newCatTarget === 'both' ? 'realized & upcoming' : newCatTarget} income stream`,
      iconName: newCatIcon,
      themeColor: newCatColor,
      target: newCatTarget,
      quickChips: [1000, 2000, 5000, 10000],
    };

    setCustomIncomeCategories(prev => [...prev, newCategory]);
    showToast(`Created category "${trimmed}"!`);
    setNewCatName('');
    setNewCatDesc('');
    setIsCatModalOpen(false);
  };

  const handleDeleteCustomIncomeCategory = (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"? Existing entries will remain safe.`)) return;
    setCustomIncomeCategories(prev => prev.filter(c => c.id !== id));
    showToast(`Category "${name}" removed`);
  };

  // -------------------------------------------------------------------------
  // WORKSHEET HELPERS
  // -------------------------------------------------------------------------
  const getOrCreateCurrentSheet = (category: CurrentIncomeCategory): Worksheet => {
    const existing = worksheets.find(w => w.category === category);
    if (existing) return existing;

    const defaultSeed = DEFAULT_WORKSHEETS.find(w => w.category === category);
    if (defaultSeed) return defaultSeed;

    const meta = getCurrentIncomeCategoryMeta(category, customIncomeCategories);
    return {
      id: `sheet_${category}_${Date.now()}`,
      userId: 'guest',
      category: category as any,
      title: meta.label,
      columns: getCategoryDefaultColumns(category as any),
      rows: [],
      totalAmount: 0,
      currency: '৳',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const getOrCreateUpcomingSheet = (cat: UpcomingIncomeCategory): Worksheet => {
    const meta = getUpcomingIncomeCategoryMeta(cat, customIncomeCategories);
    const sheetCat = meta.sheetCategory;
    const existing = worksheets.find(w => w.category === sheetCat);
    if (existing) return existing;

    const defaultSeed = DEFAULT_WORKSHEETS.find(w => w.category === sheetCat);
    if (defaultSeed) return defaultSeed;

    return {
      id: `sheet_upcoming_${cat}_${Date.now()}`,
      userId: 'guest',
      category: sheetCat as any,
      title: meta.label,
      columns: getCategoryDefaultColumns(sheetCat as any),
      rows: [],
      totalAmount: 0,
      currency: '৳',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // -------------------------------------------------------------------------
  // PARSING DATA: CURRENT REALIZED INCOME RECORDS
  // -------------------------------------------------------------------------
  const allCurrentIncomeRecords: IncomeRecord[] = useMemo(() => {
    const records: IncomeRecord[] = [];
    worksheets.forEach(ws => {
      // Exclude upcoming worksheets from current income
      if (!ws.category || ws.category.startsWith('upcoming_')) return;
      const cat = ws.category as CurrentIncomeCategory;

      (ws.rows || []).forEach(row => {
        const cells = row.cells || {};
        const rawAmt =
          Number(cells['amount']) ||
          Number(cells['col_fee']) ||
          Number(cells['col_net']) ||
          Number(cells['col_basic']) ||
          Number(cells['col_total']) ||
          Number(cells['col_amount']) ||
          0;

        const date = String(cells['date'] || cells['col_date'] || todayStr);
        const month = String(cells['month'] || date.slice(0, 7) || selectedMonth);

        let title = String(cells['title'] || '');
        if (!title) {
          if (cat === 'tution') title = String(cells['tuitionName'] || cells['col_student'] || 'Student Tuition');
          else if (cat === 'father_salary') title = String(cells['job'] || cells['col_org'] || 'Father Salary');
          else if (cat === 'selling_product') title = String(cells['productName'] || cells['col_item'] || 'Product Sale');
          else title = String(cells['whoHelp'] || cells['col_from'] || 'Other Contributor');
        }

        let description = String(cells['description'] || '');
        if (!description) {
          if (cat === 'tution') {
            const cls = cells['studentClass'] || cells['col_class'];
            const subj = cells['subject'] || cells['col_subject'];
            description = [cls, subj].filter(Boolean).join(' • ');
          } else if (cat === 'father_salary') {
            description = String(cells['col_month'] || cells['job'] || 'Monthly Salary');
          } else if (cat === 'selling_product') {
            const qty = cells['productQuantity'] || cells['col_qty'];
            description = qty ? `Qty: ${qty}` : '';
          } else {
            description = String(cells['helpOccasion'] || cells['col_purpose'] || cells['col_remarks'] || '');
          }
        }

        records.push({
          id: row.id,
          sheetId: ws.id,
          userId: ws.userId || 'guest',
          category: cat,
          amount: rawAmt,
          date,
          month,
          title,
          description,
          tuitionName: String(cells['tuitionName'] || cells['col_student'] || ''),
          studentClass: String(cells['studentClass'] || cells['col_class'] || ''),
          subject: String(cells['subject'] || cells['col_subject'] || ''),
          job: String(cells['job'] || cells['col_org'] || ''),
          salaryAmount: Number(cells['salaryAmount'] || rawAmt),
          productName: String(cells['productName'] || cells['col_item'] || ''),
          productQuantity: String(cells['productQuantity'] || cells['col_qty'] || ''),
          whoHelp: String(cells['whoHelp'] || cells['col_from'] || ''),
          helpOccasion: String(cells['helpOccasion'] || cells['col_purpose'] || cells['col_remarks'] || ''),
          createdAt: String(cells['createdAt'] || ws.createdAt || new Date().toISOString()),
        });
      });
    });
    return records;
  }, [worksheets, selectedMonth, todayStr]);

  // Total current monthly income
  const totalMonthIncome = useMemo(() => {
    return allCurrentIncomeRecords
      .filter(r => r.month === selectedMonth || r.date.startsWith(selectedMonth))
      .reduce((sum, r) => sum + r.amount, 0);
  }, [allCurrentIncomeRecords, selectedMonth]);

  // Total current all-time income
  const totalAllTimeIncome = useMemo(() => {
    return allCurrentIncomeRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [allCurrentIncomeRecords]);

  const activeCurrentScopeTotal = currentTimeScope === 'month' ? totalMonthIncome : totalAllTimeIncome;

  // Category stats for Current Quick Ledger
  const currentCategoryStats = useMemo(() => {
    return allCurrentCategoryKeys.map(cat => {
      const allCatRecords = allCurrentIncomeRecords.filter(r => r.category === cat);
      const monthRecords = allCatRecords.filter(
        r => r.month === selectedMonth || r.date.startsWith(selectedMonth)
      );

      const monthAmount = monthRecords.reduce((sum, r) => sum + r.amount, 0);
      const allTimeAmount = allCatRecords.reduce((sum, r) => sum + r.amount, 0);
      const displayRecords = currentTimeScope === 'month' ? monthRecords : allCatRecords;
      const displayAmount = currentTimeScope === 'month' ? monthAmount : allTimeAmount;

      return {
        category: cat,
        meta: getCurrentIncomeCategoryMeta(cat, customIncomeCategories),
        monthAmount,
        allTimeAmount,
        displayAmount,
        monthCount: monthRecords.length,
        allTimeCount: allCatRecords.length,
        displayCount: displayRecords.length,
        records: displayRecords.sort((a, b) => b.date.localeCompare(a.date)),
      };
    });
  }, [allCurrentCategoryKeys, allCurrentIncomeRecords, selectedMonth, currentTimeScope, customIncomeCategories]);

  // Filtered current records
  const filteredCurrentRecords = useMemo(() => {
    return allCurrentIncomeRecords
      .filter(r => {
        if (currentFilter !== 'all' && r.category !== currentFilter) return false;
        if (!currentSearchQuery.trim()) return true;
        const q = currentSearchQuery.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          r.amount.toString().includes(q) ||
          r.date.includes(q)
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (currentSortField === 'amount') {
          cmp = a.amount - b.amount;
        } else if (currentSortField === 'category') {
          cmp = a.category.localeCompare(b.category);
        } else if (currentSortField === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else {
          cmp = a.date.localeCompare(b.date);
        }
        return currentSortOrder === 'desc' ? -cmp : cmp;
      });
  }, [allCurrentIncomeRecords, currentFilter, currentSearchQuery, currentSortField, currentSortOrder]);

  const filteredCurrentTotal = useMemo(() => {
    return filteredCurrentRecords.reduce((sum, r) => sum + r.amount, 0);
  }, [filteredCurrentRecords]);

  // -------------------------------------------------------------------------
  // PARSING DATA: UPCOMING FUTURE / DUE INCOME ITEMS
  // -------------------------------------------------------------------------
  const allUpcomingItems: UpcomingIncomeItem[] = useMemo(() => {
    const items: UpcomingIncomeItem[] = [];
    worksheets.forEach(ws => {
      let cat: UpcomingIncomeCategory | null = null;
      if (ws.category === 'upcoming_tution') cat = 'tution';
      else if (ws.category === 'upcoming_father_salary') cat = 'father_salary';
      else if (ws.category === 'upcoming_due_debt') cat = 'due_debt';
      else if (ws.category && ws.category.startsWith('upcoming_')) {
        cat = ws.category.replace(/^upcoming_/, '') as UpcomingIncomeCategory;
      }

      if (!cat) return;

      (ws.rows || []).forEach(row => {
        const cells = row.cells || {};
        const amount =
          Number(cells['amount']) ||
          Number(cells['col_fee']) ||
          Number(cells['col_net']) ||
          Number(cells['col_amount']) ||
          0;

        const isUndated = Boolean(cells['isUndated'] === true || cells['isUndated'] === 'true');
        const expectedDate = String(cells['expectedDate'] || cells['date'] || cells['col_date'] || '');
        const targetMonth = String(
          cells['targetMonth'] || cells['month'] || (expectedDate ? expectedDate.slice(0, 7) : selectedMonth)
        );
        const status = (cells['status'] === 'received' ? 'received' : 'pending') as 'pending' | 'received';

        let title = String(cells['title'] || '');
        if (!title) {
          if (cat === 'tution') title = String(cells['studentName'] || cells['col_student'] || 'Upcoming Tuition');
          else if (cat === 'father_salary') title = String(cells['job'] || cells['col_org'] || 'Upcoming Salary');
          else if (cat === 'due_debt') title = String(cells['debtorName'] || cells['col_from'] || 'Debtor Money');
          else title = String(cells['col_item'] || cells['description'] || 'Upcoming Stream');
        }

        let description = String(cells['description'] || '');
        if (!description) {
          if (cat === 'tution') {
            const cls = cells['studentClass'] || cells['col_class'];
            const sub = cells['subject'] || cells['col_subject'];
            description = [cls, sub].filter(Boolean).join(' • ');
          } else if (cat === 'father_salary') {
            description = String(cells['salaryPeriod'] || cells['col_month'] || 'Monthly Expected');
          } else if (cat === 'due_debt') {
            description = String(cells['debtReason'] || cells['col_purpose'] || '');
          } else {
            description = String(cells['col_purpose'] || cells['col_remarks'] || 'Expected future income');
          }
        }

        items.push({
          id: row.id,
          sheetId: ws.id,
          userId: ws.userId || 'guest',
          category: cat,
          amount,
          expectedDate: isUndated ? '' : expectedDate,
          targetMonth,
          isUndated,
          title,
          description,
          studentName: String(cells['studentName'] || cells['col_student'] || ''),
          studentClass: String(cells['studentClass'] || cells['col_class'] || ''),
          subject: String(cells['subject'] || cells['col_subject'] || ''),
          job: String(cells['job'] || cells['col_org'] || ''),
          salaryPeriod: String(cells['salaryPeriod'] || cells['col_month'] || ''),
          debtorName: String(cells['debtorName'] || cells['col_from'] || ''),
          debtReason: String(cells['debtReason'] || cells['col_purpose'] || ''),
          status,
          receivedDate: cells['receivedDate'] ? String(cells['receivedDate']) : undefined,
          createdAt: String(cells['createdAt'] || ws.createdAt || new Date().toISOString()),
        });
      });
    });
    return items;
  }, [worksheets, selectedMonth]);

  // Pending upcoming items
  const pendingUpcomingItems = useMemo(() => {
    return allUpcomingItems.filter(item => item.status === 'pending');
  }, [allUpcomingItems]);

  const totalUpcomingPendingAmount = useMemo(() => {
    return pendingUpcomingItems.reduce((sum, item) => sum + item.amount, 0);
  }, [pendingUpcomingItems]);

  // Breakdown of pending upcoming items
  const upcomingThisMonthAmount = useMemo(() => {
    return pendingUpcomingItems
      .filter(i => !i.isUndated && i.targetMonth === selectedMonth)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [pendingUpcomingItems, selectedMonth]);

  const upcomingNextMonthAmount = useMemo(() => {
    return pendingUpcomingItems
      .filter(i => !i.isUndated && i.targetMonth === nextMonthStr)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [pendingUpcomingItems, nextMonthStr]);

  const upcomingUndatedAmount = useMemo(() => {
    return pendingUpcomingItems.filter(i => i.isUndated).reduce((sum, i) => sum + i.amount, 0);
  }, [pendingUpcomingItems]);

  // Upcoming Category Stats for Upcoming Quick Ledger
  const upcomingCategoryStats = useMemo(() => {
    return allUpcomingCategoryKeys.map(cat => {
      const catItems = pendingUpcomingItems.filter(item => item.category === cat);
      const catAmount = catItems.reduce((sum, item) => sum + item.amount, 0);
      return {
        category: cat,
        meta: getUpcomingIncomeCategoryMeta(cat, customIncomeCategories),
        amount: catAmount,
        count: catItems.length,
        items: catItems.sort((a, b) => {
          if (a.isUndated && !b.isUndated) return 1;
          if (!a.isUndated && b.isUndated) return -1;
          return (a.expectedDate || '').localeCompare(b.expectedDate || '');
        }),
      };
    });
  }, [allUpcomingCategoryKeys, pendingUpcomingItems, customIncomeCategories]);

  // Filtered upcoming items for Itemized View
  const filteredUpcomingItems = useMemo(() => {
    return allUpcomingItems
      .filter(item => {
        // Category filter
        if (upcomingCategoryFilter !== 'all' && item.category !== upcomingCategoryFilter) return false;

        // Timeframe filter
        if (upcomingTimeFilter === 'this_month') {
          if (item.isUndated || (item.targetMonth !== selectedMonth && (!item.expectedDate || !item.expectedDate.startsWith(selectedMonth)))) return false;
        } else if (upcomingTimeFilter === 'next_month') {
          if (item.isUndated || (item.targetMonth !== nextMonthStr && (!item.expectedDate || !item.expectedDate.startsWith(nextMonthStr)))) return false;
        } else if (upcomingTimeFilter === 'undated') {
          if (!item.isUndated) return false;
        } else if (upcomingTimeFilter !== 'all') {
          // Specific month key (e.g. 2026-11, 2026-12, 2027-01)
          const targetKey = upcomingTimeFilter;
          const matches =
            item.targetMonth === targetKey ||
            Boolean(item.expectedDate && item.expectedDate.startsWith(targetKey));
          if (!matches) return false;
        }

        // Search
        if (!upcomingSearchQuery.trim()) return true;
        const q = upcomingSearchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          item.amount.toString().includes(q) ||
          (item.expectedDate && item.expectedDate.includes(q))
        );
      })
      .sort((a, b) => {
        let cmp = 0;
        if (upcomingSortField === 'amount') {
          cmp = a.amount - b.amount;
        } else if (upcomingSortField === 'category') {
          cmp = a.category.localeCompare(b.category);
        } else if (upcomingSortField === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else {
          // Date sort with undated at the end
          if (a.isUndated && !b.isUndated) return 1;
          if (!a.isUndated && b.isUndated) return -1;
          cmp = (a.expectedDate || '').localeCompare(b.expectedDate || '');
        }
        return upcomingSortOrder === 'desc' ? -cmp : cmp;
      });
  }, [
    allUpcomingItems,
    upcomingCategoryFilter,
    upcomingTimeFilter,
    selectedMonth,
    nextMonthStr,
    upcomingSearchQuery,
    upcomingSortField,
    upcomingSortOrder,
  ]);

  const filteredUpcomingTotal = useMemo(() => {
    return filteredUpcomingItems
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + i.amount, 0);
  }, [filteredUpcomingItems]);

  // -------------------------------------------------------------------------
  // HANDLERS: CURRENT REALIZED INCOME
  // -------------------------------------------------------------------------
  const handleOpenCurrentModal = (cat: CurrentIncomeCategory) => {
    setActiveCurrentModalCat(cat);
    setEditingCurrentRecord(null);
    setCurrentFormAmountStr('');
    setCurrentFormDate(todayStr);

    if (cat === 'tution') {
      setFormTuitionName('');
      setFormStudentClass('Class 9');
      setFormSubject('General Math');
    } else if (cat === 'father_salary') {
      setFormJob('');
      setFormSalaryNote('Monthly Salary');
    } else if (cat === 'selling_product') {
      setFormProductName('');
      setFormProductQuantity('');
    } else if (cat === 'others_help') {
      setFormWhoHelp('');
      setFormHelpOccasion('Family Support');
    }
  };

  const handleStartEditCurrent = (rec: IncomeRecord) => {
    setEditingCurrentRecord(rec);
    setActiveCurrentModalCat(rec.category as CurrentIncomeCategory);
    setCurrentFormAmountStr(rec.amount.toString());
    setCurrentFormDate(rec.date || todayStr);

    if (rec.category === 'tution') {
      setFormTuitionName(rec.tuitionName || rec.title);
      setFormStudentClass(rec.studentClass || '');
      setFormSubject(rec.subject || '');
    } else if (rec.category === 'father_salary') {
      setFormJob(rec.job || rec.title);
      setFormSalaryNote(rec.description || '');
    } else if (rec.category === 'selling_product') {
      setFormProductName(rec.productName || rec.title);
      setFormProductQuantity(rec.productQuantity || '');
    } else if (rec.category === 'others_help') {
      setFormWhoHelp(rec.whoHelp || rec.title);
      setFormHelpOccasion(rec.helpOccasion || rec.description || '');
    }
  };

  const handleDirectCurrentChipIncrease = (cat: CurrentIncomeCategory, increment: number) => {
    const meta = getCurrentIncomeCategoryMeta(cat, customIncomeCategories);
    const targetDate = todayStr;
    const targetMonth = targetDate.slice(0, 7);
    const primarySheet = getOrCreateCurrentSheet(cat);

    let defaultTitle = '';
    if (cat === 'tution') defaultTitle = 'Tuition Fee Direct Addition';
    else if (cat === 'father_salary') defaultTitle = 'Salary Direct Increment';
    else if (cat === 'selling_product') defaultTitle = 'Product Sales Addition';
    else if (cat === 'others_help') defaultTitle = 'Direct Financial Contribution';
    else defaultTitle = `${meta.label} Direct Addition`;

    const newRowId = `row_${cat}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: RowData = {
      id: newRowId,
      cells: {
        id: newRowId,
        category: cat,
        title: defaultTitle,
        amount: increment,
        date: targetDate,
        month: targetMonth,
        description: `Direct +৳${increment.toLocaleString()} addition`,
        tuitionName: cat === 'tution' ? 'Tuition Addition' : '',
        studentClass: cat === 'tution' ? 'General' : '',
        subject: cat === 'tution' ? 'All Subjects' : '',
        job: cat === 'father_salary' ? 'Employment' : '',
        productName: cat === 'selling_product' ? 'Product Sale' : '',
        whoHelp: cat === 'others_help' ? 'Family Supporter' : '',
        createdAt: new Date().toISOString(),
        col_fee: increment,
        col_net: increment,
        col_basic: increment,
        col_total: increment,
        col_amount: increment,
        col_date: targetDate,
        col_student: defaultTitle,
        col_org: defaultTitle,
        col_item: defaultTitle,
        col_from: defaultTitle,
      },
    };

    const updatedRows = [newRow, ...(primarySheet.rows || [])];
    const updatedTotal = updatedRows.reduce((sum, r) => {
      const c = r.cells || {};
      return (
        sum +
        (Number(c['amount']) ||
          Number(c['col_fee']) ||
          Number(c['col_net']) ||
          Number(c['col_basic']) ||
          Number(c['col_total']) ||
          Number(c['col_amount']) ||
          0)
      );
    }, 0);

    onSaveWorksheet({
      ...primarySheet,
      rows: updatedRows,
      totalAmount: updatedTotal,
      updatedAt: new Date().toISOString(),
    });

    showToast(`Added +৳${increment.toLocaleString()} to ${meta.title}!`);
  };

  const handleSaveCurrentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCurrentModalCat) return;

    const parsedAmt = parseFloat(currentFormAmountStr);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter a valid income amount');
      return;
    }

    const targetDate = currentFormDate || todayStr;
    const targetMonth = targetDate.slice(0, 7);
    const cat = activeCurrentModalCat;

    let title = '';
    let description = '';

    if (cat === 'tution') {
      const tName = formTuitionName.trim() || 'Tuition Student';
      title = tName;
      description = [formStudentClass.trim(), formSubject.trim()].filter(Boolean).join(' • ') || 'Tuition batch';
    } else if (cat === 'father_salary') {
      title = formJob.trim() || 'Father Employment';
      description = formSalaryNote.trim() || 'Monthly salary';
    } else if (cat === 'selling_product') {
      title = formProductName.trim() || 'Product Item';
      description = formProductQuantity.trim() ? `Quantity: ${formProductQuantity.trim()}` : 'Retail sale';
    } else if (cat === 'others_help') {
      title = formWhoHelp.trim() || 'Family Supporter';
      description = formHelpOccasion.trim() || 'Assistance / Gift';
    } else {
      const catMeta = getCurrentIncomeCategoryMeta(cat, customIncomeCategories);
      title = formTuitionName.trim() || `${catMeta.label} Income`;
      description = formSubject.trim() || 'Custom income stream';
    }

    if (editingCurrentRecord) {
      const sheet = worksheets.find(w => w.id === editingCurrentRecord.sheetId) || getOrCreateCurrentSheet(cat);
      const updatedRows = (sheet.rows || []).map(row => {
        if (row.id === editingCurrentRecord.id) {
          return {
            ...row,
            cells: {
              ...row.cells,
              category: cat,
              title,
              amount: parsedAmt,
              date: targetDate,
              month: targetMonth,
              description,
              tuitionName: cat === 'tution' ? formTuitionName.trim() : '',
              studentClass: cat === 'tution' ? formStudentClass.trim() : '',
              subject: cat === 'tution' ? formSubject.trim() : '',
              job: cat === 'father_salary' ? formJob.trim() : '',
              salaryAmount: parsedAmt,
              productName: cat === 'selling_product' ? formProductName.trim() : '',
              productQuantity: cat === 'selling_product' ? formProductQuantity.trim() : '',
              whoHelp: cat === 'others_help' ? formWhoHelp.trim() : '',
              helpOccasion: cat === 'others_help' ? formHelpOccasion.trim() : '',
              col_fee: parsedAmt,
              col_net: parsedAmt,
              col_basic: parsedAmt,
              col_total: parsedAmt,
              col_amount: parsedAmt,
              col_date: targetDate,
              col_student: title,
              col_class: formStudentClass.trim(),
              col_subject: formSubject.trim(),
              col_org: title,
              col_item: title,
              col_qty: formProductQuantity.trim(),
              col_from: title,
            },
          };
        }
        return row;
      });

      const updatedTotal = updatedRows.reduce((sum, r) => {
        const c = r.cells || {};
        return (
          sum +
          (Number(c['amount']) ||
            Number(c['col_fee']) ||
            Number(c['col_net']) ||
            Number(c['col_basic']) ||
            Number(c['col_total']) ||
            Number(c['col_amount']) ||
            0)
        );
      }, 0);

      onSaveWorksheet({
        ...sheet,
        rows: updatedRows,
        totalAmount: updatedTotal,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Updated "${title}" in ${getCurrentIncomeCategoryMeta(cat, customIncomeCategories).title}!`);
    } else {
      const sheet = getOrCreateCurrentSheet(cat);
      const newRowId = `row_${cat}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newRow: RowData = {
        id: newRowId,
        cells: {
          id: newRowId,
          category: cat,
          title,
          amount: parsedAmt,
          date: targetDate,
          month: targetMonth,
          description,
          tuitionName: cat === 'tution' ? formTuitionName.trim() : '',
          studentClass: cat === 'tution' ? formStudentClass.trim() : '',
          subject: cat === 'tution' ? formSubject.trim() : '',
          job: cat === 'father_salary' ? formJob.trim() : '',
          salaryAmount: parsedAmt,
          productName: cat === 'selling_product' ? formProductName.trim() : '',
          productQuantity: cat === 'selling_product' ? formProductQuantity.trim() : '',
          whoHelp: cat === 'others_help' ? formWhoHelp.trim() : '',
          helpOccasion: cat === 'others_help' ? formHelpOccasion.trim() : '',
          createdAt: new Date().toISOString(),
          col_fee: parsedAmt,
          col_net: parsedAmt,
          col_basic: parsedAmt,
          col_total: parsedAmt,
          col_amount: parsedAmt,
          col_date: targetDate,
          col_student: title,
          col_class: formStudentClass.trim(),
          col_subject: formSubject.trim(),
          col_org: title,
          col_item: title,
          col_qty: formProductQuantity.trim(),
          col_from: title,
        },
      };

      const updatedRows = [newRow, ...(sheet.rows || [])];
      const updatedTotal = updatedRows.reduce((sum, r) => {
        const c = r.cells || {};
        return (
          sum +
          (Number(c['amount']) ||
            Number(c['col_fee']) ||
            Number(c['col_net']) ||
            Number(c['col_basic']) ||
            Number(c['col_total']) ||
            Number(c['col_amount']) ||
            0)
        );
      }, 0);

      onSaveWorksheet({
        ...sheet,
        rows: updatedRows,
        totalAmount: updatedTotal,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Added ৳${parsedAmt.toLocaleString()} to ${getCurrentIncomeCategoryMeta(cat, customIncomeCategories).title}!`);
    }

    setActiveCurrentModalCat(null);
    setEditingCurrentRecord(null);
  };

  const handleDeleteCurrentRecord = (rec: IncomeRecord) => {
    const sheet = worksheets.find(w => w.id === rec.sheetId);
    if (!sheet) return;

    const updatedRows = (sheet.rows || []).filter(r => r.id !== rec.id);
    const updatedTotal = updatedRows.reduce((sum, r) => {
      const c = r.cells || {};
      return (
        sum +
        (Number(c['amount']) ||
          Number(c['col_fee']) ||
          Number(c['col_net']) ||
          Number(c['col_basic']) ||
          Number(c['col_total']) ||
          Number(c['col_amount']) ||
          0)
      );
    }, 0);

    onSaveWorksheet({
      ...sheet,
      rows: updatedRows,
      totalAmount: updatedTotal,
      updatedAt: new Date().toISOString(),
    });
    setActiveCurrentModalCat(null);
    setEditingCurrentRecord(null);
    showToast(`✓ Deleted income entry "${rec.title}"`);
  };

  const handleDeleteSelectedCurrent = () => {
    if (selectedCurrentIds.size === 0) return;
    if (!confirm(`Delete ${selectedCurrentIds.size} selected income entries?`)) return;

    worksheets.forEach(ws => {
      if (!ws.rows || ws.rows.length === 0) return;
      const hasAny = ws.rows.some(r => selectedCurrentIds.has(r.id));
      if (!hasAny) return;

      const updatedRows = ws.rows.filter(r => !selectedCurrentIds.has(r.id));
      const updatedTotal = updatedRows.reduce((sum, r) => {
        const c = r.cells || {};
        return (
          sum +
          (Number(c['amount']) ||
            Number(c['col_fee']) ||
            Number(c['col_net']) ||
            Number(c['col_basic']) ||
            Number(c['col_total']) ||
            Number(c['col_amount']) ||
            0)
        );
      }, 0);

      onSaveWorksheet({
        ...ws,
        rows: updatedRows,
        totalAmount: updatedTotal,
        updatedAt: new Date().toISOString(),
      });
    });

    showToast(`Deleted ${selectedCurrentIds.size} income records`);
    setSelectedCurrentIds(new Set());
  };

  // -------------------------------------------------------------------------
  // HANDLERS: UPCOMING FUTURE / DUE INCOME
  // -------------------------------------------------------------------------
  const handleOpenUpcomingModal = (cat: UpcomingIncomeCategory) => {
    setActiveUpcomingModalCat(cat);
    setEditingUpcomingItem(null);
    setUpcomingFormAmountStr('');
    setUpcomingIsUndated(false);
    setUpcomingFormDate(todayStr);
    setUpcomingTargetHorizon(selectedMonth);

    if (cat === 'tution') {
      setUpcomingStudentName('');
      setUpcomingStudentClass('Class 10');
      setUpcomingSubject('Higher Math');
      setUpcomingGeneralNote('');
    } else if (cat === 'father_salary') {
      setUpcomingJob('');
      setUpcomingSalaryPeriod(`${monthName} Salary`);
      setUpcomingGeneralNote('');
    } else if (cat === 'due_debt') {
      setUpcomingDebtorName('');
      setUpcomingDebtReason('');
      setUpcomingGeneralNote('');
    }
  };

  const handleStartEditUpcoming = (item: UpcomingIncomeItem) => {
    setEditingUpcomingItem(item);
    setActiveUpcomingModalCat(item.category);
    setUpcomingFormAmountStr(item.amount.toString());
    setUpcomingIsUndated(item.isUndated);
    setUpcomingFormDate(item.expectedDate || todayStr);
    setUpcomingTargetHorizon(item.targetMonth || selectedMonth);

    if (item.category === 'tution') {
      setUpcomingStudentName(item.studentName || item.title);
      setUpcomingStudentClass(item.studentClass || '');
      setUpcomingSubject(item.subject || '');
      setUpcomingGeneralNote(item.description || '');
    } else if (item.category === 'father_salary') {
      setUpcomingJob(item.job || item.title);
      setUpcomingSalaryPeriod(item.salaryPeriod || '');
      setUpcomingGeneralNote(item.description || '');
    } else if (item.category === 'due_debt') {
      setUpcomingDebtorName(item.debtorName || item.title);
      setUpcomingDebtReason(item.debtReason || item.description || '');
      setUpcomingGeneralNote(item.description || '');
    }
  };

  // Direct 1-Click Chip Increase on Upcoming Categories
  const handleUpcomingDirectChipIncrease = (cat: UpcomingIncomeCategory, increment: number) => {
    const meta = getUpcomingIncomeCategoryMeta(cat, customIncomeCategories);
    const sheet = getOrCreateUpcomingSheet(cat);
    const targetDate = todayStr;
    const targetMonth = selectedMonth;

    let defaultTitle = '';
    if (cat === 'tution') defaultTitle = 'Upcoming Tuition Fee Addition';
    else if (cat === 'father_salary') defaultTitle = 'Upcoming Salary Increment';
    else if (cat === 'due_debt') defaultTitle = 'Upcoming Due Debt Addition';
    else defaultTitle = `Upcoming ${meta.label} Addition`;

    const newRowId = `row_up_${cat}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: RowData = {
      id: newRowId,
      cells: {
        id: newRowId,
        category: meta.sheetCategory,
        upcomingCategory: cat,
        title: defaultTitle,
        amount: increment,
        expectedDate: targetDate,
        date: targetDate,
        month: targetMonth,
        targetMonth,
        isUndated: false,
        status: 'pending',
        description: `Direct +৳${increment.toLocaleString()} upcoming addition`,
        studentName: cat === 'tution' ? 'Tuition Addition' : '',
        job: cat === 'father_salary' ? 'Employment' : '',
        debtorName: cat === 'due_debt' ? 'Debtor Due' : '',
        createdAt: new Date().toISOString(),
        col_fee: increment,
        col_net: increment,
        col_amount: increment,
        col_date: targetDate,
        col_student: defaultTitle,
        col_org: defaultTitle,
        col_from: defaultTitle,
      },
    };

    const updatedRows = [newRow, ...(sheet.rows || [])];
    const updatedTotal = updatedRows
      .filter(r => r.cells?.status !== 'received')
      .reduce((sum, r) => sum + (Number(r.cells?.amount) || Number(r.cells?.col_fee) || Number(r.cells?.col_amount) || 0), 0);

    onSaveWorksheet({
      ...sheet,
      rows: updatedRows,
      totalAmount: updatedTotal,
      updatedAt: new Date().toISOString(),
    });

    showToast(`Added +৳${increment.toLocaleString()} to ${meta.title}!`);
  };

  // Submit Save or Edit for Upcoming Income Modal
  const handleSaveUpcomingModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpcomingModalCat) return;

    const parsedAmt = parseFloat(upcomingFormAmountStr);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter a valid upcoming amount');
      return;
    }

    const cat = activeUpcomingModalCat;
    const meta = getUpcomingIncomeCategoryMeta(cat, customIncomeCategories);
    const sheet = getOrCreateUpcomingSheet(cat);

    const expectedDate = upcomingIsUndated ? '' : upcomingFormDate || todayStr;
    const targetMonth = upcomingIsUndated
      ? upcomingTargetHorizon || selectedMonth
      : expectedDate.slice(0, 7) || selectedMonth;

    let title = '';
    let description = '';

    if (cat === 'tution') {
      title = upcomingStudentName.trim() || 'Upcoming Tuition Student';
      description =
        [upcomingStudentClass.trim(), upcomingSubject.trim(), upcomingGeneralNote.trim()]
          .filter(Boolean)
          .join(' • ') || 'Tuition Due';
    } else if (cat === 'father_salary') {
      title = upcomingJob.trim() || 'Father Office Salary';
      description =
        [upcomingSalaryPeriod.trim(), upcomingGeneralNote.trim()].filter(Boolean).join(' • ') || 'Upcoming Paycheck';
    } else if (cat === 'due_debt') {
      title = upcomingDebtorName.trim() || 'Borrower Due Debt';
      description =
        [upcomingDebtReason.trim(), upcomingGeneralNote.trim()].filter(Boolean).join(' • ') || 'Recoverable Debt';
    } else {
      title = upcomingStudentName.trim() || `${meta.label} Stream`;
      description = upcomingGeneralNote.trim() || 'Expected upcoming stream';
    }

    if (editingUpcomingItem) {
      const parentSheet = worksheets.find(w => w.id === editingUpcomingItem.sheetId) || sheet;
      const updatedRows = (parentSheet.rows || []).map(row => {
        if (row.id === editingUpcomingItem.id) {
          return {
            ...row,
            cells: {
              ...row.cells,
              title,
              amount: parsedAmt,
              expectedDate,
              date: expectedDate,
              month: targetMonth,
              targetMonth,
              isUndated: upcomingIsUndated,
              status: editingUpcomingItem.status || 'pending',
              description,
              studentName: cat === 'tution' ? upcomingStudentName.trim() : '',
              studentClass: cat === 'tution' ? upcomingStudentClass.trim() : '',
              subject: cat === 'tution' ? upcomingSubject.trim() : '',
              job: cat === 'father_salary' ? upcomingJob.trim() : '',
              salaryPeriod: cat === 'father_salary' ? upcomingSalaryPeriod.trim() : '',
              debtorName: cat === 'due_debt' ? upcomingDebtorName.trim() : '',
              debtReason: cat === 'due_debt' ? upcomingDebtReason.trim() : '',
              col_fee: parsedAmt,
              col_net: parsedAmt,
              col_amount: parsedAmt,
              col_date: expectedDate,
              col_student: title,
              col_org: title,
              col_from: title,
              col_purpose: description,
            },
          };
        }
        return row;
      });

      const updatedTotal = updatedRows
        .filter(r => r.cells['status'] !== 'received')
        .reduce((sum, r) => sum + (Number(r.cells['amount']) || 0), 0);

      onSaveWorksheet({
        ...parentSheet,
        rows: updatedRows,
        totalAmount: updatedTotal,
        updatedAt: new Date().toISOString(),
      });

      showToast(`Updated "${title}" in ${meta.title}!`);
    } else {
      const newRowId = `row_up_${cat}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newRow: RowData = {
        id: newRowId,
        cells: {
          id: newRowId,
          category: meta.sheetCategory,
          upcomingCategory: cat,
          title,
          amount: parsedAmt,
          expectedDate,
          date: expectedDate,
          month: targetMonth,
          targetMonth,
          isUndated: upcomingIsUndated,
          status: 'pending',
          description,
          studentName: cat === 'tution' ? upcomingStudentName.trim() : '',
          studentClass: cat === 'tution' ? upcomingStudentClass.trim() : '',
          subject: cat === 'tution' ? upcomingSubject.trim() : '',
          job: cat === 'father_salary' ? upcomingJob.trim() : '',
          salaryPeriod: cat === 'father_salary' ? upcomingSalaryPeriod.trim() : '',
          debtorName: cat === 'due_debt' ? upcomingDebtorName.trim() : '',
          debtReason: cat === 'due_debt' ? upcomingDebtReason.trim() : '',
          createdAt: new Date().toISOString(),
          col_fee: parsedAmt,
          col_net: parsedAmt,
          col_amount: parsedAmt,
          col_date: expectedDate,
          col_student: title,
          col_org: title,
          col_from: title,
          col_purpose: description,
        },
      };

      const updatedRows = [newRow, ...(sheet.rows || [])];
      const updatedTotal = updatedRows
        .filter(r => r.cells?.status !== 'received')
        .reduce((sum, r) => sum + (Number(r.cells?.amount) || 0), 0);

      onSaveWorksheet({
        ...sheet,
        rows: updatedRows,
        totalAmount: updatedTotal,
        updatedAt: new Date().toISOString(),
      });

      showToast(`Added ৳${parsedAmt.toLocaleString()} to ${meta.title}!`);
    }

    setActiveUpcomingModalCat(null);
    setEditingUpcomingItem(null);
  };

  // 1-Click "Mark as Received": Instantly transfers to Current Realized Income!
  const handleReceiveUpcomingItem = (item: UpcomingIncomeItem) => {
    // 1. Mark as received in upcoming worksheet
    const upcomingSheet = worksheets.find(w => w.id === item.sheetId) || getOrCreateUpcomingSheet(item.category);
    const updatedUpcomingRows = (upcomingSheet.rows || []).map(row => {
      if (row.id === item.id) {
        return {
          ...row,
          cells: {
            ...row.cells,
            status: 'received',
            receivedDate: todayStr,
          },
        };
      }
      return row;
    });

    const updatedUpcomingTotal = updatedUpcomingRows
      .filter(r => r.cells?.status !== 'received')
      .reduce((sum, r) => sum + (Number(r.cells?.amount) || 0), 0);

    onSaveWorksheet({
      ...upcomingSheet,
      rows: updatedUpcomingRows,
      totalAmount: updatedUpcomingTotal,
      updatedAt: new Date().toISOString(),
    });

    // 2. Transfer into corresponding Current Income worksheet
    let targetCurrentCat: CurrentIncomeCategory = 'others_help';
    if (item.category === 'tution') targetCurrentCat = 'tution';
    else if (item.category === 'father_salary') targetCurrentCat = 'father_salary';
    else if (item.category === 'due_debt') targetCurrentCat = 'others_help';
    else targetCurrentCat = item.category as CurrentIncomeCategory;

    const currentSheet = getOrCreateCurrentSheet(targetCurrentCat);
    const newCurrentRowId = `row_rcv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const receivedNote = item.category === 'due_debt'
      ? `Debt recovered from ${item.debtorName || item.title} • ${item.debtReason || ''}`
      : `${item.title} (Received from Upcoming pipeline)`;

    const newCurrentRow: RowData = {
      id: newCurrentRowId,
      cells: {
        id: newCurrentRowId,
        category: targetCurrentCat,
        title: item.title,
        amount: item.amount,
        date: todayStr,
        month: todayStr.slice(0, 7),
        description: receivedNote,
        tuitionName: item.studentName || item.title,
        studentClass: item.studentClass || '',
        subject: item.subject || '',
        job: item.job || item.title,
        salaryAmount: item.amount,
        whoHelp: item.debtorName || item.title,
        helpOccasion: 'Debt Recovered',
        createdAt: new Date().toISOString(),
        col_fee: item.amount,
        col_net: item.amount,
        col_amount: item.amount,
        col_date: todayStr,
        col_student: item.title,
        col_org: item.title,
        col_from: item.debtorName || item.title,
      },
    };

    const updatedCurrentRows = [newCurrentRow, ...(currentSheet.rows || [])];
    const updatedCurrentTotal = updatedCurrentRows.reduce((sum, r) => {
      const c = r.cells || {};
      return (
        sum +
        (Number(c['amount']) ||
          Number(c['col_fee']) ||
          Number(c['col_net']) ||
          Number(c['col_basic']) ||
          Number(c['col_total']) ||
          Number(c['col_amount']) ||
          0)
      );
    }, 0);

    onSaveWorksheet({
      ...currentSheet,
      rows: updatedCurrentRows,
      totalAmount: updatedCurrentTotal,
      updatedAt: new Date().toISOString(),
    });

    showToast(`🎉 Received ৳${item.amount.toLocaleString()}! Transferred to Current Income.`);
  };

  const handleDeleteUpcomingItem = (item: UpcomingIncomeItem) => {
    const sheet = worksheets.find(w => w.id === item.sheetId);
    if (!sheet) return;

    const updatedRows = (sheet.rows || []).filter(r => r.id !== item.id);
    const updatedTotal = updatedRows
      .filter(r => r.cells?.status !== 'received')
      .reduce((sum, r) => sum + (Number(r.cells?.amount) || 0), 0);

    onSaveWorksheet({
      ...sheet,
      rows: updatedRows,
      totalAmount: updatedTotal,
      updatedAt: new Date().toISOString(),
    });

    setActiveUpcomingModalCat(null);
    setEditingUpcomingItem(null);
    showToast(`✓ Deleted upcoming entry "${item.title}"`);
  };

  const handleDeleteSelectedUpcoming = () => {
    if (selectedUpcomingIds.size === 0) return;
    if (!confirm(`Delete ${selectedUpcomingIds.size} selected upcoming items?`)) return;

    worksheets.forEach(ws => {
      if (!ws.rows || ws.rows.length === 0) return;
      const hasAny = ws.rows.some(r => selectedUpcomingIds.has(r.id));
      if (!hasAny) return;

      const updatedRows = ws.rows.filter(r => !selectedUpcomingIds.has(r.id));
      const updatedTotal = updatedRows
        .filter(r => r.cells?.status !== 'received')
        .reduce((sum, r) => sum + (Number(r.cells?.amount) || 0), 0);

      onSaveWorksheet({
        ...ws,
        rows: updatedRows,
        totalAmount: updatedTotal,
        updatedAt: new Date().toISOString(),
      });
    });

    showToast(`Deleted ${selectedUpcomingIds.size} upcoming items`);
    setSelectedUpcomingIds(new Set());
  };

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* 2 DISTINCT SECTIONS SWITCHER: CURRENT vs UPCOMING                 */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* The 2 Primary Distinct Section Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 gap-1.5 w-full md:w-auto">
          {/* Section 1: CURRENT */}
          <button
            onClick={() => handleSectionSwitch('current')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
              sectionType === 'current'
                ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <div className="text-left">
              <span className="block leading-none">1. Current Income</span>
              <span
                className={`text-[10px] font-medium leading-tight block mt-0.5 ${
                  sectionType === 'current' ? 'text-emerald-100' : 'text-slate-500'
                }`}
              >
                Realized • 4 Sections
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ml-1 ${
                sectionType === 'current' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              ৳{totalMonthIncome.toLocaleString()}
            </span>
          </button>

          {/* Section 2: UPCOMING */}
          <button
            onClick={() => handleSectionSwitch('upcoming')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all ${
              sectionType === 'upcoming'
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className="w-4 h-4" />
            <div className="text-left">
              <span className="block leading-none">2. Upcoming Income</span>
              <span
                className={`text-[10px] font-medium leading-tight block mt-0.5 ${
                  sectionType === 'upcoming' ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                Future Due • 3 Sections
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ml-1 ${
                sectionType === 'upcoming' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              ৳{totalUpcomingPendingAmount.toLocaleString()}
            </span>
          </button>
        </div>

        {/* Dynamic Context Action based on Section */}
        <div className="flex items-center gap-2 justify-end">
          {sectionType === 'current' ? (
            <>
              {/* Current Month Navigator */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 min-w-[120px] text-center font-mono">
                  {monthName}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* + Create Category Button */}
              <button
                type="button"
                onClick={() => {
                  setNewCatTarget('realized');
                  setIsCatModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold border border-slate-300 transition-all active:scale-95"
                title="Create custom category"
              >
                <FolderPlus className="w-4 h-4 text-emerald-600" />
                <span>+ Create Category</span>
              </button>

              {/* + Record Realized Income Button */}
              <button
                onClick={() => handleOpenCurrentModal(allCurrentCategoryKeys[0] || 'tution')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Income</span>
              </button>
            </>
          ) : (
            <>
              {/* + Create Category Button */}
              <button
                type="button"
                onClick={() => {
                  setNewCatTarget('upcoming');
                  setIsCatModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold border border-slate-300 transition-all active:scale-95"
                title="Create custom category"
              >
                <FolderPlus className="w-4 h-4 text-indigo-600" />
                <span>+ Create Category</span>
              </button>

              {/* + Record Upcoming Income Button */}
              <button
                onClick={() => handleOpenUpcomingModal(allUpcomingCategoryKeys[0] || 'tution')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-xs shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Record Upcoming Income</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* SECTION 1: CURRENT INCOME (EXISTING REALIZED INCOME)               */}
      {/* ================================================================= */}
      {sectionType === 'current' && (
        <div className="space-y-6">
          {/* Header Bar with Sub-Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Current Income</h2>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Realized Cashflow
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                1. Tuition Income • 2. Father Salary • 3. Selling Product • 4. Others Help
              </p>
            </div>

            {/* Toggle: Category Quick Ledger vs Itemized Records List */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button
                onClick={() => setCurrentActiveTab('category_ledger')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentActiveTab === 'category_ledger'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Category Quick Ledger</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    currentActiveTab === 'category_ledger' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  4 Sections
                </span>
              </button>
              <button
                onClick={() => setCurrentActiveTab('itemized')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentActiveTab === 'itemized'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Itemized Records List</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {allCurrentIncomeRecords.length}
                </span>
              </button>
            </div>
          </div>

          {/* Monthly Total Highlight Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Monthly Income */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
                  Total Income ({monthName})
                </span>
                <div className="text-3xl font-black tracking-tight mt-1 font-mono">
                  ৳ {totalMonthIncome.toLocaleString()}
                </div>
                <p className="text-xs text-emerald-100/90 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Calculated across all 4 income sections
                </p>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Filtered Active Records Total */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Active Records Total
                </span>
                <div className="text-lg font-bold text-slate-800 mt-1 font-mono">
                  {filteredCurrentRecords.length} Items • ৳ {filteredCurrentTotal.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">
                  Filter: {currentFilter === 'all' ? `All ${allCurrentCategoryKeys.length} Sections` : getCurrentIncomeCategoryMeta(currentFilter, customIncomeCategories).label}
                </span>
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg font-bold">
                  Editable Records
                </span>
              </div>
            </div>

            {/* All-Time Cumulative */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  All-Time Cumulative Income
                </span>
                <div className="text-lg font-black text-slate-900 mt-1 font-mono">
                  ৳ {totalAllTimeIncome.toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Add or increase amounts directly in any of the categories below.
                </p>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Sections Active: <strong>{allCurrentCategoryKeys.length} Categories</strong></span>
                <span className="text-emerald-700 font-bold">100% Synced</span>
              </div>
            </div>
          </div>

          {/* VIEW A: CATEGORY QUICK LEDGER (CURRENT) */}
          {currentActiveTab === 'category_ledger' && (
            <div className="space-y-6">
              {/* Category Ledger Control Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {allCurrentCategoryKeys.length} Categorised Income Sections
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click any card to add income or use 1-click quick increment chips (+৳1k, +৳5k, etc.)
                    </p>
                  </div>
                </div>

                {/* Time Scope Toggle: This Month vs All Time */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 mr-1">Time View:</span>
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
                    <button
                      onClick={() => setCurrentTimeScope('month')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentTimeScope === 'month'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {monthName}
                    </button>
                    <button
                      onClick={() => setCurrentTimeScope('all_time')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        currentTimeScope === 'all_time'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All-Time
                    </button>
                  </div>
                </div>
              </div>

              {/* THE INCOME CATEGORY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {currentCategoryStats.map(stat => {
                  const { category, meta, displayAmount, displayCount, records } = stat;
                  const Icon = meta.icon;
                  const theme = meta.theme;
                  const percentOfTotal =
                    activeCurrentScopeTotal > 0 ? Math.round((displayAmount / activeCurrentScopeTotal) * 100) : 0;
                  const isExpanded = expandedCurrentCategory === category;

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
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                                  {meta.title}
                                </h4>
                                {meta.isCustom && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomIncomeCategory(category, meta.label);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete custom category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {displayCount} recorded {displayCount === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${theme.badge}`}>
                            {percentOfTotal}%
                          </span>
                        </div>

                        {/* Amount Display */}
                        <div className="mt-2 mb-3">
                          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                            ৳ {displayAmount.toLocaleString()}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {meta.desc}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${theme.progressBar}`}
                            style={{ width: `${Math.min(100, Math.max(0, percentOfTotal))}%` }}
                          />
                        </div>

                        {/* Direct 1-Click Increment Chips */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Quick +Increase Amount:
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {meta.quickChips.map(chip => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => handleDirectCurrentChipIncrease(category, chip)}
                                className="px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-white/90 hover:bg-white hover:border-slate-400 border border-slate-200/90 text-slate-800 shadow-2xs hover:scale-105 active:scale-95 transition-all text-center"
                                title={`Instantly add ৳${chip.toLocaleString()} to ${meta.title}`}
                              >
                                +৳{chip >= 1000 ? `${chip / 1000}k` : chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                        <button
                          onClick={() => handleOpenCurrentModal(category)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all ${theme.btnBg}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add to {meta.label}</span>
                        </button>

                        <button
                          onClick={() => setExpandedCurrentCategory(isExpanded ? null : category)}
                          className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 flex items-center justify-between transition-colors"
                        >
                          <span>Entries ({displayCount})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Accordion of records for this category */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 max-h-60 overflow-y-auto">
                          {records.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-3 italic">
                              No entries in this period.
                            </p>
                          ) : (
                            records.map(rec => (
                              <div
                                key={rec.id}
                                className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between gap-2 hover:border-slate-300"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-slate-800 truncate">{rec.title}</div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    {rec.date} {rec.description ? `• ${rec.description}` : ''}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-black font-mono text-slate-900">
                                    ৳{rec.amount.toLocaleString()}
                                  </div>
                                  <div className="flex items-center justify-end gap-1 mt-1">
                                    <button
                                      onClick={() => handleStartEditCurrent(rec)}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                      title="Edit entry"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCurrentRecord(rec)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                      title="Delete entry"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW B: ITEMIZED RECORDS LIST (CURRENT) */}
          {currentActiveTab === 'itemized' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Controls Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search income records by title, student, job, notes, amount..."
                      value={currentSearchQuery}
                      onChange={e => setCurrentSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sort */}
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                      <select
                        value={currentSortField}
                        onChange={e => setCurrentSortField(e.target.value as IncomeSortField)}
                        className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs"
                      >
                        <option value="date">Sort: Date</option>
                        <option value="amount">Sort: Amount</option>
                        <option value="title">Sort: Title</option>
                        <option value="category">Sort: Category</option>
                      </select>
                      <button
                        onClick={() => setCurrentSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                        className="ml-1 p-1 text-slate-500 hover:text-slate-800"
                        title="Toggle Asc/Desc"
                      >
                        {currentSortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>

                    {/* Batch Delete */}
                    {selectedCurrentIds.size > 0 && (
                      <button
                        onClick={handleDeleteSelectedCurrent}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete ({selectedCurrentIds.size})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Quick Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => setCurrentFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      currentFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Sections ({allCurrentIncomeRecords.length})
                  </button>
                  {allCurrentCategoryKeys.map(cat => {
                    const count = allCurrentIncomeRecords.filter(r => r.category === cat).length;
                    const meta = getCurrentIncomeCategoryMeta(cat, customIncomeCategories);
                    const isSelected = currentFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setCurrentFilter(cat)}
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
              </div>

              {/* Records Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedCurrentIds.size === filteredCurrentRecords.length) {
                              setSelectedCurrentIds(new Set());
                            } else {
                              setSelectedCurrentIds(new Set(filteredCurrentRecords.map(r => r.id)));
                            }
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {selectedCurrentIds.size > 0 &&
                          selectedCurrentIds.size === filteredCurrentRecords.length ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Section / Category</th>
                      <th className="py-3 px-4">Title / Item</th>
                      <th className="py-3 px-4">Specific Details</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Amount (৳)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCurrentRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-400">
                          <p className="text-sm font-semibold">No income records found</p>
                          <p className="text-xs mt-1">
                            Click "+ Record Income" to add entries or increase amounts in any section.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredCurrentRecords.map(rec => {
                        const meta = getCurrentIncomeCategoryMeta(rec.category, customIncomeCategories);
                        const isSelected = selectedCurrentIds.has(rec.id);
                        return (
                          <tr
                            key={rec.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  const next = new Set(selectedCurrentIds);
                                  if (e.target.checked) next.add(rec.id);
                                  else next.delete(rec.id);
                                  setSelectedCurrentIds(next);
                                }}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${meta?.theme.badge || 'bg-slate-100'}`}
                              >
                                {meta?.label || rec.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{rec.title}</td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {rec.description || '—'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                              {rec.date}
                            </td>
                            <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                              ৳{rec.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCurrentRecord(rec)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold border border-rose-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                                  title="Delete this income record directly"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                                <button
                                  onClick={() => handleStartEditCurrent(rec)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit entry"
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
        </div>
      )}

      {/* ================================================================= */}
      {/* SECTION 2: UPCOMING INCOME (FUTURE / EXPECTED LATER)              */}
      {/* ================================================================= */}
      {sectionType === 'upcoming' && (
        <div className="space-y-6">
          {/* Header Bar with Sub-Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Upcoming Income</h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">
                  Expected Future Cashflow
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Income coming later this month, next month, or open-ended: 1. Tuition • 2. Father Salary • 3. Due Debt
              </p>
            </div>

            {/* Toggle: Upcoming Quick Ledger vs Upcoming Due Records List */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button
                onClick={() => setUpcomingActiveTab('category_ledger')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  upcomingActiveTab === 'category_ledger'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Upcoming Quick Ledger</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    upcomingActiveTab === 'category_ledger' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  3 Categories
                </span>
              </button>
              <button
                onClick={() => setUpcomingActiveTab('itemized')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  upcomingActiveTab === 'itemized'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Upcoming Due List</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono font-bold">
                  {allUpcomingItems.length}
                </span>
              </button>
            </div>
          </div>

          {/* Upcoming Summary Highlight Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Expected Pipeline */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                  Total Expected Upcoming
                </span>
                <div className="text-3xl font-black tracking-tight mt-1 font-mono">
                  ৳ {totalUpcomingPendingAmount.toLocaleString()}
                </div>
                <p className="text-xs text-indigo-200 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {pendingUpcomingItems.length} pending income items in pipeline
                </p>
              </div>
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            </div>

            {/* Time Breakdown Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Pipeline Timing Breakdown
                </span>
                <div className="mt-2 space-y-1.5 text-xs font-semibold">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Due This Month ({monthName}):</span>
                    <span className="font-mono font-bold text-slate-900">৳{upcomingThisMonthAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Due Next Month ({nextMonthName}):</span>
                    <span className="font-mono font-bold text-slate-900">৳{upcomingNextMonthAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-700">
                    <span>Not Specific Date (Tentative):</span>
                    <span className="font-mono font-bold">৳{upcomingUndatedAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span>Flexible date tracking</span>
                <span className="text-indigo-600 font-bold">1-Click Transfer</span>
              </div>
            </div>

            {/* 1-Click Receive Guide Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  One-Click Cash Transfer
                </span>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  When money arrives, click <span className="text-emerald-700 font-bold">"Receive"</span> on any upcoming item to automatically record it into your Current Income!
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Auto-syncs ledger
                </span>
                <button
                  onClick={() => handleOpenUpcomingModal('tution')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  + Add Upcoming
                </button>
              </div>
            </div>
          </div>

          {/* VIEW A: UPCOMING CATEGORY QUICK LEDGER */}
          {upcomingActiveTab === 'category_ledger' && (
            <div className="space-y-6">
              {/* Upcoming Ledger Control Bar */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      {allUpcomingCategoryKeys.length} Upcoming Income Sections
                    </h3>
                    <p className="text-xs text-slate-500">
                      1. Tuition • 2. Father Salary • 3. Due Debt — use quick increment chips (+৳1k, +৳5k, etc.) or add new
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenUpcomingModal('due_debt')}
                    className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-all"
                  >
                    + Record Due Debt
                  </button>
                </div>
              </div>

              {/* THE UPCOMING CATEGORY CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {upcomingCategoryStats.map(stat => {
                  const { category, meta, amount, count, items } = stat;
                  const Icon = meta.icon;
                  const theme = meta.theme;
                  const percentOfTotal =
                    totalUpcomingPendingAmount > 0 ? Math.round((amount / totalUpcomingPendingAmount) * 100) : 0;
                  const isExpanded = expandedUpcomingCategory === category;

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
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                                  {meta.title}
                                </h4>
                                {meta.isCustom && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCustomIncomeCategory(category, meta.label);
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete custom category"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {count} pending {count === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${theme.badge}`}>
                            {percentOfTotal}%
                          </span>
                        </div>

                        {/* Amount Display */}
                        <div className="mt-2 mb-3">
                          <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                            ৳ {amount.toLocaleString()}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {meta.desc}
                          </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden mb-4">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${theme.progressBar}`}
                            style={{ width: `${Math.min(100, Math.max(0, percentOfTotal))}%` }}
                          />
                        </div>

                        {/* Direct 1-Click Increment Chips */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Quick +Increase Expected:
                          </span>
                          <div className="grid grid-cols-4 gap-1">
                            {meta.quickChips.map(chip => (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => handleUpcomingDirectChipIncrease(category, chip)}
                                className="px-1.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-white/90 hover:bg-white hover:border-slate-400 border border-slate-200/90 text-slate-800 shadow-2xs hover:scale-105 active:scale-95 transition-all text-center"
                                title={`Instantly add ৳${chip.toLocaleString()} to ${meta.title}`}
                              >
                                +৳{chip >= 1000 ? `${chip / 1000}k` : chip}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-2">
                        <button
                          onClick={() => handleOpenUpcomingModal(category)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all ${theme.btnBg}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add to {meta.label}</span>
                        </button>

                        <button
                          onClick={() => setExpandedUpcomingCategory(isExpanded ? null : category)}
                          className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/80 flex items-center justify-between transition-colors"
                        >
                          <span>Pending Items ({count})</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Accordion of pending entries for this category */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2 max-h-72 overflow-y-auto">
                          {items.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-3 italic">
                              No pending items in this category.
                            </p>
                          ) : (
                            items.map(item => (
                              <div
                                key={item.id}
                                className="bg-white p-3 rounded-xl border border-slate-200/80 text-xs space-y-2 hover:border-slate-300 transition-all"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="font-bold text-slate-900 truncate">{item.title}</div>
                                    <div className="text-[11px] text-slate-500">
                                      {item.description || 'Upcoming Income Item'}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-black font-mono text-slate-900 text-sm">
                                      ৳{item.amount.toLocaleString()}
                                    </div>
                                    {item.isUndated ? (
                                      <span className="inline-block text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                        📅 Not Specific Date
                                      </span>
                                    ) : (
                                      <span className="inline-block text-[10px] font-mono text-slate-500">
                                        Due: {item.expectedDate}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                  {/* 1-Click Receive Button */}
                                  <button
                                    onClick={() => handleReceiveUpcomingItem(item)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-2xs active:scale-95 transition-all"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Mark Received</span>
                                  </button>

                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteUpcomingItem(item)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
                                      title="Delete this upcoming task directly"
                                    >
                                      <Trash2 className="w-3 h-3 text-rose-600" />
                                      <span>Delete</span>
                                    </button>
                                    <button
                                      onClick={() => handleStartEditUpcoming(item)}
                                      className="p-1 text-slate-400 hover:text-blue-600 rounded flex items-center gap-0.5 text-[11px]"
                                      title="Edit item"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW B: UPCOMING DUE RECORDS TABLE */}
          {upcomingActiveTab === 'itemized' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Controls Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search upcoming items by debtor, student, employer, description, amount..."
                      value={upcomingSearchQuery}
                      onChange={e => setUpcomingSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Sort */}
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1 text-xs">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
                      <select
                        value={upcomingSortField}
                        onChange={e => setUpcomingSortField(e.target.value as IncomeSortField)}
                        className="bg-transparent font-medium text-slate-700 focus:outline-hidden text-xs"
                      >
                        <option value="date">Sort: Date</option>
                        <option value="amount">Sort: Amount</option>
                        <option value="title">Sort: Title</option>
                        <option value="category">Sort: Category</option>
                      </select>
                      <button
                        onClick={() => setUpcomingSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                        className="ml-1 p-1 text-slate-500 hover:text-slate-800"
                        title="Toggle Asc/Desc"
                      >
                        {upcomingSortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>

                    {/* Batch Delete */}
                    {selectedUpcomingIds.size > 0 && (
                      <button
                        onClick={handleDeleteSelectedUpcoming}
                        className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete ({selectedUpcomingIds.size})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters: Category & Timeframe */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <button
                      onClick={() => setUpcomingCategoryFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        upcomingCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      All Categories ({allUpcomingItems.length})
                    </button>
                    {allUpcomingCategoryKeys.map(cat => {
                      const count = allUpcomingItems.filter(r => r.category === cat).length;
                      const meta = getUpcomingIncomeCategoryMeta(cat, customIncomeCategories);
                      const isSelected = upcomingCategoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setUpcomingCategoryFilter(cat)}
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

                  {/* Timing Filter: All, This Month, Next Month, Dropdown of Month Names, Undated */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 text-xs">
                      <button
                        onClick={() => setUpcomingTimeFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          upcomingTimeFilter === 'all' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        All Times
                      </button>
                      <button
                        onClick={() => setUpcomingTimeFilter('this_month')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          upcomingTimeFilter === 'this_month' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        This Month
                      </button>
                      <button
                        onClick={() => setUpcomingTimeFilter('next_month')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          upcomingTimeFilter === 'next_month' ? 'bg-indigo-100 text-indigo-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Next Month
                      </button>
                      <button
                        onClick={() => setUpcomingTimeFilter('undated')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          upcomingTimeFilter === 'undated' ? 'bg-amber-100 text-amber-900' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        📅 Open Date
                      </button>
                    </div>

                    {/* Month Name Select Dropdown (Nov, Dec, Jan, Feb, etc.) */}
                    <div className="relative">
                      <select
                        value={
                          upcomingTimeFilter !== 'all' &&
                          upcomingTimeFilter !== 'this_month' &&
                          upcomingTimeFilter !== 'next_month' &&
                          upcomingTimeFilter !== 'undated'
                            ? upcomingTimeFilter
                            : ''
                        }
                        onChange={e => {
                          if (e.target.value) {
                            setUpcomingTimeFilter(e.target.value);
                          }
                        }}
                        className={`appearance-none pl-2.5 pr-7 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          upcomingTimeFilter !== 'all' &&
                          upcomingTimeFilter !== 'this_month' &&
                          upcomingTimeFilter !== 'next_month' &&
                          upcomingTimeFilter !== 'undated'
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
                          upcomingTimeFilter !== 'all' &&
                          upcomingTimeFilter !== 'this_month' &&
                          upcomingTimeFilter !== 'next_month' &&
                          upcomingTimeFilter !== 'undated'
                            ? 'text-white'
                            : 'text-slate-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upcoming Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 w-10">
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedUpcomingIds.size === filteredUpcomingItems.length) {
                              setSelectedUpcomingIds(new Set());
                            } else {
                              setSelectedUpcomingIds(new Set(filteredUpcomingItems.map(r => r.id)));
                            }
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {selectedUpcomingIds.size > 0 &&
                          selectedUpcomingIds.size === filteredUpcomingItems.length ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="py-3 px-4">Upcoming Category</th>
                      <th className="py-3 px-4">Debtor / Student / Job</th>
                      <th className="py-3 px-4">Details / Context</th>
                      <th className="py-3 px-4">Expected Timing</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Expected Amount (৳)</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUpcomingItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-400">
                          <p className="text-sm font-semibold">No upcoming items match filter</p>
                          <p className="text-xs mt-1">
                            Click "+ Record Upcoming Income" to register tuition, salary, or due debt coming later.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUpcomingItems.map(item => {
                        const meta = getUpcomingIncomeCategoryMeta(item.category, customIncomeCategories);
                        const isSelected = selectedUpcomingIds.has(item.id);
                        const isReceived = item.status === 'received';

                        return (
                          <tr
                            key={item.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? 'bg-indigo-50/40' : ''
                            } ${isReceived ? 'opacity-60 bg-slate-50/40' : ''}`}
                          >
                            <td className="py-3 px-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  const next = new Set(selectedUpcomingIds);
                                  if (e.target.checked) next.add(item.id);
                                  else next.delete(item.id);
                                  setSelectedUpcomingIds(next);
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] border ${meta.theme.badge}`}
                              >
                                {meta.label}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{item.title}</td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                              {item.description || '—'}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600">
                              {item.isUndated ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold">
                                  <span>📅 Not Specific Date</span>
                                </span>
                              ) : (
                                <span>{item.expectedDate || item.targetMonth}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isReceived ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold border border-emerald-300">
                                  <Check className="w-3 h-3" /> Received
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold border border-indigo-200">
                                  <Clock className="w-3 h-3" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-black font-mono text-slate-900">
                              ৳{item.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isReceived && (
                                  <button
                                    onClick={() => handleReceiveUpcomingItem(item)}
                                    className="flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-all"
                                    title="Mark as received and transfer into Current Income"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>Receive</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleStartEditUpcoming(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg text-xs font-semibold transition-all"
                                  title="Edit entry"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteUpcomingItem(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                                  title="Delete this task or entry immediately"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
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
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 1: ADD / INCREASE REALIZED CURRENT INCOME                    */}
      {/* ================================================================= */}
      {activeCurrentModalCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getCurrentIncomeCategoryMeta(activeCurrentModalCat, customIncomeCategories).theme.iconBg}`}
                >
                  {React.createElement(getCurrentIncomeCategoryMeta(activeCurrentModalCat, customIncomeCategories).icon, {
                    className: 'w-5 h-5',
                  })}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingCurrentRecord ? 'Edit Income Record' : `Add / Increase ${getCurrentIncomeCategoryMeta(activeCurrentModalCat, customIncomeCategories).title}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Realized Current Income • Updates monthly cashflow & analytics
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveCurrentModalCat(null);
                  setEditingCurrentRecord(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrentModal} className="mt-5 space-y-4">
              {/* Category selector pills inside modal */}
              {!editingCurrentRecord && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Section:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {allCurrentCategoryKeys.map(cat => {
                      const catMeta = getCurrentIncomeCategoryMeta(cat, customIncomeCategories);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveCurrentModalCat(cat)}
                          className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all text-center border ${
                            activeCurrentModalCat === cat
                              ? `${catMeta.theme.btnBg} border-transparent shadow-xs`
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {catMeta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. SPECIFIC FIELDS: TUITION */}
              {activeCurrentModalCat === 'tution' && (
                <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Tuition Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Student / Tuition Name: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Tanvir Coaching, Shuvo Math Batch, Private Batch 2..."
                      value={formTuitionName}
                      onChange={e => setFormTuitionName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Class / Batch:</label>
                      <input
                        type="text"
                        placeholder="e.g. Class 9, HSC 2026..."
                        value={formStudentClass}
                        onChange={e => setFormStudentClass(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Subject:</label>
                      <input
                        type="text"
                        placeholder="e.g. Math, Physics, English..."
                        value={formSubject}
                        onChange={e => setFormSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. SPECIFIC FIELDS: FATHER SALARY */}
              {activeCurrentModalCat === 'father_salary' && (
                <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Father Salary Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Job / Employer / Organization: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Head Office, City Bank Ltd, Factory Office..."
                      value={formJob}
                      onChange={e => setFormJob(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Salary Description / Period (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. October Regular Salary + Eid Festival Bonus..."
                      value={formSalaryNote}
                      onChange={e => setFormSalaryNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 3. SPECIFIC FIELDS: SELLING PRODUCT */}
              {activeCurrentModalCat === 'selling_product' && (
                <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Store className="w-4 h-4 text-amber-600" />
                    <span>Product Sales Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Which Product / Item Name: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Pure Honey 2kg, Farm Milk, Handcrafted Jamdani..."
                      value={formProductName}
                      onChange={e => setFormProductName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Quantity / Units Sold (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 kg, 2 bottles, 10 jars, 4 packets..."
                      value={formProductQuantity}
                      onChange={e => setFormProductQuantity(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 4. SPECIFIC FIELDS: OTHERS HELP */}
              {activeCurrentModalCat === 'others_help' && (
                <div className="space-y-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800">
                    <HeartHandshake className="w-4 h-4 text-purple-600" />
                    <span>Others Help Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Who Helped / Contributor Name: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Uncle Faruk, Elder Brother, Community Trust..."
                      value={formWhoHelp}
                      onChange={e => setFormWhoHelp(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Purpose / Occasion (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Eid Gift, College Admission Support, Family Loan Repayment..."
                      value={formHelpOccasion}
                      onChange={e => setFormHelpOccasion(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 5. SPECIFIC FIELDS: CUSTOM CATEGORY */}
              {activeCurrentModalCat &&
                activeCurrentModalCat !== 'tution' &&
                activeCurrentModalCat !== 'father_salary' &&
                activeCurrentModalCat !== 'selling_product' &&
                activeCurrentModalCat !== 'others_help' && (
                  <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <Tag className="w-4 h-4 text-emerald-600" />
                      <span>{getCurrentIncomeCategoryMeta(activeCurrentModalCat, customIncomeCategories).label} Details:</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Particulars / Source Name: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Freelance Consulting, Service Fee, Dividend..."
                        value={formTuitionName}
                        onChange={e => setFormTuitionName(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Note / Remarks (Optional):
                      </label>
                      <input
                        type="text"
                        placeholder="Additional notes..."
                        value={formSubject}
                        onChange={e => setFormSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                )}

              {/* Amount Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Amount Presets:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {[500, 1000, 2000, 3000, 5000, 10000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCurrentFormAmountStr(amt.toString())}
                      className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 font-mono font-bold text-xs transition-all active:scale-95 text-center"
                    >
                      +৳{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Amount in Taka (৳): <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 5000"
                    value={currentFormAmountStr}
                    onChange={e => setCurrentFormAmountStr(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-lg font-mono font-bold rounded-xl border border-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Payment Date: <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={currentFormDate}
                  onChange={e => setCurrentFormDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCurrentModalCat(null);
                      setEditingCurrentRecord(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  {editingCurrentRecord && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrentRecord(editingCurrentRecord)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs"
                      title="Directly delete this income record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entry</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingCurrentRecord ? 'Save Changes' : `Add to ${getCurrentIncomeCategoryMeta(activeCurrentModalCat, customIncomeCategories).title}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: ADD / INCREASE UPCOMING INCOME (FUTURE / DUE / DEBT)       */}
      {/* ================================================================= */}
      {activeUpcomingModalCat && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getUpcomingIncomeCategoryMeta(activeUpcomingModalCat, customIncomeCategories).theme.iconBg}`}
                >
                  {React.createElement(getUpcomingIncomeCategoryMeta(activeUpcomingModalCat, customIncomeCategories).icon, {
                    className: 'w-5 h-5',
                  })}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {editingUpcomingItem ? 'Edit Upcoming Item' : `+ Add to ${getUpcomingIncomeCategoryMeta(activeUpcomingModalCat, customIncomeCategories).title}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Money expected later • Support for exact date or open/undated
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveUpcomingModalCat(null);
                  setEditingUpcomingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpcomingModal} className="mt-5 space-y-4">
              {/* Category selector pills inside upcoming modal */}
              {!editingUpcomingItem && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Select Upcoming Category:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allUpcomingCategoryKeys.map(cat => {
                      const catMeta = getUpcomingIncomeCategoryMeta(cat, customIncomeCategories);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setActiveUpcomingModalCat(cat)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center border ${
                            activeUpcomingModalCat === cat
                              ? `${catMeta.theme.btnBg} border-transparent shadow-xs`
                              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          {catMeta.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1. UPCOMING TUITION */}
              {activeUpcomingModalCat === 'tution' && (
                <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span>Upcoming Tuition Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Student / Tuition Name: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Arif Coaching Batch, Fahim HSC Math, Batch C..."
                      value={upcomingStudentName}
                      onChange={e => setUpcomingStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Class / Batch:</label>
                      <input
                        type="text"
                        placeholder="e.g. Class 10, Batch 1..."
                        value={upcomingStudentClass}
                        onChange={e => setUpcomingStudentClass(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">Subject:</label>
                      <input
                        type="text"
                        placeholder="e.g. Higher Math, Chemistry..."
                        value={upcomingSubject}
                        onChange={e => setUpcomingSubject(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. UPCOMING FATHER SALARY */}
              {activeUpcomingModalCat === 'father_salary' && (
                <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-800">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>Upcoming Father Salary Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Job / Employer / Organization: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. ABC Textiles Ltd, Corporate Office, Monthly Payroll..."
                      value={upcomingJob}
                      onChange={e => setUpcomingJob(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Salary Period / Notes (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. October 2026 Salary, Overtime Allowance, Bonus..."
                      value={upcomingSalaryPeriod}
                      onChange={e => setUpcomingSalaryPeriod(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 3. UPCOMING DUE DEBT */}
              {activeUpcomingModalCat === 'due_debt' && (
                <div className="space-y-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <Coins className="w-4 h-4 text-amber-600" />
                    <span>Due Debt Recovery Details:</span>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Debtor / Person Who Owes Money: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Uncle Rafiq, Hasan (Friend), Shopkeeper Rahim..."
                      value={upcomingDebtorName}
                      onChange={e => setUpcomingDebtorName(e.target.value)}
                      className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Debt Context / Reason (Optional):
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Loan given in July for emergency, pending business credit..."
                      value={upcomingDebtReason}
                      onChange={e => setUpcomingDebtReason(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {/* 4. SPECIFIC FIELDS: CUSTOM UPCOMING CATEGORY */}
              {activeUpcomingModalCat &&
                activeUpcomingModalCat !== 'tution' &&
                activeUpcomingModalCat !== 'father_salary' &&
                activeUpcomingModalCat !== 'due_debt' && (
                  <div className="space-y-3 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span>{getUpcomingIncomeCategoryMeta(activeUpcomingModalCat, customIncomeCategories).label} Details:</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Expected Stream / Source Name: <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Contract Retainer, Project Milestone, Dividend Payout..."
                        value={upcomingStudentName}
                        onChange={e => setUpcomingStudentName(e.target.value)}
                        className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                )}

              {/* General Note */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Additional Note / Description (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Promised to transfer via bKash / bank by end of month..."
                  value={upcomingGeneralNote}
                  onChange={e => setUpcomingGeneralNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              {/* Quick Amount Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quick Amount Presets:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {[1000, 2000, 3000, 5000, 10000, 20000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setUpcomingFormAmountStr(amt.toString())}
                      className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 text-slate-700 font-mono font-bold text-xs transition-all active:scale-95 text-center"
                    >
                      +৳{amt >= 1000 ? `${amt / 1000}k` : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Expected Amount in Taka (৳): <span className="text-rose-500">*</span>
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
                    placeholder="e.g. 5000"
                    value={upcomingFormAmountStr}
                    onChange={e => setUpcomingFormAmountStr(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-lg font-mono font-bold rounded-xl border border-indigo-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              {/* DATE SELECTION (INCLUDING NOT SPECIFIC DATE OPTION) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                {/* Option for Not Specific Date */}
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="undated_toggle"
                      className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-2"
                    >
                      <input
                        id="undated_toggle"
                        type="checkbox"
                        checked={upcomingIsUndated}
                        onChange={e => setUpcomingIsUndated(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>📅 No specific date (Tentative / Open date)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 ml-6 mt-0.5">
                      Check this if exact date is unknown or money can arrive anytime
                    </p>
                  </div>
                  {upcomingIsUndated && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                      Open Date
                    </span>
                  )}
                </div>

                {/* If undated: target month horizon selector */}
                {upcomingIsUndated ? (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Expected Month Horizon:
                    </label>
                    <select
                      value={upcomingTargetHorizon}
                      onChange={e => setUpcomingTargetHorizon(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="later">⚡ Flexible / Open Horizon</option>
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
                  /* If specific date: calendar picker */
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Expected Payment / Return Date: <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required={!upcomingIsUndated}
                      value={upcomingFormDate}
                      onChange={e => setUpcomingFormDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveUpcomingModalCat(null);
                      setEditingUpcomingItem(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  {editingUpcomingItem && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUpcomingItem(editingUpcomingItem)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs"
                      title="Directly delete this task or entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Task</span>
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingUpcomingItem ? 'Save Changes' : `Add to ${getUpcomingIncomeCategoryMeta(activeUpcomingModalCat, customIncomeCategories).title}`}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: CREATE CUSTOM INCOME CATEGORY                             */}
      {/* ================================================================= */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Create Income Category</h3>
                  <p className="text-xs text-slate-500">Add a custom income section to your diary</p>
                </div>
              </div>
              <button
                onClick={() => setIsCatModalOpen(false)}
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
                  placeholder="e.g. Freelancing, Agricultural Crop, Rental Shop..."
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Description / Purpose (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Income from freelance client projects & code retainers"
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              {/* Scope Target: Both, Realized Only, Upcoming Only */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Category Target Stream:
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewCatTarget('both')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                      newCatTarget === 'both'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Both Streams
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatTarget('realized')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                      newCatTarget === 'realized'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Current Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatTarget('upcoming')}
                    className={`py-2 px-2 rounded-xl font-bold border transition-all text-center ${
                      newCatTarget === 'upcoming'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Upcoming Only
                  </button>
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Select Icon:
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { name: 'Briefcase', Icon: Briefcase },
                    { name: 'GraduationCap', Icon: GraduationCap },
                    { name: 'Store', Icon: Store },
                    { name: 'HeartHandshake', Icon: HeartHandshake },
                    { name: 'Coins', Icon: Coins },
                    { name: 'Sparkles', Icon: Sparkles },
                    { name: 'Receipt', Icon: Receipt },
                    { name: 'Home', Icon: Home },
                    { name: 'Activity', Icon: Activity },
                    { name: 'Heart', Icon: Heart },
                    { name: 'ShoppingBag', Icon: ShoppingBag },
                    { name: 'Gift', Icon: Gift },
                  ].map(({ name, Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewCatIcon(name)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                        newCatIcon === name
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Color Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Color Theme:
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'emerald', bg: 'bg-emerald-500' },
                    { id: 'blue', bg: 'bg-blue-500' },
                    { id: 'amber', bg: 'bg-amber-500' },
                    { id: 'purple', bg: 'bg-purple-500' },
                    { id: 'rose', bg: 'bg-rose-500' },
                    { id: 'cyan', bg: 'bg-cyan-500' },
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCatColor(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} transition-all ${
                        newCatColor === c.id ? 'ring-3 ring-offset-2 ring-slate-800 scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Category</span>
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
