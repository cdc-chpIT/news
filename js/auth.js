let allSavedArticles = [];
let allSavedProcurements = [];

/**
 * Sets a cookie.
 * @param {string} name - The name of the cookie.
 * @param {string} value - The value of the cookie.
 * @param {number} days - The number of days the cookie should last.
 */
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

/**
 * Gets a cookie by name.
 * @param {string} name - The name of the cookie.
 * @returns {string|null} The cookie value or null if not found.
 */
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const value = c.substring(nameEQ.length, c.length);
            // Decode the cookie value
            return decodeURIComponent(value);
        }
    }
    return null;
}

/**
 * Deletes a cookie by name.
 * @param {string} name - The name of the cookie to delete.
 */
function deleteCookie(name) {  
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

/**
 * Initiates the Google login flow.
 */
function googleLogin() {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'openid email profile');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    window.location.href = authUrl.toString();
}

/**
 * Logs the user out by deleting cookies and reloading the page.
 */
function logout() {
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('user');
    window.location.reload();
}

/**
 * Retrieves the current user's data from the cookie.
 * @returns {object|null} The user object or null if not logged in.
 */
function getCurrentUser() {
    const userCookie = getCookie('user');
    try {
        return userCookie ? JSON.parse(userCookie) : null;
    } catch (e) {
        console.error("Error parsing user cookie:", e);
        return null;
    }
}

/**
 * Renders a card for a saved procurement item.
 * @param {object} procurement - The procurement data object.
 * @returns {string} The HTML string for the card.
 */
function renderSavedProcurement(procurement) {
    const postedDate = procurement.published_at ? new Date(procurement.published_at).toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    }) : 'N/A';

    const linkHtml = procurement.original_link 
        ? `<a href="${procurement.original_link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-box-arrow-up-right me-1"></i>Mở link gốc</a>` 
        : '<div></div>';

    const itemTypeDisplay = procurement.item_type === 'tbmt' ? 'Thông báo mời thầu' : 'Kế hoạch LCNT';

    const unsaveButtonHtml = `
        <button class="btn btn-sm btn-danger unsave-procurement-btn" 
                title="Bỏ lưu"
                data-procurement-id="${procurement.user_procurement_id}"
                data-item-code="${procurement.item_code}">
            <i class="bi bi-bookmark-x-fill"></i>
        </button>
    `;

    return `
        <div class="card shadow-sm mb-3 position-relative">
            <div class="card-body">
                <h6 class="card-title mb-1">${procurement.project_name}</h6>
                <p class="card-subtitle mb-2 text-muted small">
                    <strong>Mã:</strong> ${procurement.item_code} | 
                    <strong>Loại:</strong> ${itemTypeDisplay}
                </p>
                <p class="card-text small mb-1">
                    <strong>Bên mời thầu:</strong> ${procurement.procuring_entity || 'N/A'}
                </p>
                <p class="card-text small">
                    <strong>Ngày đăng tải:</strong> ${postedDate}
                </p>
                
                <div class="d-flex justify-content-between align-items-center mt-3">
                    ${linkHtml}
                    ${unsaveButtonHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * Filters and displays the saved articles in the modal.
 */
function displaySavedArticles() {
    const listEl = document.getElementById('saved-articles-list');
    if (!listEl) return;

    const searchTerm = document.getElementById('saved-article-search').value.toLowerCase();
    const sentiment = document.getElementById('saved-article-sentiment').value;
    const sortBy = document.getElementById('saved-article-sort').value;

    let filtered = [...allSavedArticles];

    if (searchTerm) {
        filtered = filtered.filter(a =>
            (a.title && a.title.toLowerCase().includes(searchTerm)) ||
            (a.content && a.content.toLowerCase().includes(searchTerm))
        );
    }

    if (sentiment) {
        filtered = filtered.filter(a => a.sentiment && a.sentiment.toLowerCase() === sentiment);
    }

    filtered.sort((a, b) => {
        const dateA = new Date(sortBy.includes('published') ? a.published_at : a.saved_at);
        const dateB = new Date(sortBy.includes('published') ? b.published_at : b.saved_at);
        return sortBy.endsWith('_asc') ? dateA - dateB : dateB - dateA;
    });
    
    listEl.innerHTML = filtered.length > 0
        ? filtered.map(createArticleCard).join('')
        : '<div class="alert alert-info text-center">Không tìm thấy bài viết nào phù hợp.</div>';
}

/**
 * Filters and displays the saved procurement items in the modal.
 */
function displaySavedProcurements() {
    const listEl = document.getElementById('saved-procurements-list');
    if (!listEl) return;

    const searchTerm = document.getElementById('saved-procurement-search').value.toLowerCase();
    const sortBy = document.getElementById('saved-procurement-sort').value;

    let filtered = [...allSavedProcurements];

    if (searchTerm) {
        filtered = filtered.filter(p => p.project_name && p.project_name.toLowerCase().includes(searchTerm));
    }

    filtered.sort((a, b) => {
        const dateA = new Date(sortBy.includes('published') ? a.published_at : a.created_at);
        const dateB = new Date(sortBy.includes('published') ? b.published_at : b.created_at);
        return sortBy.endsWith('_asc') ? dateA - dateB : dateB - dateA;
    });

    listEl.innerHTML = filtered.length > 0
        ? filtered.map(renderSavedProcurement).join('')
        : '<div class="alert alert-info text-center">Không tìm thấy mục nào phù hợp.</div>';
}

/**
 * Injects the "My Account" modal HTML into the document body.
 */
function injectSavedItemsModal() {
    if (document.getElementById('savedItemsModal')) return;

    const modalHtml = `
    <div class="modal fade" id="savedItemsModal" tabindex="-1" aria-labelledby="savedItemsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-scrollable modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="savedItemsModalLabel"><i class="bi bi-person-circle me-2"></i>Tài khoản của tôi</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div id="modal-alert-container"></div>
                    <ul class="nav nav-tabs" id="savedItemsTab" role="tablist">
                        <li class="nav-item" role="presentation">
                            <button class="nav-link active" id="saved-articles-tab" data-bs-toggle="tab" data-bs-target="#saved-articles-pane" type="button" role="tab" aria-controls="saved-articles-pane" aria-selected="true">
                                <i class="bi bi-newspaper me-2"></i>Tin Tức Đã Lưu
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="saved-procurements-tab" data-bs-toggle="tab" data-bs-target="#saved-procurements-pane" type="button" role="tab" aria-controls="saved-procurements-pane" aria-selected="false">
                                <i class="bi bi-briefcase-fill me-2"></i>Mua sắm công Đã Lưu
                            </button>
                        </li>
                        <li class="nav-item" role="presentation">
                            <button class="nav-link" id="email-settings-tab" data-bs-toggle="tab" data-bs-target="#email-settings-pane" type="button" role="tab" aria-controls="email-settings-pane" aria-selected="false">
                                <i class="bi bi-envelope-at-fill me-2"></i>Cài đặt Email
                            </button>
                        </li>
                    </ul>
                    <div class="tab-content pt-3" id="savedItemsTabContent">
                        <div class="tab-pane fade show active" id="saved-articles-pane" role="tabpanel" aria-labelledby="saved-articles-tab" tabindex="0">
                            <!-- Saved Articles Content -->
                            <div class="row g-2 mb-3 p-2 border rounded bg-light">
                                <div class="col-12"><input type="text" id="saved-article-search" class="form-control" placeholder="Tìm theo tiêu đề, nội dung..."></div>
                                <div class="col-md-6"><select id="saved-article-sort" class="form-select"><option value="saved_at_desc">Lưu gần đây nhất</option><option value="published_at_desc">Ngày xuất bản (mới nhất)</option><option value="published_at_asc">Ngày xuất bản (cũ nhất)</option></select></div>
                                <div class="col-md-6"><select id="saved-article-sentiment" class="form-select"><option value="">Tất cả sắc thái</option><option value="positive">Tích cực</option><option value="negative">Tiêu cực</option><option value="neutral">Trung tính</option></select></div>
                            </div>
                            <div id="saved-articles-list" class="vstack gap-3"></div>
                        </div>
                        <div class="tab-pane fade" id="saved-procurements-pane" role="tabpanel" aria-labelledby="saved-procurements-tab" tabindex="0">
                             <!-- Saved Procurements Content -->
                             <div class="row g-2 mb-3 p-2 border rounded bg-light">
                                <div class="col-md-8"><input type="text" id="saved-procurement-search" class="form-control" placeholder="Tìm theo tên gói thầu..."></div>
                                <div class="col-md-4"><select id="saved-procurement-sort" class="form-select"><option value="saved_at_desc">Lưu gần đây nhất</option><option value="published_at_desc">Ngày đăng (mới nhất)</option><option value="published_at_asc">Ngày đăng (cũ nhất)</option></select></div>
                            </div>
                            <div id="saved-procurements-list" class="vstack gap-3"></div>
                        </div>
                        <div class="tab-pane fade" id="email-settings-pane" role="tabpanel" aria-labelledby="email-settings-tab" tabindex="0">
                            <!-- Email Settings Form -->
                            <form id="email-settings-form">
                                <div id="email-settings-alert-container"></div>
                                <p class="text-muted">Cấu hình hệ thống tự động gửi email tổng hợp tin tức mới theo lịch bạn chọn.</p>
                                
                                <div class="form-check form-switch mb-4 fs-5">
                                    <input class="form-check-input" type="checkbox" role="switch" id="emailScheduleActive">
                                    <label class="form-check-label" for="emailScheduleActive">Kích hoạt gửi email định kỳ</label>
                                </div>

                                <fieldset id="email-schedule-fieldset">
                                    <div class="mb-3">
                                        <label class="form-label fw-semibold">Chọn ngày gửi trong tuần:</label>
                                        <div id="emailDaysOfWeek" class="d-flex flex-wrap gap-2">
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Monday" id="day-mon"><label class="form-check-label" for="day-mon">T2</label></div>
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Tuesday" id="day-tue"><label class="form-check-label" for="day-tue">T3</label></div>
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Wednesday" id="day-wed"><label class="form-check-label" for="day-wed">T4</label></div>
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Thursday" id="day-thu"><label class="form-check-label" for="day-thu">T5</label></div>
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Friday" id="day-fri"><label class="form-check-label" for="day-fri">T6</label></div>
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Saturday" id="day-sat"><label class="form-check-label" for="day-sat">T7</label></div>
                                            <div class="form-check"><input class="form-check-input" type="checkbox" value="Sunday" id="day-sun"><label class="form-check-label" for="day-sun">CN</label></div>
                                        </div>
                                    </div>
                                    <div class="row">
                                        <div class="col-md-12 mb-3">
                                            <label for="emailTimeOfDay" class="form-label fw-semibold">Thời gian gửi (UTC):</label>
                                            <input type="time" class="form-control" id="emailTimeOfDay" required>
                                        </div>
                                    </div>
                                </fieldset>
                                
                                <hr>
                                <div class="d-flex justify-content-end">
                                    <button type="submit" id="saveEmailSettingsBtn" class="btn btn-primary">
                                        <i class="bi bi-save-fill me-2"></i>Lưu thay đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

/**
 * Initializes the authentication UI, showing either the user dropdown or the login button.
 */
async function initializeAuthUI() {
    const authContainer = document.getElementById('auth-status-container');
    if (!authContainer) return;
    const user = getCurrentUser();

    if (user) {
        // FIX: Make data fetching resilient to failures (e.g., new user without a schedule)
        try {
            const results = await Promise.allSettled([
                apiService.getSavedArticleIds(),
                apiService.fetchUserProcurements()
            ]);

            const articlesResult = results[0];
            const procurementsResult = results[1];

            if (articlesResult.status === 'fulfilled' && articlesResult.value.success) {
                savedArticleIds = new Set(articlesResult.value.data);
            } else if (articlesResult.status === 'rejected') {
                console.error("Could not fetch saved articles:", articlesResult.reason);
            }

            if (procurementsResult.status === 'fulfilled' && procurementsResult.value.success) {
                savedProcurements.clear();
                procurementsResult.value.data.forEach(item => {
                    savedProcurements.set(item.item_code, item.user_procurement_id);
                });
            } else if (procurementsResult.status === 'rejected') {
                console.error("Could not fetch saved procurements:", procurementsResult.reason);
            }
        } catch (error) {
            console.error("An unexpected error occurred during initial data fetch:", error);
        }

        // Render user dropdown menu
        authContainer.innerHTML = `
            <div class="dropdown">
                <img src="${user.avatar_url}" alt="${user.username}" id="user-avatar" class="user-avatar dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" title="Tài khoản của tôi">
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="user-avatar">
                    <li><span class="dropdown-item-text">Chào, <strong>${user.username}</strong></span></li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item" href="#" id="my-account-link">
                            <i class="bi bi-person-circle me-2"></i>Tài khoản của tôi
                        </a>
                    </li>
                    <li><button class="dropdown-item" id="logout-btn"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</button></li>
                </ul>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', logout);
        
        injectSavedItemsModal();

        const myAccountLink = document.getElementById('my-account-link');
        const savedItemsModalElement = document.getElementById('savedItemsModal');

        if (myAccountLink && savedItemsModalElement) {
            const savedItemsModal = new bootstrap.Modal(savedItemsModalElement);
            
            setupModalEventListeners(savedItemsModalElement, savedItemsModal);
            
            myAccountLink.addEventListener('click', (event) => {
                event.preventDefault();
                // Load data for the default active tab when the modal is opened
                loadSavedArticles();
                savedItemsModal.show();
            });
        }
    } else {
        // Render login button if no user is logged in
        authContainer.innerHTML = `
            <button id="login-btn" class="btn btn-outline-primary d-flex align-items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                <span>Đăng nhập với Google</span>
            </button>
        `;
        document.getElementById('login-btn').addEventListener('click', googleLogin);
    }
}

/**
 * Sets up all event listeners for the modal content.
 * @param {HTMLElement} modalElement - The main modal element.
 */
function setupModalEventListeners(modalElement) {
    // Listen for filter changes
    modalElement.addEventListener('input', e => {
        if (e.target.id === 'saved-article-search') displaySavedArticles();
        if (e.target.id === 'saved-procurement-search') displaySavedProcurements();
    });
    modalElement.addEventListener('change', e => {
        if (e.target.id === 'saved-article-sort' || e.target.id === 'saved-article-sentiment') displaySavedArticles();
        if (e.target.id === 'saved-procurement-sort') displaySavedProcurements();
    });

    // Listen for tab switches to load data on demand
    document.getElementById('email-settings-tab')?.addEventListener('show.bs.tab', populateEmailSettingsForm);
    document.getElementById('saved-articles-tab')?.addEventListener('show.bs.tab', loadSavedArticles);
    document.getElementById('saved-procurements-tab')?.addEventListener('show.bs.tab', loadSavedProcurements);

    // Listen for email settings form submission
    document.getElementById('email-settings-form')?.addEventListener('submit', handleSaveEmailSettings);

    // Listen for the schedule active/inactive switch
    document.getElementById('emailScheduleActive')?.addEventListener('change', (e) => {
        document.getElementById('email-schedule-fieldset').disabled = !e.target.checked;
    });

    // Listen for clicks on unsave buttons
    modalElement.addEventListener('click', handleUnsaveActions);
}

/**
 * Fetches and populates the email settings form with the user's current schedule.
 */
async function populateEmailSettingsForm() {
    const form = document.getElementById('email-settings-form');
    const fieldset = document.getElementById('email-schedule-fieldset');
    const alertContainer = document.getElementById('email-settings-alert-container');
    
    alertContainer.innerHTML = '';
    fieldset.disabled = true;
    form.reset(); // Reset form to default state

    try {
        const result = await apiService.fetchUserSchedule();
        if (result.success && result.data) {
            const { is_active, days_of_week, time_of_day } = result.data;
            
            document.getElementById('emailScheduleActive').checked = is_active;
            fieldset.disabled = !is_active;

            document.getElementById('emailTimeOfDay').value = time_of_day || '';
            
            if (days_of_week && Array.isArray(days_of_week)) {
                days_of_week.forEach(day => {
                    // FIX: Convert API day (e.g., "MONDAY") to Title Case (e.g., "Monday") to match checkbox value
                    const formattedDay = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
                    const dayCheckbox = form.querySelector(`input[value="${formattedDay}"]`);
                    if (dayCheckbox) {
                        dayCheckbox.checked = true;
                    }
                });
            }
        }
    } catch (error) {
        // FIX: Check the error message string directly for the "not set" text
        const isNotFoundError = error.message && error.message.includes("Notification schedule not set for this user");
        
        if (!isNotFoundError) {
            // This is an unexpected error, so we show a generic message.
            console.error("An unexpected error occurred while fetching the user schedule:", error);
            alertContainer.innerHTML = `<div class="alert alert-danger">Lỗi không xác định khi tải cài đặt.</div>`;
        }
        // For "NOT_FOUND" errors, we do nothing and show no message.
    }
}


/**
 * Handles the submission of the email settings form.
 * @param {Event} event - The form submission event.
 */
async function handleSaveEmailSettings(event) {
    event.preventDefault();
    const saveBtn = document.getElementById('saveEmailSettingsBtn');
    const alertContainer = document.getElementById('email-settings-alert-container');
    
    alertContainer.innerHTML = '';
    const originalBtnHtml = saveBtn.innerHTML;

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Đang lưu...`;

    try {
        const isActive = document.getElementById('emailScheduleActive').checked;
        
        // Always get the current values from the form, even if disabled
        const selectedDays = Array.from(document.querySelectorAll('#emailDaysOfWeek .form-check-input:checked'))
                                  .map(chk => chk.value);
        const timeOfDay = document.getElementById('emailTimeOfDay').value;

        // If the schedule is active, perform validation
        if (isActive) {
            if (selectedDays.length === 0) {
                throw new Error("Vui lòng chọn ít nhất một ngày trong tuần để gửi email.");
            }
            if (!timeOfDay) {
                throw new Error("Vui lòng chọn thời gian gửi email.");
            }
        }

        const payload = {
            is_active: isActive,
            days_of_week: selectedDays,
            time_of_day: timeOfDay || '' // Send empty string if time is not set
        };

        const result = await apiService.updateUserSchedule(payload);
        if (result.success) {
            alertContainer.innerHTML = `<div class="alert alert-success">Cài đặt đã được lưu thành công!</div>`;
        } else {
            throw new Error(result.message || 'Lưu thất bại.');
        }
    } catch (error) {
        alertContainer.innerHTML = `<div class="alert alert-danger">Lỗi: ${error.message}</div>`;
    } finally {
        setTimeout(() => {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalBtnHtml;
            // Clear the success/error message after a delay
            if(alertContainer.querySelector('.alert-success')) {
               alertContainer.innerHTML = '';
            }
        }, 3000);
    }
}

/**
 * Fetches and renders the list of saved articles.
 */
async function loadSavedArticles() {
    const listEl = document.getElementById('saved-articles-list');
    listEl.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const result = await apiService.fetchSavedArticles();
        if (result.success && Array.isArray(result.data)) {
            allSavedArticles = result.data;
            // Add a dummy saved_at for sorting purposes as API doesn't provide it
            allSavedArticles.forEach(a => a.saved_at = a.saved_at || new Date()); 
            displaySavedArticles();
        } else { throw new Error(result.message || "Không thể tải bài viết đã lưu."); }
    } catch(error) {
        listEl.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}

/**
 * Fetches and renders the list of saved procurement items.
 */
async function loadSavedProcurements() {
    const listEl = document.getElementById('saved-procurements-list');
    listEl.innerHTML = '<div class="text-center p-5"><div class="spinner-border text-primary"></div></div>';
    try {
        const result = await apiService.fetchUserProcurements();
        if (result.success && Array.isArray(result.data)) {
            allSavedProcurements = result.data;
            displaySavedProcurements();
        } else { throw new Error(result.message || "Không thể tải mục mua sắm công đã lưu."); }
    } catch (error) {
        listEl.innerHTML = `<div class="alert alert-danger">${error.message}</div>`;
    }
}

/**
 * Handles click events for unsaving articles and procurements within the modal.
 * @param {Event} event - The click event.
 */
async function handleUnsaveActions(event) {
    const unsaveArticleBtn = event.target.closest('.save-icon-container');
    const unsaveProcurementBtn = event.target.closest('.unsave-procurement-btn');
    
    if (!unsaveArticleBtn && !unsaveProcurementBtn) return;

    const modalAlertContainer = document.getElementById('modal-alert-container');
    
    const fadeOutAndRemove = (element) => {
        const card = element.closest('.card');
        if (card) {
            card.style.transition = 'opacity 0.3s ease';
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        }
    };
    
    const checkAndShowEmptyMessage = (listElement, type) => {
        setTimeout(() => {
            if (listElement.children.length === 0) {
                listElement.innerHTML = `<div class="alert alert-info text-center">Bạn chưa lưu ${type === 'article' ? 'bài viết' : 'mục'} nào.</div>`;
            }
        }, 350);
    };

    if (unsaveArticleBtn) {
        event.preventDefault();
        event.stopPropagation();
        const articleId = unsaveArticleBtn.dataset.articleId;
        unsaveArticleBtn.style.pointerEvents = 'none'; // Prevent double clicks
        try {
            await apiService.unsaveArticle(articleId);
            fadeOutAndRemove(unsaveArticleBtn);
            savedArticleIds.delete(parseInt(articleId, 10));
            checkAndShowEmptyMessage(document.getElementById('saved-articles-list'), 'article');
            // Update the save icon on the main news page if it exists
            const mainPageIcon = document.querySelector(`.article-card[data-article-id-wrapper="${articleId}"] .save-icon-container`);
            if (mainPageIcon) {
                mainPageIcon.classList.remove('saved');
                mainPageIcon.title = 'Lưu bài viết';
                mainPageIcon.querySelector('.save-icon').className = 'bi bi-bookmark save-icon';
            }
        } catch (error) {
            modalAlertContainer.innerHTML = `<div class="alert alert-danger alert-dismissible fade show">Lỗi: ${error.message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
            unsaveArticleBtn.style.pointerEvents = 'auto'; // Re-enable on error
        }
    }

    if (unsaveProcurementBtn) {
        event.preventDefault();
        const { procurementId, itemCode } = unsaveProcurementBtn.dataset;
        unsaveProcurementBtn.disabled = true;
         try {
            await apiService.deleteUserProcurement(procurementId);
            fadeOutAndRemove(unsaveProcurementBtn);
            savedProcurements.delete(itemCode);
            checkAndShowEmptyMessage(document.getElementById('saved-procurements-list'), 'procurement');
            // Update the save button on the scraper page if it exists
            const mainPageBtn = document.querySelector(`.save-procurement-btn[data-item-code="${itemCode}"]`);
            if (mainPageBtn) {
                mainPageBtn.dataset.isSaved = 'false';
                mainPageBtn.title = 'Lưu tin';
                mainPageBtn.querySelector('i').className = 'bi bi-bookmark';
            }
        } catch (error) {
             modalAlertContainer.innerHTML = `<div class="alert alert-danger alert-dismissible fade show">Lỗi: ${error.message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
             unsaveProcurementBtn.disabled = false; // Re-enable on error
        }
    }
}
