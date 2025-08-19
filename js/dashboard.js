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
    const CRAWL_TIMEOUT_MS = 30 * 1000; // 30 giây
    const CRAWL_SCHEDULED_KEY = 'crawl_scheduled_status'; 
    const CRAWL_SCHEDULE_HOURS = [8, 12, 16];

    function manageCrawlButtonState() {
        if (!dom.crawlBtn) return;

        // Lấy các thẻ span tương ứng với từng trạng thái
        const defaultStateSpan = dom.crawlBtn.querySelector('.default-state');
        const loadingStateSpan = dom.crawlBtn.querySelector('.loading-state');
        if (!defaultStateSpan || !loadingStateSpan) return; // Thoát nếu không tìm thấy

        let crawlStatus = null;
        let isScheduledCrawlRunning = false;
        
        try {
            const crawlStatusStr = sessionStorage.getItem(CRAWL_STATE_KEY);
            if (crawlStatusStr) {
                crawlStatus = JSON.parse(crawlStatusStr);
            }
            const scheduledCrawlStatusStr = sessionStorage.getItem(CRAWL_SCHEDULED_KEY);
            if (scheduledCrawlStatusStr) {
                isScheduledCrawlRunning = JSON.parse(scheduledCrawlStatusStr).active;
            }
        } catch (error) {
            console.error('Lỗi khi đọc trạng thái crawl từ sessionStorage:', error);
            sessionStorage.removeItem(CRAWL_STATE_KEY);
            sessionStorage.removeItem(CRAWL_SCHEDULED_KEY);
            dom.crawlBtn.disabled = false;
            defaultStateSpan.classList.remove('d-none');
            loadingStateSpan.classList.add('d-none');
            return;
        }

        const isManualCrawlActive = crawlStatus && crawlStatus.active && (Date.now() - crawlStatus.startTime < CRAWL_TIMEOUT_MS);
        
        if (isManualCrawlActive || isScheduledCrawlRunning) {
            // Trạng thái ĐANG TẢI
            dom.crawlBtn.disabled = true;
            defaultStateSpan.classList.add('d-none');
            loadingStateSpan.classList.remove('d-none');
        } else {
            // Trạng thái MẶC ĐỊNH
            dom.crawlBtn.disabled = false;
            defaultStateSpan.classList.remove('d-none');
            loadingStateSpan.classList.add('d-none');
        }
        
        // Dọn dẹp trạng thái đã hết hạn
        if (crawlStatus && crawlStatus.active && (Date.now() - crawlStatus.startTime >= CRAWL_TIMEOUT_MS)) {
            sessionStorage.removeItem(CRAWL_STATE_KEY);
            showAlert('Quá trình cập nhật thủ công trước đó đã hoàn tất hoặc bị gián đoạn.', 'info');
        }
    }

    // Hàm mới để kiểm tra lịch tự động và cập nhật trạng thái
    function checkScheduledCrawl() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Kiểm tra xem giờ hiện tại có trùng với giờ chạy tác vụ tự động không
        const isScheduledHour = CRAWL_SCHEDULE_HOURS.includes(currentHour);
        const isScheduledMinute = now.getMinutes() >= 0 && now.getMinutes() <= 5; // Giả định tác vụ mất 5 phút để hoàn thành
        
        if (isScheduledHour && isScheduledMinute) {
            // Nếu trong khung giờ chạy, đặt cờ là đang chạy
            sessionStorage.setItem(CRAWL_SCHEDULED_KEY, JSON.stringify({ active: true }));
        } else {
            // Nếu không, xóa cờ
            sessionStorage.removeItem(CRAWL_SCHEDULED_KEY);
        }
        
        // Luôn gọi hàm quản lý trạng thái nút để cập nhật giao diện
        manageCrawlButtonState();
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
        { id: 'total-articles', title: 'Tổng số bài viết', value: stats.total_articles, icon: 'bi-file-earmark-text-fill', color: 'primary' },
        { id: 'articles-today', title: 'Bài viết hôm nay', value: stats.articles_today, icon: 'bi-calendar-event-fill', color: 'info' },
        { id: 'total-sources', title: 'Tổng số nguồn tin', value: stats.total_sources, icon: 'bi-newspaper', color: 'success' },
        { id: 'total-categories', title: 'Tổng số danh mục', value: stats.total_categories, icon: 'bi-bookmark-star-fill', color: 'warning' },
    ];

    // Hàm tiện ích để lấy ngày hôm nay theo định dạng YYYY-MM-DD
    const getTodayString = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

     dom.statsContainer.innerHTML = statCards.map(card => {
        const cardHtml = `
            <div class="card stat-card shadow-sm h-100">
                <div class="card-body">
                    <div>
                        <div class="stat-card-title text-uppercase">${card.title}</div>
                        <div class="stat-card-value">${card.value.toLocaleString('vi-VN')}</div>
                    </div>
                    <i class="bi ${card.icon} stat-card-icon text-${card.color}"></i>
                </div>
            </div>
        `;

        let cardWrapper;

        switch (card.id) {
            case 'total-articles':
                // Bọc thẻ "Tổng số bài viết" trong một link đến news.html
                cardWrapper = `<a href="news.html" class="text-decoration-none" title="Xem tất cả bài viết">${cardHtml}</a>`;
                break;
            
            case 'articles-today':
                if (card.value > 0) {
                    const today = getTodayString();
                    const url = `news.html?published_from=${today}`;
                    cardWrapper = `<a href="${url}" class="text-decoration-none" title="Xem các bài viết từ hôm nay">${cardHtml}</a>`;
                } else {
                    cardWrapper = cardHtml; // Không thể click nếu không có bài viết
                }
                break;

            default:
                // Các thẻ còn lại không có link
                cardWrapper = cardHtml;
                break;
        }

        return `<div class="col-xl-3 col-md-6 mb-4">${cardWrapper}</div>`;

    }).join('');
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
            // Thay đổi con trỏ chuột khi di vào thanh biểu đồ
            onHover: (event, chartElement) => {
                const canvas = event.native.target;
                canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            // Xử lý sự kiện click
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const clickedElementIndex = elements[0].index;
                    const clickedCategory = categories[clickedElementIndex];
                    if (clickedCategory) {
                        // Điều hướng sang trang tin tức với tham số category_id
                        window.location.href = `news.html?category_id=${clickedCategory.category_id}`;
                    }
                }
            },
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
                // Thay đổi con trỏ chuột khi di vào thanh biểu đồ để cho biết có thể click
                onHover: (event, chartElement) => {
                    const canvas = event.native.target;
                    canvas.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                // Xử lý sự kiện click
                onClick: (event, elements) => {
                    // `elements` là một mảng chứa các đối tượng được click
                    if (elements.length > 0) {
                        const clickedElementIndex = elements[0].index;
                        const clickedKeyword = keywords[clickedElementIndex];
                        
                        if (clickedKeyword) {
                            const keywordId = clickedKeyword.keyword_id;
                            const keywordText = encodeURIComponent(clickedKeyword.keyword_text);
                            
                            // Điều hướng sang trang tin tức với tham số lọc
                            window.location.href = `news.html?keyword_id=${keywordId}&keyword_text=${keywordText}`;
                        }
                    }
                },
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
                // Đặt trạng thái nút sang đang tải ngay lập tức
                const crawlStatus = { active: true, startTime: Date.now() };
                sessionStorage.setItem(CRAWL_STATE_KEY, JSON.stringify(crawlStatus));
                manageCrawlButtonState(); 

                showAlert('Đang yêu cầu cập nhật dữ liệu từ máy chủ. Quá trình này có thể mất vài phút...', 'info');

                try {
                    await apiService.crawlArticles();
                    showAlert('Dữ liệu đã được cập nhật thành công. Các số liệu trên trang sẽ được tự động làm mới.', 'success');
                    await refreshAllData();
                } catch (error) {
                    showAlert(`Cập nhật dữ liệu thất bại: ${error.message}`, 'danger');
                } finally {
                    sessionStorage.removeItem(CRAWL_STATE_KEY);
                    setTimeout(() => {
                        manageCrawlButtonState();
                    }, 500);
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
        checkScheduledCrawl();
        manageCrawlButtonState();
        setInterval(manageCrawlButtonState, 500);
        setupEventListeners();

        setInterval(checkScheduledCrawl, 30 * 1000); 
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