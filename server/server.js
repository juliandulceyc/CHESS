// needed imports
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });


const http = require('http'),
  express = require('express'),
  session = require('express-session'),
  pgSession = require('connect-pg-simple')(session),
  socket = require('socket.io');

const config = require('../config');
const { pool } = require('./database/db');
const { requireAuth, setUserData } = require('./middleware/auth');
const authRoutes = require('./routes/auth');

const myIo = require('./sockets/io'),
  routes = require('./routes/routes');

const app = express(),
  server = http.Server(app),
  io = socket(server);

// Middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session settings
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'session',
    // clean expired session
    pruneSessionInterval: 60
  }),
  secret: process.env.SESSION_SECRET || 'your_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: false,
    rolling: true,
    maxAge: 3 * 60 * 1000
  }
}));
// Serve static files
app.use('/public', express.static(path.join(__dirname, '../frontend/public')));
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use(setUserData);

// View configuration
app.set('views', path.join(__dirname, '../frontend/views'));
app.set('view engine', 'html');
app.engine('html', require('express-handlebars').engine({
  extname: 'html',
  defaultLayout: false,
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    }
  }
}));

// public routes
app.use('/auth', authRoutes);

app.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('login');
});

app.get('/register', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/');
  }
  res.render('register');
});

// protected main route
app.get('/', requireAuth, (req, res) => {
  res.render('index', { user: res.locals.user });
});

//game routes
app.use('/game', requireAuth, routes);

// Socket.io configuration
myIo(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    sucess: false,
    message: 'Internal server error'
  });
});


// Port Settings and server start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});