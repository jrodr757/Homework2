var nickname = 'guest';
var socket = io('http://10.0.0.8:3000');

$(function() {
  socket.on('connect', function() {
    if (!(uuid = localStorage.getItem('uuid'))) {
      var randomlyGeneratedUID = Math.random().toString(36).substring(3, 16) + +new Date;
      localStorage.setItem('uuid', randomlyGeneratedUID);
    }

    socket.emit('register', uuid);
  });

});

$('form').submit(function() {
  if (/\S/.test($('#m').val()))
    socket.emit('message', $('#m').val());
  $('#m').val('');
  return false;
});

// receive msg
socket.on('message', function(msg) {
  $('#messages').append($('<li>').text(msg));
});
socket.on('nickname', function(msg) {
  nickname = msg;
  $('#messages').append($('<li>').text(msg + ' just joined!'));
});
socket.on('clear', function() {
  $('#messages').html("");
});
