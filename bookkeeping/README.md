# Corporate Books — Suresh Kumar Sivasubramaniam

A personal bookkeeping app for tracking incorporated consulting income, expenses, and shareholder draws.

---

## Features

- **Dashboard** with monthly charts and year-to-date totals
- **Transactions** — add, edit, delete income / expenses / draws
- **Tax Summary** — estimated corporate tax, HST, key dates, notes for accountant
- **Export to CSV** for year-end handoff to accountant
- **Local storage** — all data saved in your browser, no server needed
- Pre-loaded with your February 2026 equipment purchases

---

## Setup (One Time)

### Prerequisites
- [Node.js](https://nodejs.org/) — download and install LTS version
- [VS Code](https://code.visualstudio.com/) — recommended editor

### Steps

1. **Open terminal in VS Code** (`Ctrl + `` ` ``)

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the app:**
   ```bash
   npm start
   ```

4. **Opens automatically** at `http://localhost:3000`

---

## Usage

### Adding a Transaction
- Click **+ Add Transaction** button
- Choose type: Income / Expense / Draw
- Fill in date, amount, category, description
- Notes field is for accountant context

### Transaction Types
| Type | Use for |
|------|---------|
| **Income** | Procom invoice payments received |
| **Expense** | Business purchases (equipment, software, etc.) |
| **Draw** | Transfers from corporate to personal bank account |

### Shareholder Draws
When you transfer money from your corporate account to personal for rent or personal use:
- Type: **Draw**
- Category: **Shareholder Draw - Rent** or **Shareholder Draw - Personal**
- Notes: reason for draw

### Expense Reimbursements
When you paid a business expense on your personal card and are reimbursing yourself:
- Type: **Draw**  
- Category: **Expense Reimbursement**
- Notes: what was purchased and when

---

## Pre-loaded Transactions (Feb 2026)

The app comes with your existing transactions:
- Jan invoices from Procom
- Laptop purchase ($2,200)
- MyUS shipping + customs ($280)
- Peripherals ($520)
- Equipment reimbursement draw ($3,000)

---

## Tax Notes

- **Laptop** = Capital asset (CCA Class 10) — depreciated over time, not full deduction year 1
- **Shipping/duties** = Part of equipment cost, fully deductible
- **HST** = If registered, you collect 13% on Procom invoices and remit quarterly/annually
- **Draws** = Classified as salary or dividends at year end — discuss with accountant
- **NTT Data income** = Separate T4, not in this app (personal income, not corporate)

---

## Year End

1. Go to **Transactions** view
2. Click **Export CSV**
3. Send CSV to your accountant along with all receipts

---

## Data Storage

All data is saved in your browser's localStorage. It persists between sessions automatically.

To backup: Export CSV regularly and save to a safe location (Google Drive etc.)
