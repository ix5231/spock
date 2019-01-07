import * as path from "path";
import * as Http from "http";
import * as express from "express";
import * as socketIo from "socket.io";

const max_player: number = 2;

class Session {
    private io: SocketIO.Server;
    private nextNum: number;

    constructor(server: Http.Server) {
        this.io = socketIo(server);
        this.nextNum = 0;
    }

    socketOpen() {
        this.io.on('connection', (socket) => {
            socket['roomNum'] = this.nextNum;
            const pname: string = this.roomName(socket['roomNum']);
            socket.on('matching', () => {
                this.io.sockets.in(pname).clients((error, clients) => {
                    // this.io.sockets.in('room').clients((error, clients) => {
                    console.log('DEBUG: ' + pname + ' num ' + clients.length);
                    this.handleMatching(clients, socket);
                });
            });
            socket.on('action', (a) => socket.broadcast.to(pname).emit('action', a));
            socket.on('mypos', (x, y) => socket.broadcast.to(pname).emit('mypos', x, y));
        })
    }

    private handleMatching(clients: Array<string>, socket: SocketIO.Socket) {
        const pname: string = this.roomName(this.nextNum);
        if (clients.length < 2) {
            socket.join(pname);
        } else {
            socket.emit('denied');
        }
        if (clients.length == 1) {
            socket.emit('client');
            this.startPlay();
            console.log('DEBUG: START');
        } else {
            socket.emit(pname);
            console.log('DEBUG: HOST JOIN');
        }
    }

    private startPlay() {
        const seed: number = Math.random();
        this.io.in(this.roomName(this.nextNum)).emit('playing', seed);
        this.nextNum++;
    }

    private roomName(n: number): string {
        return 'room' + n;
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
