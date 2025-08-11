// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        alertContainer: document.getElementById('alert-container'),
        statsContainer: document.getElementById('stats-container'),
        sentimentOverTimeCanvas: document.getElementById('sentimentOverTimeChart'),
        sentimentDistributionCanvas: document.getElementById('sentimentDistributionChart'),
        topCategoriesCanvas: document.getElementById('topCategoriesChart'),
        topKeywordsCanvas: document.getElementById('topKeywordsChart'),
        sentimentPeriodBtns: document.querySelectorAll('.sentiment-period-btn'),
        topCategoriesLimitSelect: document.getElementById('topCategoriesLimitSelect'),
        topKeywordsLimitSelect: document.getElementById('topKeywordsLimitSelect'),
        crawlBtn: document.getElementById('crawl-articles-btn'), // Cập nhật để sử dụng crawlBtn
        sendEmailBtn: document.getElementById('send-email-btn'),
    };

    let sentimentOverTimeChart, topCategoriesChart, topKeywordsChart, sentimentDistributionChart;

    // === CRAWL STATE MANAGEMENT ===
    const CRAWL_STATE_KEY = 'crawl_status';
    const CRAWL_TIMEOUT_MS = 5 * 60 * 1000; // 5 phút

    function manageCrawlButtonState() {
        if (!dom.crawlBtn) return;

        const originalHtml = `<i class="bi bi-arrow-clockwise me-2"></i>Cập nhật dữ liệu`;
        const loadingHtml = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang xử lý...`;

        try {
            const crawlStatusStr = sessionStorage.getItem(CRAWL_STATE_KEY);
            if (!crawlStatusStr) {
                dom.crawlBtn.disabled = false;
                dom.crawlBtn.innerHTML = originalHtml;
                return;
            }

            const crawlStatus = JSON.parse(crawlStatusStr);
            const elapsedTime = Date.now() - crawlStatus.startTime;

            if (crawlStatus.active && elapsedTime < CRAWL_TIMEOUT_MS) {
                dom.crawlBtn.disabled = true;
                dom.crawlBtn.innerHTML = loadingHtml;
            } else {
                sessionStorage.removeItem(CRAWL_STATE_KEY);
                dom.crawlBtn.disabled = false;
                dom.crawlBtn.innerHTML = originalHtml;
                if (crawlStatus.active) {
                    showAlert('Quá trình cập nhật trước đó đã hoàn tất.', 'info');
                }
            }
        } catch (error) {
            console.error('Lỗi quản lý trạng thái nút crawl:', error);
            sessionStorage.removeItem(CRAWL_STATE_KEY);
            dom.crawlBtn.disabled = false;
            dom.crawlBtn.innerHTML = originalHtml;
        }
    }


    // === RENDER FUNCTIONS ===

    function showAlert(message, type = 'success') {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        dom.alertContainer.innerHTML = alertHtml;
    }

    function renderLayout() {
        dom.header.innerHTML = createHeader('Dashboard');
        dom.navbar.innerHTML = createNavbar('dashboard'); 
        initializeAuthUI(); 

    }

    function renderStatsCards(stats) {
        const statCards = [
            { title: 'Tổng số bài viết', value: stats.total_articles, icon: 'bi-file-earmark-text-fill', color: 'primary' },
            { title: 'Bài viết hôm nay', value: stats.articles_today, icon: 'bi-calendar-event-fill', color: 'info' },
            { title: 'Tổng số nguồn tin', value: stats.total_sources, icon: 'bi-newspaper', color: 'success' },
            { title: 'Tổng số danh mục', value: stats.total_categories, icon: 'bi-bookmark-star-fill', color: 'warning' },
        ];

        dom.statsContainer.innerHTML = statCards.map(card => `
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card stat-card shadow-sm h-100">
                    <div class="card-body">
                        <div>
                            <div class="stat-card-title text-uppercase">${card.title}</div>
                            <div class="stat-card-value">${card.value.toLocaleString('vi-VN')}</div>
                        </div>
                        <i class="bi ${card.icon} stat-card-icon text-${card.color}"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function renderSentimentDistributionChart(distribution) {
        if (!dom.sentimentDistributionCanvas) return;
        
        if (sentimentDistributionChart) {
            sentimentDistributionChart.destroy();
        }
        
        sentimentDistributionChart = new Chart(dom.sentimentDistributionCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Tích cực', 'Tiêu cực', 'Trung tính'],
                datasets: [{
                    label: 'Phân bổ sắc thái',
                    data: [distribution.positive, distribution.negative, distribution.neutral],
                    backgroundColor: ['#198754', '#dc3545', '#6c757d'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Phân bổ sắc thái', font: { size: 16 } }
                }
            }
        });
    }

    function renderTopCategoriesChart(categories) {
        if (!dom.topCategoriesCanvas || !categories) return; 
        if (topCategoriesChart) {
            topCategoriesChart.destroy();
        }
        topCategoriesChart = new Chart(dom.topCategoriesCanvas, {
            type: 'bar',
            data: {
                labels: categories.map(c => c.category_name),
                datasets: [{
                    label: 'Số bài viết',
                    data: categories.map(c => c.article_count),
                    backgroundColor: 'rgba(13, 110, 253, 0.7)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: `Top ${categories.length} Danh mục`, font: { size: 16 } }
                },
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    function renderTopKeywordsChart(keywords) {
        if (!dom.topKeywordsCanvas || !keywords) return;
        if (topKeywordsChart) {
            topKeywordsChart.destroy();
        }
        topKeywordsChart = new Chart(dom.topKeywordsCanvas, {
            type: 'bar',
            data: {
                labels: keywords.map(k => k.keyword_text),
                datasets: [{
                    label: 'Số bài viết',
                    data: keywords.map(k => k.article_count),
                    backgroundColor: 'rgba(25, 135, 84, 0.7)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: `Top ${keywords.length} Từ khóa`, font: { size: 16 } }
                },
                scales: { x: { beginAtZero: true } }
            }
        });
    }

    // === DATA FETCH AND UPDATE LOGIC ===
    async function refreshAllData() {
        try {
            const [stats, distribution] = await Promise.all([
                apiService.fetchDashboardStats(),
                apiService.fetchSentimentDistribution()
            ]);

            renderStatsCards(stats);
            renderSentimentDistributionChart(distribution);

            updateSentimentOverTimeChart(document.querySelector('.sentiment-period-btn.active').dataset.period);
            updateTopCategories(dom.topCategoriesLimitSelect.value);
            updateTopKeywords(dom.topKeywordsLimitSelect.value);

        } catch (error) {
            showAlert(`Lỗi khi làm mới dữ liệu: ${error.message}`, 'danger');
        }
    }


    async function updateSentimentOverTimeChart(period = 'day') {
        try {
            const data = await apiService.fetchSentimentOverTime(period);
            const chartData = {
                labels: data.map(d => new Date(d.date).toLocaleDateString('vi-VN')),
                datasets: [
                    { label: 'Tích cực', data: data.map(d => d.positive), borderColor: '#198754', tension: 0.1, fill: false },
                    { label: 'Tiêu cực', data: data.map(d => d.negative), borderColor: '#dc3545', tension: 0.1, fill: false },
                    { label: 'Trung tính', data: data.map(d => d.neutral), borderColor: '#6c757d', tension: 0.1, fill: false }
                ]
            };

            if (sentimentOverTimeChart) {
                sentimentOverTimeChart.data = chartData;
                sentimentOverTimeChart.update();
            } else {
                sentimentOverTimeChart = new Chart(dom.sentimentOverTimeCanvas, {
                    type: 'line', data: chartData,
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'top' },
                            title: { display: true, text: 'Biến động sắc thái theo thời gian', font: { size: 16 } }
                        },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }
            dom.sentimentPeriodBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.period === period));
        } catch (error) {
            console.error(`Lỗi tải dữ liệu sắc thái theo thời gian cho kỳ ${period}:`, error);
        }
    }

    async function updateTopCategories(limit) {
        try {
            const categories = await apiService.fetchTopCategories(limit);
            renderTopCategoriesChart(categories);
        } catch (error) {
            console.error('Không thể cập nhật biểu đồ danh mục hàng đầu:', error);
        }
    }

    async function updateTopKeywords(limit) {
         try {
            const keywords = await apiService.fetchTopKeywords(limit);
            renderTopKeywordsChart(keywords);
        } catch (error) {
            console.error('Không thể cập nhật biểu đồ từ khóa hàng đầu:', error);
        }
    }


    // === EVENT LISTENERS ===
    function setupEventListeners() {
        dom.sentimentPeriodBtns.forEach(button => {
            button.addEventListener('click', () => {
                updateSentimentOverTimeChart(button.dataset.period);
            });
        });

        dom.topCategoriesLimitSelect.addEventListener('change', (e) => {
            updateTopCategories(e.target.value);
        });

        dom.topKeywordsLimitSelect.addEventListener('change', (e) => {
            updateTopKeywords(e.target.value);
        });
        
        if (dom.crawlBtn) {
            dom.crawlBtn.addEventListener('click', async () => {
                const crawlStatus = {
                    active: true,
                    startTime: Date.now()
                };
                sessionStorage.setItem(CRAWL_STATE_KEY, JSON.stringify(crawlStatus));
                manageCrawlButtonState();

                try {
                    const result = await apiService.crawlArticles();
                    showAlert(result.message || 'Yêu cầu cập nhật đã được gửi. Trang sẽ tự động làm mới sau một vài phút.', 'success');
                } catch (error) {
                    showAlert(error.message, 'danger');
                    sessionStorage.removeItem(CRAWL_STATE_KEY);
                    manageCrawlButtonState();
                }
            });
        }
        if (dom.sendEmailBtn) {
            dom.sendEmailBtn.addEventListener('click', async () => {
                const originalHtml = dom.sendEmailBtn.innerHTML;
                dom.sendEmailBtn.disabled = true;
                dom.sendEmailBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Đang tổng hợp & gửi...`;

                try {
                    const result = await apiService.sendLatestArticlesByEmail();
                    showAlert(result.message || 'Yêu cầu gửi email đã được thực hiện.', 'success');
                } catch (error) {
                    showAlert(error.message, 'danger');
                } finally {
                    setTimeout(() => {
                        dom.sendEmailBtn.disabled = false;
                        dom.sendEmailBtn.innerHTML = originalHtml;
                    }, 3000);
                }
            });
        }
    }

    // === INITIALIZATION ===
    async function initialize() {
        renderLayout();
        manageCrawlButtonState(); // Kiểm tra trạng thái ban đầu khi tải trang
        setInterval(manageCrawlButtonState, 5000); // Kiểm tra định kỳ (để xử lý timeout)
        setupEventListeners();

        dom.statsContainer.innerHTML = '<div class="text-center p-5"><div class="spinner-border"></div></div>';
        
        try {
            const [stats, distribution] = await Promise.all([
                apiService.fetchDashboardStats(),
                apiService.fetchSentimentDistribution()
            ]);

            renderStatsCards(stats);
            renderSentimentDistributionChart(distribution);

            updateSentimentOverTimeChart('day');
            updateTopCategories(dom.topCategoriesLimitSelect.value);
            updateTopKeywords(dom.topKeywordsLimitSelect.value);

        } catch (error) {
             dom.statsContainer.innerHTML = '';
             showAlert(`Không thể tải dữ liệu dashboard. Vui lòng thử lại. Lỗi: ${error.message}`, 'danger');
             console.error("Khởi tạo dashboard thất bại:", error);
        }
    }

    initialize();
});