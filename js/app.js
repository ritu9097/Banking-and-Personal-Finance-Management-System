/* =========================================================
   FINORA THEME SYSTEM
   ========================================================= */

/* Theme already applied by inline script in <head> before paint */

const SUN_SVG  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const MOON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next    = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("finora_theme", next);
  updateThemeButton();
}

function updateThemeButton() {
  const btn   = document.querySelector(".theme-toggle");
  if (!btn) return;
  const dark  = document.documentElement.getAttribute("data-theme") === "dark";
  btn.innerHTML = dark ? SUN_SVG : MOON_SVG;
  btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  btn.setAttribute("title",      dark ? "Light mode"           : "Dark mode");
}

function addThemeToggle() {
  if (document.querySelector(".theme-toggle")) return;
  const btn = document.createElement("button");
  btn.className  = "theme-toggle";
  btn.type       = "button";
  btn.onclick    = toggleTheme;
  const topRight = document.querySelector(".top-right");
  if (topRight) {
    topRight.insertBefore(btn, topRight.firstChild);
  } else {
    btn.classList.add("auth-theme-toggle");
    document.body.appendChild(btn);
  }
  updateThemeButton();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addThemeToggle);
} else {
  addThemeToggle();
}
const DB = { users: "users", accounts: "accounts", transactions: "transactions", income: "income", expenses: "expenses", budgets: "budgets", savings: "savings" };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]));
const money = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(Number(n) || 0);
const get = (k) => JSON.parse(localStorage.getItem("finora_" + k) || "[]");
const set = (k, v) => localStorage.setItem("finora_" + k, JSON.stringify(v));
const uid = p => p + Date.now() + Math.random().toString(16).slice(2, 6);
const user = () => get("users").find(u => u.id === localStorage.getItem("finora_currentUser"));
const data = k => get(k).filter(x => x.userId === user()?.id);
const today = () => new Date().toISOString().slice(0, 10);
function toast(m) { $("#toast").innerHTML = `<div class="toast">${esc(m)}</div>`; setTimeout(() => $("#toast").innerHTML = "", 2300) }
function modal(title, html, onSubmit) { $("#modal").innerHTML = `<div class="modal-bg" id="mb"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="close" id="mc">×</button></div>${html}</div></div>`; $("#mc").onclick = () => $("#modal").innerHTML = ""; $("#mb").onclick = e => { if (e.target.id === "mb") $("#modal").innerHTML = "" }; if (onSubmit) onSubmit() }

/* ── Shared money helpers ───────────────────────────────── */
const CREDIT_LIMIT = 50000;
const INCOME_SOURCES = ["Salary", "Freelance", "Scholarship", "Business", "Other"];
const EXPENSE_CATS = ["Food", "Shopping", "Transport", "Bills", "Entertainment", "Education", "Healthcare", "Other"];
const monthKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
const inThisMonth = x => String(x.date).startsWith(monthKey());

/* Seed files are dated Sept 2026. Shift them so the newest month = current month. */
const SEED_BASE_MONTH = 2026 * 12 + 8; // Sept 2026
function shiftSeedDates(rows) {
  const now = new Date(), diff = (now.getFullYear() * 12 + now.getMonth()) - SEED_BASE_MONTH;
  return rows.map(r => {
    const [y, m, d] = r.date.split("-").map(Number), t = y * 12 + (m - 1) + diff;
    return { ...r, date: Math.floor(t / 12) + "-" + String(t % 12 + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0") };
  });
}
async function ensureData() {
  for (const k of Object.keys(DB)) {
    if (!localStorage.getItem("finora_" + k)) {
      try {
        let rows = await (await fetch("data/" + k + ".json")).json();
        if (["transactions", "income", "expenses"].includes(k)) rows = shiftSeedDates(rows);
        set(k, rows);
      } catch (e) { }
    }
  }
}

/* Can this account pay `amt`? Credit cards use a credit limit. */
function canSpend(a, amt) {
  return a.type === "Credit Card" ? a.balance - amt >= -CREDIT_LIMIT : a.balance >= amt;
}
/* Change an account balance AND log the matching transaction. Returns the transaction id. */
function postEntry({ userId, accountId, signed, type, description, party, category, date }) {
  const all = get("accounts"), a = all.find(x => x.id === accountId);
  if (!a) return null;
  a.balance += signed; set("accounts", all);
  const t = { id: uid("t"), userId: userId || user().id, type, description, party, amount: signed, date: date || today(), category, status: "Completed", accountId };
  const tx = get("transactions"); tx.push(t); set("transactions", tx);
  return t.id;
}
/* Undo an income/expense record: restore the balance and remove its transaction. */
function reverseEntry(rec) {
  if (!rec.accountId) return;
  const all = get("accounts"), a = all.find(x => x.id === rec.accountId);
  if (a) { a.balance += (rec.source !== undefined ? -1 : 1) * Number(rec.amount); set("accounts", all); }
  if (rec.txId) set("transactions", get("transactions").filter(t => t.id !== rec.txId));
}
document.addEventListener("keydown", e => { if (e.key === "Escape" && $("#modal")) $("#modal").innerHTML = ""; });

/* ── Balance visibility toggle ──────────────────────────── */
const EYE_OPEN   = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_CLOSED = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function updateEyeButton() {
  const eyeBtn = $("#eyeBtn");
  if (!eyeBtn) return;
  const isHidden = document.documentElement.getAttribute("data-hide-balance") === "true";
  eyeBtn.innerHTML = isHidden ? EYE_CLOSED : EYE_OPEN;
  eyeBtn.setAttribute("aria-label", isHidden ? "Show balances" : "Hide balances");
  eyeBtn.setAttribute("title", isHidden ? "Show balances" : "Hide balances");
}

function toggleHideBalance() {
  const current = document.documentElement.getAttribute("data-hide-balance") === "true";
  const next = !current;
  if (next) {
    document.documentElement.setAttribute("data-hide-balance", "true");
    localStorage.setItem("finora_hide_balance", "true");
  } else {
    document.documentElement.removeAttribute("data-hide-balance");
    localStorage.setItem("finora_hide_balance", "false");
  }
  updateEyeButton();
}

function initGlobalSearch() {
  const input = $("#globalSearch");
  const res   = $("#searchResults");
  if (!input || !res) return;
  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { res.innerHTML = ""; return; }
    const tx = data("transactions").filter(t => `${t.description} ${t.party} ${t.category} ${t.type}`.toLowerCase().includes(q)).slice(0, 4);
    const ac = data("accounts").filter(a => `${a.type} ${a.number}`.toLowerCase().includes(q)).slice(0, 3);
    if (!tx.length && !ac.length) {
      res.innerHTML = '<div class="empty" style="padding:10px;font-size:.75rem">No matching records</div>';
      return;
    }
    let html = "";
    if (ac.length) {
      html += '<small style="font-weight:700;color:var(--text-3);padding:2px 4px">Accounts</small>';
      html += ac.map(a => `<a href="accounts.html" class="search-item"><b>${esc(a.type)} (•••• ${a.number})</b><span>${money(a.balance)}</span></a>`).join("");
    }
    if (tx.length) {
      html += '<small style="font-weight:700;color:var(--text-3);padding:2px 4px;margin-top:4px">Transactions</small>';
      html += tx.map(t => `<a href="transactions.html" class="search-item"><b>${esc(t.description)}</b><small class="muted">${t.date} • ${money(t.amount)}</small></a>`).join("");
    }
    res.innerHTML = html;
  });
}

function populateNotifications() {
  const notifList = $("#notifList");
  if (!notifList) return;
  const ex = data("expenses").filter(inThisMonth);
  const bud = data("budgets");
  const tx = data("transactions");
  const notes = [];
  bud.forEach(b => {
    const s = ex.filter(x => x.category === b.category).reduce((z, y) => z + Number(y.amount), 0);
    const p = Math.round(s / b.amount * 100);
    if (p >= 100) {
      notes.push({ text: `Over budget on ${esc(b.category)} (${p}%)`, time: "Action needed" });
    } else if (p >= 80) {
      notes.push({ text: `Approaching budget limit for ${esc(b.category)} (${p}%)`, time: "Alert" });
    }
  });
  if (tx.length) {
    const last = [...tx].sort((a,b) => b.date.localeCompare(a.date))[0];
    notes.push({ text: `Latest activity: ${esc(last.description)} (${money(last.amount)})`, time: last.date });
  }
  if (!notes.length) {
    notes.push({ text: "Your financial health is on track. No warnings.", time: "All clear" });
  }
  notifList.innerHTML = notes.map(n => `<div class="notification-item"><b>${n.text}</b><small>${n.time}</small></div>`).join("");
}

function exportTransactionsCSV() {
  const tx = data("transactions");
  if (!tx.length) { toast("No transactions to export"); return; }
  const headers = ["ID", "Date", "Description", "Party", "Type", "Category", "Amount", "Status"];
  const rows = tx.map(t => [t.id, t.date, `"${(t.description||'').replace(/"/g, '""')}"`, `"${(t.party||'').replace(/"/g, '""')}"`, t.type, t.category, t.amount, t.status]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${user().id}_${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Transactions exported to CSV");
}
window.exportTransactionsCSV = exportTransactionsCSV;

function shell() {
  if (!document.body.dataset.page) return;
  if (!user()) { location.href = "login.html"; return; }

  const p = document.body.dataset.page;

  /* Active nav link */
  document.querySelectorAll("[data-page-link]")
    .forEach(a => a.classList.toggle("active", a.dataset.pageLink === p));

  /* Avatar initials */
  const av = $("#avatar");
  if (av) av.textContent = user().name.split(" ").map(x => x[0]).join("").slice(0, 2);

  /* Logout */
  $("#logout")?.addEventListener("click", () => {
    localStorage.removeItem("finora_currentUser");
    location.href = "login.html";
  });

  /* Mobile sidebar */
  const sidebar  = $("#sidebar");
  const overlay  = $("#overlay");
  const menuBtn  = $("#menu");
  if (menuBtn) menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("show");
  });
  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("show");
  });

  /* Search popover */
  const searchBtn     = $("#searchBtn");
  const searchPopover = $("#searchPopover");
  const globalSearch  = $("#globalSearch");
  if (searchBtn && searchPopover) {
    searchBtn.addEventListener("click", e => {
      e.stopPropagation();
      searchPopover.classList.toggle("hidden");
      if (!searchPopover.classList.contains("hidden")) globalSearch?.focus();
    });
    document.addEventListener("click", () => searchPopover?.classList.add("hidden"));
    searchPopover.addEventListener("click", e => e.stopPropagation());
  }

  /* Notification popover */
  const notifBtn     = $("#notifBtn");
  const notifPopover = $("#notifPopover");
  if (notifBtn && notifPopover) {
    notifBtn.addEventListener("click", e => {
      e.stopPropagation();
      notifPopover.classList.toggle("hidden");
      if (!notifPopover.classList.contains("hidden")) populateNotifications();
      searchPopover?.classList.add("hidden");
    });
    document.addEventListener("click", () => notifPopover?.classList.add("hidden"));
    notifPopover.addEventListener("click", e => e.stopPropagation());
  }

  /* Eye button */
  const eyeBtn = $("#eyeBtn");
  if (eyeBtn) {
    updateEyeButton();
    eyeBtn.onclick = toggleHideBalance;
  }

  /* Live search */
  initGlobalSearch();
}
function accountCard(a) {
  return `<div class="card bank-card">
    <small class="muted">${a.type} &bull; ${a.status}</small>
    <h2>${money(a.balance)}</h2>
    <div class="bank-bottom">
      <div>
        <div class="bank-number">&bull;&bull;&bull;&bull; ${a.number}</div>
        <small>${esc(user().name)}</small>
      </div>
      <b>${a.type === "Credit Card" ? "MC" : "VISA"}</b>
    </div>
  </div>`;
}
function txRows(rows) { return `<div class="table-wrap"><table class="table"><thead><tr><th>Description</th><th>Type</th><th>Date</th><th>Status</th><th>Amount</th></tr></thead><tbody>${rows.map(t => `<tr><td><b>${esc(t.description)}</b><br><small class="muted">${esc(t.party)}</small></td><td>${t.type}</td><td>${t.date}</td><td><span class="pill">${t.status}</span></td><td class="${t.amount >= 0 ? "pos" : "neg"}">${t.amount >= 0 ? "+" : ""}${money(t.amount)}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">No transactions found.</td></tr>'}</tbody></table></div>` }
function openMoney(kind) {
  const isOut = kind === "withdraw" || kind === "transfer" || kind === "expense";
  /* Only expenses can use a credit card; deposits can pay it off */
  const ac = data("accounts").filter(a => kind === "expense" || kind === "deposit" || a.type !== "Credit Card");
  const opts = ac.map(a => `<option value="${a.id}">${a.type} •••• ${a.number} (${money(a.balance)})</option>`).join("");
  const others = get("users").filter(x => x.id !== user().id);
  const rec = others.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join("");
  const list = kind === "deposit" ? INCOME_SOURCES : EXPENSE_CATS;
  const extra = kind === "transfer"
    ? `<label>Recipient<select id="mRec" class="select">${rec}</select></label>`
    : `<label>${kind === "deposit" ? "Source" : "Category"}<select id="mCat" class="select">${list.map(x => `<option>${x}</option>`).join("")}</select></label>`;
  modal(kind[0].toUpperCase() + kind.slice(1), `<form id="moneyForm" class="form-grid">
 <label>Account<select id="mAcc" class="select">${opts}</select></label>
 ${extra}
 <label>Amount<input id="mAmt" class="input" type="number" min="1" step=".01" required></label>
 <label>Description<input id="mDesc" class="input" required placeholder="e.g. Grocery shopping"></label>
 <div class="full-col"><button class="btn primary full">Confirm</button></div></form>`, () => {
    $("#moneyForm").onsubmit = e => {
      e.preventDefault();
      const id = $("#mAcc").value, amt = Number($("#mAmt").value), desc = $("#mDesc").value.trim();
      if (!(amt > 0) || !desc) return;
      const a = get("accounts").find(x => x.id === id);
      if (!a) { toast("Select an account"); return; }
      if (isOut && !canSpend(a, amt)) { toast(a.type === "Credit Card" ? "Credit limit exceeded" : "Insufficient balance"); return; }

      if (kind === "transfer") {
        const rid = $("#mRec")?.value, rUser = others.find(x => x.id === rid);
        const rAcc = get("accounts").find(x => x.userId === rid && x.type !== "Credit Card" && x.type !== "Fixed Deposit");
        if (!rUser || !rAcc) { toast("Recipient has no account that can receive funds"); return; }
        postEntry({ accountId: id, signed: -amt, type: "Transfer", description: desc, party: rUser.name, category: "Transfer" });
        postEntry({ userId: rid, accountId: rAcc.id, signed: amt, type: "Transfer", description: desc, party: user().name, category: "Transfer" });
      } else {
        const val = $("#mCat").value;
        const txId = postEntry({ accountId: id, signed: isOut ? -amt : amt, type: isOut ? "Expense" : "Income", description: desc, party: "Self", category: val });
        if (isOut) {
          const ex = get("expenses"); ex.push({ id: uid("e"), userId: user().id, category: val, description: desc, amount: amt, date: today(), accountId: id, txId }); set("expenses", ex);
        } else {
          const inc = get("income"); inc.push({ id: uid("i"), userId: user().id, source: val, description: desc, amount: amt, date: today(), accountId: id, txId }); set("income", inc);
        }
      }
      $("#modal").innerHTML = ""; toast("Transaction completed"); setTimeout(() => location.reload(), 450);
    };
  });
}
function renderDashboard() {

  const c = $("#content");
  const u = user();

  const ac = data("accounts");
  const tx = data("transactions");
  const inc = data("income");
  const ex = data("expenses");
  const bud = data("budgets");
  const go = data("savings");

  const now = new Date();

  const currentMonth =
    now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");

  const monthIncome =
    inc
      .filter(x => x.date.startsWith(currentMonth))
      .reduce((s, x) => s + Number(x.amount), 0);

  const monthExpenses =
    ex
      .filter(x => x.date.startsWith(currentMonth))
      .reduce((s, x) => s + Number(x.amount), 0);

  const balance =
    ac
      .filter(a => a.type !== "Credit Card")
      .reduce((s, a) => s + Number(a.balance), 0);

  const net = monthIncome - monthExpenses;

  const savingsRate =
    monthIncome
      ? Math.max(0, Math.round((net / monthIncome) * 100))
      : 0;

  const sortedTx =
    [...tx]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);


  /* -----------------------------------------
     SPENDING CATEGORIES
  ----------------------------------------- */

  const categories = {};

  ex
    .filter(x => x.date.startsWith(currentMonth))
    .forEach(x => {
      categories[x.category] =
        (categories[x.category] || 0) + Number(x.amount);
    });

  const spending =
    Object.entries(categories)
      .sort((a, b) => b[1] - a[1]);

  const maxSpend =
    Math.max(...spending.map(x => x[1]), 1);

  const topCategory =
    spending[0]?.[0] || "your spending";


  /* -----------------------------------------
     MONTHLY CASH FLOW
  ----------------------------------------- */

  const months = [];

  for (let i = 5; i >= 0; i--) {

    const d = new Date(
      now.getFullYear(),
      now.getMonth() - i,
      1
    );

    const key =
      d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0");

    const label =
      d.toLocaleString("en-IN", { month: "short" });

    const income =
      tx
        .filter(x =>
          x.date.startsWith(key) &&
          Number(x.amount) > 0 &&
          x.type === "Income"
        )
        .reduce((s, x) => s + Number(x.amount), 0);

    const expense =
      tx
        .filter(x =>
          x.date.startsWith(key) &&
          Number(x.amount) < 0 &&
          x.type === "Expense"
        )
        .reduce((s, x) => s + Math.abs(Number(x.amount)), 0);

    months.push({
      label,
      income,
      expense
    });
  }

  const maxCash =
    Math.max(
      ...months.flatMap(x => [x.income, x.expense]),
      1
    );


  /* -----------------------------------------
     BUDGETS
  ----------------------------------------- */

  const budgetHTML =
    bud.slice(0, 4).map(b => {

      const spent =
        ex
          .filter(x =>
            x.category === b.category &&
            x.date.startsWith(currentMonth)
          )
          .reduce((s, x) => s + Number(x.amount), 0);

      const percentage =
        Math.min(
          100,
          Math.round((spent / b.amount) * 100)
        );

      const danger = percentage >= 85;

      return `
       <div class="budget-item">

         <div class="budget-top">

           <b>${esc(b.category)}</b>

           <span>
             ${percentage}%
           </span>

         </div>

         <div class="progress">

           <span
             style="
               width:${percentage}%;
               ${danger ? "background:linear-gradient(90deg,#a85c52,#c77a70)" : ""}
             "
           ></span>

         </div>

         <small class="muted">

           ${money(spent)}
           of
           ${money(b.amount)}

           ${percentage >= 100
          ? " · Over budget"
          : percentage >= 85
            ? " · Almost reached"
            : ""
        }

         </small>

       </div>
     `;

    }).join("");


  /* -----------------------------------------
     SAVINGS GOALS
  ----------------------------------------- */

  const goalsHTML =
    go.slice(0, 3).map(g => {

      const percentage =
        Math.min(
          100,
          Math.round(
            (Number(g.current) / Number(g.target)) * 100
          )
        );

      return `
       <div class="goal-item">

         <div class="budget-top">

           <b>${esc(g.name)}</b>

           <b>${percentage}%</b>

         </div>

         <div class="progress">

           <span style="width:${percentage}%"></span>

         </div>

         <small class="muted">

           ${money(g.current)}
           of
           ${money(g.target)}

         </small>

       </div>
     `;

    }).join("");


  /* -----------------------------------------
     TRANSACTIONS
  ----------------------------------------- */

  const transactionHTML =
    sortedTx.map(t => {

      const positive = Number(t.amount) >= 0;

      return `
       <tr>

         <td>

           <b>${esc(t.description)}</b>

           <br>

           <small class="muted">
             ${esc(t.party || t.category || "Personal")}
           </small>

         </td>

         <td>
           ${esc(t.type)}
         </td>

         <td>
           ${esc(t.date)}
         </td>

         <td>
           <span class="pill">
             ${esc(t.status || "Completed")}
           </span>
         </td>

         <td
           class="${positive ? "pos" : "neg"}"
         >
           ${positive ? "+" : ""}${money(t.amount)}
         </td>

       </tr>
     `;

    }).join("");


  /* -----------------------------------------
     CASH FLOW
  ----------------------------------------- */

  const cashHTML =
    months.map((m, i) => {

      const incomeHeight =
        Math.max(
          5,
          (m.income / maxCash) * 100
        );

      const expenseHeight =
        Math.max(
          5,
          (m.expense / maxCash) * 100
        );

      return `
       <div
         class="cash-month"
         style="animation-delay:${i * 90}ms"
       >

         <div
           class="cash-bar income"
           style="height:${incomeHeight}%"
           title="Income ${money(m.income)}"
         ></div>

         <div
           class="cash-bar expense"
           style="height:${expenseHeight}%"
           title="Expenses ${money(m.expense)}"
         ></div>

         <small>${m.label}</small>

       </div>
     `;

    }).join("");


  /* -----------------------------------------
     SPENDING
  ----------------------------------------- */

  const spendingHTML =
    spending.slice(0, 5).map(([category, value]) => {

      const percentage =
        Math.round((value / maxSpend) * 100);

      return `
       <div class="spending-row">

         <span>
           ${esc(category)}
         </span>

         <div class="spending-track">

           <div
             class="spending-fill"
             style="width:${percentage}%"
           ></div>

         </div>

         <b>
           ${money(value)}
         </b>

       </div>
     `;

    }).join("");


  /* -----------------------------------------
     MAIN DASHBOARD
  ----------------------------------------- */

  c.innerHTML = `

 <!-- HERO -->

 <div class="hero dashboard-hero">

   <div class="eyebrow">
     PERSONAL FINANCE
   </div>

   <h2>
     Good ${now.getHours() < 12 ? "morning" : now.getHours() < 18 ? "afternoon" : "evening"},
     ${esc(u.name.split(" ")[0])}.
   </h2>

   <p class="muted">
     Here's your financial picture for
     ${now.toLocaleString("en-IN", { month: "long", year: "numeric" })}.
   </p>

   <div
     style="
       display:flex;
       align-items:center;
       justify-content:space-between;
       gap:20px;
       flex-wrap:wrap;
       margin-top:22px;
     "
   >

     <div>

       <small
         style="
           color:rgba(244,241,222,.58);
           display:block;
           margin-bottom:5px;
         "
       >
         AVAILABLE BALANCE
       </small>

       <strong
         style="
           font-size:34px;
           color:#F4F1DE;
           letter-spacing:-1.5px;
         "
         data-count="${balance}"
       >
         ${money(balance)}
       </strong>

     </div>

     <button
       class="btn primary"
       onclick="openMoney('deposit')"
     >
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add money
     </button>

   </div>

 </div>


 <!-- OVERVIEW -->

 <div class="section-head">

   <div>
     <h2>Financial overview</h2>

     <small class="muted">
       Your numbers, at a glance
     </small>
   </div>

   <div class="actions">

     <button
       class="btn secondary small"
       onclick="openMoney('withdraw')"
     >
       Withdraw
     </button>

     <button
       class="btn primary small"
       onclick="openMoney('transfer')"
     >
       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg> Transfer
     </button>

   </div>

 </div>


 <div class="grid stats">

   <div class="card stat">

     <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg></div>

     <small>Total balance</small>

     <h2 data-count="${balance}">
       ${money(balance)}
     </h2>

     <small>
       Across ${ac.filter(a => a.type !== "Credit Card").length} accounts (excl. credit cards)
     </small>

   </div>


   <div class="card stat">

     <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></div>

     <small>Income this month</small>

     <h2
       class="pos"
       data-count="${monthIncome}"
     >
       ${money(monthIncome)}
     </h2>

     <small>
       Money received
     </small>

   </div>


   <div class="card stat">

     <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>

     <small>Expenses this month</small>

     <h2
       class="neg"
       data-count="${monthExpenses}"
     >
       ${money(monthExpenses)}
     </h2>

     <small>
       Money spent
     </small>

   </div>


   <div class="card stat">

     <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></div>

     <small>Net savings</small>

     <h2 data-count="${Math.max(net, 0)}">
       ${money(net)}
     </h2>

     <small>
       ${savingsRate}% savings rate
     </small>

   </div>

 </div>


 <!-- CASH FLOW + INSIGHT -->

 <div class="section-head">

   <div>
     <h2>Cash flow</h2>

     <small class="muted">
       Income vs expenses over the last six months
     </small>
   </div>

 </div>


 <div class="grid two">

   <div class="card">

     <div
       style="
         display:flex;
         gap:18px;
         align-items:center;
         margin-bottom:5px;
       "
     >

       <span class="muted">
         <b style="color:var(--sage)">●</b>
         Income
       </span>

       <span class="muted">
         <b style="color:var(--beige)">●</b>
         Expenses
       </span>

     </div>

     <div class="cash-flow">

       ${cashHTML}

     </div>

   </div>


   <div class="card insight-card">

     <small
       style="
         color:var(--beige);
         letter-spacing:1px;
         font-weight:800;
       "
     >
       FINORA INSIGHT
     </small>

     <h2
       style="
         font-size:24px;
         margin:14px 0 10px;
       "
     >
       ${savingsRate >= 20
      ? "You're building a healthy savings buffer."
      : "There's room to increase your monthly savings."
    }
     </h2>

     <p
       style="
         color:rgba(244,241,222,.68);
         line-height:1.7;
         font-size:13px;
       "
     >
       ${spending.length
      ? `Your largest spending category this month is
            <strong style="color:#F4F1DE">
              ${esc(topCategory)}
            </strong>.
            Keeping an eye on this category could help
            you reach your goals faster.`
      : "Start recording your expenses to unlock personalized financial insights."
    }
     </p>

     <div
       style="
         margin-top:25px;
         display:flex;
         justify-content:space-between;
         align-items:end;
       "
     >

       <div>

         <small
           style="color:rgba(244,241,222,.5)"
         >
           SAVINGS RATE
         </small>

         <div
           style="
             font-size:30px;
             font-weight:850;
             color:#F4F1DE;
             margin-top:3px;
           "
         >
           ${savingsRate}%
         </div>

       </div>

       <span
         style="
           width:55px;
           height:55px;
           border-radius:50%;
           display:grid;
           place-items:center;
           background:rgba(244,241,222,.08);
           border:1px solid rgba(244,241,222,.12);
           font-size:23px;
         "
       >
         ✦
       </span>

     </div>

   </div>

 </div>


 <!-- ACCOUNTS -->

 <div class="section-head">

   <div>
     <h2>Your accounts</h2>
     <small class="muted">
       Your connected financial accounts
     </small>
   </div>

   <a
     class="btn secondary small"
     href="accounts.html"
   >
     View all →
   </a>

 </div>


 <div class="grid account-grid">

   ${ac.slice(0, 3).map(accountCard).join("")}

 </div>


 <!-- SPENDING + BUDGETS -->

 <div class="section-head">

   <div>
     <h2>Where your money goes</h2>
     <small class="muted">
       This month's spending
     </small>
   </div>

 </div>


 <div class="grid two">

   <div class="card">

     <div class="section-head" style="margin-top:0">

       <div>
         <h2>Spending breakdown</h2>
       </div>

       <a
         href="expenses.html"
         class="muted"
       >
         Details →
       </a>

     </div>

     ${spendingHTML ||
    `<div class="empty">
          No expenses recorded this month.
        </div>`
    }

   </div>


   <div class="card">

     <div class="section-head" style="margin-top:0">

       <div>
         <h2>Budget progress</h2>
       </div>

       <a
         href="budgets.html"
         class="muted"
       >
         Manage →
       </a>

     </div>

     ${budgetHTML}

   </div>

 </div>


 <!-- TRANSACTIONS -->

 <div class="section-head">

   <div>
     <h2>Recent transactions</h2>

     <small class="muted">
       Your latest activity
     </small>
   </div>

   <a
     href="transactions.html"
     class="btn secondary small"
   >
     View all →
   </a>

 </div>


 <div class="card">

   <div class="table-wrap">

     <table class="table">

       <thead>

         <tr>
           <th>Description</th>
           <th>Type</th>
           <th>Date</th>
           <th>Status</th>
           <th>Amount</th>
         </tr>

       </thead>

       <tbody>

         ${transactionHTML ||
    `<tr>
             <td
               colspan="5"
               class="empty"
             >
               No transactions yet.
             </td>
           </tr>`
    }

       </tbody>

     </table>

   </div>

 </div>


 <!-- SAVINGS -->

 <div class="section-head">

   <div>
     <h2>Savings goals</h2>

     <small class="muted">
       Keep moving toward what matters
     </small>
   </div>

   <a
     href="savings.html"
     class="btn secondary small"
   >
     View goals →
   </a>

 </div>


 <div class="grid three">

   ${go.length
      ? goalsHTML
      : `
       <div class="card empty">
         No savings goals yet.
       </div>
     `
    }

 </div>


 <!-- QUICK ACTIONS -->

 <div class="section-head">

   <div>
     <h2>Quick actions</h2>

     <small class="muted">
       Manage your money instantly
     </small>
   </div>

 </div>


 <div class="grid quick-grid">

   <button class="quick" onclick="openMoney('deposit')" aria-label="Deposit money">
     <div class="qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg></div>
     <strong>Deposit money</strong>
     <small class="muted">Add funds to an account</small>
   </button>

   <button class="quick" onclick="openMoney('withdraw')" aria-label="Withdraw money">
     <div class="qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg></div>
     <strong>Withdraw money</strong>
     <small class="muted">Record a withdrawal</small>
   </button>

   <button class="quick" onclick="openMoney('transfer')" aria-label="Transfer money">
     <div class="qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg></div>
     <strong>Transfer money</strong>
     <small class="muted">Send money to another user</small>
   </button>

   <button class="quick" onclick="openMoney('expense')" aria-label="Add expense">
     <div class="qi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="17" height="17" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
     <strong>Add expense</strong>
     <small class="muted">Track a new expense</small>
   </button>

 </div>

 `;


  /* -----------------------------------------
     ANIMATED NUMBER COUNTERS
  ----------------------------------------- */

  const counters =
    c.querySelectorAll("[data-count]");

  counters.forEach((el, index) => {

    const target =
      Number(el.dataset.count) || 0;

    const duration = 1100 + index * 120;

    const start =
      performance.now();

    function animate(time) {

      const progress =
        Math.min(
          (time - start) / duration,
          1
        );

      const eased =
        1 - Math.pow(1 - progress, 4);

      const value =
        target * eased;

      el.textContent =
        money(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.textContent = money(target);
      }

    }

    setTimeout(() => {
      requestAnimationFrame(animate);
    }, 180 + index * 80);

  });


  /* -----------------------------------------
     TILT EFFECT FOR ACCOUNT CARDS
  ----------------------------------------- */

  c.querySelectorAll(".bank-card")
    .forEach(card => {

      card.addEventListener("mousemove", e => {

        if (window.innerWidth < 800) return;

        const rect =
          card.getBoundingClientRect();

        const x =
          e.clientX - rect.left;

        const y =
          e.clientY - rect.top;

        const rotateY =
          ((x / rect.width) - .5) * 5;

        const rotateX =
          ((y / rect.height) - .5) * -5;

        card.style.transform =
          `perspective(900px)
         translateY(-9px)
         rotateX(${rotateX}deg)
         rotateY(${rotateY}deg)`;

      });

      card.addEventListener("mouseleave", () => {

        card.style.transform = "";

      });

    });

}
function renderAccounts() {
  const c = $("#content"), a = data("accounts"); c.innerHTML = `<div class="section-head"><h2>All accounts</h2><button class="btn primary small" onclick="addAccount()">＋ Add account</button></div><div class="grid account-grid">${a.map(accountCard).join("")}</div>`;
  window.addAccount = () => modal("Add simulated account", `<form id="af" class="form-grid"><label>Type<select id="at" class="select"><option>Savings</option><option>Checking</option><option>Credit Card</option><option>Fixed Deposit</option></select></label><label>Opening balance<input id="ab" class="input" type="number" min="0" required></label><div class="full-col"><button class="btn primary full">Create</button></div></form>`, () => $("#af").onsubmit = e => { e.preventDefault(); let a = get("accounts"); a.push({ id: uid("a"), userId: user().id, type: $("#at").value, number: String(Math.floor(1000 + Math.random() * 9000)), balance: Number($("#ab").value), status: "Active" }); set("accounts", a); $("#modal").innerHTML = ""; toast("Account created"); setTimeout(() => location.reload(), 400) });
}
function renderTransactions() {
  const c = $("#content"); let rows = data("transactions").sort((a, b) => b.date.localeCompare(a.date)); c.innerHTML = `<div class="card"><div class="section-head" style="margin-top:0"><h2>Transaction history</h2><div class="filters"><input id="q" class="input filter" placeholder="Search transactions..." aria-label="Search transactions"><select id="type" class="select" style="width:130px" aria-label="Filter by type"><option value="">All types</option><option>Income</option><option>Expense</option><option>Transfer</option></select><button class="btn secondary small" onclick="exportTransactionsCSV()" aria-label="Export transactions to CSV" title="Export CSV"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Export</button></div></div><div id="tx">${txRows(rows)}</div></div>`; function f() { let q = $("#q").value.toLowerCase(), t = $("#type").value; $("#tx").innerHTML = txRows(rows.filter(x => (!q || `${x.description} ${x.party} ${x.category}`.toLowerCase().includes(q)) && (!t || x.type === t))) } $("#q").oninput = f; $("#type").onchange = f;
}
function renderCrud(kind, title) {
  const c = $("#content"), isInc = kind === "income";
  const opts = isInc ? INCOME_SOURCES : EXPENSE_CATS;
  function draw() {
    const rows = data(kind);
    c.innerHTML = `<div class="section-head"><h2>${title} records</h2><button class="btn primary small" onclick="addRecord()">＋ Add ${title.toLowerCase()}</button></div><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>${isInc ? "Source" : "Category"}</th><th>Description</th><th>Date</th><th>Amount</th><th></th></tr></thead><tbody>${rows.map(x => `<tr><td>${esc(x[isInc ? "source" : "category"])}</td><td>${esc(x.description)}</td><td>${esc(x.date)}</td><td class="${isInc ? "pos" : "neg"}">${money(x.amount)}</td><td><button class="btn danger small" onclick="removeRecord('${x.id}')">Delete</button></td></tr>`).join("") || '<tr><td colspan="5" class="empty">No records yet.</td></tr>'}</tbody></table></div></div>`;
  }
  window.addRecord = () => {
    const accOpts = data("accounts").map(a => `<option value="${a.id}">${a.type} •••• ${a.number} (${money(a.balance)})</option>`).join("");
    modal(`Add ${title.toLowerCase()}`, `<form id="rf" class="form-grid"><label>${isInc ? "Source" : "Category"}<select id="cat" class="select">${opts.map(x => `<option>${x}</option>`).join("")}</select></label><label>${isInc ? "Deposit to" : "Pay from"}<select id="racc" class="select">${accOpts}</select></label><label>Amount<input id="amt" class="input" type="number" min="1" step=".01" required></label><label>Description<input id="desc" class="input" required></label><label>Date<input id="date" class="input" type="date" value="${today()}" required></label><div class="full-col"><button class="btn primary full">Save</button></div></form>`, () => $("#rf").onsubmit = e => {
      e.preventDefault();
      const cat = $("#cat").value, accId = $("#racc").value, amount = Number($("#amt").value), desc = $("#desc").value.trim(), date = $("#date").value;
      const a = get("accounts").find(x => x.id === accId);
      if (!a) { toast("Choose an account"); return; }
      if (!(amount > 0) || !desc) return;
      if (!isInc && !canSpend(a, amount)) { toast(a.type === "Credit Card" ? "Credit limit exceeded" : "Insufficient balance"); return; }
      const txId = postEntry({ accountId: accId, signed: isInc ? amount : -amount, type: isInc ? "Income" : "Expense", description: desc, party: isInc ? cat : "Self", category: cat, date });
      const arr = get(kind);
      arr.push({ id: uid(kind[0]), userId: user().id, [isInc ? "source" : "category"]: cat, description: desc, amount, date, accountId: accId, txId });
      set(kind, arr); $("#modal").innerHTML = ""; toast(`${title} added`); draw();
    });
  };
  window.removeRecord = id => {
    if (!confirm("Are you sure you want to delete this " + title.toLowerCase() + " record?")) return;
    const rec = get(kind).find(x => x.id === id);
    if (rec) reverseEntry(rec);               // restores balance + removes linked transaction
    set(kind, get(kind).filter(x => x.id !== id));
    toast(`${title} deleted`); draw();
  };
  draw();
}
function renderBudgets() {
  const c = $("#content"), b = data("budgets"), exp = data("expenses").filter(inThisMonth);
  c.innerHTML = `<div class="section-head"><h2>Monthly budgets</h2><button class="btn primary small" onclick="addBudget()">＋ Add budget</button></div><div class="grid two">${b.map(x => {
    const s = exp.filter(y => y.category === x.category).reduce((z, y) => z + Number(y.amount), 0), p = Math.min(100, s / x.amount * 100);
    return `<div class="card"><div class="budget-top"><b>${esc(x.category)}</b><b>${Math.round(p)}%</b></div><p class="muted">${money(s)} spent of ${money(x.amount)}</p><div class="progress"><span style="width:${p}%;${p >= 100 ? "background:#a85c52" : ""}"></span></div><small class="muted">${p >= 100 ? "Over budget" : "Remaining " + money(x.amount - s)}</small></div>`;
  }).join("") || '<div class="card empty">No budgets yet.</div>'}</div>`;
  window.addBudget = () => modal("Create budget", `<form id="bf" class="form-grid"><label>Category<select id="bc" class="select">${EXPENSE_CATS.map(x => `<option>${x}</option>`).join("")}</select></label><label>Amount<input id="ba" class="input" type="number" min="1" required></label><div class="full-col"><button class="btn primary full">Create</button></div></form>`, () => $("#bf").onsubmit = e => {
    e.preventDefault();
    const all = get("budgets"), cat = $("#bc").value, amt = Number($("#ba").value);
    const existing = all.find(x => x.userId === user().id && x.category === cat);
    if (existing) { existing.amount = amt; toast("Budget updated"); }
    else { all.push({ id: uid("b"), userId: user().id, category: cat, amount: amt }); toast("Budget created"); }
    set("budgets", all); $("#modal").innerHTML = ""; renderBudgets();
  });
}
function renderSavings() {
  const c = $("#content"), g = data("savings");
  c.innerHTML = `<div class="section-head"><h2>Your goals</h2><button class="btn primary small" onclick="addGoal()">＋ Add goal</button></div><div class="grid three">${g.map(x => {
    const p = Math.min(100, x.current / x.target * 100);
    return `<div class="card"><div class="budget-top"><b>${esc(x.name)}</b><b>${Math.round(p)}%</b></div><h2>${money(x.current)}</h2><p class="muted">Target ${money(x.target)}</p><div class="progress"><span style="width:${p}%"></span></div><p class="muted">Remaining ${money(Math.max(0, x.target - x.current))}</p><small class="muted">Target: ${esc(x.date)}</small><div style="margin-top:12px"><button class="btn secondary small" onclick="addToGoal('${x.id}')">＋ Add money</button></div></div>`;
  }).join("") || '<div class="card empty">No savings goals yet.</div>'}</div>`;
  window.addGoal = () => modal("Add savings goal", `<form id="gf" class="form-grid"><label>Goal name<input id="gn" class="input" required></label><label>Target amount<input id="gt" class="input" type="number" min="1" required></label><label>Current saved<input id="gc" class="input" type="number" min="0" required></label><label>Target date<input id="gd" class="input" type="date" required></label><div class="full-col"><button class="btn primary full">Create</button></div></form>`, () => $("#gf").onsubmit = e => {
    e.preventDefault();
    const target = Number($("#gt").value), current = Number($("#gc").value);
    if (current > target) { toast("Saved amount can't exceed the target"); return; }
    const a = get("savings"); a.push({ id: uid("s"), userId: user().id, name: $("#gn").value.trim(), target, current, date: $("#gd").value });
    set("savings", a); $("#modal").innerHTML = ""; toast("Goal created"); renderSavings();
  });
  window.addToGoal = id => modal("Add money to goal", `<form id="gaf" class="form-grid"><label>Amount<input id="ga" class="input" type="number" min="1" step=".01" required></label><div class="full-col"><button class="btn primary full">Add</button></div></form>`, () => $("#gaf").onsubmit = e => {
    e.preventDefault();
    const all = get("savings"), goal = all.find(x => x.id === id), amt = Number($("#ga").value);
    if (!goal || !(amt > 0)) return;
    goal.current = Math.min(goal.target, Number(goal.current) + amt);
    set("savings", all); $("#modal").innerHTML = ""; toast("Goal updated"); renderSavings();
  });
}
function renderAnalytics() { const c = $("#content"), inc = data("income"), ex = data("expenses"), ti = inc.reduce((s, x) => s + x.amount, 0), te = ex.reduce((s, x) => s + x.amount, 0), cats = {}; ex.forEach(x => cats[x.category] = (cats[x.category] || 0) + x.amount); let max = Math.max(...Object.values(cats), 1); const wk = [0, 0, 0, 0, 0, 0, 0]; ex.forEach(x => { wk[(new Date(x.date + "T00:00:00").getDay() + 6) % 7] += Number(x.amount) }); const wmax = Math.max(...wk, 1); c.innerHTML = `<div class="grid stats"><div class="card stat"><small>Income</small><h2 class="pos">${money(ti)}</h2></div><div class="card stat"><small>Expenses</small><h2 class="neg">${money(te)}</h2></div><div class="card stat"><small>Net cash flow</small><h2>${money(ti - te)}</h2></div><div class="card stat"><small>Savings rate</small><h2>${ti ? Math.round((ti - te) / ti * 100) : 0}%</h2></div></div><div class="section-head"><h2>Financial analytics</h2></div><div class="grid two"><div class="card"><h2>Expense categories</h2>${Object.entries(cats).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="budget-item"><div class="budget-top"><b>${k}</b><span>${money(v)}</span></div><div class="progress"><span style="width:${v / max * 100}%"></span></div></div>`).join("")}</div><div class="card"><h2>Income vs Expenses</h2><div class="mini-chart"><div class="bar-col"><div class="bar" style="height:${Math.max(8, ti / Math.max(ti, te) * 100)}%"></div><small>Income</small></div><div class="bar-col"><div class="bar" style="height:${Math.max(8, te / Math.max(ti, te) * 100)}%"></div><small>Expense</small></div></div></div></div><div class="card" style="margin-top:18px"><h2>Spending activity (by weekday)</h2><div class="mini-chart">${wk.map((v, i) => `<div class="bar-col"><div class="bar" title="${money(v)}" style="height:${Math.max(4, v / wmax * 100)}%"></div><small>${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}</small></div>`).join("")}</div></div>` }
function renderProfile() { const c = $("#content"), u = user(); c.innerHTML = `<div class="grid two"><div class="card"><div class="profile"><div class="profile-avatar">${esc(u.name.split(" ").map(x => x[0]).join(""))}</div><div><h2 style="margin:0">${esc(u.name)}</h2><p class="muted">${esc(u.email)}</p></div></div><div class="section-head"><h2>Profile information</h2><button class="btn primary small" onclick="editProfile()">Edit</button></div><p><span class="muted">Phone</span><br><b>${esc(u.phone || "Not provided")}</b></p><p><span class="muted">User ID</span><br><b>${u.id}</b></p></div><div class="card"><h2>About this project</h2><p class="muted" style="line-height:1.7">This is a frontend-only college project. All data is fictional and stored in your browser LocalStorage. No real banking or payment services are connected.</p><button class="btn danger" onclick="localStorage.removeItem('finora_currentUser');location.href='login.html'">Logout</button></div></div>`; window.editProfile = () => modal("Edit profile", `<form id="pf" class="form"><label>Name<input id="pn" class="input" value="${esc(u.name)}" required></label><label>Phone<input id="pp" class="input" value="${esc(u.phone || "")}" required></label><button class="btn primary full">Save changes</button></form>`, () => $("#pf").onsubmit = e => { e.preventDefault(); let a = get("users"), x = a.find(z => z.id === u.id); x.name = $("#pn").value; x.phone = $("#pp").value; set("users", a); $("#modal").innerHTML = ""; toast("Profile updated"); setTimeout(() => location.reload(), 400) }) }

async function boot() {
  const path = location.pathname.toLowerCase();
  if (path.endsWith("login.html") || path.endsWith("register.html")) { await ensureData(); auth(); return }
  if (path.endsWith("index.html") || path.endsWith("/")) return;
  await ensureData(); shell(); const p = document.body.dataset.page;
  if (!user()) return;
  ({ dashboard: renderDashboard, accounts: renderAccounts, transactions: renderTransactions, income: () => renderCrud("income", "Income"), expenses: () => renderCrud("expenses", "Expense"), budgets: renderBudgets, savings: renderSavings, analytics: renderAnalytics, profile: renderProfile }[p] || renderDashboard)();
}
function auth() {
  const login = $("#login"), reg = $("#register");
  if (login) login.onsubmit = e => { e.preventDefault(); const u = get("users").find(x => x.email.toLowerCase() === $("#email").value.trim().toLowerCase() && x.password === $("#password").value); if (!u) { $("#error").textContent = "Invalid email or password."; return } localStorage.setItem("finora_currentUser", u.id); location.href = "dashboard.html" };
  if (reg) reg.onsubmit = e => { e.preventDefault(); if ($("#password").value !== $("#confirm").value) { $("#error").textContent = "Passwords do not match."; return } let a = get("users"); if (a.some(x => x.email.toLowerCase() === $("#email").value.trim().toLowerCase())) { $("#error").textContent = "Email already registered."; return } const u = { id: uid("u"), name: $("#name").value, email: $("#email").value.trim().toLowerCase(), password: $("#password").value, phone: $("#phone").value }; a.push(u); set("users", a); let ac = get("accounts"); ac.push({ id: uid("a"), userId: u.id, type: "Savings", number: String(Math.floor(1000 + Math.random() * 9000)), balance: 10000, status: "Active" }); set("accounts", ac); localStorage.setItem("finora_currentUser", u.id); location.href = "dashboard.html" };
}
boot();