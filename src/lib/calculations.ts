/**
 * Pure calculation and business logic functions for INDOSATI Office Management Suite.
 * Decoupled from UI to ensure accurate, testable arithmetic.
 */

export interface PaymentRecord {
  id?: string;
  amount: number;
  paymentDate: string;
  reference?: string;
  paymentMode?: string;
}

export interface OrderFinancials {
  orderTotal: number;
  totalReceived: number;
  outstandingBalance: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
}

export function calculateOrderFinancials(
  orderTotal: number,
  payments: PaymentRecord[] = []
): OrderFinancials {
  const safeTotal = Math.max(0, Number(orderTotal) || 0);
  const totalReceived = payments.reduce(
    (sum, p) => sum + (Math.max(0, Number(p.amount) || 0)),
    0
  );
  // Accurate to 2 decimal places
  const roundedReceived = Math.round(totalReceived * 100) / 100;
  const rawBalance = safeTotal - roundedReceived;
  const outstandingBalance = Math.round(Math.max(0, rawBalance) * 100) / 100;

  let paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
  if (roundedReceived >= safeTotal && safeTotal > 0) {
    paymentStatus = 'PAID';
  } else if (roundedReceived > 0) {
    paymentStatus = 'PARTIAL';
  }

  return {
    orderTotal: safeTotal,
    totalReceived: roundedReceived,
    outstandingBalance,
    paymentStatus,
  };
}

export interface DispatchDeadlineAlert {
  daysRemaining: number;
  isOverdue: boolean;
  isUrgent: boolean; // 5 days or fewer
  statusText: string;
  severity: 'normal' | 'warning' | 'critical';
}

export function getDispatchDeadlineStatus(
  dispatchDeadline: string,
  referenceDate: string = new Date().toISOString().split('T')[0]
): DispatchDeadlineAlert {
  if (!dispatchDeadline) {
    return {
      daysRemaining: 999,
      isOverdue: false,
      isUrgent: false,
      statusText: 'No deadline set',
      severity: 'normal',
    };
  }

  const deadline = new Date(dispatchDeadline);
  deadline.setHours(0, 0, 0, 0);

  const current = new Date(referenceDate);
  current.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - current.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      daysRemaining: diffDays,
      isOverdue: true,
      isUrgent: true,
      statusText: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
      severity: 'critical',
    };
  } else if (diffDays <= 5) {
    return {
      daysRemaining: diffDays,
      isOverdue: false,
      isUrgent: true,
      statusText: diffDays === 0 ? 'Dispatch due today' : `${diffDays} day${diffDays === 1 ? '' : 's'} left (Urgent)`,
      severity: 'warning',
    };
  } else {
    return {
      daysRemaining: diffDays,
      isOverdue: false,
      isUrgent: false,
      statusText: `${diffDays} days remaining`,
      severity: 'normal',
    };
  }
}

export interface AdvanceRecord {
  id?: string;
  amount: number;
  date: string;
  source: string;
  description?: string;
}

export interface ExpenseRecord {
  id?: string;
  amount: number;
  date: string;
  category: string;
  madeBy: string;
  forPersonOrDept: string;
  description: string;
  linkedOrderId?: string | null;
}

export interface FundSummary {
  openingBalance: number;
  totalAdvances: number;
  totalFunds: number;
  totalExpenses: number;
  availableBalance: number;
  isLowBalance: boolean;
  warningMessage?: string;
}

export function calculateExpenseFundBalance(
  openingBalance: number = 0,
  advances: AdvanceRecord[] = [],
  expenses: ExpenseRecord[] = [],
  lowBalanceThreshold: number = 10000
): FundSummary {
  const safeOpening = Math.max(0, Number(openingBalance) || 0);
  const totalAdvances = advances.reduce(
    (acc, a) => acc + (Math.max(0, Number(a.amount) || 0)),
    0
  );
  const roundedAdvances = Math.round(totalAdvances * 100) / 100;
  const totalFunds = Math.round((safeOpening + roundedAdvances) * 100) / 100;

  const totalExpenses = expenses.reduce(
    (acc, e) => acc + (Math.max(0, Number(e.amount) || 0)),
    0
  );
  const roundedExpenses = Math.round(totalExpenses * 100) / 100;
  const availableBalance = Math.round((totalFunds - roundedExpenses) * 100) / 100;

  const isLowBalance = availableBalance < lowBalanceThreshold;
  let warningMessage: string | undefined;

  if (availableBalance < 0) {
    warningMessage = `Critical: Deficit of ₹${Math.abs(availableBalance).toLocaleString('en-IN')}. Recorded expenses exceed available office funds.`;
  } else if (isLowBalance) {
    warningMessage = `Warning: Available balance (₹${availableBalance.toLocaleString('en-IN')}) is below safety threshold of ₹${lowBalanceThreshold.toLocaleString('en-IN')}.`;
  }

  return {
    openingBalance: safeOpening,
    totalAdvances: roundedAdvances,
    totalFunds,
    totalExpenses: roundedExpenses,
    availableBalance,
    isLowBalance,
    warningMessage,
  };
}

export function formatINR(amount: number, showDecimals: boolean = false): string {
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  });
  return `₹${formatted}`;
}
