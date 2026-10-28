
/* =====================================================
   FINORA — DASHBOARD FUNCTIONALITY
   File: js/dashboard.js
   Frontend demo only — no real bank connection
===================================================== */

(() => {
    "use strict";

    const STORAGE_KEY = "finoraDashboardTransactions";

    const $ = (selector) => document.querySelector(selector);

    const money = (amount) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(amount) || 0);

    const today = () => {
        const date = new Date();
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - offset * 60000)
            .toISOString()
            .slice(0, 10);
    };

    const escapeHTML = (value) =>
        String(value).replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);

    const initialTransactions = [
        {
            id: "demo-1",
            title: "Shopping",
            description: "Online purchase",
            type: "expense",
            category: "Shopping",
            amount: 2450,
            date: today()
        },
        {
            id: "demo-2",
            title: "Monthly salary",
            description: "Income received",
            type: "income",
            category: "Salary",
            amount: 35000,
            date: today()
        },
        {
            id: "demo-3",
            title: "Restaurant",
            description: "Food and dining",
            type: "expense",
            category: "Food",
            amount: 850,
            date: today()
        },
        {
            id: "demo-4",
            title: "House rent",
            description: "Monthly payment",
            type: "expense",
            category: "Housing",
            amount: 7000,
            date: today()
        },
        {
            id: "demo-5",
            title: "Freelance payment",
            description: "Project income",
            type: "income",
            category: "Other",
            amount: 7800,
            date: today()
        }
    ];

    function loadTransactions() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (saved === null) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(initialTransactions)
                );

                return [...initialTransactions];
            }

            const parsed = JSON.parse(saved);

            if (!Array.isArray(parsed)) {
                return [...initialTransactions];
            }

            return parsed.filter((transaction) =>
                transaction &&
                typeof transaction.title === "string" &&
                Number.isFinite(Number(transaction.amount)) &&
                Number(transaction.amount) > 0 &&
                ["income", "expense"].includes(transaction.type)
            );
        } catch (error) {
            console.error("Could not load Finora transactions:", error);
            return [...initialTransactions];
        }
    }

    let transactions = loadTransactions();
    let cashflowChart = null;
    let spendingChart = null;

    /* ---------- USER NAME ---------- */

    function initialiseUser() {
        let name = "Riya";

        try {
            const storedUser = JSON.parse(
                localStorage.getItem("finoraUser") || "null"
            );

            if (storedUser && typeof storedUser === "object") {
                name =
                    storedUser.name ||
                    storedUser.fullName ||
                    storedUser.username ||
                    name;
            }
        } catch {
            // Use the default demo name.
        }

        const firstName = String(name).trim().split(/\s+/)[0] || "Riya";
        const initial = firstName.charAt(0).toUpperCase();

        if ($("#welcomeName")) {
            $("#welcomeName").textContent = firstName;
        }

        if ($("#sidebarUserName")) {
            $("#sidebarUserName").textContent = name;
        }

        if ($("#sidebarAvatar")) {
            $("#sidebarAvatar").textContent = initial;
        }

        if ($(".topbar-avatar")) {
            $(".topbar-avatar").textContent = initial;
        }
    }

    /* ---------- DATE ---------- */

    function initialiseDate() {
        const dateElement = $("#currentDate");

        if (!dateElement) return;

        dateElement.textContent = new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        }).format(new Date());

        const hour = new Date().getHours();

        const greeting =
            hour < 12 ? "Good morning" :
            hour < 17 ? "Good afternoon" :
            "Good evening";

        const welcomeHeading = $(".welcome-section h1");

        if (welcomeHeading) {
            welcomeHeading.innerHTML =
                `${greeting}, <span id="welcomeName">${
                    escapeHTML(
                        $("#welcomeName")?.textContent || "Riya"
                    )
                }</span><span class="heading-period">.</span>`;
        }
    }

    /* ---------- FINANCIAL SUMMARY ---------- */

    function getTotals() {
        const currentMonth = today().slice(0, 7);

        const currentMonthTransactions = transactions.filter(
            (transaction) =>
                String(transaction.date || "").slice(0, 7) === currentMonth
        );

        const income = currentMonthTransactions
            .filter((transaction) => transaction.type === "income")
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        const expenses = currentMonthTransactions
            .filter((transaction) => transaction.type === "expense")
            .reduce((sum, transaction) => sum + Number(transaction.amount), 0);

        return {
            income,
            expenses,
            balance: income - expenses,
            savings: Math.max(0, income - expenses)
        };
    }

    function updateSummary() {
        const totals = getTotals();

        if ($("#totalBalance")) {
            $("#totalBalance").textContent = money(totals.balance);
        }

        if ($("#totalIncome")) {
            $("#totalIncome").textContent = money(totals.income);
        }

        if ($("#totalExpenses")) {
            $("#totalExpenses").textContent = money(totals.expenses);
        }

        if ($("#totalSavings")) {
            $("#totalSavings").textContent = money(totals.savings);
        }

        if ($("#chartTotalSpent")) {
            $("#chartTotalSpent").textContent = money(totals.expenses);
        }
    }

    /* ---------- CASH FLOW CHART ---------- */

    function getCashflowData(period) {
        const now = new Date();
        const labels = [];
        const incomeData = [];
        const expenseData = [];

        let bucketCount;
        let getLabel;
        let getBucket;

        if (period === "week") {
            bucketCount = 7;

            getLabel = (date) =>
                new Intl.DateTimeFormat("en-IN", {
                    weekday: "short"
                }).format(date);

            getBucket = (date) => {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                start.setDate(start.getDate() - 6);

                const target = new Date(date + "T00:00:00");
                return Math.floor(
                    (target - start) / 86400000
                );
            };
        } else if (period === "year") {
            bucketCount = 12;

            getLabel = (date) =>
                new Intl.DateTimeFormat("en-IN", {
                    month: "short"
                }).format(date);

            getBucket = (date) => {
                const parsed = new Date(date + "T00:00:00");
                return parsed.getFullYear() === now.getFullYear()
                    ? parsed.getMonth()
                    : -1;
            };
        } else {
            bucketCount = 6;

            getLabel = (date) =>
                new Intl.DateTimeFormat("en-IN", {
                    day: "numeric",
                    month: "short"
                }).format(date);

            getBucket = (date) => {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                start.setDate(start.getDate() - 5);

                const target = new Date(date + "T00:00:00");
                return Math.floor(
                    (target - start) / 86400000
                );
            };
        }

        const buckets = Array.from(
            { length: bucketCount },
            () => ({ income: 0, expense: 0 })
        );

        for (let i = bucketCount - 1; i >= 0; i--) {
            const date = new Date(now);

            if (period === "week") {
                date.setDate(date.getDate() - i);
            } else if (period === "year") {
                date.setDate(1);
                date.setMonth(date.getMonth() - i);
            } else {
                date.setDate(date.getDate() - i);
            }

            labels.push(getLabel(date));
        }

        transactions.forEach((transaction) => {
            if (!transaction.date) return;

            const bucket = getBucket(transaction.date);

            if (bucket < 0 || bucket >= bucketCount) return;

            if (period === "week" || period === "month") {
                const start = new Date(now);
                start.setHours(0, 0, 0, 0);
                start.setDate(
                    start.getDate() - (bucketCount - 1)
                );

                const transactionDate = new Date(
                    transaction.date + "T00:00:00"
                );

                if (
                    transactionDate < start ||
                    transactionDate > now
                ) {
                    return;
                }
            }

            if (transaction.type === "income") {
                buckets[bucket].income += Number(transaction.amount);
            } else {
                buckets[bucket].expense += Number(transaction.amount);
            }
        });

        buckets.forEach((bucket) => {
            incomeData.push(bucket.income);
            expenseData.push(bucket.expense);
        });

        return { labels, incomeData, expenseData };
    }

    function initialiseCashflowChart() {
        const canvas = $("#cashflowChart");

        if (!canvas || typeof Chart === "undefined") return;

        if (cashflowChart) {
            cashflowChart.destroy();
        }

        const period = $("#cashflowPeriod")?.value || "month";
        const data = getCashflowData(period);

        cashflowChart = new Chart(canvas, {
            type: "line",

            data: {
                labels: data.labels,

                datasets: [
                    {
                        label: "Income",
                        data: data.incomeData,
                        borderColor: "#30343b",
                        backgroundColor: "rgba(48, 52, 59, 0.07)",
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: "#30343b"
                    },
                    {
                        label: "Expenses",
                        data: data.expenseData,
                        borderColor: "#a9adb3",
                        backgroundColor: "rgba(169, 173, 179, 0.06)",
                        fill: true,
                        tension: 0.35,
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        pointBackgroundColor: "#a9adb3"
                    }
                ]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: "index"
                },

                plugins: {
                    legend: { display: false },

                    tooltip: {
                        backgroundColor: "#202329",
                        padding: 12,
                        callbacks: {
                            label: (context) =>
                                `${context.dataset.label}: ${money(context.parsed.y)}`
                        }
                    }
                },

                scales: {
                    x: {
                        grid: { display: false },
                        border: { display: false },
                        ticks: {
                            color: "#858992",
                            maxRotation: 0,
                            autoSkip: true,
                            font: { size: 10 }
                        }
                    },

                    y: {
                        beginAtZero: true,
                        border: { display: false },
                        grid: {
                            color: "rgba(130, 133, 140, 0.13)"
                        },
                        ticks: {
                            color: "#858992",
                            font: { size: 10 },
                            callback: (value) => {
                                if (value >= 100000) {
                                    return `₹${(value / 100000).toFixed(1)}L`;
                                }

                                if (value >= 1000) {
                                    return `₹${(value / 1000).toFixed(0)}k`;
                                }

                                return `₹${value}`;
                            }
                        }
                    }
                }
            }
        });
    }

    /* ---------- SPENDING CHART ---------- */

    function getCategoryTotals() {
        const totals = {};

        transactions
            .filter((transaction) => transaction.type === "expense")
            .filter((transaction) =>
                String(transaction.date || "").slice(0, 7) === today().slice(0, 7)
            )
            .forEach((transaction) => {
                const category = transaction.category || "Other";

                totals[category] =
                    (totals[category] || 0) + Number(transaction.amount);
            });

        return Object.entries(totals)
            .sort((a, b) => b[1] - a[1]);
    }

    function updateSpendingLegend(categories) {
        const container = $("#spendingLegend");

        if (!container) return;

        const colors = [
            "#30343b",
            "#777c85",
            "#b5b8b5",
            "#deded8",
            "#92969d",
            "#c6c8c5"
        ];

        if (!categories.length) {
            container.innerHTML =
                '<p class="panel-description">No expenses recorded this month yet.</p>';
            return;
        }

        container.innerHTML = categories.map(([name, amount], index) => `
            <div class="spending-legend-item">
                <span class="category-name">
                    <i class="legend-dot" style="background:${colors[index % colors.length]}"></i>
                    ${escapeHTML(name)}
                </span>
                <strong>${money(amount)}</strong>
            </div>
        `).join("");
    }

    function initialiseSpendingChart() {
        const canvas = $("#spendingChart");

        if (!canvas || typeof Chart === "undefined") return;

        if (spendingChart) {
            spendingChart.destroy();
        }

        const categories = getCategoryTotals();
        const colors = [
            "#30343b",
            "#777c85",
            "#b5b8b5",
            "#deded8",
            "#92969d",
            "#c6c8c5"
        ];

        const chartData = categories.length
            ? categories.map((item) => item[1])
            : [1];

        const chartLabels = categories.length
            ? categories.map((item) => item[0])
            : ["No expenses"];

        spendingChart = new Chart(canvas, {
            type: "doughnut",

            data: {
                labels: chartLabels,

                datasets: [{
                    data: chartData,
                    backgroundColor: categories.length
                        ? categories.map((_, index) =>
                            colors[index % colors.length]
                        )
                        : ["#e9e9e6"],
                    borderWidth: 0,
                    hoverOffset: 5,
                    spacing: 3,
                    borderRadius: 4
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "76%",

                plugins: {
                    legend: { display: false },

                    tooltip: {
                        enabled: categories.length > 0,
                        callbacks: {
                            label: (context) =>
                                `${context.label}: ${money(context.parsed)}`
                        }
                    }
                }
            }
        });

        updateSpendingLegend(categories);
    }

    /* ---------- RECENT TRANSACTIONS ---------- */

    function getTransactionIcon(category) {
        const icons = {
            Shopping: "shopping-bag",
            Food: "utensils",
            Housing: "house",
            Transport: "car",
            Bills: "receipt",
            Health: "heart-pulse",
            Education: "graduation-cap",
            Salary: "briefcase-business",
            Other: "wallet"
        };

        return icons[category] || "wallet";
    }

    function formatDate(dateString) {
        if (!dateString) return "—";

        const date = new Date(dateString + "T00:00:00");

        if (Number.isNaN(date.getTime())) return "—";

        if (dateString === today()) return "Today";

        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short"
        }).format(date);
    }

    function renderTransactions() {
        const container = $("#recentTransactions");

        if (!container) return;

        const latest = [...transactions]
            .sort((a, b) =>
                String(b.date || "").localeCompare(String(a.date || ""))
            )
            .slice(0, 5);

        if (!latest.length) {
            container.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;padding:30px">
                        No transactions yet. Add your first transaction.
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = latest.map((transaction) => {
            const isIncome = transaction.type === "income";
            const amount = Number(transaction.amount);
            const category = transaction.category || "Other";

            return `
                <tr>
                    <td>
                        <div class="transaction-name">
                            <span class="transaction-icon">
                                <i data-lucide="${getTransactionIcon(category)}"></i>
                            </span>
                            <div>
                                <strong>${escapeHTML(transaction.title)}</strong>
                                <span>${escapeHTML(transaction.description || category)}</span>
                            </div>
                        </div>
                    </td>
                    <td>${formatDate(transaction.date)}</td>
                    <td>
                        <span class="category-tag">${escapeHTML(category)}</span>
                    </td>
                    <td class="${isIncome ? "amount-positive" : "amount-negative"}">
                        ${isIncome ? "+" : "−"}${money(amount)}
                    </td>
                </tr>
            `;
        }).join("");

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    /* ---------- REFRESH DASHBOARD ---------- */

    function refreshDashboard() {
        updateSummary();
        renderTransactions();
        initialiseCashflowChart();
        initialiseSpendingChart();
    }

    /* ---------- TRANSACTION MODAL ---------- */

    function openModal() {
        const modal = $("#transactionModal");

        if (!modal) return;

        modal.hidden = false;
        document.body.style.overflow = "hidden";

        const dateInput = $("#transactionDate");

        if (dateInput) {
            dateInput.value = today();
        }

        $("#transactionTitle")?.focus();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function closeModal() {
        const modal = $("#transactionModal");

        if (!modal) return;

        modal.hidden = true;
        document.body.style.overflow = "";
        $("#addTransactionBtn")?.focus();
    }

    function saveTransactions() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(transactions)
            );

            return true;
        } catch (error) {
            console.error("Could not save transactions:", error);
            return false;
        }
    }

    function handleTransactionSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const title = String(formData.get("title") || "").trim();
        const type = String(formData.get("type") || "");
        const category = String(formData.get("category") || "Other");
        const amount = Number(formData.get("amount"));
        const date = String(formData.get("date") || "");

        if (
            !title ||
            !["income", "expense"].includes(type) ||
            !Number.isFinite(amount) ||
            amount <= 0 ||
            !date
        ) {
            $("#transactionMessage").textContent =
                "Please enter valid transaction details.";
            return;
        }

        const transaction = {
            id: `txn-${Date.now()}`,
            title,
            description: category,
            type,
            category,
            amount,
            date
        };

        transactions.unshift(transaction);

        if (!saveTransactions()) {
            transactions.shift();

            $("#transactionMessage").textContent =
                "Unable to save. Please check your browser storage settings.";

            return;
        }

        form.reset();

        const message = $("#transactionMessage");

        if (message) {
            message.textContent = "Transaction saved successfully.";
        }

        refreshDashboard();

        window.setTimeout(() => {
            closeModal();

            if (message) {
                message.textContent = "";
            }
        }, 700);
    }

    function initialiseModal() {
        $("#addTransactionBtn")?.addEventListener("click", openModal);
        $("#closeModalBtn")?.addEventListener("click", closeModal);
        $("#cancelModalBtn")?.addEventListener("click", closeModal);

        $("#transactionModal")?.addEventListener("click", (event) => {
            if (event.target === event.currentTarget) {
                closeModal();
            }
        });

        $("#transactionForm")?.addEventListener(
            "submit",
            handleTransactionSubmit
        );

        document.addEventListener("keydown", (event) => {
            if (
                event.key === "Escape" &&
                $("#transactionModal") &&
                !$("#transactionModal").hidden
            ) {
                closeModal();
            }
        });

        const dateInput = $("#transactionDate");

        if (dateInput) {
            dateInput.value = today();
            dateInput.max = today();
        }
    }

    /* ---------- SIDEBAR ---------- */

    function initialiseSidebar() {
        const sidebar = $("#sidebar");
        const toggle = $("#menuToggle");

        if (!sidebar || !toggle) return;

        toggle.addEventListener("click", () => {
            const isOpen = sidebar.classList.toggle("open");

            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute(
                "aria-label",
                isOpen ? "Close navigation" : "Open navigation"
            );
        });

        document.addEventListener("click", (event) => {
            if (
                window.innerWidth <= 900 &&
                sidebar.classList.contains("open") &&
                !sidebar.contains(event.target) &&
                !toggle.contains(event.target)
            ) {
                sidebar.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                sidebar.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
            }
        });
    }

    /* ---------- THEME TOGGLE ---------- */

    function initialiseTheme() {
        const toggle = $("#themeToggle");

        if (!toggle) return;

        let savedTheme = "light";

        try {
            savedTheme = localStorage.getItem("finoraTheme") || "light";
        } catch {
            // Continue with light mode.
        }

        function applyTheme(theme) {
            const isDark = theme === "dark";

            document.documentElement.dataset.theme = isDark
                ? "dark"
                : "light";

            toggle.innerHTML = isDark
                ? '<i data-lucide="sun"></i>'
                : '<i data-lucide="moon"></i>';

            toggle.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );

            if (window.lucide) {
                window.lucide.createIcons();
            }

            if (cashflowChart) {
                cashflowChart.update();
            }

            if (spendingChart) {
                spendingChart.update();
            }
        }

        applyTheme(savedTheme);

        toggle.addEventListener("click", () => {
            const nextTheme =
                document.documentElement.dataset.theme === "dark"
                    ? "light"
                    : "dark";

            applyTheme(nextTheme);

            try {
                localStorage.setItem("finoraTheme", nextTheme);
            } catch {
                // Theme still works for the current page.
            }
        });
    }

    /* ---------- INITIALISE ---------- */

    function initialiseDashboard() {
        initialiseUser();
        initialiseDate();
        initialiseSidebar();
        initialiseTheme();
        initialiseModal();

        $("#cashflowPeriod")?.addEventListener(
            "change",
            initialiseCashflowChart
        );

        refreshDashboard();

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initialiseDashboard,
            { once: true }
        );
    } else {
        initialiseDashboard();
    }
})();
