// File: js/worldbank.js
document.addEventListener('DOMContentLoaded', () => {
    // === STATE ===
    let state = {
        currentPage: 1,
        pageSize: 20,
        sortBy: 'boardapprovaldate',
        sortOrder: 'desc',
        filters: {
            searchTerm: '',
            countries: [],
            statuses: [],
            stages: [],
            approvalDateFrom: '',
            approvalDateTo: '',
            updatedDateFrom: '',
            updatedDateTo: ''
        }
    };
    
    let allProjects = [];
    let filteredProjects = [];
    let tomSelectInstances = {};

    // === DOM ELEMENTS ===
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        alertContainer: document.getElementById('alert-container'),
        resultsContainer: document.getElementById('wb-results-container'),
        paginationContainer: document.getElementById('pagination-container'),
        searchInput: document.getElementById('wb-search-input'),
        countryFilter: document.getElementById('wb-country-filter'),
        statusFilter: document.getElementById('wb-status-filter'),
        stageFilter: document.getElementById('wb-stage-filter'),
        approvalDateFrom: document.getElementById('wb-approval-date-from'),
        approvalDateTo: document.getElementById('wb-approval-date-to'),
        updatedDateFrom: document.getElementById('wb-updated-date-from'),
        updatedDateTo: document.getElementById('wb-updated-date-to'),
        clearFiltersBtn: document.getElementById('wb-clear-filters-btn')
    };
    
    const HEADERS_CONFIG = [
        { key: 'project_name', display: 'Project Title' },
        { key: 'countryshortname', display: 'Country' },
        { key: 'id', display: 'Project ID' },
        { key: 'totalcommamt', display: 'Commitment Amount' },
        { key: 'projectstatusdisplay', display: 'Status' },
        { key: 'boardapprovaldate', display: 'Approval Date' },
        { key: 'proj_last_upd_date', display: 'Last updated Date' },
        { key: 'last_stage_reached_name', display: 'Last Stage Reached' }
    ];

    // === RENDER FUNCTIONS ===
    function renderLayout() {
        dom.header.innerHTML = createHeader('World Bank Projects');
        dom.navbar.innerHTML = createNavbar('worldbank');
        initializeAuthUI();
    }
    
    function populateAndInitFilters() {
        const countries = [...new Set(allProjects.map(p => p.countryshortname).filter(Boolean))].sort();
        const statuses = [...new Set(allProjects.map(p => p.projectstatusdisplay || p.status).filter(Boolean))].sort();
        const stages = [...new Set(allProjects.map(p => p.last_stage_reached_name).filter(Boolean))].sort();

        const createOptions = arr => arr.map(item => `<option value="${item}">${item}</option>`).join('');
        
        if(dom.countryFilter) dom.countryFilter.innerHTML = createOptions(countries);
        if(dom.statusFilter) dom.statusFilter.innerHTML = createOptions(statuses);
        if(dom.stageFilter) dom.stageFilter.innerHTML = createOptions(stages);

        if(tomSelectInstances.countries) tomSelectInstances.countries.destroy();
        if(tomSelectInstances.statuses) tomSelectInstances.statuses.destroy();
        if(tomSelectInstances.stages) tomSelectInstances.stages.destroy();

        tomSelectInstances.countries = new TomSelect(dom.countryFilter, { plugins: ['remove_button'] });
        tomSelectInstances.statuses = new TomSelect(dom.statusFilter, { plugins: ['remove_button'] });
        tomSelectInstances.stages = new TomSelect(dom.stageFilter, { plugins: ['remove_button'] });

        tomSelectInstances.countries.on('change', (values) => {
            state.filters.countries = values;
            applyFiltersAndRender();
        });
        tomSelectInstances.statuses.on('change', (values) => {
            state.filters.statuses = values;
            applyFiltersAndRender();
        });
        tomSelectInstances.stages.on('change', (values) => {
            state.filters.stages = values;
            applyFiltersAndRender();
        });
    }

    function renderTable(projectsOnPage, totalFiltered) {
        if (!projectsOnPage || projectsOnPage.length === 0) {
            dom.resultsContainer.innerHTML = '<div class="alert alert-info text-center">Không tìm thấy dự án nào phù hợp với bộ lọc.</div>';
            return;
        }

        const headersHtml = HEADERS_CONFIG.map(h => {
            const isSorting = state.sortBy === h.key;
            const iconClass = isSorting ? (state.sortOrder === 'asc' ? 'bi-caret-up-fill sort-icon-active' : 'bi-caret-down-fill sort-icon-active') : 'bi-caret-down-fill sort-icon-default';
            return `<th class="sortable-header" data-sort-by="${h.key}" style="cursor: pointer;">${h.display}<i class="bi ${iconClass} sort-icon"></i></th>`;
        }).join('');

        const rowsHtml = projectsOnPage.map(p => {
            const approvalDate = p.boardapprovaldate ? new Date(p.boardapprovaldate).toLocaleDateString('en-GB') : 'N/A';
            const lastUpdatedDate = p.proj_last_upd_date ? new Date(p.proj_last_upd_date).toLocaleDateString('en-GB') : 'N/A';
            const totalAmountValue = parseFloat(p.totalamt) || 0;
            const grantAmountValue = parseFloat(p.grantamt) || 0;
            const totalCommitment = totalAmountValue + grantAmountValue;
            const commitmentAmount = totalCommitment > 0 ? `$${totalCommitment.toLocaleString('en-US')}` : 'N/A';
            const projectStatus = p.projectstatusdisplay || p.status || 'N/A';
            return `<tr><td><a href="https://projects.worldbank.org/en/projects-operations/project-detail/${p.id}" target="_blank" rel="noopener noreferrer">${p.project_name || 'N/A'}</a></td><td>${p.countryshortname || 'N/A'}</td><td>${p.id || 'N/A'}</td><td>${commitmentAmount}</td><td>${projectStatus}</td><td>${approvalDate}</td><td>${lastUpdatedDate}</td><td>${p.last_stage_reached_name || 'N/A'}</td></tr>`;
        }).join('');

        const startItem = (state.currentPage - 1) * state.pageSize + 1;
        const endItem = startItem + projectsOnPage.length - 1;

        dom.resultsContainer.innerHTML = `<p class="text-muted small">Hiển thị ${startItem} - ${endItem} của ${totalFiltered.toLocaleString('en-US')} dự án</p><div class="table-responsive"><table class="table table-hover table-bordered wb-table"><thead class="table-light"><tr>${headersHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
    }
    
    function applyFiltersAndRender() {
        const { searchTerm, countries, statuses, stages, approvalDateFrom, approvalDateTo, updatedDateFrom, updatedDateTo } = state.filters;
        
        let tempFiltered = [...allProjects];

        const approvalFrom = approvalDateFrom ? new Date(approvalDateFrom).setHours(0,0,0,0) : 0;
        const approvalTo = approvalDateTo ? new Date(approvalDateTo).setHours(23,59,59,999) : Infinity;
        const updatedFrom = updatedDateFrom ? new Date(updatedDateFrom).setHours(0,0,0,0) : 0;
        const updatedTo = updatedDateTo ? new Date(updatedDateTo).setHours(23,59,59,999) : Infinity;

        tempFiltered = tempFiltered.filter(p => {
            const searchMatch = !searchTerm || (p.project_name && p.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
            const countryMatch = countries.length === 0 || countries.includes(p.countryshortname);
            const statusMatch = statuses.length === 0 || statuses.includes(p.projectstatusdisplay || p.status);
            const stageMatch = stages.length === 0 || stages.includes(p.last_stage_reached_name);

            const approvalDate = p.boardapprovaldate ? new Date(p.boardapprovaldate).getTime() : 0;
            const approvalDateMatch = !p.boardapprovaldate || (approvalDate >= approvalFrom && approvalDate <= approvalTo);
            
            const updatedDate = p.proj_last_upd_date ? new Date(p.proj_last_upd_date).getTime() : 0;
            const updatedDateMatch = !p.proj_last_upd_date || (updatedDate >= updatedFrom && updatedDate <= updatedTo);

            return searchMatch && countryMatch && statusMatch && stageMatch && approvalDateMatch && updatedDateMatch;
        });

        filteredProjects = tempFiltered;
        state.currentPage = 1;
        sortAndRender();
    }

    function sortAndRender() {
        filteredProjects.sort((a, b) => {
            let valA = a[state.sortBy] || '';
            let valB = b[state.sortBy] || '';
            
            if (state.sortBy.includes('date')) {
                valA = valA ? new Date(valA).getTime() : 0;
                valB = valB ? new Date(valB).getTime() : 0;
            } else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
        renderCurrentPage();
    }

    function renderCurrentPage() {
        const start = (state.currentPage - 1) * state.pageSize;
        const end = start + state.pageSize;
        const projectsOnPage = filteredProjects.slice(start, end);
        
        renderTable(projectsOnPage, filteredProjects.length);
        
        const totalPages = Math.ceil(filteredProjects.length / state.pageSize);
        dom.paginationContainer.innerHTML = createPagination({ page: state.currentPage, pages: totalPages });
    }

    async function fetchInitialData() {
        dom.resultsContainer.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div><h5 class="mt-3">Đang tải dữ liệu...</h5><p class="text-muted">Quá trình này có thể mất một chút thời gian, vui lòng chờ.</p></div>`;
        dom.paginationContainer.innerHTML = '';
        
        try {
            const result = await apiService.fetchWorldBankProjects({ sort_by: 'boardapprovaldate', sort_order: 'desc' });
            allProjects = Object.values(result.projects || {});
            filteredProjects = [...allProjects];
            
            populateAndInitFilters();
            renderCurrentPage();
        } catch (error) {
            dom.alertContainer.innerHTML = `<div class="alert alert-danger" role="alert">Lỗi tải dữ liệu từ World Bank: ${error.message}</div>`;
            dom.resultsContainer.innerHTML = '<div class="alert alert-danger text-center">Không thể tải dữ liệu. Vui lòng thử lại.</div>';
        }
    }

    function setupEventListeners() {
        dom.paginationContainer.addEventListener('click', e => {
            const pageLink = e.target.closest('a.page-link');
            if (pageLink && pageLink.dataset.page && !pageLink.parentElement.classList.contains('disabled')) {
                e.preventDefault();
                state.currentPage = parseInt(pageLink.dataset.page, 10);
                window.scrollTo(0, 0);
                renderCurrentPage();
            }
        });
        
        dom.resultsContainer.addEventListener('click', e => {
            const header = e.target.closest('.sortable-header');
            if(!header) return;
            const newSortBy = header.dataset.sortBy;
            if (state.sortBy === newSortBy) {
                state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
            } else {
                state.sortBy = newSortBy;
                state.sortOrder = 'desc';
            }
            sortAndRender();
        });

        dom.searchInput.addEventListener('input', debounce(() => {
            state.filters.searchTerm = dom.searchInput.value;
            applyFiltersAndRender();
        }, 300));

        const dateFilters = [dom.approvalDateFrom, dom.approvalDateTo, dom.updatedDateFrom, dom.updatedDateTo];
        dateFilters.forEach(el => {
            el.addEventListener('change', () => {
                state.filters.approvalDateFrom = dom.approvalDateFrom.value;
                state.filters.approvalDateTo = dom.approvalDateTo.value;
                state.filters.updatedDateFrom = dom.updatedDateFrom.value;
                state.filters.updatedDateTo = dom.updatedDateTo.value;
                applyFiltersAndRender();
            });
        });

        dom.clearFiltersBtn.addEventListener('click', () => {
            state.filters = { searchTerm: '', countries: [], statuses: [], stages: [], approvalDateFrom: '', approvalDateTo: '', updatedDateFrom: '', updatedDateTo: '' };
            dom.searchInput.value = '';
            dateFilters.forEach(el => el.value = '');
            Object.values(tomSelectInstances).forEach(ts => ts.clear());
            applyFiltersAndRender();
        });
    }
    
    const debounce = (func, delay) => {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    };

    async function initialize() {
        renderLayout();
        setupEventListeners();
        await fetchInitialData(); 
    }

    initialize();
});