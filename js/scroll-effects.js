// updated file: cdc-chpit/news/news-91ffb72db5ca0a8bb43a3078e9c3d4f3a9879c66/js/scroll-effects.js
document.addEventListener('DOMContentLoaded', () => {
    const headerWrapper = document.querySelector('.sticky-header-wrapper');

    if (!headerWrapper) {
        return; // Thoát nếu không tìm thấy wrapper
    }

    // Lắng nghe sự kiện cuộn trên toàn bộ cửa sổ trang
    window.addEventListener('scroll', () => {
        // Nếu cuộn xuống hơn 10px, thêm lớp 'scrolled'
        if (window.scrollY > 10) {
            headerWrapper.classList.add('scrolled');
        } else {
            // Ngược lại, xóa lớp 'scrolled'
            headerWrapper.classList.remove('scrolled');
        }
    });
});