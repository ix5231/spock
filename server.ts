import * as path from "path"
import * as Http from "http"
import * as express from "express"
import * as socketIo from "socket.io"

const app = express()
const port = process.env.PORT || 3000
const server = Http.createServer(app)
const io = socketIo(server)

//app.use(express.static('dist'))
app.use('/dist', express.static(path.join(__dirname, 'dist')))
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'))
})

app.listen(port, () => console.log('Listening on ' + port))

io.on('connect', (_) => { })
