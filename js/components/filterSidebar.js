function createFilterSidebar() {
    return `
        <div class="filter-sidebar sticky-top">
            <h5 class="fw-bold border-bottom pb-2 mb-3"><i class="bi bi-funnel-fill me-2"></i>Bộ lọc & Tìm kiếm</h5>
            
            <div class="mb-3">
                <label for="article-search-input" class="form-label fw-semibold">Tìm bài viết</label>
                <div class="input-group">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" id="article-search-input" class="form-control" placeholder="Tiêu đề, nội dung...">
                </div>
            </div>
            
            <div class="mb-3">
                <label for="source-filter" class="form-label fw-semibold">Lọc theo nguồn</label>
                <select id="source-filter" class="form-select">
                    <option value="" selected>Tất cả nguồn</option>
                    </select>
            </div>

            <div class="mb-3 position-relative">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <label for="keyword-search-input" class="form-label fw-semibold mb-0">Lọc theo từ khóa</label>
                    <div id="keyword-logic-toggle" class="btn-group btn-group-sm" role="group" aria-label="Keyword search logic">
                        <input type="radio" class="btn-check" name="keyword_logic" id="logic-or" value="or" autocomplete="off" checked>
                        <label class="btn btn-outline-primary" for="logic-or" title="Hiển thị bài viết chứa BẤT KỲ từ khóa nào đã chọn">OR</label>

                        <input type="radio" class="btn-check" name="keyword_logic" id="logic-and" value="and" autocomplete="off">
                        <label class="btn btn-outline-primary" for="logic-and" title="Hiển thị bài viết chứa TẤT CẢ các từ khóa đã chọn">AND</label>
                    </div>
                </div>
                
                <div id="selected-keyword-container" class="mb-2"></div>
                
                <div id="keyword-input-wrapper">
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-tags-fill"></i></span>
                        <input type="text" id="keyword-search-input" class="form-control" placeholder="Gõ để tìm từ khóa...">
                    </div>
                    <div id="keyword-suggestions" class="autocomplete-suggestions list-group"></div>
                </div>
            </div>

            <div class="mb-3">
                <label for="sentiment-filter" class="form-label fw-semibold">Sắc thái</label>
                <select id="sentiment-filter" class="form-select">
                    <option value="">Tất cả</option>
                    <option value="positive">Tích cực</option>
                    <option value="negative">Tiêu cực</option>
                    <option value="neutral">Trung tính</option>
                </select>
            </div>

            <div class="mb-3">
                <label class="form-label fw-semibold">Lọc theo ngày xuất bản</label>
                <div class="input-group">
                    <input type="date" id="start-date-filter" class="form-control" placeholder="Ngày bắt đầu">
                    <span class="input-group-text">-</span>
                    <input type="date" id="end-date-filter" class="form-control" placeholder="Ngày kết thúc">
                </div>
            </div>

            <div class="mb-4">
                   <label class="form-label fw-semibold">Sắp xếp</label>
                   <div class="input-group">
                        <select id="sort-by" class="form-select">
                            <option value="published_at">Ngày xuất bản</option>
                            <option value="title">Tiêu đề</option>
                        </select>
                        <button id="sort-order-btn" class="btn btn-outline-secondary" data-order="desc"><i class="bi bi-sort-down"></i></button>
                   </div>
            </div>
            
            <div class="d-grid mb-4">
               <button id="reset-filters-btn" class="btn btn-sm btn-outline-danger"><i class="bi bi-arrow-counterclockwise me-2"></i>Xóa tất cả bộ lọc</button>
            </div>

            <div class="mb-4">
                <h6 class="fw-semibold">Lọc theo danh mục</h6>
                <div id="category-filter-list" class="tag-filter-container">
                    <div class="text-center"><div class="spinner-border spinner-border-sm" role="status"></div></div>
                </div>
            </div>
        </div>
    `;
}