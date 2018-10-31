import { ENABLE_DISABLE_REGEX } from 'tslint/lib';
import * as Phaser from 'phaser-ce';
import * as io from 'socket.io-client';
import * as seedrandom from 'seedrandom';

namespace spock {
    const screen_width: number = 800;
    const screen_height: number = 600;

    const game_time: number = Phaser.Timer.MINUTE * 1 + Phaser.Timer.SECOND * 30;

    enum Action {
        MoveLeft,
        MoveRight,
        Jump,
        Attack,
        Stop,
    }

    // グローバルな設定
    class Boot extends Phaser.State {
        public create() {
            game.stage.disableVisibilityChange = true;

            game.state.start('load');
        }
    }

    // アセット読み込み
    class Load extends Phaser.State {
        public preload() {
            game.load.image('sky', 'assets/sky.png');
            game.load.image('ground', 'assets/platform.png');
            game.load.image('star', 'assets/star.png');
            game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
            game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
            game.load.image('diamond', 'assets/diamond.png');
        }

        public create() {
            game.state.start('matching');
        }
    }

    // マッチング中
    class Matching extends Phaser.State {
        private isHost: boolean;

        public create() {
            this.isHost = false;

            client.emitMatching();
        }

        public render() {
            if (this.isHost) {
                this.game.debug.text('Hosting...', 1, 16);
            } else {
                this.game.debug.text('Matching...', 1, 16);
            }
        }

        public gameStart() {
            game.state.start('gaming');
        }

        public isOurHost(h: boolean) {
            this.isHost = h;
        }

        public amIHost(): boolean {
            return this.isHost;
        }
    }

    // 試合中
    class Gaming extends Phaser.State {
        // players
        private player1: Phaser.Sprite;
        private player2: Phaser.Sprite;

        // scores
        private scorePlayer1: number;
        private scorePlayer2: number;

        // texts
        private scorePlayer1Text: Phaser.Text;
        private scorePlayer2Text: Phaser.Text;
        private timeLeft: Phaser.Text;

        // groups
        private platforms: Phaser.Group;
        private stars: Phaser.Group;
        private diamonds1: Phaser.Group;
        private diamonds2: Phaser.Group;

        // timers
        private gameTimer;

        // keys
        private cursors: Phaser.CursorKeys;
        private attackKey: Phaser.Key;

        private hitPlatform: boolean;
        private playing: boolean;

        // flag determines reset next tick
        private resetNext: boolean;

        public create() {
            game.add.sprite(0, 0, 'sky');
            game.physics.startSystem(Phaser.Physics.ARCADE);

            this.setupField();
            this.setupPlayers();
            this.setupStars();
            this.setupUi();
            this.setupInput();
            this.playing = true;
            this.gameTimer = new Timer(game_time, () => {
                this.playing = false;
            });

            this.gameTimer.start();
        }

        public render() {
            this.refreshUi();
            if (matchingState.amIHost()) {
                this.game.debug.text('Host', 1, 16);
            } else {
                this.game.debug.text('Client', 1, 16);
            }
            if (!this.playing) {
                this.scorePlayer1Text.text = "";
                this.scorePlayer2Text.text = "";
                let text;
                if (this.scorePlayer1 === this.scorePlayer2) {
                    text = "Draw";
                } else if (this.scorePlayer1 > this.scorePlayer2) {
                    text = "You win!";
                } else {
                    text = "You lose...";
                }
                this.timeLeft.text = text;
            }
        }

        public update() {
            if (this.resetNext) {
                this.reset()
                console.log('TRACE: Reset completed')
            }
            if (this.playing) {
                // あたり判定
                this.hitPlatform = game.physics.arcade.collide(this.player1, this.platforms);
                game.physics.arcade.collide(this.player2, this.platforms);
                game.physics.arcade.collide(this.stars, this.platforms);

                game.physics.arcade.overlap(this.player1, this.stars, (_, star) => {
                    star.kill();
                    this.create_star(screen_width * Math.random(), 0);

                    this.scorePlayer1 += 10;
                }, undefined, this);
                game.physics.arcade.overlap(this.player2, this.stars, (_, star) => {
                    star.kill();
                    this.create_star(screen_width * Math.random(), 0);

                    this.scorePlayer2 += 10;
                }, undefined, this);
                game.physics.arcade.overlap(this.player1, this.diamonds2, (_, diamond) => {
                    diamond.kill();

                    this.scorePlayer1 -= 5;
                }, undefined, this);
                game.physics.arcade.overlap(this.player2, this.diamonds1, (_, diamond) => {
                    diamond.kill();

                    this.scorePlayer2 -= 5;
                }, undefined, this);

                this.handleInput();
            }
        }

        // 次回アップデート時リセットを予約
        public reserveReset() {
            console.log('TRACE: Reset reserved')
            this.resetNext = true
        }

        // 入力処理
        private handleInput() {
            let action: Array<Action> = new Array();
            if (this.cursors.left.isDown) {
                action.push(Action.MoveLeft);
            } else if (this.cursors.right.isDown) {
                action.push(Action.MoveRight);
            } else {
                action.push(Action.Stop);
            }
            if (this.cursors.up.isDown && this.player1.body.touching.down &&
                this.hitPlatform) {
                action.push(Action.Jump);
            }
            if (this.attackKey.justDown) {
                action.push(Action.Attack);
            }

            action.forEach((a) => {
                this.handleMove(this.player1, a, true);
                client.emitAction(a);
            })
            client.emitPos(this.player1.x, this.player1.y);
        }

        // 移動処理
        private handleMove(player: Phaser.Sprite, action: Action, isMe: boolean) {
            switch (action) {
                case Action.MoveLeft:
                    player.body.velocity.x = -150;
                    player.animations.play('left');
                    break;
                case Action.MoveRight:
                    player.body.velocity.x = 150;
                    player.animations.play('right');
                    break;
                case Action.Jump:
                    player.body.velocity.y = -350;
                    break;
                case Action.Attack:
                    const diamond = (isMe ? this.diamonds1 : this.diamonds2)
                        .create(player.x, player.y, 'diamond');
                    diamond.body.velocity.x = (player.body.velocity.x > 0 ? 1 : -1) * 300;
                    break;
                case Action.Stop:
                    player.body.velocity.x = 0;
                    player.animations.stop();
                    player.frame = 4;
                    break;
            }
        }

        public enemyMove(action: Action) {
            this.handleMove(this.player2, action, false);
        }

        public enemyPosSet(x: number, y: number) {
            this.player2.x = x;
            this.player2.y = y;
        }

        // プレイヤー追加
        private setupPlayers() {
            this.player1 = game.add.sprite(32, game.world.height - 150, 'dude');
            game.physics.arcade.enable(this.player1);

            this.player1.body.bounce.y = 0
            this.player1.body.gravity.y = 300
            this.player1.body.collideWorldBounds = true

            this.player1.animations.add('left', [0, 1, 2, 3], 10, true);
            this.player1.animations.add('right', [5, 6, 7, 8], 10, true);

            this.scorePlayer1 = 0;
          
            this.player2 = game.add.sprite(700, game.world.height - 150, 'baddie');
            game.physics.arcade.enable(this.player2);

            this.player2.body.bounce.y = 0
            this.player2.body.gravity.y = 300
            this.player2.body.collideWorldBounds = true

            this.player2.animations.add('left', [0, 1], 10, true);
            this.player2.animations.add('right', [2, 3], 10, true);

            this.scorePlayer2 = 0;
            // クライアント側はbaddie(player2)を操作
            if (matchingState.amIHost() == false) {
                let tmp = this.player1;
                this.player1 = this.player2;
                this.player2 = tmp;
            }
        }

        // 星追加
        private create_star(x: number, y: number) {
            const star = this.stars.create(x, y, 'star');
            star.body.gravity.y = 300;
            star.body.bounce.y = 0.7 + Math.random() * 0.2;
        }

        // 初期星追加
        private setupStars() {
            this.stars = game.add.group();
            this.stars.enableBody = true;
          
            this.diamonds1 = game.add.group();
            this.diamonds1.enableBody = true;
            this.diamonds2 = game.add.group();
            this.diamonds2.enableBody = true;

            for (let i = 0; i < 12; i++) {
                this.create_star(i * 70, 0);
            }
        }

        // Uiのセットアップ
        private setupUi() {
            this.scorePlayer1Text = game.add.text(16, 16, 'P1.score:', { fontSize: 32, fill: '#000' });
            this.scorePlayer2Text = game.add.text(550, 16, 'P2.score:', { fontSize: 32, fill: '#000' });
            this.timeLeft = game.add.text(280, 16, 'TimeLeft:', { fontSize: 32, fill: '#000' });
        }

        // フィールド作成
        private setupField() {
            // 足場グループ
            this.platforms = game.add.group();
            this.platforms.enableBody = true;

            // 足場生成
            const ground = this.platforms.create(0, game.world.height - 64, 'ground');
            ground.scale.setTo(2, 2);
            ground.body.immovable = true;

            const ledge1 = this.platforms.create(400, 400, 'ground');
            ledge1.body.immovable = true;
            const ledge2 = this.platforms.create(-150, 250, 'ground');
            ledge2.body.immovable = true;
        }

        // 操作セットアップ
        private setupInput() {
            this.cursors = game.input.keyboard.createCursorKeys();
            this.attackKey = game.input.keyboard.addKey(65);
        }

        // Uiの更新
        private refreshUi() {
            this.scorePlayer1Text.text = 'You: ' + this.scorePlayer1;
            this.scorePlayer2Text.text = 'Enemy: ' + this.scorePlayer2;
            this.timeLeft.text = 'TimeLeft: ' + this.gameTimer.text();
        }

        // リセットする
        private reset() {
            this.player1.destroy();
            this.player2.destroy();
            this.setupPlayers();

            this.stars.destroy();
            this.diamonds1.destroy();
            this.diamonds2.destroy();
            this.setupStars();

            this.playing = true;
            this.gameTimer = new Timer(game_time, () => {
                this.playing = false;
            });

            this.gameTimer.start();

            this.resetNext = false;
        }
    }

    class Timer {
        private timer: Phaser.Timer;
        private timerEvent: Phaser.TimerEvent;
        private time: number;
        private callback: Function;

        public constructor(time: number, callback: Function) {
            this.timer = game.time.create();
            this.time = time;
            this.callback = callback;
        }

        public start() {
            this.timerEvent = this.timer.add(this.time, () => {
                this.timer.stop();
                this.callback();
            });
            this.timer.start();
        }

        public text(): string {
            return this.formatTime(Math.round((this.timerEvent.delay - this.timer.ms) / 1000));
        }

        private formatTime(s: number): string {
            const minutes = Math.floor(s / 60);
            const seconds = (s - minutes * 60);
            return String('0' + minutes).substr(-2) + ':' + String('0' + seconds).substr(-2);
        }
    }

    class Client {
        private socket: io.Socket;

        constructor() {
            this.socket = io.connect();
            this.registerHandlers();
        }

        public emitMatching() {
            this.socket.emit('matching');
        }

        public emitAction(action: Action) {
            this.socket.emit('action', action);
        }

        public emitPos(x: number, y: number) {
            this.socket.emit('mypos', x, y);
        }

        private registerHandlers() {
            this.socket.on('playing', (seed: number) => {
                seedrandom(String(seed), { global: true });
                matchingState.gameStart();
            });
            this.socket.on('host', () => matchingState.isOurHost(true));
            this.socket.on('action', (a: Action) => gamingState.enemyMove(a));
            this.socket.on('mypos', (x: number, y: number) => gamingState.enemyPosSet(x, y));
            this.socket.on('reset', () => { console.log("reset"); gamingState.reserveReset() });
        }
    }

    const game: Phaser.Game = new Phaser.Game(screen_width, screen_height, Phaser.AUTO, '');
    const matchingState: Matching = new Matching();
    const gamingState: Gaming = new Gaming();
    const client = new Client();

    game.state.add('boot', new Boot());
    game.state.add('load', new Load());
    game.state.add('matching', matchingState);
    game.state.add('gaming', gamingState);

    game.state.start('boot');
}
