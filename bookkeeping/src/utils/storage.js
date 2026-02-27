import { supabase } from './supabase';

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

export async function loadTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function upsertTransaction(tx) {
  const { error } = await supabase
    .from('transactions')
    .upsert(tx);
  if (error) throw error;
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
  if (error) throw error;
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
