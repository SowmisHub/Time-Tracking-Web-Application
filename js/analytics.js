// analytics.js
// ============================================
// Analytics Dashboard
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // Elements
    const analyticsDate = document.getElementById("analyticsDate");
    const analyticsContent = document.getElementById("analyticsContent");
    const emptyAnalytics = document.getElementById("emptyAnalytics");
    const loadingAnalytics = document.getElementById("loadingAnalytics");

    // visible navbar username + initial (may or may not exist depending on markup)
    const navUserName = document.getElementById("navUserName");
    const navUserInitial = document.getElementById("navUserInitial");

    // sidebar elements (profile.js will inject these)
    const sidebarUserName = document.getElementById("sidebarUserName");
    const sidebarUserEmail = document.getElementById("sidebarUserEmail");
    const sidebarUserInitial = document.getElementById("sidebarUserInitial");

    const logoutBtn = document.getElementById("logoutBtn");
    // guard: sidebarLogout may be injected by profile.js (id now 'sidebarLogout')
    const sidebarLogout = document.getElementById("sidebarLogout");

    // Summary
    const totalHours = document.getElementById("totalHours");
    const totalActivities = document.getElementById("totalActivities");
    const topCategory = document.getElementById("topCategory");
    const avgDuration = document.getElementById("avgDuration");

    const categoryList = document.getElementById("categoryList");

    let pieChart = null;
    let barChart = null;

    let currentDate = Utils.getTodayDate();
    let activities = [];

    // check date from URL
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");
    if (dateParam) currentDate = dateParam;

    // INIT
    init();

    function init() {
        auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "index.html";
                return;
            }

            // ---- set username everywhere if elements exist ----
            const name = user.displayName || (user.email ? user.email.split("@")[0] : "User");
            const initial = name ? name.charAt(0).toUpperCase() : "U";
            const email = user.email || "";

            if (navUserName) navUserName.textContent = name;
            if (navUserInitial) navUserInitial.textContent = initial;

            if (sidebarUserName) sidebarUserName.textContent = name;
            if (sidebarUserEmail) sidebarUserEmail.textContent = email;
            if (sidebarUserInitial) sidebarUserInitial.textContent = initial;
            // ------------------------------

            if (analyticsDate) {
                analyticsDate.value = currentDate;
                analyticsDate.max = Utils.getTodayDate();
            }

            loadAnalytics();
        });
    }

    async function loadAnalytics() {
        showLoading(true);

        try {
            activities = await DB.getActivities(currentDate) || [];

            if (!Array.isArray(activities) || activities.length === 0) {
                showEmptyState();
            } else {
                renderAnalytics();
            }

        } catch (err) {
            console.error("Error loading analytics", err);
            showEmptyState();
        }

        showLoading(false);
    }

    function showLoading(show) {
        if (!loadingAnalytics || !analyticsContent || !emptyAnalytics) return;
        if (show) {
            loadingAnalytics.classList.remove("hidden");
            analyticsContent.classList.add("hidden");
            emptyAnalytics.classList.add("hidden");
        } else {
            loadingAnalytics.classList.add("hidden");
        }
    }

    function showEmptyState() {
        if (!emptyAnalytics || !analyticsContent) return;
        emptyAnalytics.classList.remove("hidden");
        analyticsContent.classList.add("hidden");
    }

    function renderAnalytics() {
        if (analyticsContent) analyticsContent.classList.remove("hidden");
        if (emptyAnalytics) emptyAnalytics.classList.add("hidden");

        updateSummary();
        renderCharts();
        renderCategoryBreakdown();
    }

    function updateSummary() {
        const total = activities.reduce((sum, a) => sum + (a.duration || 0), 0);

        if (totalHours) totalHours.textContent = Utils.formatDuration(total);
        if (totalActivities) totalActivities.textContent = activities.length;

        const categoryTotals = getCategoryTotals();
        const topCat = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])[0];

        if (topCategory) topCategory.textContent = topCat
            ? `${Utils.getCategoryEmoji(topCat[0])} ${topCat[0]}`
            : "-";

        const avg = activities.length ? Math.round(total / activities.length) : 0;
        if (avgDuration) avgDuration.textContent = Utils.formatDuration(avg);
    }

    function getCategoryTotals() {
        return activities.reduce((acc, act) => {
            const cat = act.category || 'Others';
            acc[cat] = (acc[cat] || 0) + (act.duration || 0);
            return acc;
        }, {});
    }

    function renderCharts() {
        try {
            renderPieChart();
            renderBarChart();
        } catch (err) {
            console.error('chart render error', err);
        }
    }

    function renderPieChart() {
        const canvas = document.getElementById("pieChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const totals = getCategoryTotals();

        const labels = Object.keys(totals);
        const data = Object.values(totals);
        const colors = labels.map((c) => Utils.getCategoryColor(c));

        if (pieChart) pieChart.destroy();

        pieChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: colors,
                        borderColor: "#fff",
                        borderWidth: 3,
                        hoverOffset: 10,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                    legend: { position: "bottom" },
                },
            },
        });
    }

    function renderBarChart() {
        const canvas = document.getElementById("barChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        const labels = activities.map((a) =>
            a.name ? (a.name.length > 15 ? a.name.substring(0, 15) + "..." : a.name) : "Untitled"
        );
        const data = activities.map((a) => a.duration || 0);
        const colors = activities.map((a) => Utils.getCategoryColor(a.category || 'Others'));

        if (barChart) barChart.destroy();

        barChart = new Chart(ctx, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        data,
                        backgroundColor: colors.map((c) => c + "88"),
                        borderColor: colors,
                        borderWidth: 2,
                        borderRadius: 8,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: activities.length > 6 ? "y" : "x",
                plugins: { legend: { display: false } },
            },
        });
    }

    function renderCategoryBreakdown() {
        const totals = getCategoryTotals();
        const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);

        if (!categoryList) return;
        categoryList.innerHTML = sorted
            .map(
                ([cat, dur]) => `
            <div class="category-item">
                <span class="category-dot" style="background-color:${Utils.getCategoryColor(cat)}"></span>
                <span class="category-name">${Utils.getCategoryEmoji(cat)} ${cat}</span>
                <span class="category-duration">${Utils.formatDuration(dur)}</span>
            </div>
        `
            )
            .join("");
    }

    // Events
    analyticsDate?.addEventListener("change", (e) => {
        currentDate = e.target.value;
        window.history.replaceState({}, "", `analytics.html?date=${currentDate}`);
        loadAnalytics();
    });

    // logout buttons: guard their existence before adding listeners
    if (logoutBtn) logoutBtn.addEventListener("click", () => auth.signOut());
    if (sidebarLogout) sidebarLogout.addEventListener("click", () => auth.signOut());
});
