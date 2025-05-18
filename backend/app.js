const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quizapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Question = require('./models/Question');

// Routes

// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'your_secret_key',
      { expiresIn: '1h' }
    );

    res.status(201).json({ token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      'your_secret_key',
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Questions
app.get('/api/questions', async (req, res) => {
  try {
    const questions = await Question.find().limit(15);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Quiz
app.post('/api/submit', async (req, res) => {
  try {
    const { answers } = req.body;
    
    // Calculate score
    let score = 0;
    for (const answer of answers) {
      const question = await Question.findById(answer.id);
      if (question && question.answer === answer.answer) {
        score++;
      }
    }

    res.json({ score, total: answers.length });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, 'your_secret_key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Add Question
// POST /api/questions
app.post('/api/questions', authenticate, async (req, res) => {
  try {
    const { question, options, answer } = req.body;
    
    const newQuestion = new Question({
      question,
      options,
      answer
    });

    await newQuestion.save();
    
    // Return the complete updated list
    const questions = await Question.find().sort({ createdAt: -1 });
    res.status(201).json(questions);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Disable caching for GET requests
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
});
// Delete Question
app.delete('/api/questions/:id', authenticate, async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});