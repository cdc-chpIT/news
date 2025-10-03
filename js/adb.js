document.addEventListener('DOMContentLoaded', () => {
    // === STATE ===
    let allProjects = [];
    let state = {
        currentPage: 1,
        pageSize: 10,
        filters: { // Sử dụng Set để quản lý các lựa chọn
            country: new Set(),
            sector: new Set(),
            theme: new Set(),
            type: new Set(),
            fund: new Set(),
            status: new Set(),
            year: new Set()
        }
    };
    
    // === DOM ELEMENTS ===
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        alertContainer: document.getElementById('alert-container'),
        resultsContainer: document.getElementById('adb-results-container'),
        paginationContainer: document.getElementById('pagination-container'),
        filterSidebarContainer: document.getElementById('filter-sidebar-container'),
    };

    // === FILTER CONFIGURATION (Đầy đủ 7 bộ lọc) ===
    const FILTERS_CONFIG = [
        {
            title: 'Country/Economy',
            id: 'country',
            options: [
                { name: 'Regional', id: '1' }, { name: 'Afghanistan', id: '2' }, { name: 'Armenia', id: '3' }, 
                { name: 'Azerbaijan', id: '4' }, { name: 'Bangladesh', id: '5' }, { name: 'Bhutan', id: '6' },
                { name: 'Brunei Darussalam', id: '7' }, { name: 'Cambodia', id: '8' }, { name: "China, People's Republic of", id: '9' },
                { name: 'Cook Islands', id: '10' }, { name: 'Fiji', id: '11' }, { name: 'Georgia', id: '12' },
                { name: 'Hong Kong, China', id: '13' }, { name: 'India', id: '14' }, { name: 'Indonesia', id: '15' }, 
                { name: 'Kazakhstan', id: '17' }, { name: 'Kiribati', id: '18' }, { name: 'Korea, Republic of', id: '19' }, 
                { name: 'Kyrgyz Republic', id: '20' }, { name: "Lao People's Democratic Republic", id: '21' }, { name: 'Malaysia', id: '22' }, 
                { name: 'Maldives', id: '23' }, { name: 'Marshall Islands', id: '24' }, { name: 'Micronesia, Federated States of', id: '25' }, 
                { name: 'Mongolia', id: '26' }, { name: 'Myanmar', id: '27' }, { name: 'Nauru', id: '28' }, { name: 'Nepal', id: '29' },
                { name: 'Niue', id: '4126' }, { name: 'Pakistan', id: '30' }, { name: 'Palau', id: '31' },
                { name: 'Papua New Guinea', id: '32' }, { name: 'Philippines', id: '33' }, { name: 'Samoa', id: '34' },
                { name: 'Singapore', id: '35' }, { name: 'Solomon Islands', id: '36' }, { name: 'Sri Lanka', id: '37' }, 
                { name: 'Taipei,China', id: '38' }, { name: 'Tajikistan', id: '39' }, { name: 'Thailand', id: '40' }, 
                { name: 'Timor-Leste', id: '41' }, { name: 'Tonga', id: '42' }, { name: 'Türkiye', id: '7651' }, 
                { name: 'Turkmenistan', id: '43' }, { name: 'Tuvalu', id: '44' }, { name: 'Uzbekistan', id: '45' },
                { name: 'Vanuatu', id: '46' }, { name: 'Viet Nam', id: '47' }
            ]
        },
        {
            title: 'Sectors',
            id: 'sector',
            options: [
                { name: 'Agriculture, natural resources and rural development', id: '1057' }, { name: 'Education', id: '1058' },
                { name: 'Energy', id: '1059' }, { name: 'Finance', id: '1060' }, { name: 'Health', id: '1061' },
                { name: 'Health and social protection', id: '1371' }, { name: 'Industry and trade', id: '1062' }, 
                { name: 'Information and communication technology', id: '1066' }, { name: 'Multisector', id: '1067' }, 
                { name: 'Public sector management', id: '1063' }, { name: 'Transport', id: '1064' },
                { name: 'Transport and ICT', id: '1372' }, { name: 'Water and other urban infrastructure and services', id: '1065' }
            ]
        },
        {
            title: 'Theme',
            id: 'theme',
            options: [
                 { name: 'Environmentally sustainable growth', id: '1666' }, { name: 'Gender Equity and Mainstreaming', id: '1651' },
                 { name: 'Governance and capacity development', id: '1646' }, { name: 'Inclusive economic growth', id: '1676' },
                 { name: 'Knowledge solutions', id: '1656' }, { name: 'Partnerships', id: '1661' },
                 { name: 'Private sector development', id: '1641' }, { name: 'Regional integration', id: '1671' }
            ]
        },
        {
            title: 'Type',
            id: 'type',
            options: [
                { name: 'Sovereign', id: '1069' }, { name: 'Nonsovereign', id: '1070' }
            ]
        },
        {
            title: 'Fund',
            id: 'fund',
            options: [
                { name: 'Asian Development Fund', id: 'Asian Development Fund' },
                { name: 'Ordinary capital resources', id: 'Ordinary capital resources' },
                { name: 'Technical Assistance Special Fund', id: 'Technical Assistance Special Fund' },
                { name: 'Japan Special Fund', id: 'Japan Special Fund' },
                { name: 'Green Climate Fund', id: 'Green Climate Fund' },
                { name: 'Australia', id: 'Australia' },
                { name: 'Canada', id: 'Canada' },
                { name: 'Clean Energy Fund', id: 'Clean Energy Fund' },
                { name: 'European Union', id: 'European Union' },
                { name: 'France', id: 'France' },
                { name: 'Germany', id: 'Germany' },
                { name: 'Global Environment Facility', id: 'Global Environment Facility' },
                { name: 'High-Level Technology Fund', id: 'High-Level Technology Fund' },
                { name: 'Japan', id: 'Japan' },
                { name: 'Republic of Korea', id: 'Republic of Korea' },
                { name: 'Spain', id: 'Spain' },
                { name: 'Sweden', id: 'Sweden' },
                { name: 'Switzerland', id: 'Switzerland' },
                { name: 'United Kingdom', id: 'United Kingdom' },
                { name: 'World Bank', id: 'World Bank' },
                { name: 'Abu Dhabi Fund', id: 'Abu Dhabi Fund' },
                { name: 'Agence franaise de dveloppement', id: 'Agence franaise de dveloppement' },
                { name: 'Asian Infrastructure Investment Bank', id: 'Asian Infrastructure Investment Bank' },
                { name: 'Bill & Melinda Gates Foundation', id: 'Bill & Melinda Gates Foundation' },
                { name: 'Clean Technology Fund', id: 'Clean Technology Fund' },
                { name: 'Climate Change Fund', id: 'Climate Change Fund' },
                { name: 'European Investment Bank', id: 'European Investment Bank' },
                { name: 'International Fund for Agricultural Development', id: 'International Fund for Agricultural Development' },
                { name: 'Islamic Development Bank', id: 'Islamic Development Bank' },
                { name: 'KfW', id: 'KfW' },
                { name: "Leading Asia's Private Infrastructure Fund (LEAP)", id: "Leading Asia's Private Infrastructure Fund (LEAP)"},
                { name: 'Luxembourg', id: 'Luxembourg' },
                { name: 'Netherlands', id: 'Netherlands' },
                { name: 'New Zealand', id: 'New Zealand' },
                { name: 'Nordic Development Fund', id: 'Nordic Development Fund' },
                { name: 'Norway', id: 'Norway' },
                { name: 'OPEC Fund for International Development', id: 'OPEC Fund for International Development' },
                { name: "People's Republic of China", id: "People's Republic of China" },
                { name: 'Regional Cooperation and Integration Fund', id: 'Regional Cooperation and Integration Fund' },
                { name: 'Rockefeller Foundation', id: 'Rockefeller Foundation' },
                { name: 'Strategic Climate Fund', id: 'Strategic Climate Fund' },
                { name: 'United States', id: 'United States' }
            ].sort((a, b) => a.name.localeCompare(b.name)) // Sắp xếp cho dễ nhìn
        },
        {
            title: 'Status',
            id: 'status',
            options: [
                { name: 'Proposed', id: '1360' }, { name: 'Approved', id: '1359' },
                { name: 'Active', id: '1367' }, { name: 'Dropped / Terminated', id: '1362' },
                { name: 'Closed', id: '1361' }, { name: 'Archived', id: '1366' }
            ]
        },
        {
            title: 'Year',
            id: 'year',
            options: [
                '2029', '2028', '2027', '2026', '2025', '2024', '2023', '2022', '2021', '2020', 
                '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', 
                '2011', '2010', '2009', '2008', '2007', '2006', '2005', '2004',
                '2003', '2002', '2001', '2000', '1999', '1998', '1997', '1996',
                '1995', '1994', '1993', '1992', '1991', '1990', '1989', '1988',
                '1987', '1986', '1985', '1984', '1983', '1982', '1981', '1980',
                '1979', '1978', '1977', '1976', '1975', '1974', '1973', '1972',
                '1971', '1970', '1969', '1968', '1967'
            ].map(y => ({ name: y, id: y }))
        }
    ];

    // === RENDER FUNCTIONS ===
    function renderLayout() {
        dom.header.innerHTML = createHeader('ADB Projects');
        dom.navbar.innerHTML = createNavbar('adb');
        initializeAuthUI();
    }
    
    function renderFilterSidebar() {
        const filterHtml = `
            <div class="card shadow-sm">
                <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h5 class="mb-0"><i class="bi bi-funnel-fill me-2"></i>Filter Results</h5>
                    <div class="btn-group btn-group-sm">
                        <button id="apply-filters-btn" class="btn btn-primary">Apply</button>
                        <button id="clear-filters-btn" class="btn btn-outline-secondary">Clear All</button>
                    </div>
                </div>
                <div class="card-body">
                    <div class="accordion" id="filterAccordion">
                        ${FILTERS_CONFIG.map((group, index) => `
                            <div class="accordion-item">
                                <h2 class="accordion-header" id="heading-${group.id}">
                                    <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${group.id}" aria-expanded="${index === 0}" aria-controls="collapse-${group.id}">
                                        ${group.title}
                                        <span class="filter-count-badge ms-2" id="filter-count-${group.id}"></span>
                                    </button>
                                </h2>
                                <div id="collapse-${group.id}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}" aria-labelledby="heading-${group.id}">
                                    <div class="accordion-body" style="max-height: 250px; overflow-y: auto;">
                                        ${group.options.map(opt => `
                                            <div class="form-check">
                                                <input class="form-check-input filter-checkbox" type="checkbox" value="${opt.id}" id="filter-${group.id}-${opt.id}" data-filter-group="${group.id}">
                                                <label class="form-check-label" for="filter-${group.id}-${opt.id}">
                                                    ${opt.name}
                                                </label>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>`;
        dom.filterSidebarContainer.innerHTML = filterHtml;
    }

    function showAlert(message, type = 'danger') {
        const alertContainer = dom.alertContainer;
        if (alertContainer) {
            alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
        }
    }

    function getStatusBadge(status) {
        if (!status) return `<span class="badge bg-light text-dark">N/A</span>`;
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

    function renderTable(projectsForPage) {
        if (!projectsForPage || projectsForPage.length === 0) {
            dom.resultsContainer.innerHTML = '<div class="alert alert-info text-center">Không có dự án nào phù hợp với bộ lọc đã chọn.</div>';
            return;
        }
        const headers = ['Lưu', 'Tên dự án', 'Mã dự án', 'Năm phê duyệt', 'Trạng thái', 'Quốc gia', 'Lĩnh vực'];
        const headersHtml = headers.map(h => `<th scope="col">${h}</th>`).join('');
        
        const rowsHtml = projectsForPage.map(p => {
            const projectCode = p.details['Project number'] || '';
            const isSaved = savedAdbProjects.has(projectCode);
            const userAdbId = isSaved ? savedAdbProjects.get(projectCode) : '';
            const saveIconClass = isSaved ? 'bi-bookmark-check-fill text-success' : 'bi-bookmark';
            const saveTitle = isSaved ? 'Bỏ lưu dự án' : 'Lưu dự án';

             const saveButtonHtml = `
                <button class="btn btn-light save-adb-btn p-1" // <-- Thêm p-1 để giảm padding, hoặc tạo class riêng như trên
                        title="${saveTitle}"
                        data-is-saved="${isSaved}"
                        data-user-adb-id="${userAdbId}"
                        data-project-code="${projectCode}"
                        data-project-name="${p.title.replace(/"/g, '&quot;')}"
                        data-project-approve-year="${p.details['Approval year'] || ''}"
                        data-project-status="${p.details['Status'] || ''}"
                        data-project-country="${p.details['Countries'] || ''}"
                        data-project-sector="${p.details['Sectors'] || ''}"
                        data-project-url="${p.link}">
                    <i class="bi ${saveIconClass}" style="font-size: 0.9rem;"></i>
                </button>
            `;

            return `
                <tr>
                    <td class="text-center">${saveButtonHtml}</td>
                    <td><a href="${p.link}" target="_blank" rel="noopener noreferrer" title="Xem chi tiết dự án">${p.title}</a></td>
                    <td class="text-center">${projectCode}</td>
                    <td class="text-center">${p.details['Approval year'] || 'N/A'}</td>
                    <td class="text-center">${getStatusBadge(p.details['Status'])}</td>
                    <td>${p.details['Countries'] || 'N/A'}</td>
                    <td>${p.details['Sectors'] || 'N/A'}</td>
                </tr>
            `;
        }).join('');

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
    
    function renderPage(pageNumber) {
        state.currentPage = pageNumber;
        const totalPages = Math.ceil(allProjects.length / state.pageSize);
        const start = (state.currentPage - 1) * state.pageSize;
        const end = start + state.pageSize;
        const projectsForPage = allProjects.slice(start, end);

        renderTable(projectsForPage);
        if (dom.paginationContainer) {
             dom.paginationContainer.innerHTML = createPagination({ page: state.currentPage, pages: totalPages });
        }
    }

    function updateFilterCounts() {
        FILTERS_CONFIG.forEach(group => {
            const count = state.filters[group.id].size;
            const badge = document.getElementById(`filter-count-${group.id}`);
            if (badge) {
                badge.textContent = count > 0 ? `${count}` : '';
            }
        });
    }

    // === LOGIC FUNCTIONS ===
    
    function buildFilterPath() {
        const filterOrder = ['country', 'sector', 'theme', 'type', 'status', 'year', 'fund'];
        const pathParts = filterOrder.map(filterKey => {
            const selected = state.filters[filterKey];
            if (!selected || selected.size === 0) {
                return 'all';
            }
            if (filterKey === 'fund') {
                return Array.from(selected).join(',') + ',all';
            } 
            else {
                return Array.from(selected).join('+');
            }
        });
        return pathParts.join('/');
    }

    async function fetchAndRender() {
        dom.resultsContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h5 class="mt-4">Đang tải và lọc dữ liệu từ ADB...</h5>
                <p class="text-muted">
                    Quá trình này có thể mất một chút thời gian, vui lòng chờ.
                </p>
            </div>
        `;
        
        if (dom.paginationContainer) {
            dom.paginationContainer.innerHTML = '';
        }
        
        try {
            const filterPath = buildFilterPath();
            const rssString = await apiService.fetchAdbRssFeed(filterPath);
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(rssString, "application/xml");

            const parseError = xmlDoc.querySelector("parsererror");
            if (parseError) {
                console.error("Lỗi phân tích XML:", parseError);
                throw new Error("Dữ liệu nhận được từ máy chủ không phải là định dạng XML hợp lệ.");
            }

            const items = xmlDoc.querySelectorAll("item");
            
            allProjects = Array.from(items).map(item => {
                const categoryText = item.querySelector("category")?.textContent || '';
                const details = {};
                
                categoryText.split('|').forEach(part => {
                    const [key, ...valueParts] = part.split(':');
                    const value = valueParts.join(':').trim(); 
                    
                    if (key && value) { 
                        details[key.trim()] = value;
                    }
                });

                return {
                    title: item.querySelector("title")?.textContent || 'N/A',
                    link: item.querySelector("link")?.textContent || '#',
                    details: details,
                };
            });
            
            renderPage(1);

        } catch (error) {
            let userMessage = `Không thể tải dữ liệu dự án từ ADB. Lỗi: ${error.message}`;
            if (error.message.includes("Status: 429")) {
                userMessage = "<b>Lỗi Tạm Thời:</b> Máy chủ đang bị giới hạn truy cập đến ADB do có quá nhiều yêu cầu. Vui lòng chờ vài phút rồi thử lại.";
            }
            showAlert(userMessage, 'danger');
            allProjects = [];
            renderPage(1);
        }
    }

    function setupEventListeners() {
        if (dom.paginationContainer) {
            dom.paginationContainer.addEventListener('click', e => {
                const pageLink = e.target.closest('a.page-link');
                if (pageLink && pageLink.dataset.page) {
                    e.preventDefault();
                    const pageNum = parseInt(pageLink.dataset.page, 10);
                    if (pageNum !== state.currentPage) {
                         renderPage(pageNum);
                    }
                }
            });
        }

        if (dom.filterSidebarContainer) {
            dom.filterSidebarContainer.addEventListener('change', e => {
                if (e.target.classList.contains('filter-checkbox')) {
                    const group = e.target.dataset.filterGroup;
                    const value = e.target.value;

                    if (e.target.checked) {
                        state.filters[group].add(value);
                    } else {
                        state.filters[group].delete(value);
                    }
                    updateFilterCounts();
                }
            });
            
            dom.filterSidebarContainer.addEventListener('click', e => {
                const target = e.target;
                
                if (target.id === 'apply-filters-btn') {
                    fetchAndRender();
                } 
                else if (target.id === 'clear-filters-btn') {
                    Object.values(state.filters).forEach(set => set.clear());
                    dom.filterSidebarContainer.querySelectorAll('.filter-checkbox:checked').forEach(cb => cb.checked = false);
                    updateFilterCounts(); 
                    fetchAndRender(); 
                }
            });
        }

        // Event listener cho nút Lưu
        dom.resultsContainer.addEventListener('click', async (e) => {
            const saveBtn = e.target.closest('.save-adb-btn');
            if (!saveBtn) return;

            if (!getCurrentUser()) {
                showAlert('Vui lòng đăng nhập để sử dụng tính năng này.', 'warning');
                return;
            }

            const { 
                isSaved, userAdbId, projectCode, projectName, 
                projectApproveYear, projectStatus, projectCountry, 
                projectSector, projectUrl 
            } = saveBtn.dataset;
            
            saveBtn.disabled = true;
            saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
            
            try {
                if (isSaved === 'true') {
                    // --- Logic Bỏ lưu ---
                    await apiService.deleteAdbProject(userAdbId);
                    savedAdbProjects.delete(projectCode);
                    showAlert('Đã bỏ lưu dự án.', 'info');
                    saveBtn.dataset.isSaved = 'false';
                    saveBtn.dataset.userAdbId = '';
                    saveBtn.title = 'Lưu dự án';
                } else {
                    // --- Logic Lưu ---
                    const payload = { 
                        project_name: projectName, 
                        project_code: projectCode, 
                        project_approve_year: projectApproveYear, 
                        project_status: projectStatus, 
                        project_country: projectCountry, 
                        project_sector: projectSector, 
                        project_url: projectUrl 
                    };
                    const result = await apiService.saveAdbProject(payload);
                    
                    if (result.success && result.data) {
                        savedAdbProjects.set(projectCode, result.data.user_adb_id);
                        showAlert('Lưu dự án thành công.', 'success');
                        saveBtn.dataset.isSaved = 'true';
                        saveBtn.dataset.userAdbId = result.data.user_adb_id;
                        saveBtn.title = 'Bỏ lưu dự án';
                    }
                }
            } catch(error) {
                showAlert(error.message, 'danger');
                saveBtn.dataset.isSaved = isSaved; 
                saveBtn.title = isSaved === 'true' ? 'Bỏ lưu dự án' : 'Lưu dự án';
            } finally {
                saveBtn.disabled = false;
                const iconClass = saveBtn.dataset.isSaved === 'true' ? 'bi bi-bookmark-check-fill text-success' : 'bi bi-bookmark';
                saveBtn.innerHTML = `<i class="${iconClass}"></i>`;
            }
        });
    }

    async function initialize() {
        renderLayout();
        renderFilterSidebar();
        setupEventListeners();
        
        await initializeAuthUI(); 
        await fetchAndRender(); 
    }

    initialize();
});