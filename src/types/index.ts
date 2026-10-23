export interface PaymentRecord {
  id: string;
  amount: number;
  paymentDate: string;
  reference: string;
  paymentMode: string;
}

export interface OrderHistoryItem {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  performedBy: string;
}

export interface GeMOrder {
  id: string;
  gemOrderDate: string;
  dispatchDeadline: string;
  productName: string;
  quantity: number;
  buyerName: string;
  buyerOrg: string;
  buyerAddress: string;
  buyerContact: string;
  buyerEmail: string;
  orderTotal: number;
  orderStatus: 'Draft' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'CRAC Generated' | 'Closed';
  dispatchDate: string | null;
  transporterName: string | null;
  docketNumber: string | null;
  buyerReceiptDate: string | null;
  cracGenerated: boolean;
  cracDate: string | null;
  notes: string;
  payments: PaymentRecord[];
  history: OrderHistoryItem[];
  createdAt: string;
  updatedAt: string;
  financials?: {
    orderTotal: number;
    totalReceived: number;
    outstandingBalance: number;
    paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  };
  deadlineAlert?: {
    daysRemaining: number;
    isOverdue: boolean;
    isUrgent: boolean;
    statusText: string;
    severity: 'normal' | 'warning' | 'critical';
  };
  linkedExpenseCount?: number;
  linkedExpenseTotal?: number;
  linkedExpenses?: ExpenseRecord[];
}

export interface ExpenseRecord {
  id: string;
  date: string;
  amount: number;
  category: string;
  madeBy: string;
  forPersonOrDept: string;
  description: string;
  linkedOrderId: string | null;
  paymentMode: string;
  receiptName: string | null;
  createdAt: string;
}

export interface AdvanceRecord {
  id: string;
  date: string;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  targetModule: 'crm' | 'expenses' | 'system';
  targetId?: string;
  isRead: boolean;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

export interface DashboardStats {
  crm: {
    totalOrders: number;
    pendingDispatches: number;
    pendingCrac: number;
    totalOutstanding: number;
    urgentDispatches: number;
  };
  expenses: {
    totalExpenses: number;
    availableBalance: number;
    totalAdvances: number;
    openingBalance: number;
    isLowBalance: boolean;
    warningMessage?: string;
  };
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  organization: string;
}

export interface ExpensePerson {
  id: string;
  name: string;
  roleOrDept: string;
  phone?: string;
}

export interface LinkedAppModule {
  id: string;
  name: string;
  shortDescription: string;
  category: string;
  url: string;
  mode: 'internal_workspace' | 'iframe_embed' | 'external_link';
  iconName: string;
  status: 'active' | 'planned';
  createdAt: string;
  records?: Array<{
    id: string;
    title: string;
    status: string;
    valueOrNote: string;
    date: string;
  }>;
}

export interface SuiteConfig {
  openingBalance: number;
  expenseCategories: string[];
  expensePersons: ExpensePerson[];
  linkedApps: LinkedAppModule[];
}

