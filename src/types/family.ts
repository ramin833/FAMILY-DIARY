export type NavSection = 'home' | 'income' | 'expenditure' | 'project' | 'miscellaneous';

export type CurrentIncomeCategory = 'tution' | 'father_salary' | 'selling_product' | 'others_help' | string;

export type IncomeCategory =
  | 'tution'
  | 'father_salary'
  | 'selling_product'
  | 'others_help'
  | 'upcoming_tution'
  | 'upcoming_father_salary'
  | 'upcoming_due_debt'
  | string;

export interface ColumnDefinition {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date';
  width?: number;
}

export interface RowData {
  id: string;
  cells: Record<string, string | number | boolean>;
}

export interface Worksheet {
  id: string;
  userId: string;
  category: IncomeCategory;
  title: string;
  columns: ColumnDefinition[];
  rows: RowData[];
  totalAmount?: number;
  currency?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expenditure {
  id: string;
  userId: string;
  dates: string[]; // List of specific dates (YYYY-MM-DD)
  primaryDate: string; // First selected date (YYYY-MM-DD)
  month: string; // YYYY-MM
  amount: number;
  description: string;
  category?: string; // e.g. Grocery, Utilities, House Rent, Health, Education, Debt, Donation, Shopping, Other
  createdAt: string;
}

export type UpcomingExpenditureCategory =
  | 'payable_debt'
  | 'payment'
  | 'grocery'
  | 'mega_project'
  | 'father_giving'
  | 'education'
  | 'transportation'
  | string;

export interface UpcomingPaymentHistory {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  category?: UpcomingExpenditureCategory | string;
  title: string;
  expectedDate: string; // YYYY-MM-DD or empty
  expectedAmount: number; // For compatibility
  initialAmount?: number; // Total original commitment / debt (e.g. 10000)
  amount?: number; // Current remaining amount due (e.g. 8000)
  paidAmount?: number; // Amount paid so far (e.g. 2000)
  isUndated?: boolean; // For "skip date" / "no specific date"
  targetHorizon?: 'this_month' | 'next_month' | 'later' | string;
  targetMonth?: string; // YYYY-MM
  description: string;
  status: 'planning' | 'in_progress' | 'completed' | 'pending';
  completedAt?: string;
  paymentHistory?: UpcomingPaymentHistory[];

  // Mega Project specific fields ("mega project contain timer description etc."):
  targetDeadline?: string; // ISO date-time or YYYY-MM-DD for timer countdown
  projectScope?: string;
  milestones?: { id: string; title: string; completed: boolean }[];

  createdAt: string;
  updatedAt?: string;
}

export type UpcomingExpenditure = Project;

export interface FamilyNote {
  id: string;
  userId: string;
  content: string;
  tag?: string;
  createdAt: string;
}

export interface IncomeRecord {
  id: string;
  sheetId?: string;
  userId: string;
  category: IncomeCategory;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  title: string;
  description?: string;

  // 1. Tuition Income
  tuitionName?: string;
  studentClass?: string;
  subject?: string;

  // 2. Father Salary
  job?: string;
  salaryAmount?: number;

  // 3. Selling Product
  productName?: string;
  productQuantity?: string;

  // 4. Others Help
  whoHelp?: string;
  helpOccasion?: string;

  createdAt: string;
  updatedAt?: string;
}

export type UpcomingIncomeCategory = 'tution' | 'father_salary' | 'due_debt' | string;

export interface UpcomingIncomeItem {
  id: string;
  sheetId?: string;
  userId: string;
  category: UpcomingIncomeCategory;
  amount: number;
  expectedDate?: string; // YYYY-MM-DD or empty
  targetMonth: string; // YYYY-MM
  isUndated: boolean;
  title: string;
  description?: string;

  // 1. Tuition
  studentName?: string;
  studentClass?: string;
  subject?: string;

  // 2. Father Salary
  job?: string;
  salaryPeriod?: string;

  // 3. Due Debt (recoverable money owed by someone)
  debtorName?: string;
  debtReason?: string;

  status: 'pending' | 'received';
  receivedDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FamilyStats {
  todayIncome: number;
  todayExpenditure: number;
  monthIncome: number;
  monthExpenditure: number;
  netSavings: number;
  upcomingProjectsCount: number;
}
