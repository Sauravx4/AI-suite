import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderFinancials,
  getDispatchDeadlineStatus,
  calculateExpenseFundBalance,
  formatINR,
} from './calculations.ts';

test('calculateOrderFinancials correctly calculates unpaid order', () => {
  const result = calculateOrderFinancials(150000, []);
  assert.equal(result.orderTotal, 150000);
  assert.equal(result.totalReceived, 0);
  assert.equal(result.outstandingBalance, 150000);
  assert.equal(result.paymentStatus, 'UNPAID');
});

test('calculateOrderFinancials handles multiple partial payments', () => {
  const payments = [
    { amount: 50000, paymentDate: '2026-10-01' },
    { amount: 25000.5, paymentDate: '2026-10-10' },
  ];
  const result = calculateOrderFinancials(150000, payments);
  assert.equal(result.orderTotal, 150000);
  assert.equal(result.totalReceived, 75000.5);
  assert.equal(result.outstandingBalance, 74999.5);
  assert.equal(result.paymentStatus, 'PARTIAL');
});

test('calculateOrderFinancials marks fully paid orders', () => {
  const payments = [
    { amount: 50000, paymentDate: '2026-10-01' },
    { amount: 50000, paymentDate: '2026-10-05' },
  ];
  const result = calculateOrderFinancials(100000, payments);
  assert.equal(result.outstandingBalance, 0);
  assert.equal(result.totalReceived, 100000);
  assert.equal(result.paymentStatus, 'PAID');
});

test('calculateOrderFinancials clamps negative balance if overpaid', () => {
  const payments = [{ amount: 120000, paymentDate: '2026-10-01' }];
  const result = calculateOrderFinancials(100000, payments);
  assert.equal(result.outstandingBalance, 0);
  assert.equal(result.totalReceived, 120000);
  assert.equal(result.paymentStatus, 'PAID');
});

test('getDispatchDeadlineStatus triggers 5-day urgent reminder', () => {
  const refDate = '2026-10-17';
  // 4 days left
  const reminder = getDispatchDeadlineStatus('2026-10-21', refDate);
  assert.equal(reminder.isUrgent, true);
  assert.equal(reminder.isOverdue, false);
  assert.equal(reminder.severity, 'warning');

  // Overdue
  const overdue = getDispatchDeadlineStatus('2026-10-15', refDate);
  assert.equal(overdue.isUrgent, true);
  assert.equal(overdue.isOverdue, true);
  assert.equal(overdue.severity, 'critical');

  // Safe (> 5 days)
  const safe = getDispatchDeadlineStatus('2026-10-28', refDate);
  assert.equal(safe.isUrgent, false);
  assert.equal(safe.isOverdue, false);
  assert.equal(safe.severity, 'normal');
});

test('calculateExpenseFundBalance calculates available balance correctly', () => {
  const openingBalance = 20000;
  const advances = [
    { amount: 50000, date: '2026-10-01', source: 'Director Advance' },
    { amount: 30000, date: '2026-10-10', source: 'Client Advance' },
  ];
  const expenses = [
    {
      amount: 15000,
      date: '2026-10-05',
      category: 'Office Supplies',
      madeBy: 'Rajesh',
      forPersonOrDept: 'Operations',
      description: 'Packaging materials for GeM dispatch',
    },
    {
      amount: 45000,
      date: '2026-10-12',
      category: 'Logistics',
      madeBy: 'Saurav',
      forPersonOrDept: 'Shipping',
      description: 'Freight for order #GEM-2026-981',
    },
  ];

  const summary = calculateExpenseFundBalance(openingBalance, advances, expenses, 10000);
  // Total funds = 20000 + 80000 = 100000
  // Total expenses = 60000
  // Available = 40000
  assert.equal(summary.totalFunds, 100000);
  assert.equal(summary.totalExpenses, 60000);
  assert.equal(summary.availableBalance, 40000);
  assert.equal(summary.isLowBalance, false);
});

test('calculateExpenseFundBalance detects low balance warning', () => {
  const openingBalance = 5000;
  const advances = [{ amount: 10000, date: '2026-10-01', source: 'HQ' }];
  const expenses = [{
    amount: 12000,
    date: '2026-10-02',
    category: 'Travel',
    madeBy: 'Vikram',
    forPersonOrDept: 'Sales',
    description: 'Buyer meeting',
  }];

  const summary = calculateExpenseFundBalance(openingBalance, advances, expenses, 10000);
  // Total funds = 15000, expenses = 12000, available = 3000 < 10000
  assert.equal(summary.availableBalance, 3000);
  assert.equal(summary.isLowBalance, true);
  assert.match(summary.warningMessage || '', /below safety threshold/);
});

test('formatINR formats currency in Indian numbering', () => {
  const formatted = formatINR(150000);
  assert.ok(formatted.includes('1,50,000'));
});
