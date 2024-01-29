// const fs = require('fs')
// const path = require('path')
const axios = require('axios').default
const users = {}

function someoneConnected (socket, io) {
  const clients = Array.from(io.of('/').sockets.keys())
  if (!users[socket.id]) users[socket.id] = 'anonymous'
  console.log(clients)
  io.emit('server-message', { users })
}

function someoneLoggedOff (socket, io) {
  console.log(`${socket.id} is gone!`)
  if (users[socket.id]) delete users[socket.id]
  io.emit('server-message', { users })
}

function clientSentMessage (socket, io, msg) {
  console.log(`${socket.id}:`, msg)
  if (msg.action === 'code-update') {
    socket.broadcast.emit('server-message', {
      file: msg.payload.file,
      user: users[socket.id]
    })
  } else if (msg.action === 'user-logged-in') {
    users[socket.id] = msg.payload
    io.emit('server-message', { users })
  } else if (msg.action === 'user-coding') {
    io.emit('server-message', { isCoding: msg.payload.id })
  }
}

module.exports = (socket, io) => {
  someoneConnected(socket, io)
  socket.on('disconnect', () => { someoneLoggedOff(socket, io) })
  socket.on('new-action', (m) => { clientSentMessage(socket, io, m) })
}
