import * as path from "path";
import * as Http from "http";
import * as express from "express";
import * as socketIo from "socket.io";
import { LinkedList, Set } from "typescript-collections";

const max_player: number = 2;

class SessionManager {
    private players: LinkedList<string>;
    private waiting_players: LinkedList<string>;

    constructor() {
        this.players = new LinkedList();
        this.waiting_players = new LinkedList();
    }

    try_join(player: string): boolean {
        console.log('join');
        if (this.players.size() >= max_player) { // もういっぱい
            this.waiting_players.add(player);
            return false;
        } else {
            this.players.add(player);
            return true;
        }
    }

    leave(player: string): string | undefined {
        if (this.players.remove(player)) {
            return player;
        } else if (this.waiting_players.remove(player)) {
            return undefined;
        } else {
            throw new Error("No such player")
        }
    }

    ready(): boolean { return this.players.size() === 2; }

    try_join_waiter(): string | undefined {
        const next = this.waiting_players.removeElementAtIndex(0);
        if (next) { // 待ち人がいた場合
            this.players.add(next);
            return next;
        }
        return undefined;
    }
}

class Server {
    private app: express.Express;
    private port: number;
    private server: Http.Server;
    private io: SocketIO.Server;

    private sessions: SessionManager;

    constructor(port?: number) {
        this.app = express();
        this.port = parseInt(process.env.PORT || "3000");
        this.server = Http.createServer(this.app);
        this.io = socketIo(this.server);

        this.sessions = new SessionManager();
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

            socket.on('action', (a) => socket.broadcast.to('current_player').emit('action', a));
            socket.on('mypos', (x, y) => socket.broadcast.to('current_player').emit('mypos', x, y));

            socket.on('disconnect', () => {
                if (this.sessions.leave(socket.id)) { // 試合中のメンバーが退出
                    const next_player = this.sessions.try_join_waiter();
                    if (next_player) {
                        socket.join('current_player');
                        this.io.to(next_player).emit('playing');
                    }
                }
            });
        })
    }
}

let server = new Server();
server.route();
server.socketOpen();
server.listen();
