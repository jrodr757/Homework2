// Requires
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chatSession = require('./chat-session');
var commands = require('./chat-commands')(io, chatSession);

// Routes
app.use(express.static(__dirname + '/public'));

app.get('/chatapp', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// Sockets
io.on('connection', function(socket) {
  var player = {};

  socket.on('register', function(uuid) {
    if (!(player = chatSession.players[uuid])) {
      chatSession.count++;
      player = chatSession.players[uuid] = {
        uuid: uuid,
        tabs: 0,
        nick: 'guest' + chatSession.count,
        socket: socket
      };
      socket.emit('message', chatSession.log);
      io.sockets.emit('nickname', player.nick);

    } else {
      player = chatSession.players[uuid];
      socket.emit('message', chatSession.log + '\nWelcome back ' + player.nick + '!');
      if (!player.disconnected) {
        player.tabs++;
        socket.disconnect();
      }
    }
    // Keep player connected if a refresh occurs before timeout
    if (player.disconnected) {
      clearTimeout(player.timeout);
      player.disconnected = false;
    }

    chatSession.players[uuid] = player;
  });

  socket.on('disconnect', function(type) {
    // Don't disconnect player in-game
    if (type == 'booted' && player.tabs > 0)
      return;

    player.disconnected = true;

    player.timeout = setTimeout(function() {
      if (player.disconnected) {
        delete chatSession.players[player.uuid];
        chatSession.count--;
      }
    }, 2000);
  });

  socket.on('message', function(msg) {
    if (!commands.isCommand(msg)) {
      var out = player.nick + ': ' + msg;
      io.emit('message', out);
      chatSession.log += out + "\n";
      console.log(out);
    } else
      commands.run(player, msg);
  });
});

http.listen(3000, function(){
  console.log('Chat App Online @ localhost: 3000');
});
