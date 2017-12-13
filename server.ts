import * as path from "path";
import * as Http from "http";
import * as express from "express";
import * as socketIo from "socket.io";
import {Set} from "typescript-collections";

class SessionManager {
    private player1: number;
    private player2: number;
    private player_num: number;

    constructor() {
        this.player_num = 0;
    }

    try_join(player: number): boolean {
        if(this.player_num === 0) {
            this.player1 = player;
            this.player_num++;
            return true;
        } else if(this.player_num === 1) {
            this.player2 = player;
            this.player_num++;
            return true;
        } else {
            return false;
        }
    }

    leave(player: number) {
        if(this.player1 === player) {
            this.player1 = this.player2;
            this.player_num--;
        } else if(this.player2 === player) {
            this.player_num--;
        } else {
            throw new Error('No such plyaer');
        }
    }

    ready(): boolean { return this.player_num === 2; }
}

class Server {
    private app: any;
    private port: number;
    private server: any;
    private io: any;

    private sessions: SessionManager;

    constructor(port?: number) {
        this.app = express();
        this.port = parseInt(process.env.PORT) || 3000;
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
                socket.join('waiting')
                
            });

            socket.on('disconnect'), () => {
            }
        })
    }
}

let server = new Server();
server.route();
server.socketOpen();
server.listen();
