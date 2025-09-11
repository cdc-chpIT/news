/**
 * Creates the HTML for a sentiment indicator dot.
 * @param {string} sentiment - The sentiment value ('positive', 'negative', 'neutral').
 * @returns {string} The HTML string for the indicator.
 */
function createSentimentIndicator(sentiment) {
    // If no sentiment is provided, return an empty string
    if (!sentiment) return '';

    let sentimentClass = '';
    let sentimentTooltip = '';

    // Determine the class and tooltip text based on the sentiment value
    switch (sentiment.toLowerCase()) {
        case 'positive':
            sentimentClass = 'sentiment-positive';
            sentimentTooltip = 'Sắc thái: Tích cực';
            break;
        case 'negative':
            sentimentClass = 'sentiment-negative';
            sentimentTooltip = 'Sắc thái: Tiêu cực';
            break;
        case 'neutral':
            sentimentClass = 'sentiment-neutral';
            sentimentTooltip = 'Sắc thái: Trung tính';
            break;
        default:
            // Don't render anything for an unknown sentiment
            return '';
    }

    // Return the HTML for the indicator
    return `<div class="sentiment-indicator ${sentimentClass}" title="${sentimentTooltip}"></div>`;
}


function createArticleCard(article) {
    // --- Data preparation (no changes) ---
    const categoryName = article.category ? article.category.name : '';
    const keywordsHtml = (article.keywords || [])
        .map(kw => `<span class="badge bg-light text-dark border me-1 clickable-keyword" data-keyword-id="${kw.keyword_id}" data-keyword-text="${kw.keyword_text}">${kw.keyword_text}</span>`)
        .join('');
    const sentimentIndicatorHtml = createSentimentIndicator(article.sentiment);
    const publishedDate = article.published_at ? new Date(article.published_at).toLocaleDateString('vi-VN') : 'N/A';
    const isSaved = savedArticleIds.has(article.article_id);
    const saveIconClass = isSaved ? 'bi-bookmark-fill' : 'bi-bookmark';
    const saveIconTitle = isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết';
    const saveContainerClass = isSaved ? 'saved' : '';

    // --- HTML generation (no changes) ---
    const imageHtml = article.image_url ?
        `<img src="${article.image_url}" class="card-img-top" alt="${article.title.substring(0, 50)}" referrerpolicy="no-referrer" onerror="this.style.display='none';">` :
        `<div class="card-img-top bg-light d-flex align-items-center justify-content-center text-muted"><i class="bi bi-image" style="font-size: 3rem;"></i></div>`;
    const saveIconHtml = `
        <div class="save-icon-container ${saveContainerClass}" data-article-id="${article.article_id}" title="${saveIconTitle}">
            <i class="bi ${saveIconClass} save-icon"></i>
        </div>`;

    // --- Final card assembly ---
    return `
        <div class="col-lg-4 mb-4">
            <div class="card article-card shadow-sm h-100" data-article-id-wrapper="${article.article_id}">
                
                <a href="${article.url}" target="_blank" rel="noopener noreferrer" title="Mở bài viết trong tab mới">
                    ${imageHtml}
                </a>
                

                <div class="card-body d-flex flex-column">
                                                            <small class="text-muted mb-3">
                                                <strong>Ngày đăng:</strong>
                                            ${publishedDate}
                                            </small>

                    <div class="d-flex align-items-center mb-1">
                        ${sentimentIndicatorHtml}
                        ${categoryName ? `<span class="badge bg-primary-subtle text-primary-emphasis ms-2">${categoryName}</span>` : ''}
                    </div>
                    <h5 class="card-title fw-bold">${article.title}</h5>
                    <p class="card-text small text-muted mt-2">${(article.content || '').substring(0, 120)}...</p>
                    
                    <div class="mt-auto pt-3">
                        <div class="small text-muted mb-2">
                            <strong>Nguồn:</strong> ${article.source?.source_name || 'N/A'}
                        </div>

                        <div class="d-flex justify-content-between align-items-end">
                            <div class="keywords-footer-container">
                                ${keywordsHtml}
                            </div>
                            ${saveIconHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Cần đảm bảo hàm createSentimentIndicator cũng được cập nhật trong file này
function createSentimentIndicator(sentiment) {
    if (!sentiment) return '';
    let sentimentClass = '';
    switch (sentiment.toLowerCase()) {
        case 'positive': sentimentClass = 'sentiment-positive'; break;
        case 'negative': sentimentClass = 'sentiment-negative'; break;
        case 'neutral':  sentimentClass = 'sentiment-neutral'; break;
        default: return '';
    }
    // Chỉ trả về div, không cần title vì nó đã đi cùng danh mục
    return `<div class="sentiment-indicator ${sentimentClass}"></div>`;
}