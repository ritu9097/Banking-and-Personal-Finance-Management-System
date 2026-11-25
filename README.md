# Finora — Banking & Personal Finance Management System

A premium, minimal fintech web application designed for comprehensive personal financial tracking and banking simulation. Built with pure **HTML5, modular CSS3, Vanilla JavaScript (ES6+), JSON, and browser LocalStorage**.

---

## Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Design System & Palette](#design-system--palette)
3. [Folder & File Structure](#folder--file-structure)
4. [Detailed File-by-File Breakdown](#detailed-file-by-file-breakdown)
   - [HTML Pages](#html-pages)
   - [CSS Architecture](#css-architecture)
   - [JavaScript (`js/app.js`) & Function Mapping](#javascript-jsappjs--function-mapping)
   - [Data Store (`data/*.json`)](#data-store-datajson)
5. [Page-to-Function Mapping Matrix](#page-to-function-mapping-matrix)
6. [Interactive Controls & Accessibility](#interactive-controls--accessibility)
7. [How to Run](#how-to-run)
8. [Demo Credentials](#demo-credentials)

---

## Overview & Architecture

Finora is an offline-capable, client-side Single Page Architecture (SPA-hybrid) application. All transactions, accounts, budgets, and savings goals are simulated safely inside browser `LocalStorage` with pre-seeded demo JSON files.

- **Frontend-only**: No backend server, Node.js runtime, or external JS frameworks required.
- **Persistence**: Automatically seeds from `data/*.json` on first launch into browser `LocalStorage` under the `finora_*` namespace.
- **State isolation**: Multi-user support with data segmented strictly by authenticated `userId`.
- **Responsive**: Fully responsive across mobile, tablet, laptop, and ultra-wide screens.

---

## Design System & Palette

The design system implements a premium, minimal fintech look using exact CSS variables:

| Color Name | Hex Code | Purpose |
| :--- | :--- | :--- |
| **Navy** | `#0D1B2A` | Sidebar background, primary brand buttons, dark visual panels |
| **Slate** | `#1B263B` | Secondary dark surfaces, modal accents, insight cards |
| **Sage** | `#778D7A` | Positive cash flow, savings progress, healthy metrics |
| **Steel Blue** | `#6B8299` | Charts, interactive icons, hover outlines, informational pills |
| **Beige** | `#D4C4A8` | Accent tags, expense chart markers, subtle decorative rings |
| **Ivory** | `#F7F5EF` | Page backgrounds, card base tint in light theme |

### Typography
- **Font Family**: [DM Sans](https://fonts.google.com/specimen/DM+Sans) (Google Fonts).
- **Tabular Numerals**: `font-variant-numeric: tabular-nums` applied across all monetary figures and statistical counters to ensure vertical alignment of numbers.

---

## Folder & File Structure

```text
├── index.html               # Landing page / entry gateway
├── login.html               # Authentication login page
├── register.html            # New user registration page
├── dashboard.html           # Main financial dashboard
├── accounts.html            # Accounts overview & creation
├── transactions.html        # Transaction history with filters & CSV export
├── income.html              # Income stream management
├── expenses.html            # Expense record tracking
├── budgets.html             # Monthly category budget management
├── savings.html             # Savings goals & progress tracking
├── analytics.html           # Cash flow breakdown & mini-charts
├── profile.html             # User profile details & simulation disclaimers
│
├── css/
│   ├── variables.css        # Root design tokens, palette variables, dark mode variables
│   ├── base.css             # HTML reset, utility classes, and base tags
│   ├── typography.css       # DM Sans font imports, type scales, headings, numbers
│   ├── layout.css           # Shell grid, sidebar, sticky topbar, layout containers
│   ├── components.css       # Cards, buttons, tables, pills, forms, modals, toasts, popovers
│   ├── animations.css       # Subtle fade-ins, modal scale, cash flow bar rises
│   ├── responsive.css       # Mobile/tablet breakpoints and off-canvas sidebar behavior
│   ├── darkmode.css         # Theme token overrides for [data-theme="dark"]
│   ├── style.css            # Master forwarder importing all stylesheets
│   │
│   │   /* Page-Specific Stylesheets */
│   ├── dashboard.css        # Hero balance, cash flow bars, spending progress, insight card
│   ├── accounts.css         # Card gradient themes, chip styling, masked numbers
│   ├── transactions.css     # Filter toolbar, status badges, tabular alignment
│   ├── budgets.css          # Budget progress meters, limit alert thresholds
│   ├── savings.css          # Savings progress meters, target date markers
│   ├── analytics.css        # Metric tiles, CSS bar charts, activity breakdown
│   ├── profile.css          # Profile layout, large avatar badge, user detail grid
│   └── auth.css             # Two-column login/register layout, showcases, demo cards
│
├── js/
│   └── app.js               # Core application logic, router, renderers, and DB layer
│
└── data/
    ├── users.json           # Seed credentials and user profiles
    ├── accounts.json        # Seed checking, savings, and credit accounts
    ├── transactions.json   # Seed transaction log
    ├── income.json          # Seed income records
    ├── expenses.json        # Seed expense records
    ├── budgets.json         # Seed monthly category budget limits
    └── savings.json         # Seed savings targets and goal progress
```

---

## Detailed File-by-File Breakdown

### HTML Pages

All application pages share a standardized topbar and off-canvas sidebar structure, identifying the active view through the `<body data-page="...">` attribute.

1. **`index.html`**
   - **Purpose**: Welcoming landing page for the Finora platform.
   - **Components**: Brand badge, hero value proposition, "Get Started" (routes to `login.html`), "Create account" (routes to `register.html`), and demo credential preview.
   - **Unique Scripts**: Inline theme pre-paint initializer to prevent theme flicker on load.

2. **`login.html`**
   - **Purpose**: Authenticates users into the system.
   - **Components**:
     - *Left showcase panel*: Branding, tagline, floating mock cards (available balance, dream trip savings progress, monthly spending).
     - *Right form panel*: Email input, password input with interactive eye visibility toggle, error display box, submit button.
     - *Quick Demo Accounts*: One-click login buttons for demo users (Riya, Rahul, Priya).
   - **Linked Styles**: `variables.css`, `base.css`, `typography.css`, `layout.css`, `components.css`, `animations.css`, `responsive.css`, `auth.css`, `darkmode.css`.

3. **`register.html`**
   - **Purpose**: Creates a new user profile and initializes a default savings account.
   - **Components**:
     - Full Name, Email, Phone, Password, and Confirm Password fields.
     - Interactive password visibility toggles.
     - Live password strength indicator (evaluates length, uppercase, numbers, and symbols).
   - **Linked Styles**: Matches `login.html` with registration-specific showcase overrides in `auth.css`.

4. **`dashboard.html` (`data-page="dashboard"`)**
   - **Purpose**: High-level executive summary of current user's financial health.
   - **Components**:
     - Hero card displaying real-time available balance with quick "Add money" trigger.
     - Overview stat cards: Total Balance, Month's Income, Month's Expenses, and Net Savings Rate.
     - 6-month historical cash flow visualizer comparing income vs. expenses.
     - Finora automated financial insight card.
     - Quick Account cards preview.
     - Spending breakdown track by category.
     - Budget progress bars with threshold indicators.
     - Recent transactions ledger.
     - Savings goals preview.
     - Quick Action action buttons (Deposit, Withdraw, Transfer, Add Expense).

5. **`accounts.html` (`data-page="accounts"`)**
   - **Purpose**: Detailed card view of all active accounts (Savings, Checking, Credit Card, Fixed Deposit).
   - **Components**: Header action with "＋ Add account" modal trigger; dynamic grid of stylized credit/debit bank cards featuring masked account numbers and card issuer badges.

6. **`transactions.html` (`data-page="transactions"`)**
   - **Purpose**: Full searchable and filterable transaction ledger.
   - **Components**: Live keyword search bar, transaction type filter dropdown (Income, Expense, Transfer), "Export CSV" button, and paginated transaction table with positive/negative color coding.

7. **`income.html` (`data-page="income"`)**
   - **Purpose**: Management of income sources (Salary, Freelance, Scholarship, Business, Other).
   - **Components**: "＋ Add income" modal button; income records table displaying source, description, date, amount, and delete action.

8. **`expenses.html` (`data-page="expenses"`)**
   - **Purpose**: Categorized expense tracking (Food, Shopping, Bills, Transport, Healthcare, etc.).
   - **Components**: "＋ Add expense" modal button; records table with date, amount, description, and delete action.

9. **`budgets.html` (`data-page="budgets"`)**
   - **Purpose**: Monthly spending allowance per category.
   - **Components**: "＋ Add budget" modal trigger; two-column grid showing current monthly category expenses vs. target threshold with danger status for categories exceeding 85% or 100%.

10. **`savings.html` (`data-page="savings"`)**
    - **Purpose**: Long-term financial goal tracker.
    - **Components**: "＋ Add goal" modal trigger; goal cards showing target amount, current saved amount, completion percentage, remaining balance, and target deadline date.

11. **`analytics.html` (`data-page="analytics"`)**
    - **Purpose**: Visual financial distribution analysis.
    - **Components**: Summary metric tiles, category-wise spending progress distribution, income vs. expense balance comparisons, and weekly spending activity breakdown.

12. **`profile.html` (`data-page="profile"`)**
    - **Purpose**: Account management and personal metadata.
    - **Components**: User initials avatar badge, Name, Email, Phone, User ID, "Edit Profile" modal trigger, project disclaimer, and account Logout button.

---

### CSS Architecture

Styles are modularized following a clear cascade order without conflicts:

1. **`css/variables.css`**: Defines all `:root` design tokens (Navy `#0D1B2A`, Slate `#1B263B`, Sage `#778D7A`, Steel Blue `#6B8299`, Beige `#D4C4A8`, Ivory `#F7F5EF`), semantic shadows, radii, spacing, and prefers-reduced-motion guards.
2. **`css/base.css`**: Resets element margins, enables smooth scrolling, image fluid widths, and global utility classes (`.hidden`, `.muted`, `.pos`, `.neg`, `.empty`).
3. **`css/typography.css`**: Imports Google Font DM Sans, sets line-heights, heading scales, and applies `tabular-nums` for financial numbers.
4. **`css/layout.css`**: Implements `.app` flex container, fixed sidebar with brand header, sticky topbar with glassmorphism blur, responsive grid classes (`.stats`, `.two`, `.three`, `.account-grid`, `.quick-grid`), and the balance masking filter.
5. **`css/components.css`**: Reusable UI elements: cards, `.btn` variants (`primary`, `secondary`, `danger`, `small`), tabular data styling, modal overlay/dialog, notification toast, quick-action tiles, search popover, and notification flyouts.
6. **`css/animations.css`**: Keyframe animations (`fadein`, `scalein`, `slidein`, `slideup`, `barrise`, `progress-fill`).
7. **`css/responsive.css`**: Media queries at `1200px`, `900px`, `760px`, `540px`, and `480px` handling off-canvas sidebar transitions, grid collapse, mobile menu toggles, and print stylesheets.
8. **`css/darkmode.css`**: High-contrast dark theme overrides activated under `[data-theme="dark"]`.
9. **`css/style.css`**: Central stylesheet importing all files in cascade sequence.
10. **Page CSS Files (`dashboard.css`, `accounts.css`, `transactions.css`, `budgets.css`, `savings.css`, `analytics.css`, `profile.css`, `auth.css`)**: Isolated style rules specifically required for their respective pages without leaking to global components.

---

### JavaScript (`js/app.js`) & Function Mapping

`js/app.js` is the central brain of Finora. Below is the functional architecture:

#### 1. Theme & Privacy System
- **`toggleTheme()`**: Swaps between `"light"` and `"dark"`, stores preference in `localStorage.finora_theme`, and calls `updateThemeButton()`.
- **`updateThemeButton()`**: Updates icon and accessibility labels (`Switch to light mode` / `Switch to dark mode`) with Lucide Sun/Moon SVGs.
- **`addThemeToggle()`**: Injects the theme toggle button into `.top-right` on dashboard pages or into the body on auth pages.
- **`toggleHideBalance()`**: Toggles `data-hide-balance="true"` on `<html>`, applying a privacy blur across all visible monetary balances; saves state in `localStorage.finora_hide_balance`.
- **`updateEyeButton()`**: Synchronizes the eye / eye-off SVG icon on the topbar privacy button.

#### 2. Database & Storage Layer
- **`DB` Object**: Map of LocalStorage keys (`users`, `accounts`, `transactions`, `income`, `expenses`, `budgets`, `savings`).
- **`get(k)`**: Reads and JSON-parses a collection from `localStorage.finora_<k>`.
- **`set(k, v)`**: Serializes and writes data array to `localStorage.finora_<k>`.
- **`user()`**: Retrieves the currently authenticated user object via `localStorage.finora_currentUser`.
- **`data(k)`**: Convenience helper returning records matching `userId === user().id`.
- **`ensureData()`**: Seed function that checks for existing collections in LocalStorage; if missing, fetches initial state from `data/<k>.json`.
- **`uid(prefix)`**: Generates unique alphanumeric IDs for newly created records (e.g. `t1700000000abcd`).

#### 3. Utilities & Micro-Components
- **`money(n)`**: Formats numbers into Indian Rupee currency format (`₹12,345.67`) using `Intl.NumberFormat("en-IN")`.
- **`esc(str)`**: HTML entity escape sanitizer defending against XSS in user-provided strings.
- **`toast(msg)`**: Displays a slide-in alert message in `#toast` that automatically vanishes after 2.3 seconds.
- **`modal(title, html, onSubmit)`**: Spawns an accessible dialog into `#modal` with backdrop click detection and close handling.
- **`today()`**: Returns current date formatted as `YYYY-MM-DD`.

#### 4. Navigation & App Shell
- **`shell()`**:
  - Validates authentication: redirects unauthenticated users to `login.html`.
  - Sets active state on sidebar navigation links matching `data-page`.
  - Displays user initials inside topbar `#avatar`.
  - Attaches `#logout` click event (clears session and redirects).
  - Handles mobile sidebar opening and backdrop clicks (`#menu`, `#overlay`).
  - Sets up `#searchBtn` to toggle `#searchPopover` and triggers `initGlobalSearch()`.
  - Sets up `#notifBtn` to toggle `#notifPopover` and triggers `populateNotifications()`.
  - Binds `#eyeBtn` click to `toggleHideBalance()`.

#### 5. Popover Features
- **`initGlobalSearch()`**: Listens to `#globalSearch` inputs; queries accounts and transactions in real-time, displaying direct clickable links.
- **`populateNotifications()`**: Automatically scans budgets for categories exceeding 80% or 100% capacity and pulls the latest transaction activity into `#notifList`.
- **`exportTransactionsCSV()`**: Compiles all current user transactions into RFC-4180 compliant CSV format and triggers an instant browser file download (`transactions_<userId>_<date>.csv`).

#### 6. Page Renderers
- **`renderDashboard()`**: Computes balance, monthly income, monthly expenses, savings rate, 6-month cash flow bars, top spending categories, and injects HTML into `#content`. Runs animated counter increments on numeric figures.
- **`renderAccounts()`**: Renders all user accounts via `accountCard(a)`; sets up `window.addAccount` for modal account creation.
- **`accountCard(a)`**: Template generator for styled debit/credit bank cards.
- **`renderTransactions()`**: Displays the searchable transactions table (`txRows(rows)`); handles real-time keyword and type dropdown filtering.
- **`txRows(rows)`**: Generates transaction table rows with positive/negative color badges.
- **`renderCrud(kind, title)`**: Generic CRUD engine driving both `income.html` and `expenses.html`. Sets up modal addition (`window.addRecord`) and item deletion with confirmation dialog (`window.removeRecord`).
- **`renderBudgets()`**: Calculates category expenses against planned limits; sets up `window.addBudget` modal form.
- **`renderSavings()`**: Renders target savings cards with progress meters; sets up `window.addGoal` modal form.
- **`renderAnalytics()`**: Aggregates total financial stats, category breakdown tracks, and CSS mini-charts for income vs. expenses and weekly activity.
- **`renderProfile()`**: Renders user details and system disclaimer; sets up `window.editProfile` modal to update user name and phone.
- **`openMoney(kind)`**: Shared modal workflow for depositing, withdrawing, transferring, or recording an expense against specific accounts, maintaining double-entry balance consistency.

#### 7. Authentication Controller
- **`auth()`**:
  - `login`: Validates email and password matching against `users` collection; sets `localStorage.finora_currentUser` and redirects to `dashboard.html`.
  - `register`: Validates password matching and email uniqueness; creates new user, provisions a starter ₹10,000 savings account, logs in, and redirects.

#### 8. Application Bootstrap
- **`boot()`**: Root entry point called on script load. Evaluates URL path, runs `ensureData()`, initiates authentication controllers or loads the shell and corresponding page renderer based on `document.body.dataset.page`.

---

## Page-to-Function Mapping Matrix

| Page (`.html`) | `data-page` | Primary Functions Executed |
| :--- | :--- | :--- |
| **`index.html`** | *(none)* | `boot()`, `initTheme()` |
| **`login.html`** | *(none)* | `boot()`, `ensureData()`, `auth()`, `addThemeToggle()`, inline password toggle |
| **`register.html`** | *(none)* | `boot()`, `ensureData()`, `auth()`, `addThemeToggle()`, inline password & strength meter |
| **`dashboard.html`** | `dashboard` | `boot()`, `shell()`, `renderDashboard()`, `openMoney()`, `accountCard()`, `initGlobalSearch()`, `populateNotifications()`, `toggleHideBalance()` |
| **`accounts.html`** | `accounts` | `boot()`, `shell()`, `renderAccounts()`, `addAccount()`, `accountCard()` |
| **`transactions.html`** | `transactions` | `boot()`, `shell()`, `renderTransactions()`, `txRows()`, `exportTransactionsCSV()` |
| **`income.html`** | `income` | `boot()`, `shell()`, `renderCrud('income', 'Income')`, `addRecord()`, `removeRecord()` |
| **`expenses.html`** | `expenses` | `boot()`, `shell()`, `renderCrud('expenses', 'Expense')`, `addRecord()`, `removeRecord()` |
| **`budgets.html`** | `budgets` | `boot()`, `shell()`, `renderBudgets()`, `addBudget()` |
| **`savings.html`** | `savings` | `boot()`, `shell()`, `renderSavings()`, `addGoal()` |
| **`analytics.html`** | `analytics` | `boot()`, `shell()`, `renderAnalytics()` |
| **`profile.html`** | `profile` | `boot()`, `shell()`, `renderProfile()`, `editProfile()` |

---

## Interactive Controls & Accessibility

Every interactive control in Finora is mapped to real functional actions with proper ARIA attributes:

1. **Global Search (`#searchBtn`)**: Opens popover with real-time indexing of accounts and transactions.
2. **Notifications (`#notifBtn`)**: Analyzes budget limits and recent transactions to show alert badges.
3. **Balance Privacy (`#eyeBtn`)**: Masks/blurs sensitive numbers across cards and headers; toggles between eye and eye-off icons.
4. **Theme Switcher (`.theme-toggle`)**: Switches between Ivory light theme and Navy/Slate dark theme.
5. **CSV Export**: Real-time generation of CSV spreadsheets from user transactions.
6. **Deletion with Confirmation**: Confirmation dialog guard before removing income or expense records.
7. **Mobile Drawer (`#menu`, `#overlay`)**: Touch-friendly sidebar drawer navigation for small screens.
8. **Modals & Focus Trap**: Modal dialogs support backdrop click-to-close and explicit `Esc` dismissals.

---

## How to Run

Because the application uses native browser `fetch()` to load the initial seed files (`data/*.json`), opening the files directly using `file://` protocol will trigger browser CORS restrictions.

### Recommended Steps:
1. Open the project root folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The application will launch at `http://127.0.0.1:5500/index.html`.

*(Alternatively, run `python -m http.server 8000` in the project folder and open `http://localhost:8000` in your browser).*

---

## Demo Credentials

You can log in instantly using any of the pre-configured mock accounts:

| Name | Email Address | Password | Account Type |
| :--- | :--- | :--- | :--- |
| **Riya Sharma** | `riya@example.com` | `riya123` | Personal (Active) |
| **Rahul Verma** | `rahul@example.com` | `rahul123` | Personal (Active) |
| **Priya Singh** | `priya@example.com` | `priya123` | Personal (Active) |

*You can also create a new account on `register.html`, which immediately provisions a simulated savings account balance of ₹10,000.*
