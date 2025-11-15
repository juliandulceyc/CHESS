const games = {};

const player = {};

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

            //if both player are connected we notify everyone int the game room
            if (games[code].white && games[code].black){
                console.log(`Both players are connected in game ${code}`);

                io.to(code).emit('playersConnectted', {
                    white: players[games[code].white].username,
                    black: players[games[code].black].username
                });
            }
        });
    })
}