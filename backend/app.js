const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quizapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // Timeout for server selection
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Models (Ensure these files exist in ./models/)
const User = require('./models/User');
const Question = require('./models/Question');
const Result = require('./models/Result');
const Setting = require('./models/Setting');

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('Authenticate: No token provided');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Authenticate: Invalid token', error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin Middleware
const adminCheck = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.log(`AdminCheck: User ${req.user.username} is not admin, role: ${req.user.role}`);
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

// Routes

// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ token, role: user.role, username: user.username });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, username: user.username },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role, username: user.username });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get Questions
app.get('/api/questions', authenticate, async (req, res) => {
  try {
    let questionLimit = 0;
    if (req.user.role !== 'admin') {
      const setting = await Setting.findOne({ name: 'questionLimit' });
      questionLimit = parseInt(setting?.value) || 0;
    }

    let questions = await Question.find();

    if (req.user.role !== 'admin' && questionLimit > 0 && questions.length > questionLimit) {
      questions = questions
        .sort(() => Math.random() - 0.5)
        .slice(0, questionLimit);
    }

    res.json(questions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Submit Quiz
app.post('/api/submit', authenticate, async (req, res) => {
  try {
    const { answers } = req.body;

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty answers array' });
    }

    let score = 0;
    for (const answer of answers) {
      if (!answer.id || !answer.answer) {
        continue;
      }
      const question = await Question.findById(answer.id);
      if (question && question.answer === answer.answer) {
        score++;
      }
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const totalQuestions = answers.length;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 0;

    const result = new Result({
      userId: req.user.userId,
      username: user.username,
      score,
      totalQuestions,
      percentage
    });

    await result.save();

    const leaderboard = await Result.find()
      .sort({ percentage: -1, submittedAt: 1 })
      .limit(10);

    const allResults = await Result.find().sort({ percentage: -1, submittedAt: 1 });
    const userRank = allResults.findIndex(r => r.userId.toString() === req.user.userId.toString()) + 1;

    res.json({
      score,
      total: totalQuestions,
      percentage,
      rank: userRank,
      leaderboard
    });

  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get Users (Admin only)
app.get('/api/users', authenticate, adminCheck, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    console.log(`Get users: Returning ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Delete User (Admin only)
app.delete('/api/users/:id', authenticate, adminCheck, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role === 'admin' && req.user.userId === userId) {
      return res.status(403).json({ error: 'Cannot delete own admin account' });
    }

    await User.findByIdAndDelete(userId);
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await Result.find()
      .sort({ percentage: -1, submittedAt: 1 })
      .limit(10);

    let userRank = null;
    let userScore = null;

    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        const allResults = await Result.find().sort({ percentage: -1, submittedAt: 1 });
        userRank = allResults.findIndex(r => r.userId.toString() === decoded.userId.toString()) + 1;

        const userBestResult = await Result.findOne({ userId: decoded.userId })
          .sort({ percentage: -1, submittedAt: 1 });

        if (userBestResult) {
          userScore = {
            score: userBestResult.score,
            total: userBestResult.totalQuestions,
            percentage: userBestResult.percentage
          };
        }
      } catch (error) {
        console.error('Leaderboard token error:', error);
      }
    }

    res.json({ leaderboard, userRank, userScore });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Get Question Limit (Allow all authenticated users)
app.get('/api/settings/questionLimit', authenticate, async (req, res) => {
  try {
    const setting = await Setting.findOne({ name: 'questionLimit' });
    console.log(`Get questionLimit: ${setting?.value || '0'}`);
    res.json({ value: setting?.value || '0' });
  } catch (error) {
    console.error('Get questionLimit error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Update Question Limit (Admin only)
app.put('/api/settings/questionLimit', authenticate, adminCheck, async (req, res) => {
  try {
    const { value } = req.body;

    const limit = parseInt(value);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: 'Invalid value' });
    }

    const setting = await Setting.findOneAndUpdate(
      { name: 'questionLimit' },
      { value: String(limit) },
      { upsert: true, new: true }
    );

    console.log(`Update questionLimit: Set to ${setting.value}`);
    res.json({ value: setting.value });
  } catch (error) {
    console.error('Update questionLimit error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Add Question (Admin only)
app.post('/api/questions', authenticate, adminCheck, async (req, res) => {
  try {
    const { question, options, answer } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2 || !answer) {
      return res.status(400).json({ error: 'Question, at least 2 options, and answer are required' });
    }

    if (!options.includes(answer)) {
      return res.status(400).json({ error: 'Correct answer must be one of the options' });
    }

    const newQuestion = new Question({
      question,
      options,
      answer
    });

    await newQuestion.save();
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(201).json(questions);

  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Delete Question (Admin only)
app.delete('/api/questions/:id', authenticate, adminCheck, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await Question.findByIdAndDelete(req.params.id);
    const questions = await Question.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// Disable caching
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});