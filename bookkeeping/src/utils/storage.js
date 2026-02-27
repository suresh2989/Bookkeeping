// Local storage keys
const TRANSACTIONS_KEY = 'suresh_bookkeeping_transactions';
const SETTINGS_KEY = 'suresh_bookkeeping_settings';

export const CATEGORIES = {
  income: [
    'Procom - SAP Consulting',
    'NTT Data - Employment',
    'Other Consulting',
    'Other Income',
  ],
  expense: [
    'Equipment - Hardware',
    'Equipment - Peripherals',
    'Software & Subscriptions',
    'Internet & Phone',
    'Home Office',
    'Shipping & Import',
    'Professional Services',
    'Accounting & Legal',
    'Travel & Transportation',
    'Other Business Expense',
  ],
  draw: [
    'Shareholder Draw - Rent',
    'Shareholder Draw - Personal',
    'Shareholder Draw - RRSP',
    'Expense Reimbursement',
    'Other Draw',
  ],
};

export const TYPES = ['income', 'expense', 'draw'];

export function loadTransactions() {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    return raw ? JSON.parse(raw) : getDefaultTransactions();
  } catch {
    return getDefaultTransactions();
  }
}

export function saveTransactions(transactions) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { currency: 'CAD', fiscalYear: 2026 };
  } catch {
    return { currency: 'CAD', fiscalYear: 2026 };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getDefaultTransactions() {
  return [
    {
      id: 'default-1',
      date: '2026-01-15',
      type: 'income',
      category: 'Procom - SAP Consulting',
      description: 'Procom invoice - Jan 1-15',
      amount: 500,
      notes: 'Assignment E0008847 - 5 units @ $100/hr',
      year: 2026,
    },
    {
      id: 'default-2',
      date: '2026-02-10',
      type: 'expense',
      category: 'Equipment - Hardware',
      description: 'Laptop purchase (via MyUS from US)',
      amount: 2200,
      notes: 'For Procom SAP work - capital asset',
      year: 2026,
    },
    {
      id: 'default-3',
      date: '2026-02-10',
      type: 'expense',
      category: 'Shipping & Import',
      description: 'MyUS shipping + customs duties',
      amount: 280,
      notes: 'US to Canada shipping for laptop',
      year: 2026,
    },
    {
      id: 'default-4',
      date: '2026-02-10',
      type: 'expense',
      category: 'Equipment - Peripherals',
      description: 'Peripherals (keyboard, mouse, headset)',
      amount: 520,
      notes: 'Home office setup for Procom work',
      year: 2026,
    },
    {
      id: 'default-5',
      date: '2026-02-15',
      type: 'draw',
      category: 'Expense Reimbursement',
      description: 'Reimbursement - equipment purchased on personal card',
      amount: 3000,
      notes: 'Personal card used Feb week 2 - reimbursing corporate to personal',
      year: 2026,
    },
  ];
}

export function exportToCSV(transactions) {
  const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (CAD)', 'Notes'];
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category,
    `"${t.description}"`,
    t.amount.toFixed(2),
    `"${t.notes || ''}"`,
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bookkeeping_${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
