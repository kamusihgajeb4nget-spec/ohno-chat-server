const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let users = {};
let chats = [];
let videos = [];

io.on('connection', (socket) => {
  console.log('User connect');
  
  socket.on('login', (data) => {
    const { nama, password } = data;
    if (!users[nama]) users[nama] = { password, online: true };
    if (users[nama].password == password) {
      socket.nama = nama;
      users[nama].online = true;
      socket.emit('login_ok', { nama });
      socket.emit('load_data', { chats, videos });
      io.emit('online', Object.keys(users).filter(k=>users[k].online));
    } else {
      socket.emit('login_gagal');
    }
  });

  socket.on('kirim_chat', (pesan) => {
    const data = { dari: socket.nama, pesan: pesan, jam: new Date().toLocaleTimeString() };
    chats.push(data);
    if(chats.length > 100) chats.shift();
    io.emit('chat_baru', data);
  });

  socket.on('upload_video', (v) => {
    const vid = { id: Date.now(), owner: socket.nama, judul: v.judul, link: v.link, tipe: v.tipe };
    videos.unshift(vid);
    io.emit('video_baru', vid);
  });

  socket.on('disconnect', () => {
    if(socket.nama) users[socket.nama].online = false;
  });
});

app.get('/', (req,res) => res.send('OHNO CHAT SERVER AKTIF - BY FINO'));
server.listen(10000, () => console.log('Server jalan di port 10000'));