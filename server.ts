import * as path from "path"
import * as Http from "http"
import * as express from "express"
import * as socketIo from "socket.io"
import * as cors from "cors"

class Server {
    private app: any
    private port: number
    private server: any
    private io: any

    constructor(port?: number) {
        this.app = express()
        this.port = parseInt(process.env.PORT) || 3000
        this.server = Http.createServer(this.app)
        this.io = socketIo(this.server)

        this.app.use(cors());
        this.app.use(express.static('dist'))
        this.app.use('/dist', express.static(path.join(__dirname, 'dist')))
        this.app.use('/assets', express.static(path.join(__dirname, 'assets')))
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'))
        })
    }

    listen() {
        this.server.listen(this.port, () => console.log('Listening on ' + this.port))

        this.io.on('connect', (_) => { })
    }
}

new Server().listen();
