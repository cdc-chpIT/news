// js/auth_config.js

const GOOGLE_CLIENT_ID = "151555212192-mnp8nrt9585rd0bae52uc4kcfr8uman8.apps.googleusercontent.com";

// URI callback phải khớp với những gì đã đăng ký trên Google Cloud Console
const REDIRECT_URI_PROD = "https://cdc-chpit.github.io/news/auth_callback.html"; 
const REDIRECT_URI_DEV = "http://127.0.0.1:5500/auth_callback.html";

// Tự động chọn URI dựa trên môi trường
// So sánh hostname, không bao gồm http://
const isDevelopment = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';

const REDIRECT_URI = isDevelopment ? REDIRECT_URI_DEV : REDIRECT_URI_PROD;
