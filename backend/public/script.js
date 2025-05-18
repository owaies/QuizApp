 let token = null;
    let questions = [];
    let selectedAnswers = {};

    // DOM Elements
    const questionContainer = document.getElementById('questionContainer');
    const authSection = document.getElementById('auth');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const quizSection = document.getElementById('quiz');
    const resultSection = document.getElementById('result');
    const adminPanel = document.getElementById('adminPanel');
    const adminAccessBtn = document.getElementById('adminAccessBtn');

    // Initialize the app
    document.addEventListener('DOMContentLoaded', () => {
      checkAuthStatus();
      setupEventListeners();
      resetOptionFields(); // Initialize with 2 option fields
    });

    // Check if user is already authenticated
    function checkAuthStatus() {
      const storedToken = localStorage.getItem('quizToken');
      if (storedToken) {
        token = storedToken;
        const role = localStorage.getItem('userRole');
        role === 'admin' ? showAdminPanel() : showQuiz();
      } else {
        showLogin();
      }
    }

    // Setup all event listeners
    function setupEventListeners() {
      // Auth navigation
      document.getElementById('loginBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        login();
      });
      
      document.getElementById('signupBtn')?.addEventListener('click', (e) => {
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
      
      // Quiz functionality
      document.getElementById('submitQuizBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        submitQuiz();
      });
      
      // Admin functionality
      document.getElementById('addQuestionBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        addQuestion();
      });
      
      document.getElementById('addOptionBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        addOptionField();
      });
      
      adminAccessBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        showAdminLoginPrompt();
      });
    }

    // --- UI View Management ---
    function showLogin() {
      setView('auth');
      loginForm.style.display = 'block';
      signupForm.style.display = 'none';
    }

    function showSignup() {
      setView('auth');
      loginForm.style.display = 'none';
      signupForm.style.display = 'block';
    }

    function showQuiz() {
      setView('quiz');
      // Show admin access button only for non-admin users
      const role = localStorage.getItem('userRole');
      adminAccessBtn.classList.toggle('hidden', role === 'admin');
      loadQuestions();
    }

    function showResult(score, total) {
      setView('result');
      resultSection.innerHTML = `
        <div class="text-center p-6">
          <h2 class="text-2xl font-bold mb-4">Quiz Results</h2>
          <p class="text-lg mb-6">You scored ${score} out of ${total}</p>
          <button onclick="showQuiz()" 
                  class="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Take Quiz Again
          </button>
        </div>
      `;
    }

    function showAdminPanel() {
      setView('adminPanel');
      loadAdminQuestions();
    }

    function setView(view) {
      // Hide all views
      authSection.style.display = 'none';
      quizSection.style.display = 'none';
      resultSection.style.display = 'none';
      adminPanel.style.display = 'none';
      
      // Show requested view
      switch(view) {
        case 'auth':
          authSection.style.display = 'block';
          break;
        case 'quiz':
          quizSection.style.display = 'block';
          break;
        case 'result':
          resultSection.style.display = 'block';
          break;
        case 'adminPanel':
          adminPanel.style.display = 'block';
          break;
      }
    }

    // --- Authentication Functions ---
    async function login(emailParam, passwordParam) {
      const email = emailParam || document.getElementById('loginEmail').value.trim();
      const password = passwordParam || document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        showAlert('Please enter both email and password', 'error');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Login failed');
        }

        // Store token and user data
        token = data.token;
        localStorage.setItem('quizToken', token);
        localStorage.setItem('userRole', data.role);
        localStorage.setItem('username', data.username);

        // Redirect to appropriate view
        if (data.role === 'admin') {
          showAdminPanel();
        } else {
          showQuiz();
        }

      } catch (error) {
        showAlert(`Login error: ${error.message}`, 'error');
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

      try {
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
        showAlert(`Signup error: ${error.message}`, 'error');
      }
    }

    function logout() {
      token = null;
      localStorage.removeItem('quizToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('username');
      showLogin();
    }

    // --- Quiz Functions ---
    async function loadQuestions() {
      try {
        if (!token) {
          showAlert('Session expired. Please login again.', 'error');
          showLogin();
          return;
        }

        // Show loading state
        questionContainer.innerHTML = '<div class="text-center py-8">Loading questions...</div>';

        const response = await fetch('http://localhost:5000/api/questions', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load questions');
        }

        questions = await response.json();
        renderQuestions();

      } catch (error) {
        console.error('Error loading questions:', error);
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

      questions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'mb-6 p-4 border rounded bg-white shadow-sm';

        const questionText = document.createElement('h3');
        questionText.className = 'text-lg font-semibold mb-3';
        questionText.textContent = `${index + 1}. ${q.question}`;
        questionDiv.appendChild(questionText);

        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';

        q.options.forEach((option, optIndex) => {
          const optionBtn = document.createElement('button');
          optionBtn.className = 'p-3 border rounded text-left hover:bg-gray-50 transition-colors';
          optionBtn.textContent = option;

          optionBtn.addEventListener('click', () => {
            // Remove selected class from all options in this question
            optionsContainer.querySelectorAll('button').forEach(btn => {
              btn.classList.remove('selected-option');
            });
            
            // Add selected class to clicked option
            optionBtn.classList.add('selected-option');
            
            // Store selected answer
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
          showAlert('Session expired. Please login again.', 'error');
          showLogin();
          return;
        }

        const answers = Object.entries(selectedAnswers).map(([id, answer]) => ({ id, answer }));

        if (answers.length === 0) {
          showAlert('Please answer at least one question', 'error');
          return;
        }

        // Show loading state
        const submitBtn = document.getElementById('submitQuizBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

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

        showResult(data.score, data.total);

      } catch (error) {
        console.error('Submission error:', error);
        showAlert(`Submission error: ${error.message}`, 'error');
      } finally {
        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit Quiz';
        }
      }
    }

    // --- Admin Functions ---
    async function loadAdminQuestions(forceRefresh = false) {
      try {
        const adminList = document.getElementById('adminQuestionList');
        if (!adminList) return;

        // Show loading state
        adminList.innerHTML = '<li class="text-center py-8">Loading questions...</li>';

        // Add cache-busting parameter if forcing refresh
        const url = forceRefresh 
          ? `http://localhost:5000/api/questions?timestamp=${Date.now()}` 
          : 'http://localhost:5000/api/questions';

        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });

        if (!response.ok) throw new Error('Failed to load questions');

        const questions = await response.json();
        renderAdminQuestions(questions);

      } catch (error) {
        console.error('Error loading questions:', error);
        const adminList = document.getElementById('adminQuestionList');
        if (adminList) {
          adminList.innerHTML = `
            <li class="p-4 bg-red-100 text-red-700 rounded">
              Error: ${error.message}
              <button onclick="loadAdminQuestions(true)" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                Retry
              </button>
            </li>
          `;
        }
      }
    }

    function renderAdminQuestions(questions) {
      const adminList = document.getElementById('adminQuestionList');
      adminList.innerHTML = '';

      if (!questions || questions.length === 0) {
        adminList.innerHTML = '<li class="text-center py-8 text-gray-500">No questions found</li>';
        return;
      }

      questions.forEach(q => {
        const li = document.createElement('li');
        li.className = 'mb-3 p-4 border rounded bg-white shadow-sm';
        
        li.innerHTML = `
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
            <button onclick="deleteQuestion('${q._id}')" 
                    class="mt-2 md:mt-0 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
              Delete
            </button>
          </div>
        `;
        
        adminList.appendChild(li);
      });
    }

    async function addQuestion() {
      try {
        // Get form values
        const question = document.getElementById('newQuestion').value.trim();
        const answer = document.getElementById('newAnswer').value.trim();
        const options = Array.from(document.querySelectorAll('.optionInput'))
          .map(input => input.value.trim())
          .filter(opt => opt);

        // Validate inputs
        if (!question || options.length < 2 || !answer) {
          showAlert('Please provide a question, at least 2 options, and the correct answer', 'error');
          return;
        }

        if (!options.includes(answer)) {
          showAlert('Correct answer must be one of the options', 'error');
          return;
        }

        // Show loading state
        const addBtn = document.getElementById('addQuestionBtn');
        addBtn.disabled = true;
        addBtn.textContent = 'Adding...';

        // Make API call
        const response = await fetch('http://localhost:5000/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify({ question, options, answer })
        });

        // Handle response
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add question');
        }

        // Clear form
        document.getElementById('newQuestion').value = '';
        document.getElementById('newAnswer').value = '';
        resetOptionFields();

        // Force refresh the question list
        await loadAdminQuestions(true); // Pass true to force refresh
        
        showAlert('Question added successfully!', 'success');

      } catch (error) {
        console.error('Add question error:', error);
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
        const response = await fetch(`http://localhost:5000/api/questions/${id}`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete question');
        }

        showAlert('Question deleted successfully', 'success');
        loadAdminQuestions();

      } catch (error) {
        console.error('Delete question error:', error);
        showAlert(`Error: ${error.message}`, 'error');
      }
    }

    // --- Admin Access Prompt ---
    function showAdminLoginPrompt() {
      const email = prompt("Enter admin email:");
      if (!email) return;
      
      const password = prompt("Enter admin password:");
      if (!password) return;
      
      login(email, password).then(() => {
        if (localStorage.getItem('userRole') === 'admin') {
          showAdminPanel();
        } else {
          showAlert("You don't have admin privileges", 'error');
        }
      });
    }

    // --- Helper Functions ---
    function resetOptionFields() {
      const optionFields = document.getElementById('optionFields');
      optionFields.innerHTML = '';
      // Add 2 default empty options
      for (let i = 0; i < 2; i++) {
        addOptionField();
      }
    }

    function addOptionField() {
      const optionFields = document.getElementById('optionFields');
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
      // Remove any existing alerts first
      const existingAlerts = document.querySelectorAll('.alert-message');
      existingAlerts.forEach(alert => alert.remove());

      const alertDiv = document.createElement('div');
      alertDiv.className = `alert-message fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
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

    // Make functions available globally for HTML onclick attributes
    window.showQuiz = showQuiz;
    window.loadAdminQuestions = loadAdminQuestions;
    window.deleteQuestion = deleteQuestion;
    window.logout = logout;