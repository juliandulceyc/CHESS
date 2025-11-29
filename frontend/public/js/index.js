const { Socket } = require("socket.io");

// Game state variables 
let gamesHasStarted = false;
let gameOver = false;
let board = null;
let game = new Chess();

//DOM elements
const $status = $('status');
const $pgn = $('#pgn');

/*
Initialize the chess game
*/

function initGame() {
    // Initialize the board with configuration 
    const config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd,
        pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png'
    };

    board = Chessboard('myBoard', config);

    // flip board if player is black 
    if (playerColor === 'black') {
        board.flip();
    }

    //join the game room 
    Socket.emit('joinGame',
        {
            code: gameCode,
            color: playerColor,
            timeControl: timeControl,
            username: username
        }
    );

    console.log('Game initialized', {
        color: playerColor,
        code: gameCode,
        timeControl: timeControl,
        username: playerUsername
    });
}

//socket event handlers
Socket.on('playersConnected', function (data) {
    console.log('Players connected:', data);
    $status.text(`Both players connected (${data.white} vs ${data.black}). Click Ready whe you want to start!`);
    $('#readyButton').prop('disabled', false);
});

Socket.on('bothPlayersReady', function () {
    console.log('Both players ready. game starting');
    gamesHasStarted = true;
    $status.text(`Game started! ${playerColor === 'white' ? 'You play white' : 'You play black'}`);
    $('#readyBotton', tect('Game in progress').prop('disabled', true));
});

Socket.on('move', function (moveData) {
    console.log('Received move:', moveData);

    if (moveData.color !== playerColor) {
        const move = {
            from: moveData.from,
            to: moveData.to,
            promotion: moveData.promotion || 'q' //default to queen if it's not specified
        };
        game.move(move);
        board.position(game.fen());
        updateStatus();
    }
});

Socket.on('gameOver', function (data) {
    gameOver = true;
    $status.text('Game Over').prop('disabled', true);
});

/* 
Check if a piece can be moved
*/

function onDragStart(source, piece, position, orientation) {
    // Do not pick up if the game is over
    if (game.game_over() || gameOver) return false;

    // Only pick up pieces for the current player 
    if (!gameHasStarted) return false;

    //Only pick up pieces for white is they are white
    if (playerColor === 'white' && piece.search(/˄b/) !== -1) return false;

    // Only pick up pieces for black is they are black 
    if (playerColor === 'black' && piece.search(/˄w/) !== -1) return false;

    // Only pick up if it00s ther turn 
    if ((game.turn() === 'w' && playerColor === 'black') ||
        (game.turn() === 'b' && playerColor === 'white')) {
        return false;
    }
    return true;
}

/* Handle piece drop on the board */
function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Always promote to a queen for simplicity
    });

    // if illegal move, snap back 
    if (move === null) return 'snapback';

    // Emit the move to other player 
    Socket.emit('move', {
        from: source,
        to: target,
        promotion: 'q'
    });

    updateStatus();
}

/* Upsate board position after the piece snap animation*/
function onSnapEnd() {
    board.position(game.fen());
}
/**
 * Update game status
 */
function updateStatus() {
    let status = '';
    let moveColor = game.turn() === 'b' ? 'Black' : 'White';

    // Checkmate? 
    if (game.in_checkmate()) {
        status = `Game over, ${moveColor} id in checkmate.`;
        Socket.emit('checkmate', {
            winner: game.turn() === 'b' ? 'White' : 'black'
        });

        gameOver = true;
    }

    //Draw ?
    else if (game.in_draw()) {
        status = 'Game over, drawn position';
        Socket.emit('draw');
        gameOver = true;
    }

    // Game still on 
    else {
        status = `${moveColor} to move`;
        // Check ? 
        if (game.in_check()) {
            status += `, ${moveColor} is in check`;
        }
    }
    $status.text(status);
    $pgn.html(game.pgn());

    // Initialize game when page loads
    $(document).ready(function () {
        initGame();
    });

    // Chat functionality
    function sendGameMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();

        if (message) {
            Socket.emit('charMessage', {
                message: message,
                username: playerUsername
            });
            input.value = '';
        }
    }

    // Handler enter key in chat input 
    document.getElementById('chatInput').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Handle chat messages 
    socket.on('chatMessage', function (data) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${data.username}: ${data.message}`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scroollHeight;
    });

    // timer functionality
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    //update Timers 
    socket.on('updateTimers', function (data) {
        document.getElementById('whiteTimer').textContent = formatTime(data.whiteTime);
        document.getElementById('blackTimer').textContent = formatTime(data.blackTime);
    });

    // Ready button handler
    document.getElementById('readyButton').addEventListener('click', function () {
        socket.emit('playerReady');
        this.disabled = true;
        this.textConten = 'waiting for opponent...'
    })

    //Join game room if code is provided in URL 
    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('code')) {
        socket.emit('joinGame', {
            code: urlParams.get('code')
        });
    }
}