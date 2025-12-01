const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');
const e = require('express');

//register new user
router.post('/register', async (req, res) => {
  console.log('Registration received:', req.body);

  try {
    const { username, email, password } = req.body;

    // basic validations
    if (!username || !email || !password) {
      console.log('Error:Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // check if user already exists
    console.log('Checking if user already exists');
    const userExists = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (userExists.rows.length > 0) {
      console.log('Error:User already exists');
      return res.status(400).json({
        success: false,
        message: 'Username or email is already registered'
      });
    }

    // hash password
    console.log('Generating password hash...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // insert new user into database
    console.log('Inserting new user into database...');
    const result = await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [username, email, passwordHash]
    );

    console.log('User registered successfully', result.rows[0]);
    res.json({
      success: true,
      message: 'User registered successfully'
    });

  } catch (err) {
    console.error('Detailed registration error', {
      error: err.message,
      code: err.code,
      detail: err.detail,
      table: err.table,
      constraint: err.constraint
    });

    // handle specific errors
    if (err.code === '23505') {
      console.log('Error:User already exists');
      return res.status(400).json({
        success: false,
        message: 'Username or email is already registered'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error registering user. Please try again'
      });
    }
  }
});

// login user
router.post('/login', async (req, res) => {
  console.log('Login attempt: ', { username: req.body.username });

  try {
    const { username, password } = req.body;

    // basic validations
    if (!username || !password) {
      console.log('Error:Missing fields in login');
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find user by username
    console.log('Searching user in database...');
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    if (!user) {
      console.log('Error:User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Verify password
    console.log('Verifying password...');
    const Validpassword = await bcrypt.compare(password, user.password_hash);

    if (!Validpassword) {
      console.log('Error:Incorrect password');
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Update last_login
    console.log('Updating last login...');
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Set session
    req.session.userId = user.id;

    console.log('login successful:', { username: user.username, id: user.id });
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      message: 'Login successful'
    });

  } catch (err) {
    console.error('Detailed login error', {
      error: err.message,
      code: err.code,
      detail: err.detail,
      table: err.table,
      constraint: err.constraint
    });
    res.status(500).json({
      success: false,
      message: 'Error logging in. Please try again'
    });
  }
});

// logout user
router.post('/logout', (req, res) => {

  req.session.destroy(err => {
    if (err) {
      console.error('Error in logout', err);
      return res.status(500).json({
        success: false,
        message: 'Error logging out. Please try again'
      });
    }
    res.json({
      success: true,
      message: 'Logout successful'
    });

  });

});

// get current user
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  try {
    const result = await db.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [req.session.userId]
    );
    if (!result.rows[0]) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (err) {
    console.error('Error fetching user data', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data. Please try again'
    });
  }
});

module.exports = router;