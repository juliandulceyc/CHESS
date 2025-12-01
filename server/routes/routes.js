const express = require('express');
const router = express.Router();

const games = {};

// set an automatic cleaner that run every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(games).forEach(gameCode => {
    if (now - games[gameCode].created > 24 * 60 * 60 * 1000) {
      delete games[gameCode];
    }
  });
}, 60 * 60 * 1000);

// post route to create a new game

router.post('/create', (req, res) => {
  const { gameCode, timeControl } = req.body;

  //validate that new game exists
  if (!gameCode) {
    return res.status(400).json({
      success: false,
      message: 'Game code is required'
    });
  }

  //verify code is not in use

  if (games[gameCode]) {
    return res.status(400).json({
      success: false,
      message: 'Game code already in use'
    });
  }

  // create a new game with initial properties

  games[gameCode] = {
    timeControl: parseInt(timeControl) || 10,
    whitePlayer: req.session.userId,
    created: Date.now(),
    status: 'waiting'
  };

  // response with success
  res.json({
    success: true,
    message: 'Game created successfully',
    gameCode
  });
});

// post route to join an existing game

router.post('/join', (req, res) => {
  const { gameCode } = req.body;

  // basic validations
  if (!gameCode) {
    return res.status(400).json({
      success: false,
      message: 'Game code is required'
    });
  }

  const game = games[gameCode];

  // verify game exists
  if (!game) {
    return res.status(404).json({
      success: false,
      message: 'Game not found'
    });
  }

  // verify if the player is already in the game

  if (game.whitePlayer === req.session.userId) {
    return res.json({
      success: true,
      message: 'You are already in this game as white',

    });
  }

  if (game.blackPlayer === req.session.userId) {
    return res.json({
      success: true,
      message: 'You are already in this game as black',
    });
  }

  // we verify that the game is not full
  if (game.blackPlayer) {
    return res.status(400).json({
      success: false,
      message: 'Game is full'
    });
  }

  // We assign the black player and update the game status
  game.blackPlayer = req.session.userId;
  game.status = 'ready';

  // response with success
  res.json({
    success: true,
    message: 'You joined the game successfully',
  });
});

// Get route to see the game board

router.get('/:gameCode', (req, res) => {
  const { gameCode } = req.params;
  const game = games[gameCode];

  // if the game does not exist, we redirect with error
  if (!game) {
    return res.redirect('/?error=gameNotFound');
  }

  // we determine the color of the current player
  const isWhitePlayer = game.whitePlayer === req.session.userId;
  const isBlackPlayer = game.blackPlayer === req.session.userId;

  // if the player is not in the game, we redirect with error
  if (!isWhitePlayer && !isBlackPlayer) {
    return res.redirect('/?error=notPlayer');
  }
  // we render the game view with the game data
  res.render('game', {
    color: isWhitePlayer ? 'white' : 'black',
    gameCode,
    timeControl: game.timeControl,
    username: res.locals.user.username
  });
});

module.exports = router;
