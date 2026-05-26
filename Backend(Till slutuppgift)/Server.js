
// Server med Socket IO för att lägga till global highscore lista.
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
 
const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: { origin: '*' }
})
 
const PORT = 3000
 
//filer från spelet
app.use(express.static('../'))
 
// Spara Highscore
let highscores = []
 
io.on('connection', (socket) => {
    console.log('Spelare anslöt:', socket.id)
 
    // Skicka Highscore till en ny ansluten spelare
    socket.emit('updateHighscores', highscores)
 
    // Ta emot poäng 
    socket.on('submitScore', ({ name, score }) => {
        // Lägg till päng
        highscores.push({ name: name || 'Anonym', score })

        highscores.sort((a, b) => b.score - a.score)
        highscores = highscores.slice(0, 5)
 
        // Uppdatera high score listan till alla spelare som är anslutna
        io.emit('updateHighscores', highscores)
        console.log(`Ny poäng från ${name}: ${score}`)
    })
 
    socket.on('disconnect', () => {
        console.log('Spelare kopplade från:', socket.id)
    })

    socket.on('chatMessage', ({ name, text }) => {
    if (!text || text.trim() === '') return
    const msg = {
        name: name || 'Anonym',
        text: text.slice(0, 100)
    }
    io.emit('chatMessage', msg)
    console.log(`Chatt [${msg.name}]: ${msg.text}`)
})

})

server.listen(PORT, () => {
    console.log(`Server körs på http://localhost:${PORT}`)
})