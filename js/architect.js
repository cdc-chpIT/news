// js/architect.js

document.addEventListener('DOMContentLoaded', () => {
    const dom = {
        header: document.getElementById('header-container'),
        navbar: document.getElementById('navbar-container'),
        resultsContainer: document.getElementById('architect-results-container'),
        alertContainer: document.getElementById('alert-container'),
    };

    function renderLayout() {
        dom.header.innerHTML = createHeader('Thi tuyển kiến trúc');
        dom.navbar.innerHTML = createNavbar('architect');
        // initializeAuthUI(); // Bỏ comment nếu muốn hiện avatar user
    }

    function showAlert(message, type = 'danger') {
        dom.alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
    }

    // Hàm làm sạch HTML trong description của Google News
    function cleanDescription(htmlString) {
        const doc = new DOMParser().parseFromString(htmlString, 'text/html');
        // Xóa các thẻ a (vì link google news hay bị duplicate)
        const links = doc.querySelectorAll('a');
        links.forEach(l => l.remove());
        return doc.body.textContent || "";
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
    }

    function renderTable(items) {
        if (!items || items.length === 0) {
            dom.resultsContainer.innerHTML = '<div class="alert alert-info text-center">Không tìm thấy tin tức nào.</div>';
            return;
        }

        const rowsHtml = items.map(item => {
            const title = item.querySelector("title")?.textContent || 'Không có tiêu đề';
            const link = item.querySelector("link")?.textContent || '#';
            const pubDate = item.querySelector("pubDate")?.textContent || '';
            // Google News description thường chứa HTML, ta có thể lấy nguồn từ đó hoặc hiển thị snippet
            const descriptionHtml = item.querySelector("description")?.textContent || '';
            
            // Trích xuất tên nguồn từ title (thường Google News để dạng "Tiêu đề - Tên Báo")
            let sourceName = "Google News";
            const titleParts = title.lastIndexOf(" - ");
            let displayTitle = title;
            if (titleParts > -1) {
                sourceName = title.substring(titleParts + 3);
                displayTitle = title.substring(0, titleParts);
            }

            return `
                <tr>
                    <td>
                        <a href="${link}" target="_blank" class="fw-bold text-decoration-none text-dark hover-primary">
                            ${displayTitle}
                        </a>
                        <div class="small text-muted mt-1">${cleanDescription(descriptionHtml).substring(0, 150)}...</div>
                    </td>
                    <td class="text-center"><span class="badge bg-light text-dark border">${sourceName}</span></td>
                    <td class="text-center small text-nowrap">${formatDate(pubDate)}</td>
                    <td class="text-center">
                        <a href="${link}" target="_blank" class="btn btn-sm btn-outline-primary">
                            <i class="bi bi-box-arrow-up-right"></i> Xem
                        </a>
                    </td>
                </tr>
            `;
        }).join('');

        dom.resultsContainer.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th style="width: 60%">Tiêu đề</th>
                            <th style="width: 20%" class="text-center">Nguồn</th>
                            <th style="width: 10%" class="text-center">Ngày đăng</th>
                            <th style="width: 10%" class="text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;
    }

    async function fetchAndRender() {
        dom.resultsContainer.innerHTML = `<div class="text-center p-5"><div class="spinner-border text-primary"></div><div class="mt-2">Đang tải tin tức từ Google News...</div></div>`;
        try {
            const xmlText = await apiService.fetchArchitectRss();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "application/xml");
            
            const items = Array.from(xmlDoc.querySelectorAll("item"));
            renderTable(items);

        } catch (error) {
            console.error(error);
            showAlert(`Lỗi tải dữ liệu: ${error.message}`);
            dom.resultsContainer.innerHTML = '';
        }
    }

    // Init
    renderLayout();
    fetchAndRender();
});