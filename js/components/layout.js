function createHeader(title) {
    return `
        <div class="bg-white p-3 shadow-sm border-bottom d-flex justify-content-between align-items-center">
            <h1 class="h4 mb-0">${title}</h1>
            <div class="d-flex align-items-center gap-3">
                <div id="auth-status-container"></div>
            </div>
        </div>
    `;
}

function createSidebar(activePage = 'dashboard') {
    const pages = [
        { id: 'dashboard', href: 'index.html', icon: 'bi-grid-fill', text: 'Dashboard' },
        { id: 'news', href: 'news.html', icon: 'bi-newspaper', text: 'Tin Tức' },
        { id: 'scraper', href: 'scraper.html', icon: 'bi-funnel-fill', text: 'Mua sắm công' },
        { id: 'keywords', href: 'keywords.html', icon: 'bi-tags-fill', text: 'Quản lý Từ khóa' },
        { id: 'categories', href: 'categories.html', icon: 'bi-bookmark-fill', text: 'Quản lý Danh mục' },
        { id: 'sources', href: 'sources.html', icon: 'bi-newspaper', text: 'Quản lý Nguồn tin' },
    ];

    const links = pages.map(page => `
        <li class="nav-item">
            <a href="${page.href}" class="nav-link ${page.id === activePage ? 'active' : ''}">
                <i class="bi ${page.icon} me-2"></i>
                ${page.text}
            </a>
        </li>
    `).join('');

    return `
        <div class="main-sidebar d-flex flex-column flex-shrink-0 p-3 bg-light">
            <a href="/" class="d-flex align-items-center justify-content-center mb-3 mb-md-0 link-dark text-decoration-none">
                <img src="images/CHP_Logo.png" alt="Logo" style="width: 100px; height: 60px;">
            </a>
            <hr>
            <ul class="nav nav-pills flex-column mb-auto">
                ${links}
            </ul>
            <hr>

        </div>
    `;
}