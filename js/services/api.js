// File: cdc-chpit/news/news-218ec43bcb0d9af4130d53308cae379978fd43b6/js/services/api.js

const API_BASE_URL = config.API_BASE_URL;

const apiService = {
    async _request(endpoint, options = {}) {
        const token = getCookie('accessToken');
        const headers = {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...options.headers,
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Default cache option is 'default', can be overridden
        const fetchOptions = {
            headers,
            cache: options.cache || 'default',
            ...options,
        };


        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);

            if (response.status === 401 || response.status === 403) {
                // Chỉ thực hiện đăng xuất nếu người dùng đang có thông tin đăng nhập trong cookie
                if (getCookie('user')) {
                    console.log("Token đã hết hạn hoặc không hợp lệ. Tự động đăng xuất.");
                    // Gọi hàm logout() đã được định nghĩa trong auth.js
                    logout();
                    // Ném một lỗi đặc biệt để dừng việc thực thi các lệnh phía sau
                    throw new Error('Unauthorized');
                }
            }

            if (response.status === 204) { // Xử lý cho trường hợp xóa thành công (No Content)
                return { success: true, message: 'Xóa thành công.' };
            }

            const result = await response.json();
            if (!response.ok) {
                let errorMsg = 'Có lỗi không xác định từ API.';
                if (result.message) {
                    errorMsg = result.message;
                } else if (result.detail) {
                    // If detail is an object/array, stringify it for better logging.
                    errorMsg = typeof result.detail === 'string' ? result.detail : JSON.stringify(result.detail);
                }
                throw new Error(errorMsg);
            }
            return result;

         } catch (error) {
        // Nếu lỗi là 'Unauthorized' thì không cần log ra console vì đó là hành vi mong muốn
        if (error.message !== 'Unauthorized') {
            console.error(`Lỗi khi thực hiện yêu cầu đến ${endpoint}:`, error);
        }
        // Ném lỗi ra ngoài để hàm gọi có thể bắt và xử lý
        throw error;
    }
    },

    /**
     * Hàm fetch đã được tối ưu hóa để xử lý tham số dạng mảng.
     * @param {string} endpoint - Đường dẫn API.
     * @param {object} params - Các tham số truy vấn.
     * @returns {Promise<object|null>}
     */
    async _fetch(endpoint, params = {}, fetchOptions = {}) {
        const urlParams = new URLSearchParams();
        for (const key in params) {
            const value = params[key];
            if (value !== null && value !== '' && value !== undefined) {
                if (Array.isArray(value)) {
                    value.forEach(item => urlParams.append(key, item));
                } else {
                    urlParams.append(key, value);
                }
            }
        }
        const queryString = urlParams.toString();
        const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this._request(fullEndpoint, { method: 'GET', ...fetchOptions });
    },

    // --- APIs cho Articles ---
    fetchArticles(params) {
        return this._fetch('/articles/', params);
    },

    crawlArticles() {
        return this._request('/articles/crawl', { method: 'POST' });
    },

    scrapeTables(url, page) {
        return this._request('/scrape/tables', {
            method: 'POST',
            body: JSON.stringify({ url: url, pages: page }),
        });
    },
    
    getProcurementLinks(items) {
        // Calls the new endpoint shown in your screenshots
        return this._request('/procurement/get-links', {
            method: 'POST',
            body: JSON.stringify(items),
        });
    },

    // --- APIs cho Categories ---
    fetchCategories() {
        return this._fetch('/categories/');
    },

    // --- APIs cho Sources ---
    fetchSources(params) {
        return this._fetch('/sources/', params);
    },
    
    createSource(data) {
        return this._request('/sources/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    updateSource(sourceId, data) {
        return this._request(`/sources/${sourceId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteSource(sourceId) {
        return this._request(`/sources/${sourceId}`, {
            method: 'DELETE',
        });
    },
    
    fetchSource(sourceId) {
        return this._fetch(`/sources/${sourceId}`);
    },

    // --- APIs cho Keywords (CRUD) ---
    fetchKeywords(params) {
        return this._fetch('/keywords/', params);
    },
    
    createKeyword(data) {
        return this._request('/keywords/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    updateKeyword(keywordId, data) {
        return this._request(`/keywords/${keywordId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    deleteKeyword(keywordId) {
        return this._request(`/keywords/${keywordId}`, {
            method: 'DELETE',
        });
    },

    // --- APIs cho Dashboard ---
    fetchDashboardStats() {
        return this._fetch('/dashboard/stats');
    },

    fetchSentimentDistribution() {
        return this._fetch('/dashboard/sentiment-distribution');
    },

    fetchSentimentOverTime(period = 'day') {
        return this._fetch('/dashboard/sentiment-over-time', { period });
    },

    fetchTopCategories(limit = 5) {
        return this._fetch('/dashboard/top-categories', { limit });
    },

    fetchTopKeywords(limit = 10) {
        return this._fetch('/dashboard/top-keywords', { limit });
    },
    
    sendLatestArticlesByEmail() {
        return this._request('/dashboard/send-latest-articles', { method: 'POST' });
    },

    // --- APIs cho Categories (CRUD) ---
    fetchCategory(categoryId) {
        return this._fetch(`/categories/${categoryId}`);
    },
    
    createCategory(data) {
        return this._request('/categories/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
    
    updateCategory(categoryId, data) {
        return this._request(`/categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    deleteCategory(categoryId) {
        return this._request(`/categories/${categoryId}`, {
            method: 'DELETE',
        });
    },
    getSavedArticleIds() {
        return this._request('/users/me/saved-articles/', { cache: 'no-cache' });
    },

    fetchSavedArticles() {
        return this._request('/users/me/saved-articles/details', { cache: 'no-cache' });
    },

    saveArticle(articleId) {
        return this._request('/users/me/saved-articles/', {
            method: 'POST',
            body: JSON.stringify({ article_id: articleId }),
        });
    },

    unsaveArticle(articleId) {
        return this._request(`/users/me/saved-articles/${articleId}`, {
            method: 'DELETE',
        });
    },

    fetchUserProcurements() {
        return this._request('/user-procurements/', { method: 'GET', cache: 'no-cache' });
    },

    saveUserProcurement(procurementData) {
        return this._request('/user-procurements/', {
            method: 'POST',
            body: JSON.stringify(procurementData)
        });
    },

    deleteUserProcurement(userProcurementId) {
        return this._request(`/user-procurements/${userProcurementId}`, {
            method: 'DELETE'
        });
    },

    // --- APIs for User Preferences ---
    fetchUserSchedule() {
        return this._request('/users/me/preferences/schedule', { method: 'GET' });
    },

    updateUserSchedule(scheduleData) {
        return this._request('/users/me/preferences/schedule', {
            method: 'PUT',
            body: JSON.stringify(scheduleData)
        });
    },

    fetchUserKeywords() {
        return this._fetch('/users/me/preferences/keywords', {}, { cache: 'no-cache' });
    },

    setUserKeywords(keywordTexts) {
        if (keywordTexts === null) {
            return Promise.resolve({ success: true, message: 'Không có từ khóa mới để thêm.' });
        }
        if (!Array.isArray(keywordTexts)) {
            return Promise.reject(new Error("Invalid data provided to setUserKeywords. Expected an array."));
        }
        return this._request('/users/me/preferences/keywords', {
            method: 'POST',
            body: JSON.stringify({ keywords: keywordTexts })
        });
    },
    
    removeUserKeyword(customKeywordId) {
        return this._request(`/users/me/preferences/keywords/${customKeywordId}`, {
            method: 'DELETE'
        });
    },

    fetchAdbRssFeed(filterPath = 'all/all/all/all/all/all/all') {
        const token = getCookie('accessToken');
        const headers = { 'ngrok-skip-browser-warning': 'true' };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = `${API_BASE_URL}/adb/rss?filters=${filterPath}`;
        
        return fetch(url, { headers })
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => { 
                        throw new Error(`Lỗi từ backend: Status ${res.status} - ${text}`); 
                    });
                }
                return res.text();
            })
            .catch(error => {
                console.error("Lỗi khi gọi fetchAdbRssFeed:", error);
                throw error;
            });
    },
    
    fetchWorldBankProjects(params) {
        return this._fetch('/worldbank/projects', params);
    },

    getSavedWorldBankProjects() {
        return this._request('/worldbank/saved-projects', { method: 'GET', cache: 'no-cache' });
    },

    saveWorldBankProject(projectData) {
        return this._request('/worldbank/saved-projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },

    deleteWorldBankProject(userWorldbankId) {
        return this._request(`/worldbank/saved-projects/${userWorldbankId}`, {
            method: 'DELETE'
        });
    },

    // --- APIs for User Saved ADB Projects ---
    getSavedAdbProjects() {
        return this._request('/adb/saved-projects', { method: 'GET', cache: 'no-cache' });
    },

    saveAdbProject(projectData) {
        return this._request('/adb/saved-projects', {
            method: 'POST',
            body: JSON.stringify(projectData)
        });
    },

    deleteAdbProject(userAdbId) {
        return this._request(`/adb/saved-projects/${userAdbId}`, {
            method: 'DELETE'
        });
    },
};