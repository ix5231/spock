import * as path from "path";
import * as Http from "http";
import * as express from "express";
import * as socketIo from "socket.io";

const max_player: number = 2;

class SessionManager {
    public players: Array<string>;
    private waiting_players: Array<string>;

    constructor() {
        this.players = new Array();
        this.waiting_players = new Array();
    }

    // 入室を試みる
    // 成功でtrue, 失敗でfalseを返す
    try_join(player: string): boolean {
        console.log('TRACE: Try join');
        if (this.ready()) { // もういっぱい
            this.waiting_players.push(player); // 待ってもらう
            return false;
        } else {
            this.players.push(player);
            return true;
        }
    }

    leave(player: string): string | undefined {
        //if (this.players.remove(player, (a, b) => a === b)) {
        if (this.players.splice(this.players.indexOf(player), 1)) {
            console.log('TRACE: removed player from battle')
            return player;
        } else if (this.waiting_players.splice(this.players.indexOf(player), 1)) {
            console.log('TRACE: removed player from wait queue')
            return undefined;
        } else {
            throw new Error("ERROR: No such player")
        }
    }

    ready(): boolean { return this.players.length === 2; }

    try_join_waiter(): string | undefined {
        const next = this.waiting_players.splice(0, 1);
        if (next != []) { // 待ち人がいた場合
            this.players.push(next[0]);
            return next[0];
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
                    console.log('TRACE: Member left')
                    this.io.to(this.sessions.players[0]).emit('reset');
                    console.log('TRACE: Send reset to: ', this.sessions.players[0])

                    const next_player = this.sessions.try_join_waiter();
                    if (next_player) {
                        socket.join('current_player');
                        this.io.to(this.sessions.players[0]).emit('host');
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
