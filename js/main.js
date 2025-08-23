
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
    let selectedPrimaryKeywords = [];
    let selectedSecondaryKeywords = [];
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
            sentimentFilter: document.getElementById('sentiment-filter'),
            sortBy: document.getElementById('sort-by'),
            sortOrderBtn: document.getElementById('sort-order-btn'),
            resetFiltersBtn: document.getElementById('reset-filters-btn'),
            categoryFilterList: document.getElementById('category-filter-list'),
            startDateFilter: document.getElementById('start-date-filter'),
            endDateFilter: document.getElementById('end-date-filter'),

            // Primary Keywords Elements
            primaryKeywordSearchInput: document.getElementById('primary-keyword-search-input'),
            primaryKeywordSuggestions: document.getElementById('primary-keyword-suggestions'),
            selectedPrimaryKeywordContainer: document.getElementById('selected-primary-keyword-container'),

            // Secondary Keywords Elements
            secondaryKeywordSearchInput: document.getElementById('secondary-keyword-search-input'),
            secondaryKeywordSuggestions: document.getElementById('secondary-keyword-suggestions'),
            selectedSecondaryKeywordContainer: document.getElementById('selected-secondary-keyword-container'),
        };
    }

    async function initializeTomSelects() {
        tomSelectInstances.source = new TomSelect(filterDom.sourceFilter, { placeholder: 'Chọn một nguồn...' });
        tomSelectInstances.sentiment = new TomSelect(filterDom.sentimentFilter, {});
        tomSelectInstances.sortBy = new TomSelect(filterDom.sortBy, {});
    }

    async function handleSaveToggle(saveContainer) {
        const articleId = parseInt(saveContainer.dataset.articleId, 10);
        if (!articleId) return;

        const icon = saveContainer.querySelector('.save-icon');
        const isCurrentlySaved = saveContainer.classList.contains('saved');

        saveContainer.style.pointerEvents = 'none';

        if (isCurrentlySaved) {
            saveContainer.classList.remove('saved');
            icon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
            saveContainer.title = 'Lưu bài viết';
            savedArticleIds.delete(articleId); 

            try {
                await apiService.unsaveArticle(articleId);
                showAlert('Đã bỏ lưu bài viết.', 'info');
            } catch (error) {
                showAlert('Lỗi khi bỏ lưu bài viết. Vui lòng thử lại.', 'danger');
                saveContainer.classList.add('saved');
                icon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
                saveContainer.title = 'Bỏ lưu bài viết';
                savedArticleIds.add(articleId);
            }

        } else {
            saveContainer.classList.add('saved');
            icon.classList.replace('bi-bookmark', 'bi-bookmark-fill');
            saveContainer.title = 'Bỏ lưu bài viết';
            savedArticleIds.add(articleId);

            try {
                await apiService.saveArticle(articleId);
                showAlert('Đã lưu bài viết thành công!', 'success');
            } catch (error) {
                if (error.message.includes('401') || error.message.toLowerCase().includes('validate credentials')) {
                    showAlert('Vui lòng đăng nhập để lưu bài viết.', 'warning');
                } else {
                    showAlert(`Lỗi khi lưu bài viết: ${error.message}`, 'danger');
                }
                saveContainer.classList.remove('saved');
                icon.classList.replace('bi-bookmark-fill', 'bi-bookmark');
                saveContainer.title = 'Lưu bài viết';
                savedArticleIds.delete(articleId);
            }
        }
        saveContainer.style.pointerEvents = 'auto';
    }

    async function fetchAndRenderArticles() {
        dom.articlesList.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>`;
        dom.alertContainer.innerHTML = '';

        const result = await apiService.fetchArticles(queryState);

        if (result && result.data && result.data.items) {
            const articlesToProcess = result.data.items;

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
                sourceSelect.addOption({ value: source.source_id, text: source.source_name });
            });
        }
    }
    
    function renderKeywordSuggestions(keywords, type) {
        const suggestionsEl = type === 'primary' ? filterDom.primaryKeywordSuggestions : filterDom.secondaryKeywordSuggestions;
        if (!keywords || keywords.length === 0) {
            suggestionsEl.style.display = 'none';
            return;
        }
        suggestionsEl.innerHTML = keywords.map(kw =>
            `<a href="#" class="list-group-item list-group-item-action suggestion-item" data-id="${kw.keyword_id}" data-type="${type}">${kw.keyword_text}</a>`
        ).join('');
        suggestionsEl.style.display = 'block';
    }

    // --- KEYWORD TAG MANAGEMENT ---
    function renderSelectedKeywordTags() {
        filterDom.selectedPrimaryKeywordContainer.innerHTML = selectedPrimaryKeywords.map(kw => `
            <span class="badge text-bg-primary selected-keyword-tag me-1 mb-1">
                ${kw.text}
                <button type="button" class="btn-close" aria-label="Close" data-keyword-id-to-remove="${kw.id}" data-type="primary"></button>
            </span>
        `).join('');

        filterDom.selectedSecondaryKeywordContainer.innerHTML = selectedSecondaryKeywords.map(kw => `
            <span class="badge text-bg-secondary selected-keyword-tag me-1 mb-1">
                ${kw.text}
                <button type="button" class="btn-close" aria-label="Close" data-keyword-id-to-remove="${kw.id}" data-type="secondary"></button>
            </span>
        `).join('');
    }

    function addKeyword(keywordId, keywordText, type) {
        const targetList = type === 'primary' ? selectedPrimaryKeywords : selectedSecondaryKeywords;
        if (!targetList.some(kw => kw.id.toString() === keywordId.toString())) {
            targetList.push({ id: keywordId, text: keywordText });
            updateStateAndFetch();
        }
    }

    function removeKeyword(keywordId, type) {
        if (type === 'primary') {
            selectedPrimaryKeywords = selectedPrimaryKeywords.filter(kw => kw.id.toString() !== keywordId.toString());
        } else {
            selectedSecondaryKeywords = selectedSecondaryKeywords.filter(kw => kw.id.toString() !== keywordId.toString());
        }
        updateStateAndFetch();
    }

    function updateStateAndFetch() {
        renderSelectedKeywordTags();
        updateQueryState({
            primary_keywords: selectedPrimaryKeywords.map(kw => kw.id),
            secondary_keywords: selectedSecondaryKeywords.map(kw => kw.id)
        }, fetchAndRenderArticles);
    }

    // === EVENT HANDLERS ===
    const debouncedPrimaryKeywordSearch = debounce(async (searchText) => {
        if (searchText.length < 2) { renderKeywordSuggestions([], 'primary'); return; }
        const result = await apiService.fetchKeywords({ search: searchText, limit: 5 });
        if (result && result.data) renderKeywordSuggestions(result.data, 'primary');
    }, 300);

    const debouncedSecondaryKeywordSearch = debounce(async (searchText) => {
        if (searchText.length < 2) { renderKeywordSuggestions([], 'secondary'); return; }
        const result = await apiService.fetchKeywords({ search: searchText, limit: 5 });
        if (result && result.data) renderKeywordSuggestions(result.data, 'secondary');
    }, 300);

     function addEventListeners() {
        document.body.addEventListener('click', e => {
            const pageLinkTarget = e.target.closest('a.page-link');
            const suggestionTarget = e.target.closest('.suggestion-item');
            const removeKeywordBtn = e.target.closest('.selected-keyword-tag .btn-close');
            const saveContainerTarget = e.target.closest('.save-icon-container');
            const tagTarget = e.target.closest('.tag.filter-tag');
             const keywordTarget = e.target.closest('.clickable-keyword');
            if (keywordTarget) {
                e.preventDefault();
                e.stopPropagation();
                const keywordId = keywordTarget.dataset.keywordId;
                const keywordText = keywordTarget.dataset.keywordText;
                
                if (keywordId && keywordText) {
                    addKeyword(keywordId, keywordText, 'primary'); // Default to adding to primary
                }
                return;
            }
            if (saveContainerTarget) {
                e.preventDefault();
                handleSaveToggle(saveContainerTarget);
                return;
            }
            if (tagTarget) {
                e.preventDefault();
                const { type, id } = tagTarget.dataset;
                if (type === 'category') {
                    const newCategoryId = queryState.category_id === id ? null : id;
                    updateQueryState({ category_id: newCategoryId }, () => {
                        updateActiveCategoryTag(newCategoryId);
                        fetchAndRenderArticles();
                    });
                }
            }
            if (pageLinkTarget && pageLinkTarget.dataset.page) {
                e.preventDefault();
                if (pageLinkTarget.parentElement.classList.contains('disabled')) return;
                updatePageState({ page: parseInt(pageLinkTarget.dataset.page) }, fetchAndRenderArticles);
            }
            if (suggestionTarget) {
                e.preventDefault();
                const { id, type } = suggestionTarget.dataset;
                const text = suggestionTarget.textContent;
                addKeyword(id, text, type);
                if (type === 'primary') {
                    filterDom.primaryKeywordSearchInput.value = '';
                    filterDom.primaryKeywordSuggestions.style.display = 'none';
                } else {
                    filterDom.secondaryKeywordSearchInput.value = '';
                    filterDom.secondaryKeywordSuggestions.style.display = 'none';
                }
            }
            if (removeKeywordBtn) {
                e.preventDefault();
                const { keywordIdToRemove, type } = removeKeywordBtn.dataset;
                removeKeyword(keywordIdToRemove, type);
            }
        });

        filterDom.articleSearchInput.addEventListener('input', debounce(e => updateQueryState({ search: e.target.value }, fetchAndRenderArticles), 300));
        filterDom.sourceFilter.addEventListener('change', () => updateQueryState({ source_id: tomSelectInstances.source.getValue() }, fetchAndRenderArticles));
        filterDom.primaryKeywordSearchInput.addEventListener('input', e => debouncedPrimaryKeywordSearch(e.target.value));
        filterDom.secondaryKeywordSearchInput.addEventListener('input', e => debouncedSecondaryKeywordSearch(e.target.value));
        filterDom.sentimentFilter.addEventListener('change', () => updateQueryState({ sentiment: tomSelectInstances.sentiment.getValue() }, fetchAndRenderArticles));
        filterDom.sortBy.addEventListener('change', () => updateQueryState({ sort_by: tomSelectInstances.sortBy.getValue() }, fetchAndRenderArticles));
        filterDom.sortOrderBtn.addEventListener('click', () => {
            const newOrder = queryState.sort_order === 'desc' ? 'asc' : 'desc';
            filterDom.sortOrderBtn.innerHTML = newOrder === 'desc' ? '<i class="bi bi-sort-down"></i>' : '<i class="bi bi-sort-up"></i>';
            updateQueryState({ sort_order: newOrder }, fetchAndRenderArticles);
        });
        const handleDateChange = () => {
            updateQueryState({ published_from: filterDom.startDateFilter.value, published_to: filterDom.endDateFilter.value }, fetchAndRenderArticles);
        };
        filterDom.startDateFilter.addEventListener('change', handleDateChange);
        filterDom.endDateFilter.addEventListener('change', handleDateChange);
        
        filterDom.resetFiltersBtn.addEventListener('click', () => {
            resetQueryState();
            selectedPrimaryKeywords = [];
            selectedSecondaryKeywords = [];
            renderSelectedKeywordTags();
            filterDom.articleSearchInput.value = '';
            filterDom.primaryKeywordSearchInput.value = '';
            filterDom.secondaryKeywordSearchInput.value = '';
            filterDom.startDateFilter.value = '';
            filterDom.endDateFilter.value = '';
            tomSelectInstances.source.clear();
            tomSelectInstances.sentiment.clear();
            tomSelectInstances.sortBy.setValue('published_at');
            filterDom.sortOrderBtn.innerHTML = '<i class="bi bi-sort-down"></i>';
            updateActiveCategoryTag(null);
            fetchAndRenderArticles();
        });
    }

    function updateActiveCategoryTag(activeId) {
        const categoryTags = document.querySelectorAll('.filter-tag[data-type="category"]');
        categoryTags.forEach(tag => {
            tag.classList.toggle('active', tag.dataset.id === String(activeId));
        });
    }

    async function initialize() {
        renderLayout();
        const applyUrlFilters = () => {
            const params = new URLSearchParams(window.location.search);
            const stateUpdates = {};
            const categoryId = params.get('category_id');
            const publishedFrom = params.get('published_from');
            const publishedTo = params.get('published_to');
            const keywordId = params.get('keyword_id');
            const keywordText = params.get('keyword_text');

            if (categoryId) stateUpdates.category_id = categoryId;
            if (publishedFrom) {
                stateUpdates.published_from = publishedFrom;
                if (filterDom.startDateFilter) filterDom.startDateFilter.value = publishedFrom;
            }
            if (publishedTo) {
                stateUpdates.published_to = publishedTo;
                if (filterDom.endDateFilter) filterDom.endDateFilter.value = publishedTo;
            }
            if (keywordId && keywordText) {
                stateUpdates.primary_keywords = [keywordId];
                addKeyword(keywordId, decodeURIComponent(keywordText), 'primary'); 
            }
            if (Object.keys(stateUpdates).length > 0) {
                updateQueryState(stateUpdates); 
            }
        };
        await initializeTomSelects();
        applyUrlFilters();
        addEventListeners();
        fetchAndRenderArticles();
        fetchAndRenderCategories().then(() => {
            updateActiveCategoryTag(queryState.category_id);
        });
        fetchAndRenderSources();
    }
    initialize();
});