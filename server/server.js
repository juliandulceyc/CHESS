// needed imports 
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
require('dotenv').config();

//Middleware 

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

//Routes for views 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/index.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/login.html'))
});
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/views/register.html'))
});

//basic Socket.io settings
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected')
    });
});

// Port Setting and server start 
const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});