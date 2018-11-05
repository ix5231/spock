import * as path from "path";
import * as Http from "http";
import * as express from "express";
import * as socketIo from "socket.io";

const max_player: number = 2;

class Server {
    private app: express.Express;
    private port: number;
    private server: Http.Server;
    private io: SocketIO.Server;

    constructor(port?: number) {
        this.app = express();
        this.port = parseInt(process.env.PORT || "3000");
        this.server = Http.createServer(this.app);
        this.io = socketIo(this.server);
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
        this.io.on('connection', (socket) => {
            /*
            socket.on('matching', () => {
                if (this.sessions.try_join(socket.id)) { // 試合可能状態
                    socket.join('current_player');
                    if (this.sessions.ready()) {
                        const seed: number = Math.random();
                        this.io.to('current_player').emit('playing', seed);
                    } else {
                        this.io.to(socket.id).emit('host');
                    }
                }
            });
            */
        })
    }
}

let server = new Server();
server.route();
server.socketOpen();
server.listen();
