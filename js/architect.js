// js/architect.js

document.addEventListener('DOMContentLoaded', () => {
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        newsList: document.getElementById('architect-news-list'),
        refreshBtn: document.getElementById('refresh-btn'),
        alertContainer: document.getElementById('alert-container'),
    };

    function renderLayout() {
        dom.header.innerHTML = createHeader('Thi tuyển kiến trúc');
        dom.navbar.innerHTML = createNavbar('architect');
        initializeAuthUI();
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });
    }

    function createNewsCard(article) {
        return `
            <div class="col-md-6 col-lg-4 col-xl-3">
                <div class="card h-100 shadow-sm position-relative article-card">
                    <span class="news-source-badge">${article.source}</span>
                    <a href="${article.link}" target="_blank">
                        <img src="${article.image_url}" class="card-img-top news-card-img" alt="Thumbnail" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                    </a>
                    <div class="card-body d-flex flex-column">
                        <h6 class="card-title mb-2">
                            <a href="${article.link}" target="_blank" class="text-decoration-none text-dark fw-bold hover-primary">
                                ${article.title}
                            </a>
                        </h6>
                        <div class="mt-auto pt-2 border-top">
                            <small class="text-muted">
                                <i class="bi bi-clock me-1"></i>${formatDate(article.published_date)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async function fetchNews() {
        dom.newsList.innerHTML = `
            <div class="col-12 text-center p-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Đang lấy dữ liệu từ Google và phân tích hình ảnh...</p>
            </div>`;
            
        try {
            const result = await apiService.fetchArchitectNews();
            
            if (result.success && result.data && result.data.length > 0) {
                dom.newsList.innerHTML = result.data.map(createNewsCard).join('');
            } else {
                dom.newsList.innerHTML = `<div class="col-12 alert alert-info text-center">Không tìm thấy bài viết nào.</div>`;
            }
        } catch (error) {
            console.error(error);
            dom.alertContainer.innerHTML = `<div class="alert alert-danger">Lỗi tải dữ liệu: ${error.message}</div>`;
            dom.newsList.innerHTML = '';
        }
    }

    // Event Listeners
    dom.refreshBtn.addEventListener('click', fetchNews);

    // Init
    renderLayout();
    fetchNews();
});