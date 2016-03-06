/**
 * Sockets Chat App
 * By Francisco Ortega (http://franciscoraulortega.com/), Alain Galvan (https://Alain.xyz)
 * Visit the page, and you'll be given a unique id and a default username you can rename with /nick <newname>
 * All previous messages in the chat are saved on the server.
 */

import * as Express from 'express';
import * as Http from 'http';
import * as Sockets from 'socket.io';

import chatSession from './chat-session';
import Commands from './chat-commands';

var app = Express();
var http = Http.createServer(app);
var io = Sockets(http);

var commands = Commands(io, chatSession);

// Routes
// Route all static files from the current directory + /public
// Route /chatapp to curdir + public/index.html
app.use(Express.static(__dirname + '/public'));
app.get('/chatapp', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});


// Sockets
io.on('connection', (socket) => {

  var player;

  socket.on('register', (uuid) => {
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



  socket.on('disconnect', (type) => {
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
    } else
      commands.run(player, msg);
  });

});


// Start App
var port = 8082;
http.listen(port);
console.log('Chat App Online @ localhost:' + port);
