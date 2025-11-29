const { move } = require("../routes/auth");

const games = {};

const players = {};

module.exports = function (io) {
    io.on('connection', (socket) => {
        console.log('New client connected');

        //event when a player tries to join a game 
        socket.on('joinGame', (data) => {
            const { code, color, timeControl, username } = data;
            console.log(`Player ${username} joining game ${code} as ${color}`);

            //if the game does not exist, cret it with initial values
            if (!game[code]) {
                games[code] = {
                    white: null,
                    black: null,
                    timeControl: timeControl,
                    whiteReady: false,
                    blackReady: false,
                    gameStarted: false,
                    WhiteTime: timeControl * 60,
                    BlackTime: timeControl * 60,
                    turn: 'white',
                    moves: []
                };
            }

            //Save the information about the player in the player object 
            players[socket.id] = {
                username: username,
                gameCode: code,
                color: color
            };

            //players join the game room of Socket.io with the game code 
            socket.join(code);

            // we assign the player to the game color
            if (color == 'white') {
                games[code].white = socket.id;
            } else if (color === 'black') {
                games[code].black = socket.id;
            }

            //if both player are connected we notify everyone in the game room
            if (games[code].white && games[code].black) {
                console.log(`Both players are connected in game ${code}`);

                io.to(code).emit('playersConnectted', {
                    white: players[games[code].white].username,
                    black: players[games[code].black].username
                });
            }
        });

        // Event when a player shows that is ready to play
        socket.on('playerReady', (data) => {
            const { player } = players[socket.id];
            if (!player) return;

            const game = games[player.gameCode];
            if (!game) return;

            console.log(`Player ${player.username} is ready`);

            if (player.color === 'white') {
                game.whiteReady = true;
            } else if (player.color === 'black') {
                game.blackReady = true;
            }

            // if both players are ready  and game is not started, we start the game
            if (game.whiteReady && game.blackReady && !game.gameStarted) {
                console.log(`Game ${player.gameCode} starting`);
                game.gameStarted = true;
                io.to(player.gameCode).emit('bothPlayerReady');

                // Initialize the time for each player 
                game.timer = setInterval(() => {
                    if (game.turn === 'black') {
                        game.WhiteTime--;
                    } else {
                        game.BlackTime--;
                    }

                    //Notify all players about the new time
                    io.to(player.gameCode).emit('timeUpdate', {
                        white: game.WhiteTime,
                        black: game.BlackTime
                    });

                    //Verify if player has not time 
                    if (game.WhiteTime <= 0) {
                        clearInterval(game.timer);
                        io.to(player.gameCode).emit('gameOverTime', {
                            winnerUser: players[game.black].username
                        });
                    } else if (game.blackTime <= 0) {
                        clearInterval(game.timer);
                        io.to(player.gameCode).emit('gameOverTime', {
                            winnerUsername: player[game.white].username
                        });
                    }
                }, 1000);
            }
        });
        // Event when a player makes a move 
        socket.on('move', (data) => {
            const player = players[socket.id];
            if (!player) {
                consnole.log('Player reject: Player not found');
                return;
            }

            const game = games[player.gameCode];
            if (!game || !game.gameStarted) {
                console.log('Move rejected: Game not foun or not started');
                return;
            }
            //We verify if the turn is the player's turn 
            if (game.turn !== player.color) {
                console.log('Move rejected: Not player\'s turn');
                return;
            }
            console.log(`Move from ${player.color} in game ${player.gameCode}: ${data.from} to ${data.to}`);

            // we change the turn 
            game.turn = game.turn === 'white' ? 'black' : 'white';

            // we notify the move to all players
            io.to(player.gameCode).emit('move', {
                from: data.from,
                to: data.to,
                promotion: data.promotion,
                color: player.color
            });
        });

        //Event to manage chat messages
        socket.on('chat', (message) => {
            const player = players[socket.id];
            if (!player) return;

            console.log(`Chat message from ${player.username}: ${message}`);

            // we send the message to all players in the game 
            io.to(player.gameCode).emit('chat', {
                username: player.username,
                message: message
            });

        });

        //Event when the player gets disconnected
        socket.io('disconnect', () => {
            const player = player[socket.id];
            if (player) {
                console.log(`Player ${player.username}  disconnected from game ${player.gameCode}`);

                const game = games[player.gameCode];
                if (game) {
                    if (game.timer) {
                        clearInterval(game.timer);
                    }
                    // We notify all that a player discconected
                    io.to(player.gameCode).emit('gameOverDisconnected', {
                        username: player.username
                    });
                }

                //We delete the player from the player's list 
                delete players[socket.id];
            }
        });

        //Event when a player makescheckmate
        socket.on('checkmate', () => {
            const player = players[socket.id];
            if (!player) return;

            const game = games[player.gameCode]
            if (!game) return;

            if (game.timer) {
                clearInterval(game.timer);
            }

            // we notify all players tha the game ended
            io.to(player.gameCode).emit('gameOver', {
                reason: 'checkmate',
                winner: data.winner,
                winnerUsername: player[data.winner === 'white' ? game.white : game.black].username
            });
        });
    });
};