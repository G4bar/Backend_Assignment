// JavaScript for poll details page

// Get poll ID from query string
const urlParams = new URLSearchParams(window.location.search);
const pollId = urlParams.get('poll_id');

// DOM Elements
const pollTitle = document.getElementById('poll-title');
const pollDescription = document.getElementById('poll-description');
const pollOptions = document.getElementById('poll-options');
const pollMeta = document.getElementById('poll-meta');
const resultsSection = document.getElementById('poll-results');
const resultsContainer = document.getElementById('results-container');
const deletePollBtn = document.getElementById('delete-poll-btn');

// Variables
let currentPoll = null;
let userVoted = false;
let userIsCreator = false;

// Check if poll ID exists
if (!pollId) {
    window.location.href = 'index.html';
}

// Helper function to extract creator ID from poll object
function getCreatorId(poll) {
    // According to the API documentation, user_id is the standard field
    if (poll.user_id !== undefined) {
        return poll.user_id;
    }
    
    // Fallback to other possible fields if needed
    const possibleFields = ['creator_id', 'userId', 'creatorId', 'creator', 'author_id'];
    
    for (const field of possibleFields) {
        if (poll[field] !== undefined) {
            console.log(`Found creator ID in non-standard field: ${field} = ${poll[field]}`);
            return poll[field];
        }
    }
    
    return null;
}

// Check if current user is admin
function isUserAdmin() {
    const token = localStorage.getItem('token');
    try {
        if (!token) return false;
        
        const payload = token.split('.')[1];
        if (!payload) return false;
        
        // Base64 decode and parse
        const decoded = JSON.parse(atob(payload));
        console.log('Admin check - token payload:', decoded); // Debug admin data
        
        // Check for admin role/flag in token
        return decoded.is_admin === true;
    } catch (error) {
        console.error('Error decoding token for admin check:', error);
        return false;
    }
}

// Override checkAuth function for poll details page
function checkAuth() {
    const token = localStorage.getItem('token');
    let isAuthenticated = false;
    
    if (token) {
        document.getElementById('auth-nav').classList.add('d-none');
        userControls.classList.remove('d-none');
        usernameSpan.textContent = localStorage.getItem('username');
        isAuthenticated = true;
        
        // Check if user is poll creator or admin and should see delete button
        if (currentPoll) {
            const userId = getUserIdFromToken(token);
            const creatorId = getCreatorId(currentPoll);
            const admin = isUserAdmin();
            
            console.log('Auth check - User ID:', userId, 'Creator ID:', creatorId, 'Is Admin:', admin);
            
            // Always show delete button for admins, regardless of ownership
            if (admin) {
                deletePollBtn.classList.remove('d-none');
                
                // Check if admin is viewing someone else's poll
                if (userId && creatorId && String(creatorId) !== String(userId)) {
                    deletePollBtn.classList.add('btn-danger');
                    deletePollBtn.textContent = "Delete Poll (Admin)";
                    // Add visual indicator for admin delete action
                    if (!deletePollBtn.querySelector('.admin-badge')) {
                        const badge = document.createElement('span');
                        badge.className = 'badge bg-warning ms-2 admin-badge';
                        badge.textContent = 'ADMIN';
                        deletePollBtn.appendChild(badge);
                    }
                }
            } 
            // Show delete button for poll creator
            else if (userId && creatorId && String(creatorId) === String(userId)) {
                deletePollBtn.classList.remove('d-none');
                userIsCreator = true;
                // Ensure standard button appearance for creator
                deletePollBtn.classList.add('btn-danger');
                deletePollBtn.textContent = "Delete Poll";
            } else {
                deletePollBtn.classList.add('d-none');
                userIsCreator = false;
            }
        }
    } else {
        document.getElementById('auth-nav').classList.remove('d-none');
        userControls.classList.add('d-none');
        deletePollBtn.classList.add('d-none');
        userIsCreator = false;
    }
    
    return isAuthenticated;
}

// Fetch poll details
async function fetchPollDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/polls/get/${pollId}`);
        
        if (!response.ok) {
            throw new Error('Poll not found');
        }
        
        currentPoll = await response.json();
        console.log('Poll details:', currentPoll); // Debug poll structure
        displayPollDetails(currentPoll);
        
        // Re-check auth after getting poll data to update delete button
        checkAuth();
    } catch (error) {
        console.error('Error fetching poll details:', error);
        document.getElementById('poll-content').innerHTML = `
            <div class="card-body">
                <div class="alert alert-danger">Error: ${error.message}</div>
                <a href="index.html" class="btn btn-primary">Back to Polls</a>
            </div>
        `;
    }
}

// Display poll details
function displayPollDetails(poll) {
    pollTitle.textContent = poll.title;
    pollDescription.textContent = poll.description;
    
    // Format date and include creator name
    const createdDate = new Date(poll.created_at).toLocaleDateString();
    const creatorName = poll.creator_name || 'Unknown user';
    pollMeta.textContent = `Created by ${creatorName} on ${createdDate}`;
    
    // Display options
    pollOptions.innerHTML = '';
    poll.options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'poll-option card p-3 mb-2';
        optionDiv.dataset.optionId = option.id;
        optionDiv.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <span>${option.text}</span>
                <span class="badge bg-primary">${option.votes} votes</span>
            </div>
        `;
        pollOptions.appendChild(optionDiv);
    });
    
    // Add click event for voting
    document.querySelectorAll('.poll-option').forEach(option => {
        option.addEventListener('click', async () => {
            if (!localStorage.getItem('token')) {
                alert('Please login to vote');
                return;
            }
            
            if (userVoted) {
                alert('You have already voted on this poll');
                return;
            }
            
            try {
                const optionId = option.dataset.optionId;
                const response = await fetch(`${API_BASE_URL}/polls/vote`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ poll_id: pollId, option_id: optionId })
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.msg || 'Failed to vote');
                }
                
                userVoted = true;
                fetchPollDetails();
                displayResults(poll);
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        });
    });
    
    // Show results
    displayResults(poll);
}

// Display poll results
function displayResults(poll) {
    resultsSection.classList.remove('d-none');
    
    const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
    
    resultsContainer.innerHTML = `
        <div id="chart-container" class="mb-4">
            <canvas id="results-chart"></canvas>
        </div>
        <div class="table-responsive">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>Option</th>
                        <th>Votes</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    ${poll.options.map(option => `
                        <tr>
                            <td>${option.text}</td>
                            <td>${option.votes}</td>
                            <td>${totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Create chart
    const ctx = document.getElementById('results-chart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: poll.options.map(option => option.text),
            datasets: [{
                data: poll.options.map(option => option.votes),
                backgroundColor: [
                    '#0d6efd', '#dc3545', '#ffc107', '#198754', 
                    '#6610f2', '#6f42c1', '#fd7e14', '#20c997'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                }
            }
        }
    });
}

// Delete poll functionality
if (deletePollBtn) {
    deletePollBtn.addEventListener('click', async () => {
        const isAdmin = isUserAdmin();
        const confirmMessage = isAdmin ? 
            'Are you sure you want to delete this poll? You are doing this as an ADMIN.' : 
            'Are you sure you want to delete this poll?';
            
        if (confirm(confirmMessage)) {
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
                
                alert('Poll deleted successfully');
                window.location.href = 'index.html';
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }
    });
}

// Helper function to get user ID from token
function getUserIdFromToken(token) {
    try {
        if (!token) return null;
        
        const payload = token.split('.')[1];
        if (!payload) return null;
        
        // Base64 decode and parse
        const decoded = JSON.parse(atob(payload));
        
        // JWT can store user ID in different fields, check common patterns
        return decoded.sub || decoded.id || decoded.user_id;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    fetchPollDetails();
    
    // Add event listener for logout to ensure delete button is hidden
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            checkAuth();
        });
    }
});
