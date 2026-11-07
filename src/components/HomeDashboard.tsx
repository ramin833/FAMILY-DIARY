import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  CalendarDays,
  Plus,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Bot,
  ArrowRight,
  Layers,
  Activity,
  CalendarClock,
  Coins,
  CheckSquare,
  Square,
  Briefcase,
  GraduationCap,
  ShoppingCart,
  CreditCard,
  HeartHandshake,
  Car,
  Check,
  TrendingDown,
  Filter,
  DollarSign,
  Zap,
} from 'lucide-react';
import {
  Worksheet,
  Expenditure,
  Project,
  NavSection,
  UpcomingIncomeItem,
  UpcomingIncomeCategory,
  UpcomingExpenditureCategory,
  UpcomingPaymentHistory,
} from '../types/family';
import { SpendingTrendsDashboard } from './SpendingTrendsDashboard';

interface HomeDashboardProps {
  worksheets: Worksheet[];
  expenditures: Expenditure[];
  projects: Project[];
  onNavigate: (section: NavSection) => void;
  onOpenQuickExpense: () => void;
  onOpenQuickProject: () => void;
  onOpenUpcomingIncome?: () => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onSaveWorksheet?: (worksheet: Worksheet) => void;
  onDeleteWorksheet?: (id: string) => void;
  onOpenChatbot?: () => void;
  onDeleteExpenditure?: (id: string) => void;
  onAddExpenditure?: (exp: Expenditure) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  worksheets,
  expenditures,
  projects,
  onNavigate,
  onOpenQuickExpense,
  onOpenQuickProject,
  onOpenUpcomingIncome,
  onUpdateProject,
  onDeleteProject,
  onSaveWorksheet,
  onDeleteWorksheet,
  onOpenChatbot,
  onDeleteExpenditure,
  onAddExpenditure,
}) => {
  // Dynamic current date in local timezone
  const todayDateObj = new Date();
  const todayYear = todayDateObj.getFullYear();
  const todayMonth = String(todayDateObj.getMonth() + 1).padStart(2, '0');
  const todayDay = String(todayDateObj.getDate()).padStart(2, '0');
  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
  const currentMonthStr = `${todayYear}-${todayMonth}`;

  const formattedDate = todayDateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const dayName = todayDateObj.toLocaleDateString('en-US', { weekday: 'long' });

  // Upcoming Section Controls
  const [upcomingTab, setUpcomingTab] = useState<'all' | 'income' | 'expenditure'>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [upcomingMonthFilter, setUpcomingMonthFilter] = useState<string>('all');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // 1-Click Quick Add State
  const [quickAddCategory, setQuickAddCategory] = useState<string>('Transportation');

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleHomeQuickAdd = (amt: number) => {
    if (!onAddExpenditure) {
      onOpenQuickExpense();
      return;
    }
    const newExp: Expenditure = {
      id: `exp_home_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: 'guest',
      dates: [todayStr],
      primaryDate: todayStr,
      month: currentMonthStr,
      amount: amt,
      category: quickAddCategory,
      description: `${quickAddCategory} 1-click expense (+৳${amt})`,
      createdAt: new Date().toISOString(),
    };
    onAddExpenditure(newExp);
    showToast(`✓ Added ৳${amt.toLocaleString()} to ${quickAddCategory} in 1 click!`);
  };

  // Current month formatted label (e.g. "October 2026")
  const currentMonthName = todayDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // 1. Current Month Realized Income (strictly for the current month / current state)
  const currentMonthRealizedIncome = useMemo(() => {
    let sum = 0;
    worksheets
      .filter(w => !w.category?.startsWith('upcoming_'))
      .forEach(ws => {
        const rows = ws.rows || [];
        if (rows.length > 0) {
          rows.forEach(r => {
            const cells = r.cells || {};
            const rowAmt =
              Number(cells['amount']) ||
              Number(cells['col_fee']) ||
              Number(cells['col_net']) ||
              Number(cells['col_basic']) ||
              Number(cells['col_total']) ||
              Number(cells['col_amount']) ||
              0;
            const rowDate = String(cells['date'] || cells['col_date'] || '');
            const rowMonth = String(cells['month'] || (rowDate ? rowDate.slice(0, 7) : ''));
            if (rowMonth === currentMonthStr || (rowDate && rowDate.startsWith(currentMonthStr))) {
              sum += rowAmt;
            }
          });
        } else if (ws.totalAmount && ws.totalAmount > 0) {
          const sheetMonth = (ws.updatedAt || ws.createdAt || '').slice(0, 7);
          if (!sheetMonth || sheetMonth === currentMonthStr) {
            sum += ws.totalAmount;
          }
        }
      });
    return sum;
  }, [worksheets, currentMonthStr]);

  const currentMonthIncomeCount = useMemo(() => {
    let count = 0;
    worksheets
      .filter(w => !w.category?.startsWith('upcoming_'))
      .forEach(ws => {
        (ws.rows || []).forEach(r => {
          const cells = r.cells || {};
          const rowDate = String(cells['date'] || cells['col_date'] || '');
          const rowMonth = String(cells['month'] || (rowDate ? rowDate.slice(0, 7) : ''));
          if (rowMonth === currentMonthStr || (rowDate && rowDate.startsWith(currentMonthStr))) {
            count++;
          }
        });
      });
    return count;
  }, [worksheets, currentMonthStr]);

  // 2. Current Month Realized Expenditure (strictly for the current month / current state)
  const currentMonthRealizedExpenditure = useMemo(() => {
    return expenditures
      .filter(exp =>
        exp.month === currentMonthStr ||
        (Array.isArray(exp.dates) && exp.dates.some(d => d.startsWith(currentMonthStr))) ||
        (exp.primaryDate && exp.primaryDate.startsWith(currentMonthStr)) ||
        (!exp.primaryDate && (!exp.dates || exp.dates.length === 0) && (!exp.month || exp.month === currentMonthStr))
      )
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenditures, currentMonthStr]);

  const currentMonthExpendituresCount = useMemo(() => {
    return expenditures.filter(exp =>
      exp.month === currentMonthStr ||
      (Array.isArray(exp.dates) && exp.dates.some(d => d.startsWith(currentMonthStr))) ||
      (exp.primaryDate && exp.primaryDate.startsWith(currentMonthStr)) ||
      (!exp.primaryDate && (!exp.dates || exp.dates.length === 0) && (!exp.month || exp.month === currentMonthStr))
    ).length;
  }, [expenditures, currentMonthStr]);

  // 3. Current Month Reserve (Current Month Realized Income - Current Month Realized Expenditure)
  const currentMonthReserve = currentMonthRealizedIncome - currentMonthRealizedExpenditure;

  // Aliases for dashboard cards
  const totalIncome = currentMonthRealizedIncome;
  const totalExpenditure = currentMonthRealizedExpenditure;
  const reserve = currentMonthReserve;

  // All-Time Cumulative totals retained as reference
  const allTimeRealizedIncome = useMemo(() => {
    return worksheets
      .filter(w => !w.category?.startsWith('upcoming_'))
      .reduce((sum, w) => sum + (w.totalAmount || 0), 0);
  }, [worksheets]);
  const totalWorksheetIncome = allTimeRealizedIncome;

  const allTimeRealizedExpenditure = useMemo(() => {
    return expenditures.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [expenditures]);

  const allTimeReserve = allTimeRealizedIncome - allTimeRealizedExpenditure;

  // ---------------------------------------------------------------------------
  // PARSE UPCOMING INCOMES (Extracted from worksheets with category 'upcoming_*')
  // ---------------------------------------------------------------------------
  const allUpcomingIncomes: UpcomingIncomeItem[] = useMemo(() => {
    const list: UpcomingIncomeItem[] = [];

    worksheets.forEach(ws => {
      let cat: UpcomingIncomeCategory | null = null;
      if (ws.category === 'upcoming_tution') cat = 'tution';
      else if (ws.category === 'upcoming_father_salary') cat = 'father_salary';
      else if (ws.category === 'upcoming_due_debt') cat = 'due_debt';

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
          cells['targetMonth'] || cells['month'] || (expectedDate ? expectedDate.slice(0, 7) : '')
        );
        const status = (cells['status'] === 'received' ? 'received' : 'pending') as 'pending' | 'received';

        let title = String(cells['title'] || '');
        if (!title) {
          if (cat === 'tution') title = String(cells['studentName'] || cells['col_student'] || 'Upcoming Tuition');
          else if (cat === 'father_salary') title = String(cells['job'] || cells['col_org'] || 'Upcoming Salary');
          else title = String(cells['debtorName'] || cells['col_from'] || 'Debtor Money');
        }

        let description = String(cells['description'] || '');
        if (!description) {
          if (cat === 'tution') {
            const cls = cells['studentClass'] || cells['col_class'];
            const sub = cells['subject'] || cells['col_subject'];
            description = [cls, sub].filter(Boolean).join(' • ');
          } else if (cat === 'father_salary') {
            description = String(cells['salaryPeriod'] || cells['col_month'] || 'Monthly Expected');
          } else {
            description = String(cells['debtReason'] || cells['col_purpose'] || '');
          }
        }

        list.push({
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

    // Sort: pending first, then by earliest expectedDate, undated at bottom
    return list.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'pending' ? -1 : 1;
      }
      if (!a.expectedDate && b.expectedDate) return 1;
      if (a.expectedDate && !b.expectedDate) return -1;
      return (a.expectedDate || '').localeCompare(b.expectedDate || '');
    });
  }, [worksheets]);

  // Total Upcoming Income Remaining / Pending
  const totalUpcomingIncome = useMemo(() => {
    return allUpcomingIncomes
      .filter(item => item.status === 'pending')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [allUpcomingIncomes]);

  // ---------------------------------------------------------------------------
  // PARSE UPCOMING EXPENDITURES (From `projects` list)
  // ---------------------------------------------------------------------------
  const allUpcomingExpenditures: Project[] = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aCompleted = a.status === 'completed';
      const bCompleted = b.status === 'completed';
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }
      if (!a.expectedDate && b.expectedDate) return 1;
      if (a.expectedDate && !b.expectedDate) return -1;
      return (a.expectedDate || '').localeCompare(b.expectedDate || '');
    });
  }, [projects]);

  // Total Upcoming Expenditure Remaining
  const totalUpcomingExpenditure = useMemo(() => {
    return projects
      .filter(p => p.status !== 'completed')
      .reduce((sum, p) => sum + (p.amount ?? p.expectedAmount ?? 0), 0);
  }, [projects]);

  // Helper to extract canonical YYYY-MM month key for income
  const getIncomeMonthKey = (item: UpcomingIncomeItem): string => {
    if (item.targetMonth && /^\d{4}-\d{2}$/.test(item.targetMonth)) return item.targetMonth;
    if (item.expectedDate && item.expectedDate.length >= 7) return item.expectedDate.slice(0, 7);
    return item.isUndated ? 'undated' : '';
  };

  // Helper to extract canonical YYYY-MM month key for expenditure project
  const getProjectMonthKey = (p: Project): string => {
    if (p.targetMonth && /^\d{4}-\d{2}$/.test(p.targetMonth)) return p.targetMonth;
    if (p.expectedDate && p.expectedDate.length >= 7) return p.expectedDate.slice(0, 7);
    if (p.targetDeadline && p.targetDeadline.length >= 7) return p.targetDeadline.slice(0, 7);
    if (p.targetHorizon === 'this_month') return currentMonthStr;
    if (p.targetHorizon === 'next_month') {
      const nextDate = new Date(todayYear, todayDateObj.getMonth() + 1, 1);
      return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    }
    return p.isUndated ? 'undated' : '';
  };

  // Generate rolling 24 months (November, December, January, etc.) + any months from user data
  const upcomingMonthOptions = useMemo(() => {
    const set = new Set<string>();
    // Rolling 24 months forward starting from current month
    for (let i = 0; i < 24; i++) {
      const d = new Date(todayYear, todayDateObj.getMonth() + i, 1);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      set.add(`${yyyy}-${mm}`);
    }

    // Add any existing months from data (including past or far future)
    allUpcomingIncomes.forEach(i => {
      const k = getIncomeMonthKey(i);
      if (k && k !== 'undated' && /^\d{4}-\d{2}$/.test(k)) set.add(k);
    });
    allUpcomingExpenditures.forEach(p => {
      const k = getProjectMonthKey(p);
      if (k && k !== 'undated' && /^\d{4}-\d{2}$/.test(k)) set.add(k);
    });

    const sortedKeys = Array.from(set).sort();
    const nextDate = new Date(todayYear, todayDateObj.getMonth() + 1, 1);
    const nextMonthKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;

    return sortedKeys.map(key => {
      const [y, m] = key.split('-').map(Number);
      const d = new Date(y, m - 1, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const shortLabel = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const monthOnly = d.toLocaleDateString('en-US', { month: 'long' });
      const isCurrent = key === currentMonthStr;
      const isNext = key === nextMonthKey;

      let label = monthName;
      if (isCurrent) label += ' (This Month)';
      else if (isNext) label += ' (Next Month)';

      const pendingIncomesCount = allUpcomingIncomes.filter(
        i => i.status === 'pending' && getIncomeMonthKey(i) === key
      ).length;
      const pendingExpensesCount = allUpcomingExpenditures.filter(
        p => p.status !== 'completed' && getProjectMonthKey(p) === key
      ).length;

      return {
        key,
        label,
        shortLabel,
        monthOnly,
        year: y,
        isCurrent,
        isNext,
        pendingIncomesCount,
        pendingExpensesCount,
        totalPendingCount: pendingIncomesCount + pendingExpensesCount,
      };
    });
  }, [allUpcomingIncomes, allUpcomingExpenditures, currentMonthStr, todayYear, todayDateObj]);

  // Filtered lists according to showCompleted toggle and upcomingMonthFilter
  const visibleUpcomingIncomes = useMemo(() => {
    let list = showCompleted ? allUpcomingIncomes : allUpcomingIncomes.filter(i => i.status === 'pending');
    if (upcomingMonthFilter === 'all') return list;
    if (upcomingMonthFilter === 'undated') {
      return list.filter(i => i.isUndated || (!i.expectedDate && !i.targetMonth));
    }
    return list.filter(i => getIncomeMonthKey(i) === upcomingMonthFilter);
  }, [allUpcomingIncomes, showCompleted, upcomingMonthFilter]);

  const visibleUpcomingExpenditures = useMemo(() => {
    let list = showCompleted ? allUpcomingExpenditures : allUpcomingExpenditures.filter(p => p.status !== 'completed');
    if (upcomingMonthFilter === 'all') return list;
    if (upcomingMonthFilter === 'undated') {
      return list.filter(p => p.isUndated || (!p.expectedDate && !p.targetMonth && !p.targetDeadline));
    }
    return list.filter(p => getProjectMonthKey(p) === upcomingMonthFilter);
  }, [allUpcomingExpenditures, showCompleted, upcomingMonthFilter]);

  // Totals for the currently filtered month view
  const filteredUpcomingIncomeTotal = useMemo(() => {
    return visibleUpcomingIncomes
      .filter(item => item.status === 'pending')
      .reduce((sum, item) => sum + item.amount, 0);
  }, [visibleUpcomingIncomes]);

  const filteredUpcomingExpenditureTotal = useMemo(() => {
    return visibleUpcomingExpenditures
      .filter(p => p.status !== 'completed')
      .reduce((sum, p) => sum + (p.amount ?? p.expectedAmount ?? 0), 0);
  }, [visibleUpcomingExpenditures]);

  // Step to previous month in the selector
  const handlePrevUpcomingMonth = () => {
    if (upcomingMonthFilter === 'all' || upcomingMonthFilter === 'undated') {
      setUpcomingMonthFilter(currentMonthStr);
      return;
    }
    const idx = upcomingMonthOptions.findIndex(m => m.key === upcomingMonthFilter);
    if (idx > 0) {
      setUpcomingMonthFilter(upcomingMonthOptions[idx - 1].key);
    }
  };

  // Step to next month in the selector
  const handleNextUpcomingMonth = () => {
    if (upcomingMonthFilter === 'all' || upcomingMonthFilter === 'undated') {
      const nextDate = new Date(todayYear, todayDateObj.getMonth() + 1, 1);
      const nextKey = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
      setUpcomingMonthFilter(nextKey);
      return;
    }
    const idx = upcomingMonthOptions.findIndex(m => m.key === upcomingMonthFilter);
    if (idx >= 0 && idx < upcomingMonthOptions.length - 1) {
      setUpcomingMonthFilter(upcomingMonthOptions[idx + 1].key);
    }
  };

  // Helper to format item target month / date label
  const formatItemMonthTag = (expectedDate?: string, targetMonth?: string, isUndated?: boolean) => {
    if (isUndated && !expectedDate && !targetMonth) return 'Flexible';
    if (expectedDate && expectedDate.length >= 7) {
      const [y, m, d] = expectedDate.split('-').map(Number);
      if (y && m) {
        const dateObj = new Date(y, m - 1, d || 1);
        return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
    }
    if (targetMonth && /^\d{4}-\d{2}$/.test(targetMonth)) {
      const [y, m] = targetMonth.split('-').map(Number);
      const dateObj = new Date(y, m - 1, 1);
      return dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return '';
  };

  // ---------------------------------------------------------------------------
  // HELPER: CALCULATE DATE REMAINING & "HOW MANY DAYS TO GO"
  // ---------------------------------------------------------------------------
  const getDaysToGo = (dateStr?: string, isUndated?: boolean) => {
    if (isUndated || !dateStr) {
      return {
        days: null,
        label: '⚡ Flexible Horizon',
        sublabel: 'No specific date',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        isOverdue: false,
        isToday: false,
      };
    }

    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) {
      return {
        days: null,
        label: 'Date Pending',
        sublabel: 'No date',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        isOverdue: false,
        isToday: false,
      };
    }

    const targetDate = new Date(y, m - 1, d);
    const todayMidnight = new Date(todayDateObj.getFullYear(), todayDateObj.getMonth(), todayDateObj.getDate());
    const diffDays = Math.round((targetDate.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        days: 0,
        label: '⚡ Due Today!',
        sublabel: 'Today',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold animate-pulse',
        isOverdue: false,
        isToday: true,
      };
    } else if (diffDays === 1) {
      return {
        days: 1,
        label: '1 day to go (Tomorrow)',
        sublabel: 'Tomorrow',
        badgeClass: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
        isOverdue: false,
        isToday: false,
      };
    } else if (diffDays > 1) {
      return {
        days: diffDays,
        label: `${diffDays} days to go`,
        sublabel: `${diffDays}d left`,
        badgeClass: diffDays <= 5
          ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
          : diffDays <= 15
          ? 'bg-amber-50 text-amber-800 border-amber-200 font-semibold'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
        isOverdue: false,
        isToday: false,
      };
    } else {
      const absDays = Math.abs(diffDays);
      return {
        days: diffDays,
        label: `${absDays} day${absDays === 1 ? '' : 's'} overdue`,
        sublabel: 'Overdue',
        badgeClass: 'bg-red-100 text-red-900 border-red-300 font-black',
        isOverdue: true,
        isToday: false,
      };
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLER: TOGGLE COMPLETE CHECKBOX FOR UPCOMING INCOME
  // ---------------------------------------------------------------------------
  const handleToggleUpcomingIncomeComplete = (item: UpcomingIncomeItem) => {
    if (!onSaveWorksheet) return;
    const parentSheet = worksheets.find(w => w.id === item.sheetId);
    if (!parentSheet) return;

    const isNowReceived = item.status !== 'received';
    const updatedRows = (parentSheet.rows || []).map(row => {
      if (row.id === item.id) {
        return {
          ...row,
          cells: {
            ...row.cells,
            status: isNowReceived ? 'received' : 'pending',
            receivedDate: isNowReceived ? todayStr : '',
          },
        };
      }
      return row;
    });

    const updatedTotal = updatedRows
      .filter(r => r.cells?.status !== 'received')
      .reduce((sum, r) => sum + (Number(r.cells?.amount) || 0), 0);

    onSaveWorksheet({
      ...parentSheet,
      rows: updatedRows,
      totalAmount: updatedTotal,
      updatedAt: new Date().toISOString(),
    });

    showToast(
      isNowReceived
        ? `✓ Marked "${item.title}" (+৳${item.amount.toLocaleString()}) as Received!`
        : `Reopened "${item.title}" as Pending`
    );
  };

  // ---------------------------------------------------------------------------
  // HANDLER: TOGGLE COMPLETE CHECKBOX FOR UPCOMING EXPENDITURE
  // ---------------------------------------------------------------------------
  const handleToggleUpcomingExpenseComplete = (item: Project) => {
    if (!onUpdateProject) return;

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
      showToast(`Reopened "${item.title}" as Pending`);
    } else {
      // Mark as cleared in full
      const remainingBefore = item.amount || 0;
      const currentPaid = item.paidAmount || 0;
      const totalInitial = item.initialAmount || currentPaid + remainingBefore;

      const completionEntry: UpcomingPaymentHistory = {
        id: `pay_${Date.now()}`,
        amount: remainingBefore,
        date: todayStr,
        note: 'Marked as Completed / Cleared in Full from Home',
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
      showToast(`✓ Marked "${item.title}" (৳${totalInitial.toLocaleString()}) as Cleared in Full!`);
    }
  };

  // ---------------------------------------------------------------------------
  // HANDLERS: DELETE UPCOMING ITEMS EASILY FROM HOME
  // ---------------------------------------------------------------------------
  const handleDeleteUpcomingIncome = (item: UpcomingIncomeItem) => {
    if (!onSaveWorksheet) return;
    const parentSheet = worksheets.find(w => w.id === item.sheetId);
    if (!parentSheet) return;
    const updatedRows = (parentSheet.rows || []).filter(r => r.id !== item.id);
    const updatedTotal = updatedRows
      .filter(r => r.cells?.status !== 'received')
      .reduce((sum, r) => sum + (Number(r.cells?.amount) || 0), 0);

    onSaveWorksheet({
      ...parentSheet,
      rows: updatedRows,
      totalAmount: updatedTotal,
      updatedAt: new Date().toISOString(),
    });
    showToast(`Deleted upcoming income "${item.title}"`);
  };

  const handleDeleteUpcomingExpense = (proj: Project) => {
    if (onDeleteProject) {
      onDeleteProject(proj.id);
      showToast(`Deleted commitment "${proj.title}"`);
    }
  };

  // Meta helpers for visual styling of categories
  const getIncomeCategoryMeta = (cat: UpcomingIncomeCategory) => {
    switch (cat) {
      case 'tution':
        return { label: 'Tuition Fee', icon: GraduationCap, badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'father_salary':
        return { label: 'Father Salary', icon: Briefcase, badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'due_debt':
        return { label: 'Due Debt Recovery', icon: Coins, badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: cat || 'Income Stream', icon: Coins, badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
  };

  const getExpenseCategoryMeta = (cat?: UpcomingExpenditureCategory) => {
    switch (cat) {
      case 'payable_debt':
        return { label: 'Payable Debt', icon: Receipt, badgeClass: 'bg-rose-50 text-rose-800 border-rose-200' };
      case 'payment':
        return { label: 'Payment', icon: CreditCard, badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'grocery':
        return { label: 'Grocery', icon: ShoppingCart, badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'mega_project':
        return { label: 'Mega Project', icon: Sparkles, badgeClass: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'father_giving':
        return { label: 'Father Giving', icon: HeartHandshake, badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'education':
        return { label: 'Education', icon: GraduationCap, badgeClass: 'bg-teal-50 text-teal-800 border-teal-200' };
      case 'transportation':
        return { label: 'Transportation', icon: Car, badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'Upcoming Outlay', icon: Receipt, badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const selectedMonthOption = upcomingMonthOptions.find(m => m.key === upcomingMonthFilter);
  const selectedMonthLabel =
    upcomingMonthFilter === 'all'
      ? 'All Upcoming Months'
      : upcomingMonthFilter === 'undated'
      ? 'Flexible / Open Dates'
      : selectedMonthOption?.label || upcomingMonthFilter;
  const isSpecificMonthSelected = upcomingMonthFilter !== 'all' && upcomingMonthFilter !== 'undated';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Hero Welcome & Date Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-emerald-300 border border-white/10 mb-3">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {dayName}, {formattedDate}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
            Family Diary Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            All your family calculations, income spreadsheets, multi-date expenditures, and upcoming project reminders unified in one clean database.
          </p>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3 mt-6 flex-wrap">
            <button
              onClick={() => onNavigate('income')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Income Database</span>
            </button>

            <button
              onClick={onOpenQuickExpense}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>Record Expense</span>
            </button>

            <button
              onClick={onOpenQuickProject}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold text-xs sm:text-sm transition-all"
            >
              <CalendarClock className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Expenditure</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('spending-trends-dashboard');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs sm:text-sm shadow-xs transition-all"
            >
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Spending Trends & Peak Months</span>
            </button>

            {onOpenChatbot && (
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/30 border border-indigo-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>AI Chatbot (Gemini)</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3 Summary Cards: Total Income, Total Expenditure, Reserve (Strictly Current State & Current Month) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* Total Realized Income (Current Month) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-emerald-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Realized Income
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 mt-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>{currentMonthName} (Current Month)</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ৳ {currentMonthRealizedIncome.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs mt-1.5 flex-wrap gap-1">
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>{currentMonthIncomeCount} {currentMonthIncomeCount === 1 ? 'entry' : 'entries'} this month</span>
              </span>
              <span className="text-slate-400 font-medium text-[10px]" title="All-time cumulative income across all months">
                All-time: ৳{allTimeRealizedIncome.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Total Realized Expenditure (Current Month) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-rose-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Total Realized Expenditure
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/80 mt-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>{currentMonthName} (Current Month)</span>
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              ৳ {currentMonthRealizedExpenditure.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs mt-1.5 flex-wrap gap-1">
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                <span>{currentMonthExpendituresCount} realized expense{currentMonthExpendituresCount === 1 ? '' : 's'} this month</span>
              </span>
              <span className="text-slate-400 font-medium text-[10px]" title="All-time cumulative expenditures across all months">
                All-time: ৳{allTimeRealizedExpenditure.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Reserve (Current Month Net: Income - Expenditure) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-indigo-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Reserve
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border mt-1 ${
                  currentMonthReserve >= 0
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                    : 'bg-rose-50 text-rose-800 border-rose-200/80'
                }`}
              >
                <PiggyBank className="w-2.5 h-2.5" />
                <span>{currentMonthName} Net Reserve</span>
              </span>
            </div>
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                currentMonthReserve >= 0
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                  : 'bg-rose-50 text-rose-600 border-rose-100'
              }`}
            >
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div
              className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                currentMonthReserve >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ৳ {currentMonthReserve.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] sm:text-xs mt-1.5 flex-wrap gap-1">
              <span className={`font-semibold flex items-center gap-1 ${currentMonthReserve >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {currentMonthReserve >= 0 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Current month surplus (Income − Expenditure)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Current month deficit: spending exceeds income</span>
                  </>
                )}
              </span>
              <span className="text-slate-400 font-medium text-[10px]" title="All-time cumulative reserve">
                All-time net: ৳{allTimeReserve.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1-Click Quick Add: 50, 100, 200, 500, 1000 */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-2xl sm:rounded-3xl border border-rose-200/90 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-slate-900 tracking-tight">
                  1-Click Quick Add Expense
                </span>
                <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  5 Amounts: ৳50, ৳100, ৳200, ৳500, ৳1000
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Pick a category and click any amount to record the expense immediately in 1 click:
              </p>
            </div>
          </div>

          {/* Category Picker & The 5 1-Click Amount Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-white rounded-xl border border-slate-300 px-3 py-1.5 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 mr-2">Category:</span>
              <select
                value={quickAddCategory}
                onChange={e => setQuickAddCategory(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {[
                  'Transportation',
                  'Grocery',
                  'Payment',
                  'Debt',
                  'Donation',
                  'Father Giving',
                  'Education',
                  'Health',
                  'Utilities',
                  'Shopping',
                  'House Rent',
                  'Others',
                ].map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[50, 100, 200, 500, 1000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleHomeQuickAdd(amt)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-600 hover:text-white border border-rose-300 hover:border-rose-600 text-rose-800 text-xs font-mono font-black shadow-2xs hover:shadow-xs active:scale-95 transition-all text-center flex items-center gap-1 group cursor-pointer"
                  title={`1-Click Add ৳${amt.toLocaleString()} to ${quickAddCategory}`}
                >
                  <Plus className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                  <span>৳{amt.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* ===================================================================== */}
      {/* UPCOMING INCOME LIST & UPCOMING EXPENDITURE LIST (WITH DAYS TO GO & CHECKBOX) */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Section Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white shadow-xs">
                <CalendarClock className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Upcoming Incomes & Upcoming Expenditures
              </h2>
              <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200/60">
                1-Click Complete Checkbox & Days to Go
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Track when money is due to arrive and future expenditure liabilities. Tick any item's complete checkbox right here on Home to mark it received or cleared in full.
            </p>
          </div>

          {/* View Mode & Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Tabs */}
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70 text-xs font-semibold">
              <button
                onClick={() => setUpcomingTab('all')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  upcomingTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Dual View
              </button>
              <button
                onClick={() => setUpcomingTab('income')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  upcomingTab === 'income'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-emerald-700 hover:text-emerald-900'
                }`}
              >
                <span>🟢 Income</span>
                <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
                  {allUpcomingIncomes.filter(i => i.status === 'pending').length}
                </span>
              </button>
              <button
                onClick={() => setUpcomingTab('expenditure')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  upcomingTab === 'expenditure'
                    ? 'bg-rose-600 text-white shadow-2xs font-extrabold'
                    : 'text-rose-700 hover:text-rose-900'
                }`}
              >
                <span>🔴 Expenditure</span>
                <span className="font-mono text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
                  {allUpcomingExpenditures.filter(p => p.status !== 'completed').length}
                </span>
              </button>
            </div>

            {/* Show Completed Toggle */}
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                showCompleted
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showCompleted ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{showCompleted ? 'Showing All' : 'Pending Only'}</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MONTH SELECTION TOOLBAR: SELECT MONTH NAME (Nov, Dec, Jan, etc.) */}
        {/* ================================================================= */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/70 via-slate-50 to-emerald-50/50 border border-indigo-100/80 shadow-2xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Month Dropdown + Prev/Next Steppers */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5 shrink-0">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>Month Horizon:</span>
              </span>

              {/* Prev Month */}
              <button
                type="button"
                onClick={handlePrevUpcomingMonth}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs active:scale-95 transition-all"
                title="Go to previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Month Dropdown with specific month names: November, December, January or even further */}
              <div className="relative">
                <select
                  value={upcomingMonthFilter}
                  onChange={e => setUpcomingMonthFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 rounded-xl bg-white border border-indigo-200/90 text-xs font-extrabold text-indigo-950 shadow-2xs hover:border-indigo-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors"
                >
                  <option value="all">🗓️ All Upcoming Months ({allUpcomingIncomes.length + allUpcomingExpenditures.length} items total)</option>
                  <optgroup label="Select Specific Month Name">
                    {upcomingMonthOptions.map(m => (
                      <option key={m.key} value={m.key}>
                        {m.label} {m.totalPendingCount > 0 ? `(${m.totalPendingCount} due)` : ''}
                      </option>
                    ))}
                  </optgroup>
                  <option value="undated">⚡ Flexible / No Specific Date (Open Horizon)</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-indigo-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Next Month */}
              <button
                type="button"
                onClick={handleNextUpcomingMonth}
                className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300 shadow-2xs active:scale-95 transition-all"
                title="Go to next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Clear Filter / Back to All */}
              {upcomingMonthFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setUpcomingMonthFilter('all')}
                  className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-xl border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-colors flex items-center gap-1"
                >
                  <span>✕ Show All Months</span>
                </button>
              )}
            </div>

            {/* Right: Quick Month Shortcut Pills (All, This Month, Nov, Dec, Jan, Feb) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <button
                type="button"
                onClick={() => setUpcomingMonthFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  upcomingMonthFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Months
              </button>

              {upcomingMonthOptions.slice(0, 6).map(m => {
                const isSelected = upcomingMonthFilter === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setUpcomingMonthFilter(m.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <span>{m.shortLabel}</span>
                    {m.totalPendingCount > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1 rounded-full ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700 font-bold'
                        }`}
                      >
                        {m.totalPendingCount}
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setUpcomingMonthFilter('undated')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  upcomingMonthFilter === 'undated'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Items without specific dates"
              >
                ⚡ Flexible
              </button>
            </div>
          </div>

          {/* Active Month View Status Pill */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-indigo-100/80 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Viewing Schedule for:</span>
              <span className="font-extrabold text-indigo-950 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs flex items-center gap-1">
                <span>{selectedMonthLabel}</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {visibleUpcomingIncomes.length} income stream{visibleUpcomingIncomes.length === 1 ? '' : 's'} • {visibleUpcomingExpenditures.length} expenditure liability{visibleUpcomingExpenditures.length === 1 ? '' : 'ies'}
            </span>
          </div>
        </div>

        {/* Top Cashflow Balance Bar (Dynamically adapts to selected month) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between sm:justify-start sm:gap-2">
            <span className="text-slate-500 font-medium">
              {upcomingMonthFilter === 'all' ? 'Pending Inflows (All):' : `${selectedMonthOption ? selectedMonthOption.shortLabel : 'Month'} Inflows:`}
            </span>
            <span className="font-mono font-bold text-emerald-600 text-sm">
              +৳ {upcomingMonthFilter === 'all' ? totalUpcomingIncome.toLocaleString() : filteredUpcomingIncomeTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between sm:justify-start sm:gap-2 sm:border-l sm:border-slate-200 sm:pl-3">
            <span className="text-slate-500 font-medium">
              {upcomingMonthFilter === 'all' ? 'Pending Liabilities (All):' : `${selectedMonthOption ? selectedMonthOption.shortLabel : 'Month'} Liabilities:`}
            </span>
            <span className="font-mono font-bold text-rose-600 text-sm">
              -৳ {upcomingMonthFilter === 'all' ? totalUpcomingExpenditure.toLocaleString() : filteredUpcomingExpenditureTotal.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between sm:justify-start sm:gap-2 sm:border-l sm:border-slate-200 sm:pl-3">
            <span className="text-slate-500 font-medium">
              {upcomingMonthFilter === 'all' ? 'Projected All Net:' : `${selectedMonthOption ? selectedMonthOption.shortLabel : 'Month'} Projected Net:`}
            </span>
            {(() => {
              const diff =
                upcomingMonthFilter === 'all'
                  ? totalUpcomingIncome - totalUpcomingExpenditure
                  : filteredUpcomingIncomeTotal - filteredUpcomingExpenditureTotal;
              return (
                <span className={`font-mono font-black text-sm ${diff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {diff >= 0 ? '+' : ''}৳ {diff.toLocaleString()}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Dual Lists Grid (or Focused Views) */}
        <div
          className={`grid gap-6 ${
            upcomingTab === 'all' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {/* =================================================================== */}
          {/* 1. UPCOMING INCOME LIST COLUMN                                      */}
          {/* =================================================================== */}
          {(upcomingTab === 'all' || upcomingTab === 'income') && (
            <div className="bg-slate-50/60 rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between">
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Upcoming Income List
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {allUpcomingIncomes.filter(i => i.status === 'pending').length} pending streams • Tuition, salary & debts due
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        if (onOpenUpcomingIncome) {
                          onOpenUpcomingIncome();
                        } else {
                          onNavigate('income');
                        }
                      }}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs hover:bg-emerald-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => {
                        if (onOpenUpcomingIncome) {
                          onOpenUpcomingIncome();
                        } else {
                          onNavigate('income');
                        }
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Open full upcoming income ledger"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {visibleUpcomingIncomes.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl bg-white border border-dashed border-slate-200 p-6">
                    <Coins className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold text-slate-700">
                      {upcomingMonthFilter === 'all'
                        ? 'No upcoming income recorded yet'
                        : `No upcoming income scheduled for ${selectedMonthLabel}`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Record expected coaching fees, upcoming father salary, or due debtor recovery.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={() => {
                          if (onOpenUpcomingIncome) {
                            onOpenUpcomingIncome();
                          } else {
                            onNavigate('income');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        + Add Upcoming Income
                      </button>
                      {upcomingMonthFilter !== 'all' && (
                        <button
                          onClick={() => setUpcomingMonthFilter('all')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Show All Months
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                    {visibleUpcomingIncomes.map(item => {
                      const isCompleted = item.status === 'received';
                      const daysToGo = getDaysToGo(item.expectedDate, item.isUndated);
                      const meta = getIncomeCategoryMeta(item.category);
                      const IconComponent = meta.icon;
                      const monthTag = formatItemMonthTag(item.expectedDate, item.targetMonth, item.isUndated);

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isCompleted
                              ? 'bg-slate-100/70 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200/90 hover:border-emerald-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Checkbox & Details */}
                            <div className="flex items-start gap-2.5 min-w-0">
                              {/* Complete Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleUpcomingIncomeComplete(item)}
                                className="mt-0.5 p-1 -m-1 rounded-lg text-slate-400 hover:text-emerald-600 focus:outline-hidden transition-colors"
                                title={isCompleted ? 'Click to reopen as pending' : 'Click to mark as received / complete'}
                              >
                                {isCompleted ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-600 fill-emerald-50 shrink-0" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300 hover:text-emerald-500 shrink-0" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-sm font-extrabold truncate ${
                                      isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                                    }`}
                                  >
                                    {item.title}
                                  </span>

                                  {/* Category Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full border ${meta.badgeClass}`}
                                  >
                                    <IconComponent className="w-3 h-3" />
                                    <span>{meta.label}</span>
                                  </span>

                                  {isCompleted && (
                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                      Received
                                    </span>
                                  )}
                                </div>

                                {item.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                              <div
                                className={`font-mono font-black text-sm ${
                                  isCompleted ? 'text-slate-400 line-through' : 'text-emerald-700'
                                }`}
                              >
                                +৳ {item.amount.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-slate-400">expected</span>
                            </div>
                          </div>

                          {/* Date Remaining / Days to Go Bar */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-500 font-medium text-[11px]">
                                {item.expectedDate ? `Expected: ${item.expectedDate}` : 'Flexible timing'}
                              </span>
                              {monthTag && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <Calendar className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>{monthTag}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Days To Go Badge */}
                              <span
                                className={`text-[11px] px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${daysToGo.badgeClass}`}
                              >
                                <span>{daysToGo.label}</span>
                              </span>

                              {/* Direct Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUpcomingIncome(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                                title="Delete this task / list item directly (not necessary to complete or decrease)"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Nav Helper */}
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {allUpcomingIncomes.filter(i => i.status === 'received').length} received items
                </span>
                <button
                  onClick={() => {
                    if (onOpenUpcomingIncome) {
                      onOpenUpcomingIncome();
                    } else {
                      onNavigate('income');
                    }
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                >
                  <span>Open Income Sheet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* 2. UPCOMING EXPENDITURE LIST COLUMN                                 */}
          {/* =================================================================== */}
          {(upcomingTab === 'all' || upcomingTab === 'expenditure') && (
            <div className="bg-slate-50/60 rounded-3xl border border-slate-200/90 p-5 flex flex-col justify-between">
              <div>
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        Upcoming Expenditure List
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {allUpcomingExpenditures.filter(p => p.status !== 'completed').length} active commitments • 7 categories
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={onOpenQuickProject}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs hover:bg-indigo-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                    <button
                      onClick={() => onNavigate('project')}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-0.5 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Open full upcoming expenditure ledger"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {visibleUpcomingExpenditures.length === 0 ? (
                  <div className="py-10 text-center rounded-2xl bg-white border border-dashed border-slate-200 p-6">
                    <CalendarClock className="w-8 h-8 text-indigo-400 mx-auto mb-2 opacity-60" />
                    <p className="text-xs font-bold text-slate-700">
                      {upcomingMonthFilter === 'all'
                        ? 'No upcoming commitments due'
                        : `No upcoming commitments scheduled for ${selectedMonthLabel}`}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                      Plan future payable debt, bills, grocery provisions, father giving, or mega projects.
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
                      <button
                        onClick={onOpenQuickProject}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                      >
                        + Add Upcoming Commitment
                      </button>
                      {upcomingMonthFilter !== 'all' && (
                        <button
                          onClick={() => setUpcomingMonthFilter('all')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                        >
                          Show All Months
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                    {visibleUpcomingExpenditures.map(proj => {
                      const isCompleted = proj.status === 'completed';
                      const daysToGo = getDaysToGo(proj.expectedDate, proj.isUndated);
                      const meta = getExpenseCategoryMeta(proj.category);
                      const IconComponent = meta.icon;
                      const remainingAmt = proj.amount ?? proj.expectedAmount ?? 0;
                      const monthTag = formatItemMonthTag(proj.expectedDate, proj.targetMonth, proj.isUndated);

                      return (
                        <div
                          key={proj.id}
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isCompleted
                              ? 'bg-slate-100/70 border-slate-200 opacity-60'
                              : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Checkbox & Details */}
                            <div className="flex items-start gap-2.5 min-w-0">
                              {/* Complete Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleUpcomingExpenseComplete(proj)}
                                className="mt-0.5 p-1 -m-1 rounded-lg text-slate-400 hover:text-indigo-600 focus:outline-hidden transition-colors"
                                title={isCompleted ? 'Click to reopen as pending' : 'Click to mark as paid / cleared in full'}
                              >
                                {isCompleted ? (
                                  <CheckSquare className="w-5 h-5 text-indigo-600 fill-indigo-50 shrink-0" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-300 hover:text-indigo-500 shrink-0" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-sm font-extrabold truncate ${
                                      isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                                    }`}
                                  >
                                    {proj.title}
                                  </span>

                                  {/* Category Badge */}
                                  <span
                                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-full border ${meta.badgeClass}`}
                                  >
                                    <IconComponent className="w-3 h-3" />
                                    <span>{meta.label}</span>
                                  </span>

                                  {isCompleted && (
                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                      <Check className="w-2.5 h-2.5" />
                                      Paid / Cleared
                                    </span>
                                  )}
                                </div>

                                {proj.description && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                    {proj.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Amount */}
                            <div className="text-right shrink-0">
                              <div
                                className={`font-mono font-black text-sm ${
                                  isCompleted ? 'text-slate-400 line-through' : 'text-slate-900'
                                }`}
                              >
                                ৳ {remainingAmt.toLocaleString()}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {isCompleted ? 'cleared' : 'remaining due'}
                              </span>
                            </div>
                          </div>

                          {/* Date Remaining / Days to Go Bar */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-slate-500 font-medium text-[11px]">
                                {proj.expectedDate ? `Target: ${proj.expectedDate}` : 'Flexible Horizon'}
                              </span>
                              {monthTag && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  <Calendar className="w-2.5 h-2.5 text-indigo-600" />
                                  <span>{monthTag}</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Days To Go Badge */}
                              <span
                                className={`text-[11px] px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${daysToGo.badgeClass}`}
                              >
                                <span>{daysToGo.label}</span>
                              </span>

                              {/* Direct Delete Button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteUpcomingExpense(proj)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                                title="Delete this commitment directly (not necessary to complete or decrease)"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bottom Nav Helper */}
              <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  {allUpcomingExpenditures.filter(p => p.status === 'completed').length} cleared commitments
                </span>
                <button
                  onClick={() => onNavigate('project')}
                  className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <span>Paydown / Manage Commitments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Gemini AI Chatbot Feature Card */}
      {onOpenChatbot && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-sm border border-indigo-800/60 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-xs mb-3 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Google Gemini AI System • Real-Time Database Access</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Family Diary AI Chatbot
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                Ask any question about your household budget, reserve balance, income worksheets, or upcoming project deadlines. Gemini thinks and gives diverse, tailored insights every time.
              </p>

              {/* Quick Prompt Preview Pills */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <button
                  onClick={onOpenChatbot}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
                >
                  💰 "How is our reserve balance?"
                </button>
                <button
                  onClick={onOpenChatbot}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
                >
                  🚗 "Breakdown Transportation"
                </button>
                <button
                  onClick={onOpenChatbot}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors"
                >
                  📅 "Upcoming project readiness"
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={onOpenChatbot}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Bot className="w-4 h-4" />
                <span>Launch AI Chatbot</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Decorative background glow */}
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* Spending Trends & Peak Spending Months Visualizer (Recharts) */}
      <div id="spending-trends-dashboard">
        <SpendingTrendsDashboard
          expenditures={expenditures}
          projects={projects}
          onNavigateToExpense={() => onNavigate('expenditure')}
        />
      </div>

      {/* Income Streams Quick Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income Streams Summary */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>4 Income Sections</span>
              </h3>
              <button
                onClick={() => onNavigate('income')}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View Income Database →
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { label: '1. Tuition Fees', cat: 'tution', color: 'bg-emerald-500' },
                { label: '2. Father Salary', cat: 'father_salary', color: 'bg-teal-500' },
                { label: '3. Selling Product', cat: 'selling_product', color: 'bg-cyan-500' },
                { label: '4. Others Help', cat: 'others_help', color: 'bg-blue-500' },
              ].map(item => {
                const total = worksheets
                  .filter(w => w.category === item.cat)
                  .reduce((sum, w) => sum + (w.totalAmount || 0), 0);
                const percent = totalWorksheetIncome > 0 ? (total / totalWorksheetIncome) * 100 : 0;

                return (
                  <div key={item.cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{item.label}</span>
                      <span className="font-mono font-bold text-slate-900">
                        ৳ {total.toLocaleString()} ({Math.round(percent)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total Worksheets Registered:</span>
            <strong className="text-slate-900 font-bold">{worksheets.length} active sheets</strong>
          </div>
        </div>

        {/* Recent Expenditures Quick List */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                <span>Recent Expenditures</span>
              </h3>
              <button
                onClick={() => onNavigate('expenditure')}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                View Monthly History →
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {expenditures.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No expenditures recorded yet. Click below to record one.
                </div>
              ) : (
                expenditures.slice(0, 4).map(exp => {
                  const isTodayExp =
                    (Array.isArray(exp.dates) && exp.dates.includes(todayStr)) ||
                    exp.primaryDate === todayStr;

                  return (
                    <div key={exp.id} className="py-2.5 flex items-center justify-between group">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1">
                            {exp.description}
                          </p>
                          {isTodayExp && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {exp.dates && exp.dates.length > 0 ? exp.dates.join(', ') : '⚡ No specific date'} • {exp.category || 'General'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-rose-600 text-xs sm:text-sm">
                          ৳ {exp.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => onNavigate('expenditure')}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit this expenditure"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteExpenditure && (
                          <button
                            onClick={() => {
                              onDeleteExpenditure(exp.id);
                              showToast(`✓ Deleted expenditure "${exp.description}"`);
                            }}
                            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                            title="Delete this record directly"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => onNavigate('expenditure')}
              className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Category Quick Ledger</span>
            </button>
            <button
              onClick={onOpenQuickExpense}
              className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
              title="Create new expenditure with date wizard"
            >
              + Create Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
