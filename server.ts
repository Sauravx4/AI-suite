import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  calculateOrderFinancials,
  getDispatchDeadlineStatus,
  calculateExpenseFundBalance,
} from './src/lib/calculations.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(express.json());

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial robust seed data representing real INDOSATI operations
const DEFAULT_CATEGORIES = [
  'Logistics & Dispatch',
  'Packaging & Materials',
  'Office Rent & Utilities',
  'Travel & Buyer Visit',
  'Stationery & Printing',
  'Tea & Refreshments',
  'Staff Advance',
  'Maintenance & IT',
  'Other',
];

const DEFAULT_PERSONS = [
  { id: 'PER-1', name: 'Saurav Mourya', roleOrDept: 'Director / Business Development', phone: '+91 98100 11223' },
  { id: 'PER-2', name: 'Rajesh Gupta', roleOrDept: 'Head Office Administration', phone: '+91 98100 44556' },
  { id: 'PER-3', name: 'Vikram Singh', roleOrDept: 'Warehouse & Dispatch Logistics', phone: '+91 98100 77889' },
  { id: 'PER-4', name: 'Pooja Sharma', roleOrDept: 'Accounts & Pantry Welfare', phone: '+91 98100 99001' },
];

const DEFAULT_LINKED_APPS = [
  {
    id: 'APP-INV-01',
    name: 'INDOSATI Inventory & Stock Control',
    shortDescription: 'Track solar panels, LED luminaires, raw materials, and warehouse batch serials.',
    category: 'Operations & Warehouse',
    url: '',
    mode: 'internal_workspace',
    iconName: 'Boxes',
    status: 'active',
    createdAt: '2026-10-18T10:00:00Z',
    records: [
      {
        id: 'STK-101',
        title: '60W MPPT Solar Street Light (BIS Batch #B26)',
        status: 'In Stock (185 Units)',
        valueOrNote: 'Gurgaon Warehouse Bay-2',
        date: '2026-10-18',
      },
      {
        id: 'STK-102',
        title: '200W High Mast LED Floodlight',
        status: 'Low Stock (18 Units)',
        valueOrNote: 'Reorder scheduled for MES tender',
        date: '2026-10-18',
      },
    ],
  },
];

const DEFAULT_DB = {
  openingBalance: 500,
  openingBalanceCustomized: true,
  expenseCategories: DEFAULT_CATEGORIES,
  expensePersons: DEFAULT_PERSONS,
  linkedApps: DEFAULT_LINKED_APPS,
  orders: [
    {
      id: 'GEM-2026-9042',
      gemOrderDate: '2026-10-04',
      dispatchDeadline: '2026-10-21', // 4 days left! Urgent trigger
      productName: 'All-In-One Solar Street Light 60W with MPPT Controller',
      quantity: 120,
      buyerName: 'Er. Rajeshwar Singh, Executive Engineer (Electrical)',
      buyerOrg: 'Public Works Department (PWD), Zone-2, Jaipur, Rajasthan',
      buyerAddress: 'PWD Electrical Division, Jacob Road, Civil Lines, Jaipur - 302006',
      buyerContact: '+91 94140 55823',
      buyerEmail: 'ee.pwd.elec.jpr@rajasthan.gov.in',
      orderTotal: 1140000,
      orderStatus: 'Confirmed',
      dispatchDate: null,
      transporterName: 'Gati-KWE Logistics Ltd.',
      docketNumber: null,
      buyerReceiptDate: null,
      cracGenerated: false,
      cracDate: null,
      notes: 'Ministry approved BIS certified batch. Keep waterproof wrapping.',
      payments: [
        {
          id: 'PMT-9042-1',
          amount: 250000,
          paymentDate: '2026-10-06',
          reference: 'RTGS-P9042-ADVANCE',
          paymentMode: 'Bank Transfer (RTGS)',
        },
      ],
      history: [
        {
          id: 'HIST-1',
          timestamp: '2026-10-04T10:30:00Z',
          action: 'Order Accepted',
          details: 'GeM Contract accepted and confirmed by INDOSATI Sales Desk',
          performedBy: 'Saurav Mourya',
        },
        {
          id: 'HIST-2',
          timestamp: '2026-10-06T15:00:00Z',
          action: 'Advance Payment Received',
          details: 'Recorded advance payment of ₹2,50,000 via RTGS',
          performedBy: 'Finance Desk',
        },
      ],
      createdAt: '2026-10-04T10:30:00Z',
      updatedAt: '2026-10-06T15:00:00Z',
    },
    {
      id: 'GEM-2026-8819',
      gemOrderDate: '2026-09-22',
      dispatchDeadline: '2026-10-12', // Past deadline, dispatched on time
      productName: 'High Mast LED Floodlight Luminaires 200W',
      quantity: 45,
      buyerName: 'Col. Sanjeev Varma, Staff Officer',
      buyerOrg: 'Military Engineer Services (MES), Western Command',
      buyerAddress: 'HQ Chief Engineer, Chandimandir Military Cantonment, Haryana - 134107',
      buyerContact: '+91 98140 22319',
      buyerEmail: 'so1.chandimandir@mes.gov.in',
      orderTotal: 785000,
      orderStatus: 'Dispatched',
      dispatchDate: '2026-10-10',
      transporterName: 'VRL Logistics Ltd.',
      docketNumber: 'VRL-CHD-881944',
      buyerReceiptDate: '2026-10-14',
      cracGenerated: false, // Pending CRAC!
      cracDate: null,
      notes: 'Consignment delivered at Chandimandir depot. Awaiting CRAC certificate upload on GeM portal.',
      payments: [
        {
          id: 'PMT-8819-1',
          amount: 500000,
          paymentDate: '2026-10-12',
          reference: 'NEFT-MES-500K',
          paymentMode: 'Bank Transfer (NEFT)',
        },
      ],
      history: [
        {
          id: 'HIST-3',
          timestamp: '2026-09-22T09:15:00Z',
          action: 'Order Accepted',
          details: 'GeM direct purchase order verified',
          performedBy: 'Saurav Mourya',
        },
        {
          id: 'HIST-4',
          timestamp: '2026-10-10T16:45:00Z',
          action: 'Dispatched via VRL Logistics',
          details: 'Docket VRL-CHD-881944 issued from Gurgaon Hub',
          performedBy: 'Warehouse Operations',
        },
      ],
      createdAt: '2026-09-22T09:15:00Z',
      updatedAt: '2026-10-14T11:00:00Z',
    },
    {
      id: 'GEM-2026-8510',
      gemOrderDate: '2026-09-10',
      dispatchDeadline: '2026-09-30',
      productName: 'Smart Grid Energy Metering System 3-Phase',
      quantity: 80,
      buyerName: 'Dr. M. K. Narayanan, Director of Works',
      buyerOrg: 'Bharat Heavy Electricals Limited (BHEL), Bhopal Unit',
      buyerAddress: 'BHEL Complex, Piplani, Bhopal, Madhya Pradesh - 462022',
      buyerContact: '+91 755 250 3381',
      buyerEmail: 'works.purchase@bhel.in',
      orderTotal: 1850000,
      orderStatus: 'CRAC Generated',
      dispatchDate: '2026-09-25',
      transporterName: 'SafeXpress Logistics',
      docketNumber: 'SFX-BPL-77312',
      buyerReceiptDate: '2026-09-28',
      cracGenerated: true,
      cracDate: '2026-10-02',
      notes: 'CRAC issued with zero rejection. Full payment in progress.',
      payments: [
        {
          id: 'PMT-8510-1',
          amount: 1000000,
          paymentDate: '2026-10-05',
          reference: 'RTGS-BHEL-001',
          paymentMode: 'Bank Transfer (RTGS)',
        },
        {
          id: 'PMT-8510-2',
          amount: 850000,
          paymentDate: '2026-10-15',
          reference: 'RTGS-BHEL-002',
          paymentMode: 'Bank Transfer (RTGS)',
        },
      ],
      history: [
        {
          id: 'HIST-5',
          timestamp: '2026-10-02T14:20:00Z',
          action: 'CRAC Uploaded',
          details: 'CRAC #CRAC-BHEL-2026-99 issued with 100% acceptance',
          performedBy: 'Compliance Desk',
        },
        {
          id: 'HIST-6',
          timestamp: '2026-10-15T18:00:00Z',
          action: 'Final Payment Received',
          details: 'Full contract value reconciled. Order fully cleared.',
          performedBy: 'Finance Desk',
        },
      ],
      createdAt: '2026-09-10T11:00:00Z',
      updatedAt: '2026-10-15T18:00:00Z',
    },
  ],
  advances: [
    {
      id: 'ADV-2026-01',
      date: '2026-10-01',
      amount: 150000,
      source: 'Director Current Account (HDFC Bank)',
      description: 'Monthly office operational advance for October operations',
      createdAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 'ADV-2026-02',
      date: '2026-10-11',
      amount: 75000,
      source: 'Company Main Account - Petty Cash Top-up',
      description: 'Urgent transit logistics & field packaging advance',
      createdAt: '2026-10-11T11:30:00Z',
    },
  ],
  expenses: [
    {
      id: 'EXP-2026-101',
      date: '2026-10-05',
      amount: 16500,
      category: 'Office Rent & Utilities',
      madeBy: 'Rajesh Gupta',
      forPersonOrDept: 'Head Office Administration',
      description: 'Electricity & High-speed fiber broadband bill for October',
      linkedOrderId: null,
      paymentMode: 'UPI',
      receiptName: 'broadband_bill_oct.pdf',
      createdAt: '2026-10-05T14:10:00Z',
    },
    {
      id: 'EXP-2026-102',
      date: '2026-10-09',
      amount: 28400,
      category: 'Packaging & Materials',
      madeBy: 'Vikram Singh',
      forPersonOrDept: 'Warehouse Packaging Team',
      description: 'Heavy duty wooden crates and shock-absorbent foam for GeM MES Chandimandir dispatch',
      linkedOrderId: 'GEM-2026-8819', // Linked to CRM order!
      paymentMode: 'Bank Transfer',
      receiptName: 'wooden_crates_tax_inv.pdf',
      createdAt: '2026-10-09T16:20:00Z',
    },
    {
      id: 'EXP-2026-103',
      date: '2026-10-10',
      amount: 32000,
      category: 'Logistics & Dispatch',
      madeBy: 'Vikram Singh',
      forPersonOrDept: 'Shipping & Freight',
      description: 'VRL Express freight charges from Gurgaon hub to Chandimandir Cantonment',
      linkedOrderId: 'GEM-2026-8819', // Linked to CRM order!
      paymentMode: 'Bank Transfer',
      receiptName: 'vrl_freight_receipt.pdf',
      createdAt: '2026-10-10T17:00:00Z',
    },
    {
      id: 'EXP-2026-104',
      date: '2026-10-13',
      amount: 8500,
      category: 'Travel & Buyer Visit',
      madeBy: 'Saurav Mourya',
      forPersonOrDept: 'Business Development',
      description: 'Site inspection & client meeting with PWD Electrical Division in Jaipur',
      linkedOrderId: 'GEM-2026-9042', // Linked to CRM order!
      paymentMode: 'Company Card',
      receiptName: 'toll_fuel_jaipur_exp.pdf',
      createdAt: '2026-10-13T19:30:00Z',
    },
    {
      id: 'EXP-2026-105',
      date: '2026-10-15',
      amount: 4200,
      category: 'Tea & Refreshments',
      madeBy: 'Pooja Sharma',
      forPersonOrDept: 'Pantry & Staff Welfare',
      description: 'Monthly office pantry tea, coffee, mineral water and guest snacks',
      linkedOrderId: null,
      paymentMode: 'Cash',
      receiptName: 'pantry_voucher_oct.pdf',
      createdAt: '2026-10-15T11:45:00Z',
    },
  ],
  notifications: [
    {
      id: 'NOTIF-1',
      type: 'DISPATCH_REMINDER',
      title: 'GeM Dispatch Deadline Approaching (4 Days Left)',
      message: 'Order GEM-2026-9042 for PWD Jaipur must be dispatched by 21-Oct-2026. Prepare packaging and booking.',
      targetModule: 'crm',
      targetId: 'GEM-2026-9042',
      isRead: false,
      severity: 'warning',
      timestamp: '2026-10-17T08:00:00Z',
    },
    {
      id: 'NOTIF-2',
      type: 'PENDING_CRAC',
      title: 'CRAC Acceptance Pending for Delivered Consignment',
      message: 'Order GEM-2026-8819 was delivered to MES Chandimandir on 14-Oct-2026. CRAC is pending generation.',
      targetModule: 'crm',
      targetId: 'GEM-2026-8819',
      isRead: false,
      severity: 'info',
      timestamp: '2026-10-16T10:00:00Z',
    },
  ],
};

// Database persistence helpers with transactional file writing
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf8');
      return DEFAULT_DB;
    }
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    let mutated = false;

    if (!parsed.openingBalanceCustomized && parsed.openingBalance === 50000) {
      parsed.openingBalance = 500;
      parsed.openingBalanceCustomized = true;
      mutated = true;
    }
    if (!Array.isArray(parsed.expenseCategories) || parsed.expenseCategories.length === 0) {
      parsed.expenseCategories = [...DEFAULT_CATEGORIES];
      mutated = true;
    }
    if (!Array.isArray(parsed.expensePersons) || parsed.expensePersons.length === 0) {
      parsed.expensePersons = [...DEFAULT_PERSONS];
      mutated = true;
    }
    if (!Array.isArray(parsed.linkedApps)) {
      parsed.linkedApps = [...DEFAULT_LINKED_APPS];
      mutated = true;
    }

    if (mutated) {
      writeDb(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading db.json, falling back to in-memory defaults:', err);
    return DEFAULT_DB;
  }
}

function writeDb(dbData: any) {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), 'utf8');
    fs.renameSync(tempFile, DB_FILE);
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err);
    return false;
  }
}

// User state simulation (Admin vs Staff)
let currentUser = {
  id: 'USR-01',
  name: 'Saurav Mourya',
  email: 'sauravmourya54@gmail.com',
  role: 'admin', // 'admin' | 'staff'
  organization: 'INDOSATI Technologies',
};

/* -------------------------------------------------------------
   API ROUTES
------------------------------------------------------------- */

// Auth routes
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({
    user: currentUser,
    permissions: {
      canEdit: true,
      canDelete: currentUser.role === 'admin',
      canExport: true,
      canImport: currentUser.role === 'admin',
      canManageFunds: currentUser.role === 'admin',
    },
  });
});

app.post('/api/auth/switch-role', (req: Request, res: Response) => {
  const { role } = req.body;
  if (role === 'admin' || role === 'staff') {
    currentUser.role = role;
    return res.json({ success: true, user: currentUser });
  }
  return res.status(400).json({ error: 'Invalid role' });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  const db = readDb();
  const refDate = new Date().toISOString().split('T')[0];

  // CRM calculations
  const totalOrders = db.orders.length;
  let pendingDispatches = 0;
  let pendingCrac = 0;
  let totalOutstanding = 0;
  let urgentDispatches = 0;

  db.orders.forEach((o: any) => {
    const financials = calculateOrderFinancials(o.orderTotal, o.payments || []);
    totalOutstanding += financials.outstandingBalance;

    if (o.orderStatus === 'Confirmed' || o.orderStatus === 'Draft') {
      pendingDispatches++;
      const deadline = getDispatchDeadlineStatus(o.dispatchDeadline, refDate);
      if (deadline.isUrgent) {
        urgentDispatches++;
      }
    }

    if (o.orderStatus === 'Dispatched' || (o.buyerReceiptDate && !o.cracGenerated)) {
      if (!o.cracGenerated) {
        pendingCrac++;
      }
    }
  });

  // Expense calculations
  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance || 0,
    db.advances || [],
    db.expenses || []
  );

  res.json({
    crm: {
      totalOrders,
      pendingDispatches,
      pendingCrac,
      totalOutstanding,
      urgentDispatches,
    },
    expenses: {
      totalExpenses: fundSummary.totalExpenses,
      availableBalance: fundSummary.availableBalance,
      totalAdvances: fundSummary.totalAdvances,
      openingBalance: fundSummary.openingBalance,
      isLowBalance: fundSummary.isLowBalance,
      warningMessage: fundSummary.warningMessage,
    },
  });
});

// CRM Orders routes
app.get('/api/crm/orders', (req: Request, res: Response) => {
  const db = readDb();
  const { status, paymentStatus, search, sort } = req.query;

  let result = db.orders.map((order: any) => {
    const financials = calculateOrderFinancials(order.orderTotal, order.payments || []);
    const deadline = getDispatchDeadlineStatus(order.dispatchDeadline);
    // Find any linked expenses
    const linkedExpenses = (db.expenses || []).filter((e: any) => e.linkedOrderId === order.id);
    const linkedExpenseTotal = linkedExpenses.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0);

    return {
      ...order,
      financials,
      deadlineAlert: deadline,
      linkedExpenseCount: linkedExpenses.length,
      linkedExpenseTotal,
    };
  });

  if (status && status !== 'All') {
    result = result.filter((o: any) => o.orderStatus === status);
  }

  if (paymentStatus && paymentStatus !== 'All') {
    result = result.filter((o: any) => o.financials.paymentStatus === paymentStatus);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(
      (o: any) =>
        o.id.toLowerCase().includes(q) ||
        o.buyerOrg.toLowerCase().includes(q) ||
        o.buyerName.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q)
    );
  }

  // Sort
  if (sort === 'deadline') {
    result.sort((a: any, b: any) => new Date(a.dispatchDeadline).getTime() - new Date(b.dispatchDeadline).getTime());
  } else if (sort === 'value_desc') {
    result.sort((a: any, b: any) => b.orderTotal - a.orderTotal);
  } else {
    result.sort((a: any, b: any) => new Date(b.gemOrderDate).getTime() - new Date(a.gemOrderDate).getTime());
  }

  res.json({ orders: result });
});

app.get('/api/crm/orders/:id', (req: Request, res: Response) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const financials = calculateOrderFinancials(order.orderTotal, order.payments || []);
  const deadlineAlert = getDispatchDeadlineStatus(order.dispatchDeadline);
  const linkedExpenses = (db.expenses || []).filter((e: any) => e.linkedOrderId === order.id);

  res.json({
    order: {
      ...order,
      financials,
      deadlineAlert,
      linkedExpenses,
    },
  });
});

app.post('/api/crm/orders', (req: Request, res: Response) => {
  const db = readDb();
  const {
    gemOrderDate,
    dispatchDeadline,
    productName,
    quantity,
    buyerName,
    buyerOrg,
    buyerAddress,
    buyerContact,
    buyerEmail,
    orderTotal,
    notes,
  } = req.body;

  if (!productName || !buyerOrg || !orderTotal || !dispatchDeadline) {
    return res.status(400).json({ error: 'Missing required fields for GeM Order' });
  }

  const newId = `GEM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newOrder = {
    id: newId,
    gemOrderDate: gemOrderDate || now.split('T')[0],
    dispatchDeadline,
    productName,
    quantity: Number(quantity) || 1,
    buyerName: buyerName || '',
    buyerOrg,
    buyerAddress: buyerAddress || '',
    buyerContact: buyerContact || '',
    buyerEmail: buyerEmail || '',
    orderTotal: Number(orderTotal),
    orderStatus: 'Confirmed',
    dispatchDate: null,
    transporterName: null,
    docketNumber: null,
    buyerReceiptDate: null,
    cracGenerated: false,
    cracDate: null,
    notes: notes || '',
    payments: [],
    history: [
      {
        id: `HIST-${Date.now()}`,
        timestamp: now,
        action: 'Order Created',
        details: `GeM Order ${newId} created with total value ₹${Number(orderTotal).toLocaleString('en-IN')}`,
        performedBy: currentUser.name,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  db.orders.unshift(newOrder);

  // Check if reminder needed
  const reminder = getDispatchDeadlineStatus(dispatchDeadline);
  if (reminder.isUrgent) {
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      type: 'DISPATCH_REMINDER',
      title: `Dispatch Reminder: ${newId}`,
      message: `Order ${newId} for ${buyerOrg} must be dispatched by ${dispatchDeadline} (${reminder.statusText}).`,
      targetModule: 'crm',
      targetId: newId,
      isRead: false,
      severity: reminder.severity,
      timestamp: now,
    });
  }

  writeDb(db);
  res.status(201).json({ success: true, order: newOrder });
});

app.put('/api/crm/orders/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = db.orders.findIndex((o: any) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const existing = db.orders[index];
  const updates = req.body;
  const now = new Date().toISOString();

  // Audit status changes
  const newHistory = [...(existing.history || [])];
  if (updates.orderStatus && updates.orderStatus !== existing.orderStatus) {
    newHistory.push({
      id: `HIST-${Date.now()}`,
      timestamp: now,
      action: 'Status Updated',
      details: `Status changed from ${existing.orderStatus} to ${updates.orderStatus}`,
      performedBy: currentUser.name,
    });
  }

  if (updates.cracGenerated && !existing.cracGenerated) {
    newHistory.push({
      id: `HIST-${Date.now()}`,
      timestamp: now,
      action: 'CRAC Certified',
      details: `CRAC generated on ${updates.cracDate || now.split('T')[0]}`,
      performedBy: currentUser.name,
    });
  }

  if (updates.dispatchDate && !existing.dispatchDate) {
    newHistory.push({
      id: `HIST-${Date.now()}`,
      timestamp: now,
      action: 'Order Dispatched',
      details: `Dispatched via ${updates.transporterName || 'Transporter'} (Docket: ${updates.docketNumber || 'N/A'})`,
      performedBy: currentUser.name,
    });
  }

  const updatedOrder = {
    ...existing,
    ...updates,
    history: newHistory,
    updatedAt: now,
  };

  db.orders[index] = updatedOrder;
  writeDb(db);
  res.json({ success: true, order: updatedOrder });
});

app.delete('/api/crm/orders/:id', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators are permitted to delete orders' });
  }
  const db = readDb();
  const filtered = db.orders.filter((o: any) => o.id !== req.params.id);
  if (filtered.length === db.orders.length) {
    return res.status(404).json({ error: 'Order not found' });
  }
  db.orders = filtered;
  writeDb(db);
  res.json({ success: true, message: `Order ${req.params.id} deleted successfully` });
});

// CRM Payments
app.post('/api/crm/orders/:id/payments', (req: Request, res: Response) => {
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { amount, paymentDate, reference, paymentMode } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Payment amount must be greater than zero' });
  }

  const now = new Date().toISOString();
  const paymentRecord = {
    id: `PMT-${Date.now()}`,
    amount: Number(amount),
    paymentDate: paymentDate || now.split('T')[0],
    reference: reference || 'Online Payment',
    paymentMode: paymentMode || 'Bank Transfer',
  };

  order.payments = order.payments || [];
  order.payments.push(paymentRecord);

  const financials = calculateOrderFinancials(order.orderTotal, order.payments);
  order.history = order.history || [];
  order.history.push({
    id: `HIST-${Date.now()}`,
    timestamp: now,
    action: 'Payment Receipt Added',
    details: `Received ₹${Number(amount).toLocaleString('en-IN')} via ${paymentMode}. Remaining balance: ₹${financials.outstandingBalance.toLocaleString('en-IN')}`,
    performedBy: currentUser.name,
  });

  order.updatedAt = now;
  writeDb(db);

  res.status(201).json({
    success: true,
    payment: paymentRecord,
    financials,
  });
});

app.delete('/api/crm/orders/:id/payments/:pmtId', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete payment records' });
  }
  const db = readDb();
  const order = db.orders.find((o: any) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  order.payments = (order.payments || []).filter((p: any) => p.id !== req.params.pmtId);
  const financials = calculateOrderFinancials(order.orderTotal, order.payments);
  order.updatedAt = new Date().toISOString();
  writeDb(db);

  res.json({ success: true, financials });
});

// Daily Expenses routes
app.get('/api/expenses', (req: Request, res: Response) => {
  const db = readDb();
  const { category, search, startDate, endDate, linkedOrderId } = req.query;

  let list = [...(db.expenses || [])];

  if (category && category !== 'All') {
    list = list.filter((e: any) => e.category === category);
  }

  if (linkedOrderId) {
    list = list.filter((e: any) => e.linkedOrderId === linkedOrderId);
  }

  if (startDate) {
    list = list.filter((e: any) => e.date >= String(startDate));
  }

  if (endDate) {
    list = list.filter((e: any) => e.date <= String(endDate));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (e: any) =>
        e.description.toLowerCase().includes(q) ||
        e.madeBy.toLowerCase().includes(q) ||
        e.forPersonOrDept.toLowerCase().includes(q) ||
        (e.linkedOrderId && e.linkedOrderId.toLowerCase().includes(q))
    );
  }

  // Sort by date desc
  list.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({ expenses: list });
});

app.post('/api/expenses', (req: Request, res: Response) => {
  const db = readDb();
  const {
    date,
    amount,
    category,
    madeBy,
    forPersonOrDept,
    description,
    linkedOrderId,
    paymentMode,
    receiptName,
  } = req.body;

  if (!amount || Number(amount) <= 0 || !category || !description) {
    return res.status(400).json({ error: 'Please provide valid amount, category, and description' });
  }

  const now = new Date().toISOString();
  const newExpense = {
    id: `EXP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    date: date || now.split('T')[0],
    amount: Number(amount),
    category,
    madeBy: madeBy || currentUser.name,
    forPersonOrDept: forPersonOrDept || 'General Office',
    description,
    linkedOrderId: linkedOrderId || null,
    paymentMode: paymentMode || 'Cash',
    receiptName: receiptName || null,
    createdAt: now,
  };

  db.expenses = db.expenses || [];
  db.expenses.unshift(newExpense);

  // Auto-save custom category or new expense person if not already in settings
  db.expenseCategories = db.expenseCategories || [...DEFAULT_CATEGORIES];
  if (category && !db.expenseCategories.includes(category)) {
    db.expenseCategories.push(category);
  }

  db.expensePersons = db.expensePersons || [...DEFAULT_PERSONS];
  if (
    newExpense.madeBy &&
    !db.expensePersons.some((p: any) => p.name.toLowerCase() === newExpense.madeBy.toLowerCase())
  ) {
    db.expensePersons.push({
      id: `PER-${Date.now()}`,
      name: newExpense.madeBy,
      roleOrDept: newExpense.forPersonOrDept || 'Office Staff',
    });
  }

  // Re-check balance warning
  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance ?? 500,
    db.advances || [],
    db.expenses
  );

  if (fundSummary.isLowBalance) {
    db.notifications.unshift({
      id: `NOTIF-${Date.now()}`,
      type: 'LOW_BALANCE',
      title: 'Low Office Expense Balance Alert',
      message: fundSummary.warningMessage || 'Office funds are below safety threshold.',
      targetModule: 'expenses',
      targetId: newExpense.id,
      isRead: false,
      severity: fundSummary.availableBalance < 0 ? 'critical' : 'warning',
      timestamp: now,
    });
  }

  writeDb(db);
  res.status(201).json({
    success: true,
    expense: newExpense,
    fundSummary,
  });
});

app.put('/api/expenses/:id', (req: Request, res: Response) => {
  const db = readDb();
  const index = (db.expenses || []).findIndex((e: any) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }

  const updatedExpense = {
    ...db.expenses[index],
    ...req.body,
    amount: Number(req.body.amount ?? db.expenses[index].amount),
  };
  db.expenses[index] = updatedExpense;

  // Auto-register custom category or person if edited to a new value
  db.expenseCategories = db.expenseCategories || [...DEFAULT_CATEGORIES];
  if (updatedExpense.category && !db.expenseCategories.includes(updatedExpense.category)) {
    db.expenseCategories.push(updatedExpense.category);
  }

  db.expensePersons = db.expensePersons || [...DEFAULT_PERSONS];
  if (
    updatedExpense.madeBy &&
    !db.expensePersons.some((p: any) => p.name.toLowerCase() === updatedExpense.madeBy.toLowerCase())
  ) {
    db.expensePersons.push({
      id: `PER-${Date.now()}`,
      name: updatedExpense.madeBy,
      roleOrDept: updatedExpense.forPersonOrDept || 'Office Staff',
    });
  }

  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance ?? 500,
    db.advances || [],
    db.expenses
  );

  writeDb(db);
  res.json({ success: true, expense: db.expenses[index], fundSummary });
});

app.delete('/api/expenses/:id', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators are permitted to delete expense records' });
  }

  const db = readDb();
  db.expenses = (db.expenses || []).filter((e: any) => e.id !== req.params.id);

  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance || 0,
    db.advances || [],
    db.expenses
  );

  writeDb(db);
  res.json({ success: true, fundSummary });
});

// Advances & Funds
app.get('/api/advances', (req: Request, res: Response) => {
  const db = readDb();
  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance || 0,
    db.advances || [],
    db.expenses || []
  );
  res.json({
    advances: db.advances || [],
    fundSummary,
  });
});

app.post('/api/advances', (req: Request, res: Response) => {
  const db = readDb();
  const { date, amount, source, description } = req.body;

  if (!amount || Number(amount) <= 0 || !source) {
    return res.status(400).json({ error: 'Please specify a valid advance amount and source' });
  }

  const now = new Date().toISOString();
  const newAdvance = {
    id: `ADV-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
    date: date || now.split('T')[0],
    amount: Number(amount),
    source,
    description: description || '',
    createdAt: now,
  };

  db.advances = db.advances || [];
  db.advances.unshift(newAdvance);

  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance || 0,
    db.advances,
    db.expenses || []
  );

  writeDb(db);
  res.status(201).json({
    success: true,
    advance: newAdvance,
    fundSummary,
  });
});

app.delete('/api/advances/:id', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can delete advance entries' });
  }

  const db = readDb();
  db.advances = (db.advances || []).filter((a: any) => a.id !== req.params.id);

  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance || 0,
    db.advances,
    db.expenses || []
  );

  writeDb(db);
  res.json({ success: true, fundSummary });
});

// In-app Notifications
app.get('/api/notifications', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ notifications: db.notifications || [] });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const db = readDb();
  const notif = (db.notifications || []).find((n: any) => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    writeDb(db);
  }
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (req: Request, res: Response) => {
  const db = readDb();
  (db.notifications || []).forEach((n: any) => {
    n.isRead = true;
  });
  writeDb(db);
  res.json({ success: true });
});

// Suite Configuration: Opening Balance, Expense Categories, Expense Persons, Linked Apps
app.get('/api/settings/config', (req: Request, res: Response) => {
  const db = readDb();
  res.json({
    openingBalance: db.openingBalance ?? 500,
    expenseCategories: db.expenseCategories || DEFAULT_CATEGORIES,
    expensePersons: db.expensePersons || DEFAULT_PERSONS,
    linkedApps: db.linkedApps || DEFAULT_LINKED_APPS,
  });
});

app.put('/api/settings/opening-balance', (req: Request, res: Response) => {
  const db = readDb();
  const amount = Number(req.body.openingBalance);
  if (isNaN(amount) || amount < 0) {
    return res.status(400).json({ error: 'Opening balance must be a valid non-negative number' });
  }
  db.openingBalance = amount;
  db.openingBalanceCustomized = true;
  writeDb(db);

  const fundSummary = calculateExpenseFundBalance(
    db.openingBalance,
    db.advances || [],
    db.expenses || []
  );

  res.json({
    success: true,
    openingBalance: db.openingBalance,
    fundSummary,
  });
});

app.post('/api/settings/categories', (req: Request, res: Response) => {
  const db = readDb();
  const name = String(req.body.name || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }
  db.expenseCategories = db.expenseCategories || [...DEFAULT_CATEGORIES];
  if (db.expenseCategories.some((c: string) => c.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Category already exists' });
  }
  db.expenseCategories.push(name);
  writeDb(db);
  res.status(201).json({ success: true, expenseCategories: db.expenseCategories });
});

app.put('/api/settings/categories', (req: Request, res: Response) => {
  const db = readDb();
  const oldName = String(req.body.oldName || '').trim();
  const newName = String(req.body.newName || '').trim();
  if (!oldName || !newName) {
    return res.status(400).json({ error: 'Both current and new category names are required' });
  }
  db.expenseCategories = (db.expenseCategories || [...DEFAULT_CATEGORIES]).map((c: string) =>
    c === oldName ? newName : c
  );
  // Also update existing expenses with that category
  (db.expenses || []).forEach((e: any) => {
    if (e.category === oldName) {
      e.category = newName;
    }
  });
  writeDb(db);
  res.json({ success: true, expenseCategories: db.expenseCategories });
});

app.delete('/api/settings/categories/:name', (req: Request, res: Response) => {
  const db = readDb();
  const target = decodeURIComponent(req.params.name);
  db.expenseCategories = (db.expenseCategories || [...DEFAULT_CATEGORIES]).filter(
    (c: string) => c !== target
  );
  writeDb(db);
  res.json({ success: true, expenseCategories: db.expenseCategories });
});

app.post('/api/settings/persons', (req: Request, res: Response) => {
  const db = readDb();
  const name = String(req.body.name || '').trim();
  const roleOrDept = String(req.body.roleOrDept || 'Office Staff').trim();
  const phone = String(req.body.phone || '').trim();
  if (!name) {
    return res.status(400).json({ error: 'Person name is required' });
  }
  db.expensePersons = db.expensePersons || [...DEFAULT_PERSONS];
  if (db.expensePersons.some((p: any) => p.name.toLowerCase() === name.toLowerCase())) {
    return res.status(400).json({ error: 'Person already exists in the expense roster' });
  }
  const newPerson = {
    id: `PER-${Date.now()}`,
    name,
    roleOrDept,
    phone,
  };
  db.expensePersons.push(newPerson);
  writeDb(db);
  res.status(201).json({ success: true, person: newPerson, expensePersons: db.expensePersons });
});

app.put('/api/settings/persons/:id', (req: Request, res: Response) => {
  const db = readDb();
  db.expensePersons = db.expensePersons || [...DEFAULT_PERSONS];
  const idx = db.expensePersons.findIndex((p: any) => p.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Person not found' });
  }
  const oldName = db.expensePersons[idx].name;
  const newName = String(req.body.name || oldName).trim();
  db.expensePersons[idx] = {
    ...db.expensePersons[idx],
    name: newName,
    roleOrDept: String(req.body.roleOrDept ?? db.expensePersons[idx].roleOrDept).trim(),
    phone: String(req.body.phone ?? (db.expensePersons[idx].phone || '')).trim(),
  };
  if (oldName !== newName) {
    (db.expenses || []).forEach((e: any) => {
      if (e.madeBy === oldName) {
        e.madeBy = newName;
      }
    });
  }
  writeDb(db);
  res.json({ success: true, expensePersons: db.expensePersons });
});

app.delete('/api/settings/persons/:id', (req: Request, res: Response) => {
  const db = readDb();
  db.expensePersons = (db.expensePersons || [...DEFAULT_PERSONS]).filter(
    (p: any) => p.id !== req.params.id
  );
  writeDb(db);
  res.json({ success: true, expensePersons: db.expensePersons });
});

app.post('/api/settings/linked-apps', (req: Request, res: Response) => {
  const db = readDb();
  const { name, shortDescription, category, url, mode, iconName, status } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Application / Module name is required' });
  }
  db.linkedApps = db.linkedApps || [...DEFAULT_LINKED_APPS];
  const newApp = {
    id: `APP-${Date.now()}`,
    name: String(name).trim(),
    shortDescription: String(shortDescription || 'Custom connected management module').trim(),
    category: String(category || 'Operations').trim(),
    url: String(url || '').trim(),
    mode: mode || 'internal_workspace',
    iconName: iconName || 'Boxes',
    status: status || 'active',
    createdAt: new Date().toISOString(),
    records: [],
  };
  db.linkedApps.push(newApp);
  writeDb(db);
  res.status(201).json({ success: true, app: newApp, linkedApps: db.linkedApps });
});

app.put('/api/settings/linked-apps/:id', (req: Request, res: Response) => {
  const db = readDb();
  db.linkedApps = db.linkedApps || [...DEFAULT_LINKED_APPS];
  const idx = db.linkedApps.findIndex((a: any) => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Linked app not found' });
  }
  db.linkedApps[idx] = {
    ...db.linkedApps[idx],
    ...req.body,
  };
  writeDb(db);
  res.json({ success: true, app: db.linkedApps[idx], linkedApps: db.linkedApps });
});

app.delete('/api/settings/linked-apps/:id', (req: Request, res: Response) => {
  const db = readDb();
  db.linkedApps = (db.linkedApps || [...DEFAULT_LINKED_APPS]).filter(
    (a: any) => a.id !== req.params.id
  );
  writeDb(db);
  res.json({ success: true, linkedApps: db.linkedApps });
});

// Real-time Persistent Sync & Hydration (Firestore + Local Vault + Server DB)
app.get('/api/sync/snapshot', (req: Request, res: Response) => {
  const db = readDb();
  res.json({ snapshot: db });
});

app.post('/api/sync/hydrate', (req: Request, res: Response) => {
  const payload = req.body;
  if (!payload || !Array.isArray(payload.orders) || !Array.isArray(payload.expenses)) {
    return res.status(400).json({ error: 'Invalid hydration snapshot payload' });
  }
  const merged = {
    ...DEFAULT_DB,
    ...payload,
    openingBalance: typeof payload.openingBalance === 'number' ? payload.openingBalance : 500,
    openingBalanceCustomized: true,
    userModified: true,
    savedAt: payload.savedAt || new Date().toISOString(),
  };
  writeDb(merged, true);
  res.json({ success: true, snapshot: merged });
});

// Backup & Migration
app.get('/api/backup/export', (req: Request, res: Response) => {
  const db = readDb();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=indosati_backup_${new Date().toISOString().split('T')[0]}.json`);
  res.json(db);
});

app.post('/api/backup/restore', (req: Request, res: Response) => {
  if (currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Only administrators can restore backups' });
  }
  const payload = req.body;
  if (!payload || !Array.isArray(payload.orders) || !Array.isArray(payload.expenses)) {
    return res.status(400).json({ error: 'Invalid backup format. Must contain orders and expenses arrays.' });
  }

  // Write safe backup of current first
  const currentDb = readDb();
  fs.writeFileSync(path.join(DATA_DIR, `pre_restore_backup_${Date.now()}.json`), JSON.stringify(currentDb, null, 2));

  writeDb(payload);
  res.json({ success: true, message: 'Database restored successfully from backup' });
});

app.get('/api/migration/info', (req: Request, res: Response) => {
  res.json({
    unifiedSuite: 'INDOSATI Office Management Suite',
    status: 'Operational (Local Persistent Full-Stack JSON DB)',
    supportedExternalBackends: ['Supabase (PostgreSQL)', 'Direct Cloud SQL'],
    auditReport: {
      legacyLovableCRM: 'https://preview--indosaticrm.lovable.app/ (Protected behind Lovable Platform Auth)',
      legacyLovableExpense: 'https://preview--daily-fund-sparkle.lovable.app/ (Protected behind Lovable Platform Auth)',
      recommendation: 'Both schemas have been successfully unified with backward-compatible fields in this centralized database. To migrate live historic records directly from Supabase, provide the Lovable project Supabase Project URL and Service Role Key, or use the 1-Click JSON Backup/Restore tool in Settings.',
    },
  });
});

// Reports & CSV Generation
app.get('/api/reports/crm-csv', (req: Request, res: Response) => {
  const db = readDb();
  const headers = [
    'Order ID',
    'Date',
    'Deadline',
    'Buyer Org',
    'Buyer Contact',
    'Product',
    'Qty',
    'Order Total (INR)',
    'Amount Received (INR)',
    'Outstanding (INR)',
    'Status',
    'CRAC Status',
  ];

  const rows = db.orders.map((o: any) => {
    const fin = calculateOrderFinancials(o.orderTotal, o.payments || []);
    return [
      `"${o.id}"`,
      `"${o.gemOrderDate}"`,
      `"${o.dispatchDeadline}"`,
      `"${(o.buyerOrg || '').replace(/"/g, '""')}"`,
      `"${(o.buyerContact || '').replace(/"/g, '""')}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      o.quantity,
      fin.orderTotal,
      fin.totalReceived,
      fin.outstandingBalance,
      `"${o.orderStatus}"`,
      `"${o.cracGenerated ? 'Generated (' + o.cracDate + ')' : 'Pending'}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=indosati_crm_orders.csv');
  res.send(csv);
});

app.get('/api/reports/expenses-csv', (req: Request, res: Response) => {
  const db = readDb();
  const headers = [
    'Expense ID',
    'Date',
    'Category',
    'Made By',
    'For Person/Dept',
    'Description',
    'Linked Order ID',
    'Payment Mode',
    'Amount (INR)',
  ];

  const rows = (db.expenses || []).map((e: any) => {
    return [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.category}"`,
      `"${(e.madeBy || '').replace(/"/g, '""')}"`,
      `"${(e.forPersonOrDept || '').replace(/"/g, '""')}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.linkedOrderId || 'N/A'}"`,
      `"${e.paymentMode || 'Cash'}"`,
      e.amount,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=indosati_daily_expenses.csv');
  res.send(csv);
});

/* -------------------------------------------------------------
   VITE DEV MIDDLEWARE / STATIC SERVING
------------------------------------------------------------- */
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[INDOSATI Office Suite] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
