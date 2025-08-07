// updated file: cdc-chpit/news/news-91ffb72db5ca0a8bb43a3078e9c3d4f3a9879c66/js/components/layout.js
function createHeader(title) {
    return `
        <div class="top-header p-2 shadow-sm d-flex justify-content-between align-items-center">
            <a href="index.html" class="logo-link d-flex align-items-center text-decoration-none text-white">
                <img src="images/CHP_Logo.png" alt="CHP Logo" style="height: 80px; width:140px; margin-right: 15px;">
            </a>
            <div class="flex-grow-1 text-center">
                <h1 class="h4 mb-0 fw-bold text-uppercase text-white">${title}</h1>
            </div>
            <div id="auth-status-container"></div>
        </div>
    `;
}

function createNavbar(activePage = 'dashboard') {
    const currentUser = getCurrentUser();
    const adminEmail = 'cdc@chp-holdings.com';
    const isAdmin = currentUser && currentUser.email === adminEmail;

    const allPages = [
        { id: 'dashboard', href: 'index.html', text: 'Dashboard' },
        { id: 'news', href: 'news.html', text: 'Tin Tức' },
        { id: 'scraper', href: 'scraper.html', text: 'Mua sắm công' },
        { id: 'keywords', href: 'keywords.html', text: 'Quản lý Từ khóa', adminOnly: true },
        { id: 'categories', href: 'categories.html', text: 'Quản lý Danh mục', adminOnly: true },
        { id: 'sources', href: 'sources.html', text: 'Quản lý Nguồn tin', adminOnly: true },
    ];
    
    const visiblePages = allPages.filter(page => !page.adminOnly || isAdmin);

    const links = visiblePages.map(page => `
        <li class="nav-item">
            <a href="${page.href}" class="nav-link px-3 py-2 ${page.id === activePage ? 'active' : ''}">
                ${page.text}
            </a>
        </li>
    `).join('');

    return `
        <div class="main-navbar">
            <ul class="nav">
                ${links}
            </ul>
        </div>
    `;
}