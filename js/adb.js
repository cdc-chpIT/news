document.addEventListener('DOMContentLoaded', () => {
    // === STATE ===
    let allProjects = []; // Biến để lưu trữ TẤT CẢ dự án từ RSS
    let currentPage = 1;
    const pageSize = 10; // Số dự án mỗi trang theo yêu cầu của bạn

    // === DOM ELEMENTS ===
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        alertContainer: document.getElementById('alert-container'),
        resultsContainer: document.getElementById('adb-results-container'),
        paginationContainer: document.getElementById('pagination-container'),
    };

    // === RENDER FUNCTIONS ===
    function renderLayout() {
        dom.header.innerHTML = createHeader('ADB Projects');
        dom.navbar.innerHTML = createNavbar('adb');
        initializeAuthUI();
    }

    function showAlert(message, type = 'danger') {
        dom.alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
    }

    function getStatusBadge(status) {
        const statusLower = status.toLowerCase();
        if (statusLower.includes('proposed')) {
            return `<span class="badge bg-warning text-dark">${status}</span>`;
        }
        if (statusLower.includes('active') || statusLower.includes('approved')) {
            return `<span class="badge bg-success">${status}</span>`;
        }
        if (statusLower.includes('closed') || statusLower.includes('completed')) {
            return `<span class="badge bg-secondary">${status}</span>`;
        }
        return `<span class="badge bg-info">${status}</span>`;
    }

    // Hàm này chỉ render bảng, không còn logic phân trang
    function renderTable(projectsForPage) {
        if (!projectsForPage || projectsForPage.length === 0) {
            dom.resultsContainer.innerHTML = '<div class="alert alert-info">Không có dự án nào để hiển thị.</div>';
            return;
        }
        const headers = ['Tên dự án', 'Mã dự án', 'Năm phê duyệt', 'Trạng thái', 'Quốc gia', 'Lĩnh vực'];
        const headersHtml = headers.map(h => `<th scope="col">${h}</th>`).join('');
        const rowsHtml = projectsForPage.map(p => `
            <tr>
                <td><a href="${p.link}" target="_blank" rel="noopener noreferrer" title="Xem chi tiết dự án">${p.title}</a></td>
                <td class="text-center">${p.details['Project number'] || 'N/A'}</td>
                <td class="text-center">${p.details['Approval year'] || 'N/A'}</td>
                <td class="text-center">${getStatusBadge(p.details['Status'] || 'N/A')}</td>
                <td>${p.details['Countries'] || 'N/A'}</td>
                <td>${p.details['Sectors'] || 'N/A'}</td>
            </tr>
        `).join('');
        dom.resultsContainer.innerHTML = `
            <div class="table-responsive adb-table-container">
                <table class="table table-hover table-bordered">
                    <thead class="table-light">
                        <tr>${headersHtml}</tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    // Hàm mới để render một trang cụ thể
    function renderPage(pageNumber) {
        currentPage = pageNumber;
        
        const totalPages = Math.ceil(allProjects.length / pageSize);
        
        const start = (currentPage - 1) * pageSize;
        const end = start + pageSize;
        const projectsForPage = allProjects.slice(start, end);

        renderTable(projectsForPage);
        
        // Sử dụng component `createPagination` đã có
        dom.paginationContainer.innerHTML = createPagination({
            page: currentPage,
            pages: totalPages,
        });
    }

    async function fetchAndParseRss() {
        dom.resultsContainer.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>`;
        try {
            const rssString = await apiService.fetchAdbRssFeed();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rssString, "application/xml");
            const parseError = xmlDoc.querySelector("parsererror");
            if (parseError) throw new Error("Không thể phân tích dữ liệu RSS.");

            const items = xmlDoc.querySelectorAll("item");
            return Array.from(items).map(item => {
                const categoryText = item.querySelector("category")?.textContent || '';
                const details = {};
                categoryText.split('|').forEach(part => {
                    const [key, ...valueParts] = part.split(':');
                    if (key && valueParts.length > 0) {
                        details[key.trim()] = valueParts.join(':').trim();
                    }
                });
                return {
                    title: item.querySelector("title")?.textContent || 'N/A',
                    link: item.querySelector("link")?.textContent || '#',
                    description: item.querySelector("description")?.textContent || '',
                    details: details,
                };
            });
        } catch (error) {
            showAlert(`Không thể tải dữ liệu dự án từ ADB. Lỗi: ${error.message}`, 'danger');
            return []; // Trả về mảng rỗng nếu có lỗi
        }
    }

    function setupEventListeners() {
        dom.paginationContainer.addEventListener('click', e => {
            const pageLink = e.target.closest('a.page-link');
            if (pageLink && pageLink.dataset.page) {
                e.preventDefault();
                const pageNum = parseInt(pageLink.dataset.page, 10);
                if (pageNum !== currentPage) {
                    renderPage(pageNum);
                }
            }
        });
    }

    async function initialize() {
        renderLayout();
        setupEventListeners();

        // Bước 1: Lấy TẤT CẢ dự án và lưu vào biến allProjects
        allProjects = await fetchAndParseRss();
        
        // Bước 2: Render trang đầu tiên
        renderPage(1);
    }

    initialize();
});