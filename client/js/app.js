// Main JavaScript file for the Polling Application

// API base URL
// NOTE FOR RAILWAY DEPLOYMENT: Update this URL to match your backend API endpoint
const API_BASE_URL = 'https://polls-api-production.up.railway.app';

// DOM Elements
const pollsContainer = document.getElementById('polls-container');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const authModal = new bootstrap.Modal(document.getElementById('authModal'));
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const authModalTitle = document.getElementById('authModalTitle');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const userControls = document.getElementById('user-controls');
const usernameSpan = document.getElementById('username');
const createPollBtn = document.getElementById('create-poll-btn');
const myPollsBtn = document.getElementById('my-polls-btn');
const appLogo = document.getElementById('app-logo');
const pollsHeading = document.getElementById('polls-heading'); // Add reference to the heading element

// Check if user is logged in
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        document.getElementById('auth-nav').classList.add('d-none');
        userControls.classList.remove('d-none');
        usernameSpan.textContent = localStorage.getItem('username');
        return true;
    } else {
        document.getElementById('auth-nav').classList.remove('d-none');
        userControls.classList.add('d-none');
        return false;
    }
}

// Function to get current polls endpoint
function getCurrentPollsEndpoint() {
    // Check if we're viewing "My Polls"
    if (myPollsBtn && myPollsBtn.classList.contains('btn-primary')) {
        return '/polls/my-polls';
    }
    return '/polls/';
}

// Fetch all polls
async function fetchPolls(endpoint = '/polls/') {
    try {
        pollsContainer.innerHTML = '<div class="text-center w-100"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
        
        const headers = {};
        
        // Always add authorization header if user is logged in
        // This enables identifying the user's polls in the main list
        if (localStorage.getItem('token')) {
            headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch polls');
        }
        
        const data = await response.json();
        
        // Debug poll data structure
        if (data.polls && data.polls.length > 0) {
            console.log('Sample poll structure:', JSON.stringify(data.polls[0]));
        }
        
        displayPolls(data.polls, endpoint);
    } catch (error) {
        console.error('Error fetching polls:', error);
        pollsContainer.innerHTML = `<div class="alert alert-danger w-100">Error loading polls: ${error.message}</div>`;
    }
}

// Helper function to get user ID from token - improved for better token handling
function getUserIdFromToken(token) {
    try {
        if (!token) return null;
        
        const payload = token.split('.')[1];
        if (!payload) return null;
        
        // Base64 decode and parse
        const decoded = JSON.parse(atob(payload));
        console.log('Decoded JWT token:', decoded); // Debug JWT content
        
        // JWT can store user ID in different fields, check common patterns
        return decoded.sub || decoded.id || decoded.user_id;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Helper function to get user role from token
function getUserRoleFromToken(token) {
    try {
        if (!token) return null;
        
        const payload = token.split('.')[1];
        if (!payload) return null;
        
        // Base64 decode and parse
        const decoded = JSON.parse(atob(payload));
        console.log('Decoded JWT token:', decoded); // Debug JWT content
        
        // Check for admin role/flag in token
        return decoded.is_admin === true ? 'admin' : 'user';
    } catch (error) {
        console.error('Error decoding token role:', error);
        return null;
    }
}

// Check if current user is admin
function isUserAdmin() {
    const token = localStorage.getItem('token');
    return getUserRoleFromToken(token) === 'admin';
}

// Display polls in the container
function displayPolls(polls, currentEndpoint = '/polls/') {
    if (!polls || polls.length === 0) {
        pollsContainer.innerHTML = '<p class="text-center w-100">No polls available.</p>';
        return;
    }

    pollsContainer.innerHTML = '';
    
    // Get user ID if logged in
    const token = localStorage.getItem('token');
    const currentUserId = token ? getUserIdFromToken(token) : null;
    const isAdmin = isUserAdmin();
    
    console.log('Display polls - Current user ID:', currentUserId, 'Is admin:', isAdmin);
    
    polls.forEach(poll => {
        console.log(`Poll ID: ${poll.id}, Creator ID: ${poll.user_id}`);
        
        // Show badge ONLY on main page for user's polls
        const isUsersPoll = currentEndpoint === '/polls/' && 
                           currentUserId && 
                           poll.user_id && 
                           String(poll.user_id) === String(currentUserId);
                           
        // Show delete button if user owns this poll OR user is admin
        const showDeleteButton = (currentUserId && 
                                 ((poll.user_id && String(poll.user_id) === String(currentUserId)) || isAdmin)) || 
                                 currentEndpoint === '/polls/my-polls';
        
        // Determine if this is an admin delete operation (admin deleting someone else's poll)
        const isAdminDelete = isAdmin && currentUserId && poll.user_id && 
                             String(poll.user_id) !== String(currentUserId);
        
        const pollCard = document.createElement('div');
        pollCard.className = 'col';
        pollCard.innerHTML = `
            <div class="card h-100 poll-card" data-poll-id="${poll.id}">
                <div class="card-body">
                    <h5 class="card-title">${poll.title}</h5>
                    <p class="card-text">${poll.description}</p>
                    <div class="mt-3 text-muted small">
                        <div><i class="bi bi-person-circle me-1"></i> Created by: ${poll.creator_name || 'Unknown user'}</div>
                    </div>
                    ${isUsersPoll ? '<span class="badge bg-primary position-absolute top-0 end-0 m-2">Your Poll</span>' : ''}
                    ${isAdmin ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Admin</span>' : ''}
                </div>
                ${showDeleteButton ? `
                <div class="card-footer">
                    <div class="d-flex gap-2">
                        <button class="btn ${isAdminDelete ? 'btn-danger' : 'btn-danger'} btn-sm delete-poll flex-grow-1" 
                                data-poll-id="${poll.id}" 
                                data-is-admin="${isAdminDelete}">
                            Delete${isAdminDelete ? ' <span class="badge bg-warning admin-badge">ADMIN</span>' : ''}
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        pollsContainer.appendChild(pollCard);
    });
    
    // Make entire poll card clickable
    document.querySelectorAll('.poll-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't navigate if they clicked the delete button
            if (e.target.closest('.delete-poll')) {
                return;
            }
            
            const pollId = card.dataset.pollId;
            window.location.href = `poll-details.html?poll_id=${pollId}`;
        });
    });
}

// Auth event listeners
loginBtn.addEventListener('click', () => {
    authModalTitle.textContent = 'Login';
    authSubmitBtn.textContent = 'Login';
    authForm.reset();
    authError.textContent = '';
    authModal.show();
    document.getElementById('auth-username').focus();
});

registerBtn.addEventListener('click', () => {
    authModalTitle.textContent = 'Register';
    authSubmitBtn.textContent = 'Register';
    authForm.reset();
    authError.textContent = '';
    authModal.show();
    document.getElementById('auth-username').focus();
});

// Handle authentication form submission
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const isLogin = authModalTitle.textContent === 'Login';
    
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Authentication failed');
        }
        
        if (isLogin) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', username);
            authModal.hide();
            checkAuth();
            fetchPolls();
            
            showMessage('Welcome', `<i class="bi bi-check-circle text-success"></i> You are now logged in as <strong>${username}</strong>`, 'success');
        } else {
            authModal.hide();
            
            showMessage('Registration Successful', 
                `<i class="bi bi-check-circle text-success"></i> Your account has been created.<br><br>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> You can now log in with your credentials.
                </div>`, 
                'success');
        }
    } catch (error) {
        authError.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle"></i> ${error.message}
            </div>
        `;
    }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    checkAuth();
    fetchPolls();
});

// App logo click - fetch all polls
if (appLogo) {
    appLogo.addEventListener('click', (e) => {
        if (window.location.pathname.includes('index.html') || 
            window.location.pathname === '/' || 
            window.location.pathname.endsWith('/')) {
            e.preventDefault();
            
            // Reset my polls button state
            if (myPollsBtn) {
                myPollsBtn.classList.add('btn-outline-secondary');
                myPollsBtn.classList.remove('btn-primary');
            }
            
            // Update heading to "All Polls"
            if (pollsHeading) {
                pollsHeading.textContent = 'All Polls';
            }
            
            // Fetch all polls
            fetchPolls('/polls/');
        }
    });
}

// My Polls button
if (myPollsBtn) {
    myPollsBtn.addEventListener('click', () => {
        // Set button state
        myPollsBtn.classList.add('btn-primary');
        myPollsBtn.classList.remove('btn-outline-secondary');
        
        // Update heading to "My Polls"
        if (pollsHeading) {
            pollsHeading.textContent = 'My Polls';
        }
        
        // Fetch user's polls
        fetchPolls('/polls/my-polls');
    });
}

// Create poll modal and functionality
if (createPollBtn) {
    const createPollModal = new bootstrap.Modal(document.getElementById('createPollModal'));
    const createPollForm = document.getElementById('create-poll-form');
    const addOptionBtn = document.getElementById('add-option-btn');
    
    createPollBtn.addEventListener('click', () => {
        createPollForm.reset();
        document.getElementById('options-container').innerHTML = `
            <div class="input-group mb-2">
                <input type="text" class="form-control poll-option" required>
                <button type="button" class="btn btn-outline-danger remove-option">Remove</button>
            </div>
            <div class="input-group mb-2">
                <input type="text" class="form-control poll-option" required>
                <button type="button" class="btn btn-outline-danger remove-option">Remove</button>
            </div>
        `;
        createPollModal.show();
    });
    
    addOptionBtn.addEventListener('click', () => {
        const optionsContainer = document.getElementById('options-container');
        const newOption = document.createElement('div');
        newOption.className = 'input-group mb-2';
        newOption.innerHTML = `
            <input type="text" class="form-control poll-option" required>
            <button type="button" class="btn btn-outline-danger remove-option">Remove</button>
        `;
        optionsContainer.appendChild(newOption);
    });
    
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-option')) {
            const optionsContainer = document.getElementById('options-container');
            if (optionsContainer.children.length > 2) {
                e.target.parentElement.remove();
            }
        }
    });
    
    createPollForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('poll-title').value;
        const description = document.getElementById('poll-description').value;
        const optionInputs = document.querySelectorAll('.poll-option');
        const options = Array.from(optionInputs).map(input => input.value);
        
        try {
            const response = await fetch(`${API_BASE_URL}/polls/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ title, description, options })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.msg || 'Failed to create poll');
            }
            
            createPollModal.hide();
            
            // Generate share URL for the new poll
            const pollUrl = `${window.location.origin}/poll-details.html?poll_id=${data.id}`;
            
            // Show success modal with share link
            const modalContent = `
                <div class="alert alert-success mb-3">
                    <i class="bi bi-check-circle"></i> Your poll has been created successfully.
                </div>
                <p><strong>Share this poll:</strong></p>
                <div class="input-group mb-3">
                    <input type="text" class="form-control" value="${pollUrl}" id="new-poll-link-input" readonly>
                    <button class="btn btn-outline-primary" type="button" id="new-poll-copy-btn">
                        <i class="bi bi-clipboard"></i> Copy Link
                    </button>
                </div>
                <div id="new-poll-copy-confirmation" class="text-success d-none">
                    <i class="bi bi-check-circle"></i> Link copied to clipboard!
                </div>
            `;
            
            const successModal = showMessage('Poll Created', modalContent, 'success');
            
            // Add copy functionality
            document.getElementById('new-poll-copy-btn').addEventListener('click', () => {
                const linkInput = document.getElementById('new-poll-link-input');
                linkInput.select();
                document.execCommand('copy');
                
                const copyConfirmation = document.getElementById('new-poll-copy-confirmation');
                copyConfirmation.classList.remove('d-none');
                
                setTimeout(() => {
                    copyConfirmation.classList.add('d-none');
                }, 3000);
            });
            
            fetchPolls();
        } catch (error) {
            document.getElementById('create-poll-error').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-circle"></i> ${error.message}
                </div>
            `;
        }
    });
}


// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchPolls();
    
    // Add message modal to the document
    addMessageModalToDOM();
});

// Create and add message modal to the DOM
function addMessageModalToDOM() {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'messageModal';
    modalDiv.tabIndex = '-1';
    modalDiv.setAttribute('aria-hidden', 'true');
    
    modalDiv.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="messageModalTitle">Message</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body" id="messageModalBody">
                    <!-- Message content will be placed here -->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalDiv);
}

// Show message modal with custom content
function showMessage(title, content, type = 'info') {
    const messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    const modalTitle = document.getElementById('messageModalTitle');
    const modalBody = document.getElementById('messageModalBody');
    
    modalTitle.textContent = title;
    
    // Add color indication based on message type
    modalTitle.className = '';
    if (type === 'success') modalTitle.classList.add('text-success');
    if (type === 'error') modalTitle.classList.add('text-danger');
    if (type === 'warning') modalTitle.classList.add('text-warning');
    
    modalBody.innerHTML = content;
    
    messageModal.show();
    
    return messageModal;
}

// Show confirmation dialog with custom action on confirm
function showConfirmation(title, content, onConfirm) {
    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal fade';
    modalDiv.id = 'confirmationModal';
    modalDiv.tabIndex = '-1';
    modalDiv.setAttribute('aria-hidden', 'true');
    
    modalDiv.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmBtn">Confirm</button>
                </div>
            </div>
        </div>
    `;
    
    // Remove any existing confirmation modal
    const existingModal = document.getElementById('confirmationModal');
    if (existingModal) existingModal.remove();
    
    document.body.appendChild(modalDiv);
    
    const confirmationModal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    confirmationModal.show();
    
    document.getElementById('confirmBtn').addEventListener('click', () => {
        confirmationModal.hide();
        onConfirm();
    });
}

// Update delete poll button to use confirmation modal
document.addEventListener('click', async (e) => {
    if (e.target && e.target.closest('.delete-poll')) {
        e.stopPropagation(); // Prevent navigating to poll details
        const button = e.target.closest('.delete-poll');
        const pollId = button.dataset.pollId;
        const isAdminDelete = button.dataset.isAdmin === "true";
        
        const confirmTitle = isAdminDelete ? 'Admin Delete Poll' : 'Delete Poll';
        const confirmContent = isAdminDelete ? 
            '<div class="alert alert-warning"><i class="bi bi-exclamation-triangle"></i> You are deleting this poll as an <strong>ADMIN</strong>.</div><p>Are you sure you want to delete this poll?</p>' : 
            '<p>Are you sure you want to delete this poll?</p>';
        
        showConfirmation(confirmTitle, confirmContent, async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/polls/delete/${pollId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Failed to delete poll');
                }
                
                showMessage('Success', '<i class="bi bi-check-circle text-success"></i> Poll deleted successfully', 'success');
                fetchPolls(getCurrentPollsEndpoint());
            } catch (error) {
                showMessage('Error', `<i class="bi bi-x-circle text-danger"></i> ${error.message}`, 'error');
            }
        });
    }
});

// Replace poll creation alert with modal
createPollForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('poll-title').value;
    const description = document.getElementById('poll-description').value;
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs).map(input => input.value);
    
    try {
        const response = await fetch(`${API_BASE_URL}/polls/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ title, description, options })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Failed to create poll');
        }
        
        createPollModal.hide();
        
        // Generate share URL for the new poll
        const pollUrl = `${window.location.origin}/poll-details.html?poll_id=${data.id}`;
        
        // Show success modal with share link
        const modalContent = `
            <div class="alert alert-success mb-3">
                <i class="bi bi-check-circle"></i> Your poll has been created successfully.
            </div>
            <p><strong>Share this poll:</strong></p>
            <div class="input-group mb-3">
                <input type="text" class="form-control" value="${pollUrl}" id="new-poll-link-input" readonly>
                <button class="btn btn-outline-primary" type="button" id="new-poll-copy-btn">
                    <i class="bi bi-clipboard"></i> Copy Link
                </button>
            </div>
            <div id="new-poll-copy-confirmation" class="text-success d-none">
                <i class="bi bi-check-circle"></i> Link copied to clipboard!
            </div>
        `;
        
        const successModal = showMessage('Poll Created', modalContent, 'success');
        
        // Add copy functionality
        document.getElementById('new-poll-copy-btn').addEventListener('click', () => {
            const linkInput = document.getElementById('new-poll-link-input');
            linkInput.select();
            document.execCommand('copy');
            
            const copyConfirmation = document.getElementById('new-poll-copy-confirmation');
            copyConfirmation.classList.remove('d-none');
            
            setTimeout(() => {
                copyConfirmation.classList.add('d-none');
            }, 3000);
        });
        
        fetchPolls();
    } catch (error) {
        document.getElementById('create-poll-error').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle"></i> ${error.message}
            </div>
        `;
    }
});

// Update auth error display
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const isLogin = authModalTitle.textContent === 'Login';
    
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.msg || 'Authentication failed');
        }
        
        if (isLogin) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('username', username);
            authModal.hide();
            checkAuth();
            fetchPolls();
            
            showMessage('Welcome', `<i class="bi bi-check-circle text-success"></i> You are now logged in as <strong>${username}</strong>`, 'success');
        } else {
            authModal.hide();
            
            showMessage('Registration Successful', 
                `<i class="bi bi-check-circle text-success"></i> Your account has been created.<br><br>
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i> You can now log in with your credentials.
                </div>`, 
                'success');
        }
    } catch (error) {
        authError.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-circle"></i> ${error.message}
            </div>
        `;
    }
});