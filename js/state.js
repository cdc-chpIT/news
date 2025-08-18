// TRONG FILE: cdc-chpit/news/news-8e796fbd241e197f2e46d36b22e2866019584d32/js/state.js

// Thêm published_from và published_to vào trạng thái ban đầu
let queryState = {
    search: '',
    sentiment: '',
    category_id: null,
    source_id: null, 
    crawl_keyword_id: [],
    keyword_logic: 'or',
    sort_by: 'published_at',
    sort_order: 'desc',
    page: 1,
    size: 9,
    published_from: '', 
    published_to: ''   
};

let savedArticleIds = new Set();
let savedProcurements = new Map();

// Cập nhật hàm updateQueryState để xử lý đúng
function updateQueryState(updates, callback) {
    queryState = { ...queryState, ...updates, page: 1 };
    if (callback) callback();
}

function updatePageState(updates, callback) {
     queryState = { ...queryState, ...updates };
     if (callback) callback();
}

// Thêm published_from và published_to vào hàm reset
function resetQueryState(callback) {
    queryState = {
        search: '', sentiment: '', category_id: null, source_id: null, crawl_keyword_id: [], 
        keyword_logic: 'or', sort_by: 'published_at', sort_order: 'desc', page: 1, size: 9,
        published_from: '', 
        published_to: ''    
    };
    if (callback) callback();
}