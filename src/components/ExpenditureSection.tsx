import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Edit3,
  Search,
  Filter,
  Check,
  TrendingDown,
  TrendingUp,
  Clock,
  ArrowRight,
  Layers,
  Sparkles,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  CheckSquare,
  Square,
  AlertTriangle,
  Zap,
  Tag,
  CreditCard,
  HeartHandshake,
  Car,
  UserCheck,
  ShoppingBag,
  Home,
  Activity,
  GraduationCap,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  FolderPlus,
  Coins,
  Wallet,
  ArrowUpRight,
  Info,
  CalendarClock,
  CheckCircle2,
} from 'lucide-react';
import { Expenditure, Worksheet, Project } from '../types/family';
import { AIBudgetForecast } from './AIBudgetForecast';
import { ProjectSection } from './ProjectSection';
import { SpendingTrendsDashboard } from './SpendingTrendsDashboard';

interface ExpenditureSectionProps {
  expenditures: Expenditure[];
  worksheets?: Worksheet[];
  projects?: Project[];
  initialSubSection?: 'current' | 'upcoming';
  onSubSectionChange?: (sub: 'current' | 'upcoming') => void;
  onAddExpenditure: (exp: Expenditure) => void;
  onUpdateExpenditure?: (exp: Expenditure) => void;
  onDeleteExpenditure: (id: string) => void;
  onAddProject?: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}

export const EXPENDITURE_CATEGORIES = [
  'Debt',
  'Donation',
  'Transportation',
  'Payment',
  'Father Giving',
  'Grocery',
  'Utilities',
  'House Rent',
  'Health',
  'Education',
  'Shopping',
  'Others',
] as const;

type SortField = 'date' | 'amount' | 'category' | 'description';
type SortOrder = 'asc' | 'desc';
type QuickListView =
  | 'all_month'
  | 'debt_list'
  | 'donation_list'
  | 'transportation'
  | 'payment'
  | 'father_giving'
  | 'grocery'
  | 'undated_list'
  | 'all_time';

export const ExpenditureSection: React.FC<ExpenditureSectionProps> = ({
  expenditures,
  worksheets = [],
  projects = [],
  initialSubSection = 'current',
  onSubSectionChange,
  onAddExpenditure,
  onUpdateExpenditure,
  onDeleteExpenditure,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
}) => {
  // -------------------------------------------------------------------------
  // 2 DISTINCT SECTIONS SWITCHER: 'current' vs 'upcoming'
  // -------------------------------------------------------------------------
  const [sectionType, setSectionType] = useState<'current' | 'upcoming'>(
    initialSubSection || 'current'
  );

  useEffect(() => {
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

  const totalUpcomingRemaining = useMemo(() => {
    return (projects || []).reduce(
      (sum, p) => sum + (p.status === 'completed' ? 0 : (p.amount ?? p.expectedAmount ?? 0)),
      0
    );
  }, [projects]);

  // Dynamic reference date in local timezone
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = String(now.getMonth() + 1).padStart(2, '0');
  const todayDay = String(now.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;

  // Navigation & View Mode: Category Quick Ledger vs Itemized Records vs Spending Trends vs AI Budget Forecast
  const [activeTab, setActiveTab] = useState<'category_ledger' | 'itemized' | 'spending_trends' | 'ai_forecast'>('category_ledger');
  const [selectedMonth, setSelectedMonth] = useState(`${todayYear}-${todayMonth}`); // YYYY-MM
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickView, setQuickView] = useState<QuickListView>('all_month');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Custom categories state with localStorage persistence
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('family_diary_custom_categories_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Error reading custom categories:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('family_diary_custom_categories_v1', JSON.stringify(customCategories));
    } catch (e) {
      console.warn('Error saving custom categories:', e);
    }
  }, [customCategories]);

  // Category Quick Ledger State
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryTimeScope, setCategoryTimeScope] = useState<'month' | 'all_time'>('month');
  const [categorySortBy, setCategorySortBy] = useState<'amount_desc' | 'amount_asc' | 'name' | 'count'>('amount_desc');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Quick Increase & 1-Click Quick Add State
  const [quickAddBarCategory, setQuickAddBarCategory] = useState<string>('Transportation');
  const [increaseModalCategory, setIncreaseModalCategory] = useState<string | null>(null);
  const [increaseAmountStr, setIncreaseAmountStr] = useState<string>('');
  const [increaseDescription, setIncreaseDescription] = useState<string>('');
  const [increaseDate, setIncreaseDate] = useState<string>(todayStr);

  // Add Custom Category Modal State
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [newCategoryInitialAmount, setNewCategoryInitialAmount] = useState<string>('');
  const [newCategoryNote, setNewCategoryNote] = useState<string>('');

  // Multi-selection state for batch delete
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Wizard modal state (Create)
  const [showWizard, setShowWizard] = useState(false);
  const [isUndated, setIsUndated] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [targetDateCount, setTargetDateCount] = useState<number>(1);
  const [selectedDates, setSelectedDates] = useState<string[]>([todayStr]);
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('Transportation');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategoryActive, setIsCustomCategoryActive] = useState<boolean>(false);

  // Edit Modal State (Edit Expenditure)
  const [editingExp, setEditingExp] = useState<Expenditure | null>(null);
  const [editAmountStr, setEditAmountStr] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('Transportation');
  const [editCustomCategory, setEditCustomCategory] = useState<string>('');
  const [editIsCustomActive, setEditIsCustomActive] = useState<boolean>(false);
  const [editDates, setEditDates] = useState<string[]>([]);
  const [editIsUndated, setEditIsUndated] = useState<boolean>(false);
  const [editMonth, setEditMonth] = useState<string>('');

  // Delete confirmation modal state
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Month navigation calculations
  const [yearNum, monthNum] = selectedMonth.split('-').map(Number);
  const monthDate = new Date(yearNum, monthNum - 1, 1);
  const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const handlePrevMonth = () => {
    const prev = new Date(yearNum, monthNum - 2, 1);
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${prev.getFullYear()}-${m}`);
    setSelectedIds(new Set());
  };

  const handleNextMonth = () => {
    const next = new Date(yearNum, monthNum, 1);
    const m = String(next.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${next.getFullYear()}-${m}`);
    setSelectedIds(new Set());
  };

  // Category badge styling helper
  const getCategoryBadgeClass = (cat?: string) => {
    switch (cat?.toLowerCase()) {
      case 'transportation':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'payment':
        return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'father giving':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'donation':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'debt':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'education':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'utilities':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'grocery':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'health':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'house rent':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'shopping':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'others':
      case 'other':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Helper to resolve an icon for any category
  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'debt':
        return CreditCard;
      case 'donation':
        return HeartHandshake;
      case 'transportation':
        return Car;
      case 'payment':
        return Receipt;
      case 'father giving':
        return UserCheck;
      case 'grocery':
        return ShoppingBag;
      case 'utilities':
        return Zap;
      case 'house rent':
        return Home;
      case 'health':
        return Activity;
      case 'education':
        return GraduationCap;
      case 'shopping':
        return ShoppingCart;
      default:
        return Tag;
    }
  };

  // Themed styles for category cards
  const getCategoryColorTheme = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'debt':
        return {
          cardBg: 'bg-amber-500/5 hover:bg-amber-500/10 border-amber-200/80 hover:border-amber-400',
          iconBg: 'bg-amber-100 text-amber-700 border-amber-200',
          progressBar: 'bg-amber-500',
          accentText: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-800 border-amber-300',
          btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
          lightBg: 'bg-amber-50',
        };
      case 'donation':
        return {
          cardBg: 'bg-purple-500/5 hover:bg-purple-500/10 border-purple-200/80 hover:border-purple-400',
          iconBg: 'bg-purple-100 text-purple-700 border-purple-200',
          progressBar: 'bg-purple-500',
          accentText: 'text-purple-800',
          badge: 'bg-purple-100 text-purple-800 border-purple-300',
          btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
          lightBg: 'bg-purple-50',
        };
      case 'transportation':
        return {
          cardBg: 'bg-sky-500/5 hover:bg-sky-500/10 border-sky-200/80 hover:border-sky-400',
          iconBg: 'bg-sky-100 text-sky-700 border-sky-200',
          progressBar: 'bg-sky-500',
          accentText: 'text-sky-800',
          badge: 'bg-sky-100 text-sky-800 border-sky-300',
          btnBg: 'bg-sky-600 hover:bg-sky-700 text-white',
          lightBg: 'bg-sky-50',
        };
      case 'payment':
        return {
          cardBg: 'bg-violet-500/5 hover:bg-violet-500/10 border-violet-200/80 hover:border-violet-400',
          iconBg: 'bg-violet-100 text-violet-700 border-violet-200',
          progressBar: 'bg-violet-500',
          accentText: 'text-violet-800',
          badge: 'bg-violet-100 text-violet-800 border-violet-300',
          btnBg: 'bg-violet-600 hover:bg-violet-700 text-white',
          lightBg: 'bg-violet-50',
        };
      case 'father giving':
        return {
          cardBg: 'bg-teal-500/5 hover:bg-teal-500/10 border-teal-200/80 hover:border-teal-400',
          iconBg: 'bg-teal-100 text-teal-700 border-teal-200',
          progressBar: 'bg-teal-500',
          accentText: 'text-teal-800',
          badge: 'bg-teal-100 text-teal-800 border-teal-300',
          btnBg: 'bg-teal-600 hover:bg-teal-700 text-white',
          lightBg: 'bg-teal-50',
        };
      case 'grocery':
        return {
          cardBg: 'bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/80 hover:border-emerald-400',
          iconBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          progressBar: 'bg-emerald-500',
          accentText: 'text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
          lightBg: 'bg-emerald-50',
        };
      case 'utilities':
        return {
          cardBg: 'bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-200/80 hover:border-cyan-400',
          iconBg: 'bg-cyan-100 text-cyan-700 border-cyan-200',
          progressBar: 'bg-cyan-500',
          accentText: 'text-cyan-800',
          badge: 'bg-cyan-100 text-cyan-800 border-cyan-200',
          btnBg: 'bg-cyan-600 hover:bg-cyan-700 text-white',
          lightBg: 'bg-cyan-50',
        };
      case 'house rent':
        return {
          cardBg: 'bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-200/80 hover:border-indigo-400',
          iconBg: 'bg-indigo-100 text-indigo-700 border-indigo-200',
          progressBar: 'bg-indigo-500',
          accentText: 'text-indigo-800',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          btnBg: 'bg-indigo-600 hover:bg-indigo-700 text-white',
          lightBg: 'bg-indigo-50',
        };
      case 'health':
        return {
          cardBg: 'bg-rose-500/5 hover:bg-rose-500/10 border-rose-200/80 hover:border-rose-400',
          iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
          progressBar: 'bg-rose-500',
          accentText: 'text-rose-800',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          btnBg: 'bg-rose-600 hover:bg-rose-700 text-white',
          lightBg: 'bg-rose-50',
        };
      case 'education':
        return {
          cardBg: 'bg-blue-500/5 hover:bg-blue-500/10 border-blue-200/80 hover:border-blue-400',
          iconBg: 'bg-blue-100 text-blue-700 border-blue-200',
          progressBar: 'bg-blue-500',
          accentText: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
          lightBg: 'bg-blue-50',
        };
      case 'shopping':
        return {
          cardBg: 'bg-pink-500/5 hover:bg-pink-500/10 border-pink-200/80 hover:border-pink-400',
          iconBg: 'bg-pink-100 text-pink-700 border-pink-200',
          progressBar: 'bg-pink-500',
          accentText: 'text-pink-800',
          badge: 'bg-pink-100 text-pink-800 border-pink-200',
          btnBg: 'bg-pink-600 hover:bg-pink-700 text-white',
          lightBg: 'bg-pink-50',
        };
      default:
        return {
          cardBg: 'bg-slate-500/5 hover:bg-slate-500/10 border-slate-200/80 hover:border-slate-400',
          iconBg: 'bg-slate-100 text-slate-700 border-slate-200',
          progressBar: 'bg-slate-500',
          accentText: 'text-slate-800',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          btnBg: 'bg-slate-800 hover:bg-slate-900 text-white',
          lightBg: 'bg-slate-50',
        };
    }
  };

  // Unified list of all category names (standard + custom + from data)
  const allCategoriesList = useMemo(() => {
    const set = new Set<string>();
    EXPENDITURE_CATEGORIES.forEach(c => set.add(c));
    customCategories.forEach(c => set.add(c));
    expenditures.forEach(e => {
      if (e.category && e.category.trim()) set.add(e.category.trim());
    });
    return Array.from(set);
  }, [customCategories, expenditures]);

  // Category statistics for the Category Quick Ledger
  const categoryStats = useMemo(() => {
    return allCategoriesList.map(cat => {
      const catLower = cat.toLowerCase();
      const allCatRecords = expenditures.filter(e => {
        const c = (e.category || '').toLowerCase();
        return c === catLower || ((catLower === 'others' || catLower === 'other') && (c === 'others' || c === 'other'));
      });

      const monthRecords = allCatRecords.filter(e =>
        e.month === selectedMonth ||
        (Array.isArray(e.dates) && e.dates.some(d => d.startsWith(selectedMonth))) ||
        (!e.primaryDate && (!e.month || e.month === selectedMonth))
      );

      const monthAmount = monthRecords.reduce((sum, e) => sum + (e.amount || 0), 0);
      const allTimeAmount = allCatRecords.reduce((sum, e) => sum + (e.amount || 0), 0);
      const displayRecords = categoryTimeScope === 'month' ? monthRecords : allCatRecords;
      const displayAmount = categoryTimeScope === 'month' ? monthAmount : allTimeAmount;

      return {
        category: cat,
        monthAmount,
        allTimeAmount,
        displayAmount,
        monthCount: monthRecords.length,
        allTimeCount: allCatRecords.length,
        displayCount: displayRecords.length,
        records: displayRecords.sort((a, b) => {
          const da = a.primaryDate || a.month || '';
          const db = b.primaryDate || b.month || '';
          return db.localeCompare(da);
        }),
      };
    });
  }, [allCategoriesList, expenditures, selectedMonth, categoryTimeScope]);

  // Filtered & Sorted Categories for display
  const filteredSortedCategories = useMemo(() => {
    let list = categoryStats.filter(item => {
      if (!categorySearch.trim()) return true;
      return item.category.toLowerCase().includes(categorySearch.toLowerCase());
    });

    list.sort((a, b) => {
      if (categorySortBy === 'amount_desc') {
        return b.displayAmount - a.displayAmount;
      } else if (categorySortBy === 'amount_asc') {
        return a.displayAmount - b.displayAmount;
      } else if (categorySortBy === 'name') {
        return a.category.localeCompare(b.category);
      } else if (categorySortBy === 'count') {
        return b.displayCount - a.displayCount;
      }
      return 0;
    });

    return list;
  }, [categoryStats, categorySearch, categorySortBy]);

  const totalCategoryLedgerAmount = useMemo(() => {
    return categoryStats.reduce((sum, item) => sum + item.displayAmount, 0);
  }, [categoryStats]);

  const activeCategoriesCount = useMemo(() => {
    return categoryStats.filter(item => item.displayAmount > 0).length;
  }, [categoryStats]);

  const topSpendingCategory = useMemo(() => {
    const sorted = [...categoryStats].sort((a, b) => b.displayAmount - a.displayAmount);
    return sorted.length > 0 && sorted[0].displayAmount > 0 ? sorted[0] : null;
  }, [categoryStats]);

  const handleOpenIncreaseModal = (cat: string, presetAmount?: number) => {
    setIncreaseModalCategory(cat);
    setIncreaseAmountStr(presetAmount ? presetAmount.toString() : '');
    setIncreaseDescription(`${cat} payment`);
    setIncreaseDate(todayStr);
  };

  const handleQuickIncreaseCategory = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!increaseModalCategory) return;
    const parsedAmt = parseFloat(increaseAmountStr);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      showToast('Please enter a valid amount');
      return;
    }

    const targetDate = increaseDate || todayStr;
    const targetMonth = targetDate.slice(0, 7);

    const newExp: Expenditure = {
      id: `exp_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'guest',
      dates: [targetDate],
      primaryDate: targetDate,
      month: targetMonth,
      amount: parsedAmt,
      category: increaseModalCategory,
      description: increaseDescription.trim() || `${increaseModalCategory} increase`,
      createdAt: new Date().toISOString(),
    };

    onAddExpenditure(newExp);
    showToast(`Added ৳${parsedAmt.toLocaleString()} to ${increaseModalCategory}!`);
    setIncreaseModalCategory(null);
    setIncreaseAmountStr('');
    setIncreaseDescription('');
  };

  const handleDirectChipIncrease = (cat: string, increment: number) => {
    const targetDate = todayStr;
    const targetMonth = targetDate.slice(0, 7);

    const newExp: Expenditure = {
      id: `exp_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'guest',
      dates: [targetDate],
      primaryDate: targetDate,
      month: targetMonth,
      amount: increment,
      category: cat,
      description: `${cat} quick increase (+৳${increment.toLocaleString()})`,
      createdAt: new Date().toISOString(),
    };

    onAddExpenditure(newExp);
    showToast(`Added +৳${increment.toLocaleString()} to ${cat}!`);
  };

  const handleDeleteCustomCategory = (catName: string) => {
    if (confirm(`Remove custom category "${catName}"? Existing expenditures will retain this category tag.`)) {
      setCustomCategories(prev => prev.filter(c => c !== catName));
      showToast(`Removed custom category "${catName}"`);
    }
  };

  const handleCreateCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      showToast('Please enter a category name');
      return;
    }

    if (allCategoriesList.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Category "${trimmed}" already exists`);
      return;
    }

    setCustomCategories(prev => [...prev, trimmed]);

    const initAmt = parseFloat(newCategoryInitialAmount);
    if (!isNaN(initAmt) && initAmt > 0) {
      const targetDate = todayStr;
      const targetMonth = targetDate.slice(0, 7);
      const newExp: Expenditure = {
        id: `exp_cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: 'guest',
        dates: [targetDate],
        primaryDate: targetDate,
        month: targetMonth,
        amount: initAmt,
        category: trimmed,
        description: newCategoryNote.trim() || `Initial ${trimmed} amount`,
        createdAt: new Date().toISOString(),
      };
      onAddExpenditure(newExp);
      showToast(`Category "${trimmed}" created with ৳${initAmt.toLocaleString()}!`);
    } else {
      showToast(`Category "${trimmed}" created! You can now increase amount in it.`);
    }

    setShowAddCategoryModal(false);
    setNewCategoryName('');
    setNewCategoryInitialAmount('');
    setNewCategoryNote('');
  };

  // Filtered & Sorted expenditures based on User selections
  const filteredExpenditures = useMemo(() => {
    return expenditures
      .filter(exp => {
        const catLower = (exp.category || '').toLowerCase();

        // Quick view mode filter
        if (quickView === 'transportation') {
          if (catLower !== 'transportation') return false;
        } else if (quickView === 'payment') {
          if (catLower !== 'payment') return false;
        } else if (quickView === 'father_giving') {
          if (catLower !== 'father giving') return false;
        } else if (quickView === 'donation_list') {
          if (catLower !== 'donation') return false;
        } else if (quickView === 'debt_list') {
          if (catLower !== 'debt') return false;
        } else if (quickView === 'grocery') {
          if (catLower !== 'grocery') return false;
        } else if (quickView === 'undated_list') {
          if (exp.dates && exp.dates.length > 0) return false;
        } else if (quickView === 'all_month') {
          // Matches month
          const matchesMonth =
            exp.month === selectedMonth ||
            (Array.isArray(exp.dates) && exp.dates.some(d => d.startsWith(selectedMonth))) ||
            (!exp.primaryDate && (!exp.month || exp.month === selectedMonth));
          if (!matchesMonth) return false;
        }
        // If quickView is 'all_time', it doesn't filter by month

        // Specific category filter dropdown
        if (filterCategory !== 'all') {
          const filterLower = filterCategory.toLowerCase();
          if (catLower !== filterLower) {
            // Also treat 'other' and 'others' as matching
            if (!((filterLower === 'others' || filterLower === 'other') && (catLower === 'others' || catLower === 'other'))) {
              return false;
            }
          }
        }

        // Search text
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchDesc = exp.description.toLowerCase().includes(q);
          const matchCat = (exp.category || '').toLowerCase().includes(q);
          const matchDate = (exp.dates || []).some(d => d.includes(q)) || (exp.primaryDate || '').includes(q);
          if (!matchDesc && !matchCat && !matchDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'amount') {
          cmp = a.amount - b.amount;
        } else if (sortField === 'category') {
          cmp = (a.category || '').localeCompare(b.category || '');
        } else if (sortField === 'description') {
          cmp = a.description.localeCompare(b.description);
        } else {
          // Date sorting
          const dateA = a.primaryDate || a.month || '';
          const dateB = b.primaryDate || b.month || '';
          cmp = dateA.localeCompare(dateB);
        }
        return sortOrder === 'desc' ? -cmp : cmp;
      });
  }, [expenditures, selectedMonth, filterCategory, searchQuery, quickView, sortField, sortOrder]);

  // Total expenditure in active month
  const totalMonthExpenditure = useMemo(() => {
    return expenditures
      .filter(exp =>
        exp.month === selectedMonth ||
        (Array.isArray(exp.dates) && exp.dates.some(d => d.startsWith(selectedMonth))) ||
        (!exp.primaryDate && (!exp.month || exp.month === selectedMonth))
      )
      .reduce((sum, item) => sum + item.amount, 0);
  }, [expenditures, selectedMonth]);

  // Total amount in the currently filtered list
  const currentFilteredTotal = useMemo(() => {
    return filteredExpenditures.reduce((sum, item) => sum + item.amount, 0);
  }, [filteredExpenditures]);

  // Multi-select toggle handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredExpenditures.length && filteredExpenditures.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenditures.map(e => e.id)));
    }
  };

  const handleToggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} selected expenditure record(s)?`)) {
      selectedIds.forEach(id => onDeleteExpenditure(id));
      showToast(`Deleted ${selectedIds.size} expenditure records`);
      setSelectedIds(new Set());
    }
  };

  const handleDeleteEntireActiveList = () => {
    if (filteredExpenditures.length === 0) return;
    filteredExpenditures.forEach(e => onDeleteExpenditure(e.id));
    showToast(`Deleted entire list (${filteredExpenditures.length} records)`);
    setConfirmDeleteList(false);
    setSelectedIds(new Set());
  };

  // Edit Expenditure Handlers
  const handleStartEdit = (exp: Expenditure) => {
    setEditingExp(exp);
    setEditAmountStr(exp.amount.toString());
    setEditDescription(exp.description);
    const existingCat = exp.category || 'Transportation';
    const isStandard = (EXPENDITURE_CATEGORIES as readonly string[]).includes(existingCat);
    if (isStandard) {
      setEditCategory(existingCat);
      setEditIsCustomActive(false);
      setEditCustomCategory('');
    } else {
      setEditCategory('Others');
      setEditIsCustomActive(true);
      setEditCustomCategory(existingCat);
    }
    setEditDates(Array.isArray(exp.dates) ? [...exp.dates] : []);
    setEditIsUndated(!exp.dates || exp.dates.length === 0);
    setEditMonth(exp.month || selectedMonth);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExp) return;

    const parsedAmount = parseFloat(editAmountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || !editDescription.trim()) {
      showToast('Please enter a valid amount and description');
      return;
    }

    const finalCategory = editIsCustomActive && editCustomCategory.trim()
      ? editCustomCategory.trim()
      : (editCategory || 'Others');

    const isNoDate = editIsUndated || editDates.length === 0;
    const primaryDate = isNoDate ? '' : (editDates[0] || todayStr);
    const updatedMonth = editMonth || (primaryDate ? primaryDate.slice(0, 7) : selectedMonth);

    const updatedItem: Expenditure = {
      ...editingExp,
      amount: parsedAmount,
      description: editDescription.trim(),
      category: finalCategory,
      dates: isNoDate ? [] : editDates,
      primaryDate,
      month: updatedMonth,
    };

    if (onUpdateExpenditure) {
      onUpdateExpenditure(updatedItem);
    } else {
      onAddExpenditure(updatedItem);
    }

    showToast(`Expenditure "${updatedItem.description}" updated`);
    setEditingExp(null);
  };

  // Wizard logic (Create)
  const handleStartWizard = () => {
    setWizardStep(1);
    setIsUndated(false);
    setTargetDateCount(1);
    setSelectedDates([todayStr]);
    setAmountStr('');
    setDescription('');
    setCategory('Transportation');
    setCustomCategory('');
    setIsCustomCategoryActive(false);
    setShowWizard(true);
  };

  const handleSkipDate = () => {
    setIsUndated(true);
    setSelectedDates([]);
    setWizardStep(3); // Jump straight to enter amount
  };

  const handleDateSelectionChange = (index: number, val: string) => {
    const next = [...selectedDates];
    next[index] = val;
    setSelectedDates(next);
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUndated(false);
    const count = Math.max(1, targetDateCount);
    const newDates: string[] = [];
    for (let i = 0; i < count; i++) {
      if (selectedDates[i]) {
        newDates.push(selectedDates[i]);
      } else if (i === 0) {
        newDates.push(todayStr);
      } else {
        const d = new Date(todayYear, now.getMonth(), now.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        newDates.push(`${y}-${m}-${day}`);
      }
    }
    setSelectedDates(newDates);
    setWizardStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDates.length === 0) return;
    setIsUndated(false);
    setWizardStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountStr);
    if (isNaN(val) || val <= 0) return;
    setWizardStep(4);
  };

  const handleCreateExpenditureFinal = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(amountStr);
    if (isNaN(amountVal) || amountVal <= 0 || !description.trim()) return;

    const finalCategory = isCustomCategoryActive && customCategory.trim()
      ? customCategory.trim()
      : (category || 'Others');

    const isNoDate = isUndated || selectedDates.length === 0;
    const primaryDate = isNoDate ? '' : (selectedDates[0] || todayStr);
    const expMonth = isNoDate ? selectedMonth : (primaryDate.slice(0, 7) || selectedMonth);

    const newExpenditure: Expenditure = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'guest',
      dates: isNoDate ? [] : selectedDates,
      primaryDate,
      month: expMonth,
      amount: amountVal,
      description: description.trim(),
      category: finalCategory,
      createdAt: new Date().toISOString(),
    };

    onAddExpenditure(newExpenditure);
    showToast(isNoDate ? 'Undated expenditure saved' : 'Expenditure saved to list');
    setShowWizard(false);
  };

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
                ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-500'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <div className="text-left">
              <span className="block leading-none">1. Current Expenditure</span>
              <span
                className={`text-[10px] font-medium leading-tight block mt-0.5 ${
                  sectionType === 'current' ? 'text-rose-100' : 'text-slate-500'
                }`}
              >
                Realized • {monthName}
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ml-1 ${
                sectionType === 'current' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}
            >
              ৳{totalMonthExpenditure.toLocaleString()}
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
            <CalendarClock className="w-4 h-4" />
            <div className="text-left">
              <span className="block leading-none">2. Upcoming Expenditure</span>
              <span
                className={`text-[10px] font-medium leading-tight block mt-0.5 ${
                  sectionType === 'upcoming' ? 'text-indigo-100' : 'text-slate-500'
                }`}
              >
                Future Due • 7 Categories
              </span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-black ml-1 ${
                sectionType === 'upcoming' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              ৳{totalUpcomingRemaining.toLocaleString()}
            </span>
          </button>
        </div>

        {/* Dynamic Context Header Right */}
        <div className="text-xs text-slate-500 hidden md:flex items-center gap-2 font-medium">
          <span>{sectionType === 'current' ? 'Viewing Realized Expenditures' : 'Viewing Future Liabilities & Paydowns'}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="font-semibold text-slate-700">
            {sectionType === 'current' ? `${filteredExpenditures.length} records in ${monthName}` : `${(projects || []).length} commitments tracked`}
          </span>
        </div>
      </div>

      {sectionType === 'upcoming' ? (
        <ProjectSection
          projects={projects || []}
          onAddProject={onAddProject || (() => {})}
          onUpdateProject={onUpdateProject || (() => {})}
          onDeleteProject={onDeleteProject || (() => {})}
          onAddExpenditure={onAddExpenditure}
        />
      ) : (
        <>
          {/* Top Header & Tab Navigation Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Monthly Expenditure
            </h2>
            <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200/60">
              Editable Lists & Categories
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Categories: Transportation, Payment, Father Giving, Donation, Grocery, Utilities & more. All records are editable.
          </p>
        </div>

        {/* Action Buttons & Tab Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main Tab Toggle: Category Quick Ledger vs Itemized Records vs AI Forecast */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('category_ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'category_ledger'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category Quick Ledger</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'category_ledger' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}>
                New
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
              <span>Itemized Records List</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-mono">
                {filteredExpenditures.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('spending_trends')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'spending_trends'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Spending Trends</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeTab === 'spending_trends' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                Peak Month
              </span>
            </button>
            <button
              onClick={() => setActiveTab('ai_forecast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ai_forecast'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Budget Forecast</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-100 px-1.5 py-0.2 rounded-full font-extrabold">
                Live
              </span>
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-600 rounded-lg transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs sm:text-sm font-bold text-slate-800 min-w-[120px] text-center">
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

          {/* New Category Button */}
          <button
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition-all"
            title="Add a custom expenditure category"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>+ New Category</span>
          </button>

          {/* Create Expenditure Wizard Button */}
          <button
            onClick={handleStartWizard}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-xs shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Expenditure</span>
          </button>
        </div>
      </div>

      {/* When Spending Trends & Peak Months tab is selected, render Recharts SpendingTrendsDashboard */}
      {activeTab === 'spending_trends' && (
        <SpendingTrendsDashboard
          expenditures={expenditures}
          projects={projects}
          onNavigateToExpense={() => setActiveTab('itemized')}
        />
      )}

      {/* When AI Budget Forecast tab is selected, render full AIBudgetForecast engine */}
      {activeTab === 'ai_forecast' && (
        <AIBudgetForecast
          expenditures={expenditures}
          worksheets={worksheets}
          selectedMonth={selectedMonth}
          monthName={monthName}
        />
      )}

      {/* Main Monthly Total Highlight Banner (Only for ledger and itemized views) */}
      {(activeTab === 'category_ledger' || activeTab === 'itemized') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-red-700 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-semibold text-rose-100 uppercase tracking-wider">
                Total Expenditure ({monthName})
              </span>
              <div className="text-3xl font-black tracking-tight mt-1">
                ৳ {totalMonthExpenditure.toLocaleString()}
              </div>
              <p className="text-xs text-rose-100/90 mt-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Resets every month (Day 1 to {daysInMonth})
              </p>
            </div>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Filtered Total
              </span>
              <div className="text-lg font-bold text-slate-800 mt-1">
                {filteredExpenditures.length} Items • ৳ {currentFilteredTotal.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                View: {quickView === 'all_month' ? `${monthName} records` : quickView.replace('_', ' ')}
              </span>
              <span className="text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-lg font-bold">
                Editable List
              </span>
            </div>
          </div>

          {/* AI Quick Forecast Teaser Card */}
          <div
            onClick={() => setActiveTab('ai_forecast')}
            className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-indigo-800/60 cursor-pointer hover:border-indigo-600 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Budget Forecast</span>
                </span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-bold">
                  Open AI Studio
                </span>
              </div>
              <div className="text-lg font-bold text-white mt-1">
                Burn rate ≈ ৳{Math.round(totalMonthExpenditure / Math.max(1, now.getDate())).toLocaleString()}/day
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Click to run scenario simulations, category risk radar & 30-day curve forecast.
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-indigo-300 font-semibold group-hover:text-white transition-colors">
              <span>View detailed AI forecast</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* Category Quick Ledger View (New Type - Direct Increase in Categories) */}
      {activeTab === 'category_ledger' && (
        <div className="space-y-6">
          {/* Quick Explanatory Banner & Actions Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Category Quick Ledger
                  </h3>
                  <span className="text-[11px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full">
                    Direct Amount Increase
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {categoryTimeScope === 'month' ? monthName : 'All-Time'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                  No need to build a new list from scratch. Click any category below (like <strong>Debt</strong>, <strong>Donation</strong>, etc.) to immediately increase its amount with 1-click preset chips or custom input.
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all shadow-2xs"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Add Category</span>
              </button>
              <button
                onClick={() => setActiveTab('itemized')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                <Receipt className="w-4 h-4 text-slate-500" />
                <span>View Itemized List</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 1-Click Quick Add Bar: 50, 100, 200, 500, 1000 */}
          <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-2xl border border-rose-200/90 p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                  <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-black text-slate-900 tracking-tight">
                      1-Click Quick Add
                    </span>
                    <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                      5 Quick Amounts: ৳50, ৳100, ৳200, ৳500, ৳1000
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Click any amount button below to record the expense immediately in 1 single click:
                  </p>
                </div>
              </div>

              {/* Category picker & 5 1-Click Amount Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-white rounded-xl border border-slate-300 px-3 py-1.5 shadow-2xs">
                  <span className="text-xs font-bold text-slate-500 mr-2">Category:</span>
                  <select
                    value={quickAddBarCategory}
                    onChange={e => setQuickAddBarCategory(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                  >
                    {allCategoriesList.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {[50, 100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleDirectChipIncrease(quickAddBarCategory, amt)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-600 hover:text-white border border-rose-300 hover:border-rose-600 text-rose-800 text-xs font-mono font-black shadow-2xs hover:shadow-xs active:scale-95 transition-all text-center flex items-center gap-1 group cursor-pointer"
                      title={`1-Click Add ৳${amt.toLocaleString()} to ${quickAddBarCategory}`}
                    >
                      <Plus className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                      <span>৳{amt.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filter, Time-Scope & Sort Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Category Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter category (e.g. debt, donation)..."
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 w-52 sm:w-64 font-medium"
                />
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Time Scope Toggle: This Month vs All Time */}
              <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200/80">
                <button
                  onClick={() => setCategoryTimeScope('month')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryTimeScope === 'month'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {monthName}
                </button>
                <button
                  onClick={() => setCategoryTimeScope('all_time')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    categoryTimeScope === 'all_time'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All-Time
                </button>
              </div>

              {/* Sort by dropdown */}
              <div className="flex items-center bg-white rounded-xl border border-slate-200 px-2 py-1 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                <select
                  value={categorySortBy}
                  onChange={e => setCategorySortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-hidden border-none text-xs cursor-pointer"
                >
                  <option value="amount_desc">Sort: Highest Amount</option>
                  <option value="amount_asc">Sort: Lowest Amount</option>
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="count">Sort: Most Entries</option>
                </select>
              </div>
            </div>

            {/* Quick summary numbers */}
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>
                Active: <strong className="text-slate-900 font-bold">{activeCategoriesCount}</strong> / {allCategoriesList.length} Categories
              </span>
              <span>•</span>
              <span>
                Total: <strong className="text-rose-600 font-mono font-bold">৳ {totalCategoryLedgerAmount.toLocaleString()}</strong>
              </span>
            </div>
          </div>

          {/* CATEGORY CARDS GRID */}
          {filteredSortedCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
              <FolderPlus className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm text-slate-600">No categories found matching "{categorySearch}"</p>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create "{categorySearch}" as New Category</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
              {filteredSortedCategories.map(item => {
                const theme = getCategoryColorTheme(item.category);
                const Icon = getCategoryIcon(item.category);
                const percentOfTotal = totalCategoryLedgerAmount > 0
                  ? Math.round((item.displayAmount / totalCategoryLedgerAmount) * 100)
                  : 0;
                const isExpanded = expandedCategory === item.category;
                const isCustom = customCategories.includes(item.category);

                return (
                  <div
                    key={item.category}
                    className={`rounded-2xl border p-5 transition-all flex flex-col justify-between shadow-xs hover:shadow-md ${theme.cardBg}`}
                  >
                    <div>
                      {/* Top Row: Icon + Category Name + Badges */}
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${theme.iconBg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-black text-slate-900 text-base leading-tight">
                                {item.category}
                              </h4>
                              {isCustom && (
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">
                                  Custom
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {item.displayCount} {item.displayCount === 1 ? 'entry' : 'entries'}
                            </span>
                          </div>
                        </div>

                        {/* Top right: Custom category delete or category tag */}
                        <div className="flex items-center gap-1">
                          {isCustom && (
                            <button
                              onClick={() => handleDeleteCustomCategory(item.category)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                              title={`Delete custom category "${item.category}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Middle: Amount Display */}
                      <div className="my-2.5">
                        <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                          ৳ {item.displayAmount.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                          <span>
                            {categoryTimeScope === 'month' ? `${monthName} Total` : 'All-Time Total'}
                          </span>
                          <span className="font-bold text-slate-700">
                            {percentOfTotal}% of total
                          </span>
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${theme.progressBar}`}
                            style={{ width: `${Math.min(100, Math.max(percentOfTotal, item.displayAmount > 0 ? 4 : 0))}%` }}
                          />
                        </div>
                      </div>

                      {/* 1-Click Fast Increment Chips */}
                      <div className="pt-2 border-t border-slate-200/60 mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            1-Click Quick Add:
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1">
                          {[50, 100, 200, 500, 1000].map(inc => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => handleDirectChipIncrease(item.category, inc)}
                              className="px-1 py-1 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-800 text-[10px] sm:text-[11px] font-mono font-extrabold shadow-2xs hover:shadow-xs active:scale-95 transition-all text-center"
                              title={`Directly add ৳${inc.toLocaleString()} to ${item.category} in 1 click`}
                            >
                              +৳{inc >= 1000 ? '1k' : inc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 mt-3 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center gap-2">
                        {/* Custom Increase Button */}
                        <button
                          onClick={() => handleOpenIncreaseModal(item.category)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-98 transition-all ${theme.btnBg}`}
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Increase Amount</span>
                        </button>

                        {/* View in Itemized List */}
                        <button
                          onClick={() => {
                            setFilterCategory(item.category);
                            setActiveTab('itemized');
                          }}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                          title="View this category in the Itemized Records List"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Entries History Accordion Trigger */}
                      {item.records.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/70 text-[11px] font-bold transition-colors"
                          >
                            <span>
                              {isExpanded ? 'Hide' : 'Show'} {item.records.length} {item.records.length === 1 ? 'Entry' : 'Entries'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Accordion Content */}
                          {isExpanded && (
                            <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                              {item.records.map(rec => (
                                <div
                                  key={rec.id}
                                  className="p-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-2 text-xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-slate-800 truncate">
                                      {rec.description}
                                    </div>
                                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{rec.primaryDate || (rec.dates && rec.dates[0]) || 'No date'}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-mono font-bold text-rose-600">
                                      ৳ {rec.amount.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-1 justify-end mt-0.5">
                                      <button
                                        onClick={() => handleStartEdit(rec)}
                                        className="text-[10px] text-indigo-600 hover:underline font-bold"
                                      >
                                        Edit
                                      </button>
                                      <span className="text-slate-300">•</span>
                                      <button
                                        onClick={() => {
                                          onDeleteExpenditure(rec.id);
                                          showToast(`✓ Deleted "${rec.description}"`);
                                        }}
                                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold transition-colors cursor-pointer"
                                        title="Delete this record"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                        <span>Delete</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* History & List Management Section (Itemized Records - Previous List) */}
      {activeTab === 'itemized' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          {/* Top Line: Header & Quick View Pills */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <span>Expenditure Ledger</span>
                <span className="text-xs font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                  {filteredExpenditures.length} Records
                </span>
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  ✏️ Click "Edit" or record row to modify
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Filter by categories (Transportation, Payment, Father Giving, Donation, etc.), edit any record, or delete items.
              </p>
            </div>

            {/* Quick List Views Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Quick Lists:
              </span>
              <button
                onClick={() => setQuickView('all_month')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'all_month'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {monthName}
              </button>
              <button
                onClick={() => setQuickView('transportation')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'transportation'
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-white border-slate-200 text-sky-800 hover:bg-sky-50'
                }`}
              >
                Transportation
              </button>
              <button
                onClick={() => setQuickView('payment')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'payment'
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white border-slate-200 text-violet-800 hover:bg-violet-50'
                }`}
              >
                Payment
              </button>
              <button
                onClick={() => setQuickView('father_giving')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'father_giving'
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white border-slate-200 text-teal-800 hover:bg-teal-50'
                }`}
              >
                Father Giving
              </button>
              <button
                onClick={() => setQuickView('donation_list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'donation_list'
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white border-slate-200 text-purple-800 hover:bg-purple-50'
                }`}
              >
                Donation
              </button>
              <button
                onClick={() => setQuickView('debt_list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'debt_list'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white border-slate-200 text-amber-800 hover:bg-amber-50'
                }`}
              >
                Debt
              </button>
              <button
                onClick={() => setQuickView('grocery')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'grocery'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white border-slate-200 text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                Grocery
              </button>
              <button
                onClick={() => setQuickView('undated_list')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'undated_list'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Undated
              </button>
              <button
                onClick={() => setQuickView('all_time')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  quickView === 'all_time'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                All Records
              </button>
            </div>
          </div>

          {/* Bottom Filter & Actions Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-200/60">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, category, or date..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-rose-500 w-48 sm:w-60"
                />
              </div>

              {/* Category Filter Dropdown */}
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Categories</option>
                {EXPENDITURE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Sort Order */}
              <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5">
                <select
                  value={sortField}
                  onChange={e => setSortField(e.target.value as SortField)}
                  className="px-2 py-1 bg-transparent text-xs font-semibold text-slate-700 focus:outline-hidden border-none"
                >
                  <option value="date">Sort: Date</option>
                  <option value="amount">Sort: Amount</option>
                  <option value="category">Sort: Category</option>
                  <option value="description">Sort: Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                  title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List Actions: Delete Selected / Delete Whole List */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedIds.size})</span>
                </button>
              )}

              {filteredExpenditures.length > 0 && (
                <button
                  onClick={() => setConfirmDeleteList(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                  title="Delete all items currently visible in this list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Entire List ({filteredExpenditures.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expenditure Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
                <th className="px-3 py-3 w-8 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-700"
                    title={selectedIds.size === filteredExpenditures.length ? 'Deselect all' : 'Select all'}
                  >
                    {selectedIds.size === filteredExpenditures.length && filteredExpenditures.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3">Dates Covered</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-right">Amount (৳)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenditures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No expenditures found matching your filter criteria. Click "Create Expenditure" above to add one!
                  </td>
                </tr>
              ) : (
                filteredExpenditures.map(exp => {
                  const isSelected = selectedIds.has(exp.id);
                  return (
                    <tr
                      key={exp.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        isSelected ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => handleToggleSelectItem(exp.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>

                      {/* Dates Covered */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {exp.dates && exp.dates.length > 0 ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800">
                                {exp.dates.join(', ')}
                              </span>
                            </div>
                            {exp.dates.length > 1 && (
                              <span className="inline-block mt-0.5 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                                Spans {exp.dates.length} days
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              ⚡ No specific date
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Description - Clickable to edit */}
                      <td
                        onClick={() => handleStartEdit(exp)}
                        className="px-4 py-3 text-slate-800 max-w-xs font-medium cursor-pointer hover:text-indigo-600 transition-colors"
                        title="Click to edit this expenditure record"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{exp.description}</span>
                          <Edit3 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(exp.category)}`}>
                          {exp.category || 'Others'}
                        </span>
                      </td>

                      {/* Amount - Clickable to edit */}
                      <td
                        onClick={() => handleStartEdit(exp)}
                        className="px-4 py-3 text-right font-mono font-black text-rose-600 text-sm cursor-pointer hover:underline"
                        title="Click to edit amount"
                      >
                        ৳ {exp.amount.toLocaleString()}
                      </td>

                      {/* Actions: Edit & Delete */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* EDIT BUTTON (Always prominent with clear label) */}
                          <button
                            onClick={() => handleStartEdit(exp)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs"
                            title="Edit this expenditure record (Description, Amount, Category, Dates)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          {/* DELETE BUTTON (Direct deletion, no barrier) */}
                          <button
                            onClick={() => {
                              onDeleteExpenditure(exp.id);
                              showToast(`✓ Deleted expenditure "${exp.description}"`);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                            title="Directly delete this expenditure entry"
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
            {filteredExpenditures.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                  <td colSpan={4} className="px-4 py-3 text-right text-xs">
                    Total for Filtered List ({filteredExpenditures.length} items):
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-rose-700 text-sm">
                    ৳ {currentFilteredTotal.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    )}

      {/* EDIT EXPENDITURE MODAL (FULL EDITING OF EXPENDITURE LIST ITEM) */}
      {editingExp && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Edit Expenditure Record
                  </h3>
                  <p className="text-xs text-slate-400">Modify description, amount, category tag, or date</p>
                </div>
              </div>
              <button
                onClick={() => setEditingExp(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="py-4 space-y-4">
              {/* Description */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Description:
                </label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Amount in Taka (৳):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="any"
                    min={1}
                    required
                    value={editAmountStr}
                    onChange={e => setEditAmountStr(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Category Selector with full requested options */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 text-xs">
                    Category Tag:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditIsCustomActive(!editIsCustomActive);
                      if (!editIsCustomActive) setEditCustomCategory('');
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{editIsCustomActive ? 'Pick from standard list' : '+ Type Custom Category'}</span>
                  </button>
                </div>

                {!editIsCustomActive ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {EXPENDITURE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setEditCategory(cat)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          editCategory === cat
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="e.g. Fuel, Maintenance, Festival, etc."
                      value={editCustomCategory}
                      onChange={e => setEditCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-indigo-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-[11px] text-slate-400">
                      Enter any custom category name for this expenditure.
                    </p>
                  </div>
                )}
              </div>

              {/* Date / Undated Configuration */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Date Allocation:
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={editIsUndated}
                      onChange={e => setEditIsUndated(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Skip Date (Undated)</span>
                  </label>
                </div>

                {!editIsUndated ? (
                  <div className="space-y-2 pt-1">
                    {editDates.map((dStr, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="date"
                          value={dStr}
                          onChange={e => {
                            const next = [...editDates];
                            next[idx] = e.target.value;
                            setEditDates(next);
                          }}
                          className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = editDates.filter((_, i) => i !== idx);
                            setEditDates(next);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                          title="Remove date"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditDates([...editDates, todayStr])}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add another date</span>
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
                    ⚡ This expenditure has no specific day or date.
                  </div>
                )}
              </div>

              {/* Target Month Selector */}
              <div>
                <label className="block font-bold text-slate-700 text-xs mb-1">
                  Budget Month Allocation:
                </label>
                <input
                  type="month"
                  value={editMonth}
                  onChange={e => setEditMonth(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExp(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!editingExp) return;
                      const idToDelete = editingExp.id;
                      const desc = editingExp.description;
                      setEditingExp(null);
                      onDeleteExpenditure(idToDelete);
                      showToast(`✓ Deleted expenditure "${desc}"`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                    title="Directly delete this expenditure entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE ENTIRE LIST MODAL */}
      {confirmDeleteList && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Delete Entire List?
                </h3>
                <p className="text-xs text-slate-500">
                  This will permanently delete all {filteredExpenditures.length} expenditure record(s) currently displayed in this list.
                </p>
              </div>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-100 text-xs text-rose-800 mb-5">
              <strong>Records to be deleted:</strong> {filteredExpenditures.length} items (Total: ৳{currentFilteredTotal.toLocaleString()})
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteList(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEntireActiveList}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Yes, Delete List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDED WIZARD MODAL (CREATE EXPENDITURE WITH FULL CATEGORIES) */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Wizard Header & Progress Steps */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                  {wizardStep}/4
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Create Family Expenditure
                  </h3>
                  <p className="text-xs text-slate-400">Step-by-step guided entry</p>
                </div>
              </div>

              <button
                onClick={() => setShowWizard(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            {/* STEP 1: How many dates? (With prominent SKIP option) */}
            {wizardStep === 1 && (
              <form onSubmit={handleStep1Submit} className="py-6 space-y-4">
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <label className="block font-bold text-slate-800 text-sm mb-1">
                    How many dates should this expenditure cover?
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    Choose 1 day, 2 days (e.g. 11 Oct & 12 Oct), or multiple days.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={31}
                      required
                      value={targetDateCount}
                      onChange={e => setTargetDateCount(parseInt(e.target.value, 10) || 1)}
                      className="w-24 px-3 py-2 text-center text-lg font-bold rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetDateCount(1)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          targetDateCount === 1 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200'
                        }`}
                      >
                        1 Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetDateCount(2)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          targetDateCount === 2 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200'
                        }`}
                      >
                        2 Days
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetDateCount(3)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          targetDateCount === 3 ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-slate-200'
                        }`}
                      >
                        3 Days
                      </button>
                    </div>
                  </div>

                  {/* Option to Skip Day Amount / Date */}
                  <div className="mt-4 pt-3 border-t border-rose-200/60">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Or skip day amount & date:</span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        ⚡ Quick Skip
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSkipDate}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/80 hover:bg-amber-100 text-amber-900 transition-all text-left group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-200 text-amber-800 flex items-center justify-center font-black text-xs">
                          ⚡
                        </div>
                        <div>
                          <div className="text-xs font-bold text-amber-900">
                            Skip Day / Date (Create Without Specific Date)
                          </div>
                          <div className="text-[11px] text-amber-700/90">
                            Creates an undated expenditure list item directly
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-800 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        <span>Skip & Enter Amount</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleSkipDate}
                    className="px-3.5 py-2 text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-50 rounded-xl border border-amber-200"
                  >
                    Skip Date Selection
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    <span>Next: Select Dates</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Which dates? (With SKIP option) */}
            {wizardStep === 2 && (
              <form onSubmit={handleStep2Submit} className="py-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-800 text-sm">
                      Select the specific {targetDateCount} date(s):
                    </label>
                    <button
                      type="button"
                      onClick={handleSkipDate}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors flex items-center gap-1"
                    >
                      <span>⚡ Skip Date</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    For example: 11 Oct 2026 and 12 Oct 2026.
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {Array.from({ length: targetDateCount }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 w-16">
                          Date #{idx + 1}:
                        </span>
                        <input
                          type="date"
                          required
                          value={selectedDates[idx] || todayStr}
                          onChange={e => handleDateSelectionChange(idx, e.target.value)}
                          className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleDateSelectionChange(idx, todayStr)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-colors shrink-0"
                          title={`Set Date #${idx + 1} to today (${todayStr})`}
                        >
                          Today
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSkipDate}
                      className="px-3.5 py-2 text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-50 rounded-xl border border-amber-200"
                    >
                      Skip Date
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      <span>Next: Enter Amount</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 3: How much amount? */}
            {wizardStep === 3 && (
              <form onSubmit={handleStep3Submit} className="py-6 space-y-4">
                {isUndated && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
                    <span>⚡</span>
                    <span>Date Skipped: This expenditure will be created without a specific day or date.</span>
                  </div>
                )}

                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <label className="block font-bold text-slate-800 text-sm mb-1">
                    Expenditure Amount in Taka (৳):
                  </label>
                  <p className="text-xs text-slate-500 mb-3">
                    {isUndated || selectedDates.length === 0
                      ? 'Total expenditure amount for this undated entry.'
                      : `Total amount spent across the selected dates (${selectedDates.join(', ')}).`}
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                      ৳
                    </span>
                    <input
                      type="number"
                      step="any"
                      min={1}
                      required
                      autoFocus
                      placeholder="e.g. 3200"
                      value={amountStr}
                      onChange={e => setAmountStr(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 text-xl font-bold rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  {/* 1-Click Quick Amount Presets */}
                  <div className="mt-3 pt-2.5 border-t border-rose-200/60">
                    <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Zap className="w-3 h-3 text-amber-500" />
                      1-Click Quick Amount Presets:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[50, 100, 200, 500, 1000].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmountStr(amt.toString())}
                          className="px-2 py-1.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-800 font-mono font-bold text-xs transition-all active:scale-95 text-center shadow-2xs"
                          title={`Select ৳${amt}`}
                        >
                          ৳{amt >= 1000 ? '1k' : amt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(isUndated ? 1 : 2)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                  >
                    <span>Next: Add Category & Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: Category & Description */}
            {wizardStep === 4 && (
              <form onSubmit={handleCreateExpenditureFinal} className="py-6 space-y-4">
                <div>
                  <label className="block font-bold text-slate-800 text-sm mb-1">
                    Expenditure Description:
                  </label>
                  <textarea
                    required
                    autoFocus
                    rows={3}
                    placeholder="e.g. Bus fare, Monthly CNG commute, Payment to vendor, Father pocket money, Mosque donation..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Categories - Includes Transportation, Payment, Father Giving, Donation, Others */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-bold text-slate-800 text-xs">
                      Category Tag:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategoryActive(!isCustomCategoryActive);
                        if (!isCustomCategoryActive) setCustomCategory('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3" />
                      <span>{isCustomCategoryActive ? 'Pick standard category' : '+ Type Custom Category'}</span>
                    </button>
                  </div>

                  {!isCustomCategoryActive ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {EXPENDITURE_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            category === cat
                              ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="e.g. Fuel, Maintenance, Festival, etc."
                        value={customCategory}
                        onChange={e => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        Type any custom expenditure category name.
                      </p>
                    </div>
                  )}
                </div>

                {/* Summary box */}
                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Category:</span>
                    <strong className="text-slate-800">
                      {isCustomCategoryActive && customCategory.trim() ? customCategory : category}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Date:</span>
                    <strong className="text-slate-800">
                      {isUndated || selectedDates.length === 0 ? (
                        <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                          ⚡ No specific day or date (Undated)
                        </span>
                      ) : (
                        selectedDates.join(', ')
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <strong className="text-rose-600 font-mono font-bold">
                      ৳ {parseFloat(amountStr || '0').toLocaleString()}
                    </strong>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isUndated || selectedDates.length === 0 ? 'Create Undated Expenditure' : 'Create Expenditure'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QUICK INCREASE MODAL: Increase Amount directly in any category */}
      {increaseModalCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                {(() => {
                  const Icon = getCategoryIcon(increaseModalCategory);
                  const theme = getCategoryColorTheme(increaseModalCategory);
                  return (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold ${theme.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Increase {increaseModalCategory}</span>
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                      Direct Addition
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add money to this category without creating a separate list
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIncreaseModalCategory(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickIncreaseCategory} className="py-4 space-y-4">
              {/* Current category status summary */}
              {(() => {
                const stat = categoryStats.find(
                  s => s.category.toLowerCase() === increaseModalCategory.toLowerCase()
                );
                const currentMonthAmt = stat?.monthAmount || 0;
                const enteredAmt = parseFloat(increaseAmountStr) || 0;
                const newProjected = currentMonthAmt + enteredAmt;

                return (
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Current {monthName} Total:</span>
                      <strong className="text-slate-800 font-mono font-bold">
                        ৳ {currentMonthAmt.toLocaleString()}
                      </strong>
                    </div>
                    {enteredAmt > 0 && (
                      <div className="flex justify-between items-center text-rose-700 pt-1 border-t border-slate-200/60 font-bold">
                        <span>New Projected Total:</span>
                        <span className="font-mono text-sm font-black">
                          ৳ {newProjected.toLocaleString()} (+৳{enteredAmt.toLocaleString()})
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 1-Click Quick Preset Amount Buttons */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" />
                  <span>1-Click Quick Select Amount:</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[50, 100, 200, 500, 1000].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setIncreaseAmountStr(amt.toString())}
                      className="px-2 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 border border-slate-200 text-slate-800 font-mono font-bold text-xs transition-all active:scale-95 text-center shadow-2xs"
                    >
                      +৳{amt >= 1000 ? '1k' : amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Amount to Add in Taka (৳):
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
                    autoFocus
                    placeholder="Enter amount (e.g. 2500)"
                    value={increaseAmountStr}
                    onChange={e => setIncreaseAmountStr(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-lg font-mono font-bold rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Optional Note / Description */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Note / Description (Optional):
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${increaseModalCategory} installment, cash paid, bazaar...`}
                  value={increaseDescription}
                  onChange={e => setIncreaseDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Date:
                </label>
                <input
                  type="date"
                  value={increaseDate}
                  onChange={e => setIncreaseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setIncreaseModalCategory(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    Increase {increaseModalCategory} Total
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOM EXPENDITURE CATEGORY MODAL */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    New Expenditure Category
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add a category (e.g. Loan Repayment, Sadakah, Fuel)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomCategory} className="py-4 space-y-4">
              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Category Name:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Loan Repayment, Sadakah, Business, Maintenance..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Initial Amount in Taka (Optional):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    placeholder="e.g. 5000 (or leave empty)"
                    value={newCategoryInitialAmount}
                    onChange={e => setNewCategoryInitialAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 text-xs mb-1">
                  Initial Note / Description (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Initial balance or first payment"
                  value={newCategoryNote}
                  onChange={e => setNewCategoryNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400" />
          {toastMessage}
        </div>
      )}
    </div>
  );
};
