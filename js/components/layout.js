function createHeader(title) {
    // Tự động gọi hàm thiết lập Google Translate mỗi khi header được tạo
    setupGoogleTranslate();

    return `
        <div class="top-header p-2 shadow-sm d-flex justify-content-between align-items-center">
            <a href="index.html" class="logo-link d-flex align-items-center text-decoration-none text-white">
                <img src="images/CHP_Logo.png" alt="CHP Logo" style="height: 80px; width:140px; margin-right: 15px;">
            </a>

            <div class="header-title-center">
                <h1 class="h4 mb-0 fw-bold text-uppercase text-white">${title}</h1>
            </div>

            <div class="d-flex align-items-center">
                <div class="dropdown me-3">
                    <button class="btn dropdown-toggle" type="button" id="translate-dropdown-btn" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="bi bi-translate me-1"></i> 
                        <span id="translate-btn-text">Ngôn ngữ</span>
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="translate-dropdown-btn">
                        <li><a class="dropdown-item translate-option" href="#" data-lang="vi">Tiếng Việt</a></li>
                        <li><a class="dropdown-item translate-option" href="#" data-lang="en">English</a></li>
                        <li><a class="dropdown-item translate-option" href="#" data-lang="ja">日本語</a></li>
                    </ul>
                </div>
                
                <div id="google_translate_element" style="display: none;"></div>

                <div id="auth-status-container"></div>
            </div>
        </div>
    `;
}

/**
 * Tải và khởi tạo Google Translate Widget, đồng thời gắn sự kiện cho menu tùy chỉnh.
 * Hoạt động ổn định bằng cách ghi đè cookie.
 */
function setupGoogleTranslate() {
    const langMap = { 'vi': 'Tiếng Việt', 'en': 'English', 'ja': '日本語' };

    // Hàm đọc cookie để biết ngôn ngữ hiện tại
    const getCurrentLanguage = () => {
        const langCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
        if (langCookie) {
            const langValue = langCookie.split('/')[2];
            if (langMap[langValue]) {
                return langValue;
            }
        }
        return 'vi';
    };

    // Hàm cập nhật tên trên nút
    const updateTranslateButtonText = () => {
        const currentLang = getCurrentLanguage();
        const btnTextEl = document.getElementById('translate-btn-text');
        if (btnTextEl) {
            btnTextEl.textContent = langMap[currentLang];
        }
    };

    /**
     * **HÀM QUAN TRỌNG NHẤT**: Thay đổi ngôn ngữ bằng cách trực tiếp
     * thiết lập cookie 'googtrans' và tải lại trang.
     * @param {string} lang - Mã ngôn ngữ (ví dụ: 'en', 'ja', 'vi').
     */
    const changeLanguage = (lang) => {
        // Đặt cookie cho domain gốc để nó hoạt động trên toàn trang.
        // Google sẽ đọc cookie này khi trang tải lại.
        document.cookie = `googtrans=/vi/${lang}; path=/;`;
        location.reload();
    };

    // Chỉ thêm script và sự kiện một lần
    if (!window.googleTranslateScriptLoaded) {
        // Khởi tạo widget (vẫn cần thiết để script của Google hoạt động)
        window.googleTranslateElementInit = function() {
            new google.translate.TranslateElement({
                pageLanguage: 'vi',
                includedLanguages: 'en,ja,vi',
            }, 'google_translate_element');
        };

        // Tải script của Google
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.body.appendChild(script);
        window.googleTranslateScriptLoaded = true;

        // Gắn sự kiện click vào document để bắt sự kiện trên các mục dropdown
        document.addEventListener('click', function(e) {
            const target = e.target.closest('.translate-option');
            if (target) {
                e.preventDefault();
                const langCode = target.getAttribute('data-lang');
                changeLanguage(langCode);
            }
        });
    }

    // Luôn cập nhật tên nút mỗi khi header được vẽ
    updateTranslateButtonText();
}
function createNavbar(activePage = 'dashboard') {
    const currentUser = getCurrentUser();
    const adminEmail = 'cdc@chp-holdings.com';
    const isAdmin = currentUser && currentUser.email === adminEmail;

    const allPages = [
        { id: 'dashboard', href: 'index.html', text: 'Dashboard' },
        { id: 'news', href: 'news.html', text: 'Tin Tức' },
        { id: 'scraper', href: 'scraper.html', text: 'Mua sắm công' },
        { id: 'adb', href: 'adb.html', text: 'ADB' }, 
        { id: 'worldbank', href: 'worldbank.html', text: 'World Bank' },
        { id: 'architect', href: 'architect.html', text: 'Thi tuyển kiến trúc' },
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