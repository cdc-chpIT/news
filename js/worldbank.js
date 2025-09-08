// worldbank.js
document.addEventListener('DOMContentLoaded', () => {
    // === STATE (đã đơn giản hóa) ===
    let state = {
        currentPage: 1,
        pageSize: 20,
    };
    
    // === DOM ELEMENTS ===
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        alertContainer: document.getElementById('alert-container'),
        resultsContainer: document.getElementById('wb-results-container'),
        paginationContainer: document.getElementById('pagination-container'),
    };

    // === RENDER FUNCTIONS ===
    function renderLayout() {
        dom.header.innerHTML = createHeader('World Bank Projects');
        dom.navbar.innerHTML = createNavbar('worldbank');
        initializeAuthUI();
    }
    
    function renderTable(projects, total) {
        if (!projects || projects.length === 0) {
            dom.resultsContainer.innerHTML = '<div class="alert alert-info text-center">Không tìm thấy dự án nào.</div>';
            return;
        }

        const headers = ['Project Title', 'Country', 'Project ID', 'Commitment Amount', 'Status', 'Approval Date', 'Last updated Date', 'Last Stage Reached'];
        const headersHtml = headers.map(h => `<th>${h}</th>`).join('');

        const rowsHtml = projects.map(p => {
            const approvalDate = p.boardapprovaldate ? new Date(p.boardapprovaldate).toLocaleDateString('en-GB') : 'N/A';
            const lastUpdatedDate = p.proj_last_upd_date ? new Date(p.proj_last_upd_date).toLocaleDateString('en-GB') : 'N/A';
            
            const totalAmountValue = parseFloat(p.totalamt) || 0;
            const grantAmountValue = parseFloat(p.grantamt) || 0;
            const totalCommitment = totalAmountValue + grantAmountValue;
            
            const commitmentAmount = totalCommitment > 0 ? `$${totalCommitment.toLocaleString('en-US')}` : 'N/A';
            const projectStatus = p.projectstatusdisplay || p.status || 'N/A';

            return `
                <tr>
                    <td><a href="https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}" target="_blank" rel="noopener noreferrer">${p.project_name || 'N/A'}</a></td>
                    <td>${p.countryshortname || 'N/A'}</td>
                    <td>${p.id || 'N/A'}</td>
                    <td>${commitmentAmount}</td>
                    <td>${projectStatus}</td>
                    <td>${approvalDate}</td>
                    <td>${lastUpdatedDate}</td>
                    <td>${p.last_stage_reached_name || 'N/A'}</td>
                </tr>
            `;
        }).join('');

        const startItem = (state.currentPage - 1) * state.pageSize + 1;
        const endItem = startItem + projects.length - 1;

        dom.resultsContainer.innerHTML = `
             <p class="text-muted small">Showing ${startItem} - ${endItem} of ${total.toLocaleString('en-US')} projects</p>
            <div class="table-responsive">
                <table class="table table-hover table-bordered">
                    <thead class="table-light"><tr>${headersHtml}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
    }

    async function fetchAndRender() {
        dom.resultsContainer.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>`;
        dom.paginationContainer.innerHTML = '';

        // SỬA LỖI: Xóa các tham số filter
        const params = {
            page: state.currentPage,
            size: state.pageSize,
        };
        
        try {
            const result = await apiService.fetchWorldBankProjects(params);
            const projects = Object.values(result.projects || {}); 
            const totalProjects = result.total || 0;

            renderTable(projects, totalProjects);
            
            const totalPages = Math.ceil(totalProjects / state.pageSize);
            dom.paginationContainer.innerHTML = createPagination({ page: state.currentPage, pages: totalPages });

        } catch (error) {
            dom.alertContainer.innerHTML = `<div class="alert alert-danger" role="alert">Lỗi tải dữ liệu từ World Bank: ${error.message}</div>`;
            dom.resultsContainer.innerHTML = '<div class="alert alert-danger text-center">Không thể tải dữ liệu. Vui lòng thử lại.</div>';
        }
    }

    function setupEventListeners() {
        // Chỉ giữ lại event listener cho phân trang
        dom.paginationContainer.addEventListener('click', e => {
            const pageLink = e.target.closest('a.page-link');
            if (pageLink && pageLink.dataset.page) {
                e.preventDefault();
                const newPage = parseInt(pageLink.dataset.page, 10);
                if (newPage !== state.currentPage) {
                    state.currentPage = newPage;
                    window.scrollTo(0, 0);
                    fetchAndRender();
                }
            }
        });
    }

    async function initialize() {
        renderLayout();
        setupEventListeners();
        await fetchAndRender(); 
    }

    initialize();
});