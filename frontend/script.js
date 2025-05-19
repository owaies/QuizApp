let token = null;
let questions = [];
let selectedAnswers = {};
let users = [];
let settings = {};

// DOM Elements
const questionContainer = document.getElementById('questionContainer');
const authSection = document.getElementById('auth');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const quizSection = document.getElementById('quiz');
const resultSection = document.getElementById('result');
const adminPanel = document.getElementById('adminPanel');
const adminAccessBtn = document.getElementById('adminAccessBtn');
const usersTab = document.getElementById('usersTab');
const usersList = document.getElementById('usersList');
const settingsTab = document.getElementById('settingsTab');
const usernameDisplay = document.getElementById('usernameDisplay');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  setupEventListeners();
  resetOptionFields();
});

// Check if user is already authenticated
function checkAuthStatus() {
  token = localStorage.getItem('quizToken');
  if (token) {
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');
    if (username) {
      usernameDisplay.textContent = username;
    }
    if (role === 'admin') {
      showAdminPanel();
    } else {
      showQuiz();
    }
  } else {
    showLogin();
  }
}

// Setup all event listeners
function setupEventListeners() {
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    login();
  });

  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    signup();
  });

  document.getElementById('showSignupLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showSignup();
  });

  document.getElementById('showLoginLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  document.getElementById('submitQuizBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    submitQuiz();
  });

  document.getElementById('addQuestionBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    addQuestion();
  });

  document.getElementById('addOptionBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    addOptionField();
  });

  document.getElementById('refreshUsersBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    loadUsers();
  });

  adminAccessBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    showAdminLoginPrompt();
  });
}

// --- UI View Management ---
function showLogin() {
  setView('auth');
  loginForm.classList.remove('hidden');
  signupForm.classList.add('hidden');
}

function showSignup() {
  setView('auth');
  loginForm.classList.add('hidden');
  signupForm.classList.remove('hidden');
}

function showQuiz() {
  setView('quiz');
  adminAccessBtn.classList.remove('hidden');
  usernameDisplay.textContent = localStorage.getItem('username') || 'User';
  loadQuestions();
}

function showResult(data) {
  setView('result');
  let resultHTML = `
    <div class="text-center p-6">
      <h2 class="text-2xl font-bold mb-4">Quiz Results</h2>
      <div class="mb-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-lg mb-2">You scored ${data.score} out of ${data.total}</p>
        <p class="text-lg mb-2">Your percentage: ${data.percentage.toFixed(1)}%</p>
        <p class="text-lg">Your rank: ${data.rank}</p>
      </div>
  `;

  if (data.leaderboard && data.leaderboard.length > 0) {
    resultHTML += `
      <div class="mt-6">
        <h3 class="text-xl font-semibold mb-3">Leaderboard</h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-gray-100">
                <th class="border p-2 text-left">Rank</th>
                <th class="border p-2 text-left">Username</th>
                <th class="border p-2 text-left">Score</th>
                <th class="border p-2 text-left">Percentage</th>
              </tr>
            </thead>
            <tbody>
    `;

    data.leaderboard.forEach((entry, index) => {
      const isCurrentUser = entry.userId === localStorage.getItem('userId');
      resultHTML += `
        <tr class="${isCurrentUser ? 'bg-yellow-100' : ''}">
          <td class="border p-2">${index + 1}</td>
          <td class="border p-2">${entry.username}</td>
          <td class="border p-2">${entry.score}/${entry.totalQuestions}</td>
          <td class="border p-2">${entry.percentage.toFixed(1)}%</td>
        </tr>
      `;
    });

    resultHTML += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  resultHTML += `
      <button onclick="showQuiz()" class="mt-6 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Take Quiz Again
      </button>
    </div>
  `;

  resultSection.innerHTML = resultHTML;
}

function showAdminPanel() {
  setView('adminPanel');
  loadAdminQuestions(true);
  loadUsers();
  loadSettings();
  switchTab('questions');
}

function setView(view) {
  authSection.classList.add('hidden');
  quizSection.classList.add('hidden');
  resultSection.classList.add('hidden');
  adminPanel.classList.add('hidden');

  switch (view) {
    case 'auth':
      authSection.classList.remove('hidden');
      break;
    case 'quiz':
      quizSection.classList.remove('hidden');
      break;
    case 'result':
      resultSection.classList.remove('hidden');
      break;
    case 'adminPanel':
      adminPanel.classList.remove('hidden');
      break;
  }
}

function switchTab(tabName) {
  ['questions', 'users', 'settings'].forEach(tab => {
    document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.remove('tab-active');
    document.getElementById(`${tab}Tab`).classList.add('hidden');
  });

  document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`).classList.add('tab-active');
  document.getElementById(`${tabName}Tab`).classList.remove('hidden');

  if (tabName === 'users' && !usersList.innerHTML) {
    loadUsers();
  } else if (tabName === 'settings' && !settingsTab.innerHTML) {
    loadSettings();
  } else if (tabName === 'questions') {
    loadAdminQuestions(true);
  }
}

// --- Authentication Functions ---
async function login(usernameParam, passwordParam) {
  const username = usernameParam || document.getElementById('loginUsername').value.trim();
  const password = passwordParam || document.getElementById('loginPassword').value.trim();

  if (!username || !password) {
    showAlert('Please enter both username and password', 'error');
    return false;
  }

  try {
    console.log(`Login attempt for username: ${username}`);
    const response = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    token = data.token;
    localStorage.setItem('quizToken', data.token);
    localStorage.setItem('userRole', data.role || 'user');
    localStorage.setItem('username', data.username);
    localStorage.setItem('userId', data.userId);

    console.log(`Login successful: role=${data.role}, username=${data.username}`);

    if (data.role === 'admin') {
      showAdminPanel();
    } else {
      showQuiz();
    }

    return true;

  } catch (error) {
    console.error('Login error:', error);
    showAlert(`Login error: ${error.message}`, 'error');
    return false;
  }
}

async function signup() {
  const username = document.getElementById('signupUsername').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  if (!username || !email || !password) {
    showAlert('Please fill all fields', 'error');
    return;
  }

  if (password.length < 6) {
    showAlert('Password must be at least 6 characters', 'error');
    return;
  }

  try {
    console.log(`Signup attempt for username: ${username}, email: ${email}`);
    const response = await fetch('http://localhost:5000/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    showAlert('Signup successful! Please login.', 'success');
    showLogin();

  } catch (error) {
    console.error('Signup error:', error);
    showAlert(`Signup error: ${error.message}`, 'error');
  }
}

function logout() {
  token = null;
  localStorage.clear();
  users = [];
  settings = {};
  showLogin();
}

// --- Quiz Functions ---
async function loadQuestions() {
  try {
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    questionContainer.innerHTML = '<div class="text-center py-8">Loading questions...</div>';

    console.log('Fetching question limit...');
    const settingsResponse = await fetch('http://localhost:5000/api/settings/questionLimit', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!settingsResponse.ok) {
      const errorData = await settingsResponse.json();
      throw new Error(errorData.error || 'Failed to load settings');
    }

    const settingsData = await settingsResponse.json();
    settings.questionLimit = parseInt(settingsData.value) || 0;
    console.log(`Question limit loaded: ${settings.questionLimit}`);

    console.log('Fetching questions...');
    const response = await fetch('http://localhost:5000/api/questions', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load questions');
    }

    questions = await response.json();
    console.log(`Questions loaded: ${questions.length} questions`);
    renderQuestions();

  } catch (error) {
    console.error('Error loading questions:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    questionContainer.innerHTML = `
      <div class="p-4 bg-red-100 text-red-700 rounded">
        <h3 class="font-bold">Error loading questions</h3>
        <p>${error.message}</p>
        <button onclick="loadQuestions()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    `;
  }
}

function renderQuestions() {
  selectedAnswers = {};
  questionContainer.innerHTML = '';

  if (!questions || questions.length === 0) {
    questionContainer.innerHTML = '<p class="text-center py-8">No questions available</p>';
    return;
  }

  const userRole = localStorage.getItem('userRole');
  if (userRole !== 'admin' && settings.questionLimit > 0) {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'mb-4 p-3 bg-blue-50 rounded text-center text-sm text-blue-800';
    infoDiv.textContent = `Showing ${questions.length} questions based on admin settings.`;
    questionContainer.appendChild(infoDiv);
  }

  questions.forEach((q, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'mb-6 p-4 border rounded bg-white shadow-sm';

    const questionText = document.createElement('h3');
    questionText.className = 'text-lg font-semibold mb-3';
    questionText.textContent = `${index + 1}. ${q.question}`;
    questionDiv.appendChild(questionText);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';

    q.options.forEach((option) => {
      const optionBtn = document.createElement('button');
      optionBtn.className = 'p-3 border rounded text-left hover:bg-gray-50 transition-colors';
      optionBtn.textContent = option;

      optionBtn.addEventListener('click', () => {
        optionsContainer.querySelectorAll('button').forEach(btn => {
          btn.classList.remove('selected-option');
        });
        optionBtn.classList.add('selected-option');
        selectedAnswers[q._id] = option;
      });

      optionsContainer.appendChild(optionBtn);
    });

    questionDiv.appendChild(optionsContainer);
    questionContainer.appendChild(questionDiv);
  });
}

async function submitQuiz() {
  try {
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    const answers = Object.entries(selectedAnswers).map(([id, answer]) => ({ id, answer }));

    if (answers.length === 0) {
      showAlert('Please answer at least one question', 'error');
      return;
    }

    const submitBtn = document.getElementById('submitQuizBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    console.log('Submitting quiz with answers:', answers);
    const response = await fetch('http://localhost:5000/api/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Submission failed');
    }

    console.log('Quiz submission successful:', data);
    showResult(data);

  } catch (error) {
    console.error('Submission error:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    showAlert(`Submission error: ${error.message}`, 'error');
  } finally {
    const submitBtn = document.getElementById('submitQuizBtn');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Quiz';
    }
  }
}

// --- Settings Functions ---
async function loadSettings() {
  try {
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    console.log('Loading settings...');
    settingsTab.innerHTML = '<div class="text-center py-8">Loading settings...</div>';

    const response = await fetch('http://localhost:5000/api/settings/questionLimit', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load settings');
    }

    const data = await response.json();
    settings.questionLimit = parseInt(data.value) || 0;
    console.log('Settings loaded:', data);
    renderSettings();

  } catch (error) {
    console.error('Error loading settings:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    settingsTab.innerHTML = `
      <div class="p-4 bg-red-100 text-red-700 rounded">
        <h3 class="font-bold">Error loading settings</h3>
        <p>${error.message}</p>
        <button onclick="loadSettings()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    `;
  }
}

function renderSettings() {
  settingsTab.innerHTML = `
    <h2 class="text-xl font-bold mb-6">Quiz Settings</h2>
    <div class="mb-6 p-6 border rounded bg-white shadow-sm">
      <h3 class="text-lg font-semibold mb-4">Question Limit</h3>
      <p class="text-gray-600 mb-4">Set the number of questions shown to users when taking the quiz. Set to 0 to show all questions.</p>
      <div class="flex items-center mb-4">
        <input 
          type="number" 
          id="questionLimit" 
          min="0" 
          max="100" 
          value="${settings.questionLimit || 0}" 
          class="w-24 p-2 border rounded mr-4"
        >
        <button 
          id="saveQuestionLimitBtn" 
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Save
        </button>
      </div>
      <div id="questionLimitFeedback"></div>
    </div>
  `;

  document.getElementById('saveQuestionLimitBtn').addEventListener('click', saveQuestionLimit);
}

async function saveQuestionLimit() {
  try {
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    const limitInput = document.getElementById('questionLimit');
    const limit = parseInt(limitInput.value, 10);

    if (isNaN(limit) || limit < 0) {
      showAlert('Please enter a valid number (0 or greater)', 'error');
      return;
    }

    const saveBtn = document.getElementById('saveQuestionLimitBtn');
    const feedback = document.getElementById('questionLimitFeedback');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    feedback.innerHTML = '';

    console.log(`Saving question limit: ${limit}`);
    const response = await fetch('http://localhost:5000/api/settings/questionLimit', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ value: String(limit) })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update question limit');
    }

    settings.questionLimit = parseInt(data.value) || 0;
    console.log(`Question limit updated: ${settings.questionLimit}`);

    const limitText = settings.questionLimit > 0 ? `${settings.questionLimit} questions` : 'all available questions';
    feedback.innerHTML = `
      <div class="p-3 bg-green-100 text-green-800 rounded">
        Question limit successfully updated. Users will now see ${limitText}.
      </div>
    `;

    showAlert('Question limit updated successfully', 'success');

  } catch (error) {
    console.error('Save question limit error:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    document.getElementById('questionLimitFeedback').innerHTML = `
      <div class="p-3 bg-red-100 text-red-800 rounded">
        Error: ${error.message}
      </div>
    `;
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    const saveBtn = document.getElementById('saveQuestionLimitBtn');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
    }
  }
}

// --- Admin Functions ---
async function loadAdminQuestions(forceRefresh = false) {
  try {
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    const adminList = document.getElementById('adminQuestionList');
    if (!adminList) return;

    adminList.innerHTML = '<div class="text-center py-8">Loading questions...</div>';

    const url = forceRefresh ? `http://localhost:5000/api/questions?timestamp=${Date.now()}` : 'http://localhost:5000/api/questions';

    console.log('Fetching admin questions...');
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load questions');
    }

    const questions = await response.json();
    console.log(`Admin questions loaded: ${questions.length} questions`);
    renderAdminQuestions(questions);

  } catch (error) {
    console.error('Error loading questions:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    const adminList = document.getElementById('adminQuestionList');
    if (adminList) {
      adminList.innerHTML = `
        <div class="p-4 bg-red-100 text-red-700 rounded">
          Error: ${error.message}
          <button onclick="loadAdminQuestions(true)" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
            Retry
          </button>
        </div>
      `;
    }
  }
}

function renderAdminQuestions(questions) {
  const adminList = document.getElementById('adminQuestionList');
  adminList.innerHTML = '';

  if (!questions || questions.length === 0) {
    adminList.innerHTML = '<div class="text-center py-8 text-gray-500">No questions found</div>';
    return;
  }

  questions.forEach(q => {
    const div = document.createElement('div');
    div.className = 'mb-3 p-4 border rounded bg-white shadow-sm';
    div.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="flex-1">
          <h4 class="font-medium text-lg">${q.question}</h4>
          <div class="mt-2">
            <span class="font-semibold">Options:</span>
            <ul class="list-disc list-inside mt-1">
              ${q.options.map(opt => `<li>${opt}</li>`).join('')}
            </ul>
          </div>
          <div class="mt-2">
            <span class="font-semibold">Correct Answer:</span>
            <span class="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded">${q.answer}</span>
          </div>
        </div>
        <button onclick="deleteQuestion('${q._id}')" class="mt-2 md:mt-0 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
          Delete
        </button>
      </div>
    `;
    adminList.appendChild(div);
  });
}

async function loadUsers() {
  try {
    if (!token) {
      throw new Error('Session expired. Please login again.');
    }

    console.log('Loading users...');
    usersList.innerHTML = '<div class="text-center py-8">Loading users...</div>';

    const response = await fetch('http://localhost:5000/api/users', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to load users');
    }

    users = await response.json();
    console.log(`Users loaded: ${users.length} users`, users);
    renderUsers();

  } catch (error) {
    console.error('Error loading users:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    usersList.innerHTML = `
      <div class="p-4 bg-red-100 text-red-700 rounded">
        <h3 class="font-bold">Error loading users</h3>
        <p>${error.message}</p>
        <button onclick="loadUsers()" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Retry
        </button>
      </div>
    `;
  }
}

function renderUsers() {
  usersList.innerHTML = '';

  if (!users || users.length === 0) {
    usersList.innerHTML = '<div class="text-center py-8 text-gray-500">No users found</div>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'w-full border-collapse';
  table.innerHTML = `
    <thead>
      <tr class="bg-gray-100">
        <th class="border p-2 text-left">Username</th>
        <th class="border p-2 text-left">Email</th>
        <th class="border p-2 text-left">Role</th>
        <th class="border p-2 text-left">Actions</th>
      </tr>
    </thead>
    <tbody>
      ${users.map(user => `
        <tr class="border-b hover:bg-gray-50">
          <td class="border p-2">${user.username}</td>
          <td class="border p-2">${user.email || 'N/A'}</td>
          <td class="border p-2">
            <span class="px-2 py-1 rounded ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}">
              ${user.role || 'user'}
            </span>
          </td>
          <td class="border p-2">
            <button
              onclick="deleteUser('${user._id}')"
              class="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors ${user.username === localStorage.getItem('username') ? 'opacity-50 cursor-not-allowed' : ''}"
              ${user.username === localStorage.getItem('username') ? 'disabled' : ''}
            >
              Delete
            </button>
          </td>
        </tr>
      `).join('')}
    </tbody>
  `;
  usersList.appendChild(table);
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    console.log(`Deleting user with ID: ${userId}`);
    const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    users = await response.json();
    console.log('User deleted, updated users:', users);
    renderUsers();
    showAlert('User deleted successfully', 'success');

  } catch (error) {
    console.error('Delete user error:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    showAlert(`Error: ${error.message}`, 'error');
  }
}

async function addQuestion() {
  try {
    const question = document.getElementById('newQuestion').value.trim();
    const answer = document.getElementById('newAnswer').value.trim();
    const options = Array.from(document.querySelectorAll('.optionInput'))
      .map(input => input.value.trim())
      .filter(opt => opt);

    if (!question || options.length < 2 || !answer) {
      showAlert('Please provide a question, at least 2 options, and the correct answer', 'error');
      return;
    }

    if (!options.includes(answer)) {
      showAlert('Correct answer must be one of the options', 'error');
      return;
    }

    const addBtn = document.getElementById('addQuestionBtn');
    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';

    console.log('Adding question:', { question, options, answer });
    const response = await fetch('http://localhost:5000/api/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({ question, options, answer })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add question');
    }

    document.getElementById('newQuestion').value = '';
    document.getElementById('newAnswer').value = '';
    resetOptionFields();

    const updatedQuestions = await response.json();
    console.log('Question added, updated questions:', updatedQuestions);
    renderAdminQuestions(updatedQuestions);
    showAlert('Question added successfully!', 'success');

  } catch (error) {
    console.error('Add question error:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    showAlert(`Error: ${error.message}`, 'error');
  } finally {
    const addBtn = document.getElementById('addQuestionBtn');
    if (addBtn) {
      addBtn.disabled = false;
      addBtn.textContent = 'Add Question';
    }
  }
}

async function deleteQuestion(id) {
  if (!confirm('Are you sure you want to delete this question?')) return;

  try {
    console.log(`Deleting question with ID: ${id}`);
    const response = await fetch(`http://localhost:5000/api/questions/${id}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete question');
    }

    const updatedQuestions = await response.json();
    console.log('Question deleted, updated questions:', updatedQuestions);
    renderAdminQuestions(updatedQuestions);
    showAlert('Question deleted successfully', 'success');

  } catch (error) {
    console.error('Delete question error:', error);
    if (error.message.includes('Invalid token') || error.message.includes('Unauthorized')) {
      logout();
    }
    showAlert(`Error: ${error.message}`, 'error');
  }
}

// --- Admin Access Prompt ---
function showAdminLoginPrompt() {
  const username = prompt('Enter admin username:');
  if (!username) return;

  const password = prompt('Enter admin password:');
  if (!password) return;

  login(username, password).then(success => {
    if (success && localStorage.getItem('userRole') === 'admin') {
      showAdminPanel();
    } else if (success) {
      showAlert("You don't have admin privileges", 'error');
    }
  });
}

// --- Helper Functions ---
function resetOptionFields() {
  const optionFields = document.getElementById('optionFields');
  if (!optionFields) return;
  optionFields.innerHTML = '';
  for (let i = 0; i < 2; i++) {
    addOptionField();
  }
}

function addOptionField() {
  const optionFields = document.getElementById('optionFields');
  if (!optionFields) return;

  const optionCount = document.querySelectorAll('.optionInput').length;
  if (optionCount >= 6) {
    showAlert('Maximum 6 options allowed', 'error');
    return;
  }

  const div = document.createElement('div');
  div.className = 'mb-2 flex items-center';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'optionInput flex-1 p-2 border rounded';
  input.placeholder = `Option ${optionCount + 1}`;

  const removeBtn = document.createElement('button');
  removeBtn.className = 'ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600';
  removeBtn.textContent = '×';
  removeBtn.onclick = () => div.remove();

  div.appendChild(input);
  div.appendChild(removeBtn);
  optionFields.appendChild(div);
}

function showAlert(message, type = 'info') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
    type === 'error' ? 'bg-red-100 text-red-800' : 
    type === 'success' ? 'bg-green-100 text-green-800' : 
    'bg-blue-100 text-blue-800'
  }`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => alertDiv.remove(), 300);
  }, 3000);
}

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Global functions
window.showQuiz = showQuiz;
window.loadAdminQuestions = loadAdminQuestions;
window.deleteQuestion = deleteQuestion;
window.deleteUser = deleteUser;
window.logout = logout;
window.switchTab = switchTab;
window.loadSettings = loadSettings;