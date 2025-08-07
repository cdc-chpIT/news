function createPagination(paginationData) {
    const { page: currentPage, pages: totalPages } = paginationData;
    if (totalPages <= 1) return '';

    const createPageItem = (p, text = p, active = false, disabled = false) => 
        `<li class="page-item ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${p}">${text}</a>
        </li>`;

    const createEllipsisItem = () => `<li class="page-item disabled"><span class="page-link">...</span></li>`;

    const windowSize = 2;
    let html = '<ul class="pagination pagination-sm">';
    
    // Nút Lùi « (bị vô hiệu hóa ở trang 1)
    html += createPageItem(currentPage - 1, '&laquo;', false, currentPage === 1);

    // Logic hiển thị trang đầu và dấu "..."
    if (currentPage > windowSize + 1) {
        html += createPageItem(1);
        if (currentPage > windowSize + 2) {
            html += createEllipsisItem();
        }
    }

    // Vòng lặp chính để hiển thị các số trang xung quanh trang hiện tại
    for (let i = Math.max(1, currentPage - windowSize); i <= Math.min(totalPages, currentPage + windowSize); i++) {
        html += createPageItem(i, i, i === currentPage);
    }

    // Logic hiển thị trang cuối và dấu "..."
    if (currentPage < totalPages - windowSize) {
        if (currentPage < totalPages - windowSize - 1) {
            html += createEllipsisItem();
        }
        html += createPageItem(totalPages);
    }
    
    // Nút Tiến » (bị vô hiệu hóa ở trang cuối)
    html += createPageItem(currentPage + 1, '&raquo;', false, currentPage === totalPages);
    html += '</ul>';
    return html;
}