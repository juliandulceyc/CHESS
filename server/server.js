// needed imports 
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').createServerServer(app);
const io = require('socket.io');
require('dotenv').config();

//Middleware 

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//Routes for views 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/view/index.html'));
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/view/login.html'))
});
app.get('register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/view/register.html'))
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