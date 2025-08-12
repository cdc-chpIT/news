document.addEventListener('DOMContentLoaded', () => {
    // === DOM ELEMENTS ===
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        filterSidebar: document.getElementById('filter-sidebar-container'),
        articlesList: document.getElementById('articles-list'),
        paginationControls: document.getElementById('pagination-controls'),
        alertContainer: document.getElementById('alert-container'),
    };

    let filterDom = {};
    let selectedKeywords = [];
    let tomSelectInstances = {};

    function showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alert-container');
        if (alertContainer) {
            const alertHtml = `
                <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
            alertContainer.innerHTML = alertHtml;
        }
    }

    function renderLayout() {
        dom.header.innerHTML = createHeader('Tin tức');
        dom.navbar.innerHTML = createNavbar('news');
        dom.filterSidebar.innerHTML = createFilterSidebar();
        initializeAuthUI();

        filterDom = {
            articleSearchInput: document.getElementById('article-search-input'),
            sourceFilter: document.getElementById('source-filter'),
            keywordSearchInput: document.getElementById('keyword-search-input'),
            keywordSuggestions: document.getElementById('keyword-suggestions'),
            sentimentFilter: document.getElementById('sentiment-filter'),
            sortBy: document.getElementById('sort-by'),
            sortOrderBtn: document.getElementById('sort-order-btn'),
            resetFiltersBtn: document.getElementById('reset-filters-btn'),
            categoryFilterList: document.getElementById('category-filter-list'),
            selectedKeywordContainer: document.getElementById('selected-keyword-container'),
            keywordInputWrapper: document.getElementById('keyword-input-wrapper'),
            startDateFilter: document.getElementById('start-date-filter'),
            endDateFilter: document.getElementById('end-date-filter'),
        };
    }

    async function initializeTomSelects() {
        tomSelectInstances.source = new TomSelect(filterDom.sourceFilter, { placeholder: 'Chọn một nguồn...' });
        tomSelectInstances.sentiment = new TomSelect(filterDom.sentimentFilter, {});
        tomSelectInstances.sortBy = new TomSelect(filterDom.sortBy, {});
    }

    // --- REFACTORED AND FIXED FUNCTION ---
async function handleSaveToggle(saveContainer) {
        const articleId = parseInt(saveContainer.dataset.articleId, 10);
        if (!articleId) return;

        const icon = saveContainer.querySelector('.save-icon');
        const isCurrentlySaved = saveContainer.classList.contains('saved');

        // Vô hiệu hóa nút tạm thời để tránh click nhiều lần
        saveContainer.style.pointerEvents = 'none';

        if (isCurrentlySaved) {
            // --- HÀNH ĐỘNG BỎ LƯU (UNSAVE) ---

            // 1. Cập nhật UI ngay lập tức (giả định thành công)
            saveContainer.classList.remove('saved');
            icon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
            saveContainer.title = 'Lưu bài viết';
            savedArticleIds.delete(articleId); // Cập nhật state local

            try {
                // 2. Gọi API trong nền
                await apiService.unsaveArticle(articleId);
                showAlert('Đã bỏ lưu bài viết.', 'info');
            } catch (error) {
                // 3. Nếu API thất bại, khôi phục lại UI và state
                showAlert('Lỗi khi bỏ lưu bài viết. Vui lòng thử lại.', 'danger');
                saveContainer.classList.add('saved');
                icon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
                saveContainer.title = 'Bỏ lưu bài viết';
                savedArticleIds.add(articleId); // Khôi phục state local
            }

        } else {
            // --- HÀNH ĐỘNG LƯU (SAVE) ---

            // 1. Cập nhật UI ngay lập tức (giả định thành công)
            saveContainer.classList.add('saved');
            icon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
            saveContainer.title = 'Bỏ lưu bài viết';
            savedArticleIds.add(articleId); // Cập nhật state local

            try {
                // 2. Gọi API trong nền
                await apiService.saveArticle(articleId);
                showAlert('Đã lưu bài viết thành công!', 'success');
            } catch (error) {
                // 3. Nếu API thất bại, khôi phục lại UI và state
                if (error.message.includes('401') || error.message.toLowerCase().includes('validate credentials')) {
                    showAlert('Vui lòng đăng nhập để lưu bài viết.', 'warning');
                } else {
                    showAlert(`Lỗi khi lưu bài viết: ${error.message}`, 'danger');
                }
                saveContainer.classList.remove('saved');
                icon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
                saveContainer.title = 'Lưu bài viết';
                savedArticleIds.delete(articleId); // Khôi phục state local
            }
        }

        // Luôn luôn kích hoạt lại nút sau khi hoàn tất
        saveContainer.style.pointerEvents = 'auto';
    }

    async function fetchAndRenderArticles() {
        dom.articlesList.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        dom.alertContainer.innerHTML = '';

        const result = await apiService.fetchArticles(queryState);

        if (result && result.data && result.data.items) {
            const articlesToProcess = result.data.items; // API đã thực hiện lọc, không cần lọc lại ở frontend

            if (articlesToProcess.length > 0) {
                dom.articlesList.innerHTML = articlesToProcess.map(createArticleCard).join('');
                dom.paginationControls.innerHTML = createPagination(result.data);
            } else {
                dom.articlesList.innerHTML = `<div class="alert alert-warning text-center">Không tìm thấy bài viết nào phù hợp với các bộ lọc đã chọn.</div>`;
                dom.paginationControls.innerHTML = '';
            }
        } else {
            dom.articlesList.innerHTML = `<div class="alert alert-warning text-center">Không tìm thấy bài viết nào từ nguồn dữ liệu.</div>`;
            dom.paginationControls.innerHTML = '';
        }
    }

    async function fetchAndRenderCategories() {
        const result = await apiService.fetchCategories();
        if(result && result.data) {
            const tagsHtml = result.data.map(cat =>
                `<span class="badge tag filter-tag" data-type="category" data-id="${cat.category_id}">${cat.name}</span>`
            ).join(' ');
            filterDom.categoryFilterList.innerHTML = tagsHtml;
        }
    }

    async function fetchAndRenderSources() {
        const result = await apiService.fetchSources();
        const sourceSelect = tomSelectInstances.source;

        if (result && result.data && sourceSelect) {
            sourceSelect.clearOptions();

            const validSources = result.data.filter(source => source.source_name !== 'string');
            const sortedSources = validSources.sort((a, b) => a.source_name.localeCompare(b.source_name));

            sortedSources.forEach(source => {
                sourceSelect.addOption({
                    value: source.source_id,
                    text: source.source_name
                });
            });
        }
    }

    function renderKeywordSuggestions(keywords) {
        if (!keywords || keywords.length === 0) {
            filterDom.keywordSuggestions.style.display = 'none';
            return;
        }
        filterDom.keywordSuggestions.innerHTML = keywords.map(kw =>
            `<a href="#" class="list-group-item list-group-item-action suggestion-item" data-id="${kw.keyword_id}">${kw.keyword_text}</a>`
        ).join('');
        filterDom.keywordSuggestions.style.display = 'block';
    }

    // === CÁC HÀM QUẢN LÝ TAG TỪ KHÓA ===
    function renderSelectedKeywordTags() {
        if (selectedKeywords.length === 0) {
            filterDom.selectedKeywordContainer.innerHTML = '';
            return;
        }
        const tagsHtml = selectedKeywords.map(kw => `
            <span class="badge text-bg-primary selected-keyword-tag me-1 mb-1">
                ${kw.text}
                <button type="button" class="btn-close" aria-label="Close" data-keyword-id-to-remove="${kw.id}"></button>
            </span>
        `).join('');
        filterDom.selectedKeywordContainer.innerHTML = tagsHtml;
    }

    function addKeyword(keywordId, keywordText) {
        if (!selectedKeywords.some(kw => kw.id.toString() === keywordId.toString())) {
            selectedKeywords.push({ id: keywordId, text: keywordText });
            updateStateAndFetch();
        }
    }

    function removeKeyword(keywordId) {
        selectedKeywords = selectedKeywords.filter(kw => kw.id.toString() !== keywordId.toString());
        updateStateAndFetch();
    }

    function updateStateAndFetch() {
        const keywordIds = selectedKeywords.map(kw => kw.id);
        renderSelectedKeywordTags();
        updateQueryState({ crawl_keyword_id: keywordIds }, fetchAndRenderArticles);
    }

    // === EVENT HANDLERS ===
    const debouncedKeywordSearch = debounce(async (searchText) => {
        if (searchText.length < 2) {
            renderKeywordSuggestions([]);
            return;
        }
        const result = await apiService.fetchKeywords({ search: searchText, limit: 5 });
        if (result && result.data) {
            renderKeywordSuggestions(result.data);
        }
    }, 300);

     function addEventListeners() {
        document.body.addEventListener('click', e => {
            const keywordTarget = e.target.closest('.clickable-keyword');
            if (keywordTarget) {
                e.preventDefault();
                e.stopPropagation();
                const keywordId = keywordTarget.dataset.keywordId;
                const keywordText = keywordTarget.dataset.keywordText;
                
                if (keywordId && keywordText) {
                    addKeyword(keywordId, keywordText);
                }
                return;
            }

            const tagTarget = e.target.closest('.tag.filter-tag');
            if (tagTarget) {
                e.preventDefault();
                const { type, id } = tagTarget.dataset;
                
                if (type === 'category') {
                    // Nếu click vào thẻ đang active thì bỏ chọn (set state về null)
                    const newCategoryId = queryState.category_id === id ? null : id;
                    
                    updateQueryState({ category_id: newCategoryId }, () => {
                        updateActiveCategoryTag(newCategoryId); // Cập nhật màu sắc
                        fetchAndRenderArticles(); // Tải lại bài viết
                    });
                }
            }
            const pageLinkTarget = e.target.closest('a.page-link');
            const suggestionTarget = e.target.closest('.suggestion-item');
            const removeKeywordBtn = e.target.closest('.selected-keyword-tag .btn-close');
            const saveContainerTarget = e.target.closest('.save-icon-container');

            if (saveContainerTarget) {
                e.preventDefault();
                handleSaveToggle(saveContainerTarget);
                return;
            }

            if (tagTarget) {
                e.preventDefault();
                const { type, id } = tagTarget.dataset;
                updateQueryState({ category_id: null, crawl_keyword_id: [] }, () => {
                    const updates = type === 'category' ? { category_id: id } : { crawl_keyword_id: [id] };
                    updateQueryState(updates, fetchAndRenderArticles);
                });
            }

            if (pageLinkTarget && pageLinkTarget.dataset.page) {
                e.preventDefault();
                if (pageLinkTarget.parentElement.classList.contains('disabled')) return;
                updatePageState({ page: parseInt(pageLinkTarget.dataset.page) }, fetchAndRenderArticles);
            }

            if (suggestionTarget) {
                e.preventDefault();
                const keywordId = suggestionTarget.dataset.id;
                const keywordText = suggestionTarget.textContent;
                addKeyword(keywordId, keywordText);
                filterDom.keywordSearchInput.value = '';
                filterDom.keywordSuggestions.style.display = 'none';
            }

            if (removeKeywordBtn) {
                e.preventDefault();
                const keywordIdToRemove = removeKeywordBtn.dataset.keywordIdToRemove;
                removeKeyword(keywordIdToRemove);
            }
        });

        filterDom.articleSearchInput.addEventListener('input', debounce(e => updateQueryState({ search: e.target.value }, fetchAndRenderArticles), 300));
        filterDom.sourceFilter.addEventListener('change', () => updateQueryState({ source_id: tomSelectInstances.source.getValue() }, fetchAndRenderArticles));
        filterDom.keywordSearchInput.addEventListener('input', e => debouncedKeywordSearch(e.target.value));
        filterDom.sentimentFilter.addEventListener('change', () => updateQueryState({ sentiment: tomSelectInstances.sentiment.getValue() }, fetchAndRenderArticles));
        filterDom.sortBy.addEventListener('change', () => updateQueryState({ sort_by: tomSelectInstances.sortBy.getValue() }, fetchAndRenderArticles));

        filterDom.sortOrderBtn.addEventListener('click', () => {
            const newOrder = queryState.sort_order === 'desc' ? 'asc' : 'desc';
            filterDom.sortOrderBtn.innerHTML = newOrder === 'desc' ? '<i class="bi bi-sort-down"></i>' : '<i class="bi bi-sort-up"></i>';
            updateQueryState({ sort_order: newOrder }, fetchAndRenderArticles);
        });

        const handleDateChange = () => {
            updateQueryState({
                published_from: filterDom.startDateFilter.value,
                published_to: filterDom.endDateFilter.value
            }, fetchAndRenderArticles);
        };

        filterDom.startDateFilter.addEventListener('change', handleDateChange);
        filterDom.endDateFilter.addEventListener('change', handleDateChange);
        
        filterDom.resetFiltersBtn.addEventListener('click', () => {
            resetQueryState();
            selectedKeywords = [];
            renderSelectedKeywordTags();

            filterDom.articleSearchInput.value = '';
            filterDom.keywordSearchInput.value = '';
            filterDom.startDateFilter.value = '';
            filterDom.endDateFilter.value = '';

            tomSelectInstances.source.clear();
            tomSelectInstances.sentiment.clear();
            tomSelectInstances.sortBy.setValue('published_at');
            filterDom.sortOrderBtn.innerHTML = '<i class="bi bi-sort-down"></i>';
            
            fetchAndRenderArticles();
        });
    }

    function updateActiveCategoryTag(activeId) {
        const categoryTags = document.querySelectorAll('.filter-tag[data-type="category"]');
        categoryTags.forEach(tag => {
            if (tag.dataset.id === String(activeId)) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
    }

    // === INITIALIZATION ===
    async function initialize() {
        renderLayout();

        const applyUrlFilters = () => {
        const params = new URLSearchParams(window.location.search);
        const publishedFrom = params.get('published_from');
        const publishedTo = params.get('published_to');

        const stateUpdates = {};

        const categoryId = params.get('category_id');
        if (categoryId) {
            stateUpdates.category_id = categoryId;
        }

        // Nếu có tham số ngày bắt đầu, cập nhật state và UI
        if (publishedFrom) {
            stateUpdates.published_from = publishedFrom;
            if (filterDom.startDateFilter) {
                filterDom.startDateFilter.value = publishedFrom;
            }
        }

        // Nếu có tham số ngày kết thúc, cập nhật state và UI
        if (publishedTo) {
            stateUpdates.published_to = publishedTo;
            if (filterDom.endDateFilter) {
                filterDom.endDateFilter.value = publishedTo;
            }
        }

        const keywordId = params.get('keyword_id');
        const keywordText = params.get('keyword_text');

        if (keywordId && keywordText) {
            // Cập nhật state để gọi API với đúng ID từ khóa
            stateUpdates.crawl_keyword_id = [keywordId];
            
            // Sử dụng hàm addKeyword đã có sẵn để cập nhật UI (hiển thị tag từ khóa đã chọn)
            // decodeURIComponent dùng để chuyển đổi các ký tự đặc biệt (ví dụ %20 thành dấu cách)
            addKeyword(keywordId, decodeURIComponent(keywordText)); 
        }

        // Nếu có bất kỳ cập nhật nào, áp dụng chúng vào state chung
        if (Object.keys(stateUpdates).length > 0) {
            console.log("Áp dụng bộ lọc ngày từ URL:", stateUpdates);
            // Không gọi callback ở đây để tránh fetch 2 lần khi khởi tạo
            updateQueryState(stateUpdates); 
        }
    };

        await initializeTomSelects();
        
        // Gọi hàm để áp dụng bộ lọc từ URL trước khi làm mọi việc khác
        applyUrlFilters();

        addEventListeners();
    
        if (getCurrentUser()) {
            try {
                const [userKeywordsResult, allKeywordsResult] = await Promise.all([
                    apiService.fetchUserKeywords(),
                    apiService.fetchKeywords({ limit: 1000 })
                ]);
    
                if (userKeywordsResult.success && allKeywordsResult.success) {
                    const userKeywordTexts = new Set(userKeywordsResult.data.map(kw => kw.keyword_text));
                    const allKeywords = allKeywordsResult.data;
    
                    const preferredKeywords = allKeywords.filter(kw => userKeywordTexts.has(kw.keyword_text));
    
                    if (preferredKeywords.length > 0) {
                        selectedKeywords = preferredKeywords.map(kw => ({ id: kw.keyword_id, text: kw.keyword_text }));
                        queryState.crawl_keyword_id = preferredKeywords.map(kw => kw.keyword_id);
                        renderSelectedKeywordTags();
                    }
                }
            } catch (error) {
                console.error("Could not fetch and apply user's preferred keywords:", error);
            }
        }
    
        // Tải dữ liệu lần đầu, sẽ tự động áp dụng các bộ lọc từ URL hoặc từ sở thích người dùng
        fetchAndRenderArticles();
        fetchAndRenderCategories();
        fetchAndRenderSources();

        fetchAndRenderCategories().then(() => {
            updateActiveCategoryTag(queryState.category_id);
        });
        
        
    }

    initialize();
});