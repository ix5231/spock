import * as path from "path";
import * as Http from "http";
import * as express from "express";
import * as socketIo from "socket.io";

const max_player: number = 2;

class Session {
    private io: SocketIO.Server;

    constructor(server: Http.Server) {
        this.io = socketIo(server);
    }

    socketOpen() {
        this.io.on('connection', (socket) => {
            socket.on('matching', () => {
                this.io.sockets.in('room').clients((error, clients) => {
                    console.log(clients.length);
                    if (clients.length < 2) {
                        socket.join('room');
                    } else {
                        socket.emit('denied');
                    }
                });
            });
        })
    }
}

class Server {
    private app: express.Express;
    private port: number;
    private server: Http.Server;
    private session: Session;

    constructor(port?: number) {
        this.app = express();
        this.port = parseInt(process.env.PORT || "3000");
        this.server = Http.createServer(this.app);
        this.session = new Session(this.server);
    }

    route() {
        this.app.use(express.static('dist'));
        this.app.use('/dist', express.static(path.join(__dirname, 'dist')));
        this.app.use('/assets', express.static(path.join(__dirname, 'assets')));
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'index.html'))
        });
    }

    listen() {
        this.server.listen(this.port, () => console.log('Listening on ' + this.port));
    }

    socketOpen() {
        this.session.socketOpen();
    }
}

let server = new Server();
server.route();
server.socketOpen();
server.listen();
