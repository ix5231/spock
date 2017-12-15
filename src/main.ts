import { ENABLE_DISABLE_REGEX } from 'tslint/lib';
import * as Phaser from 'phaser-ce';
import * as io from 'socket.io-client'

namespace spock {
    const screen_width: number = 800;
    const screen_height: number = 600;

    const game_time: number = Phaser.Timer.MINUTE * 1 + Phaser.Timer.SECOND * 30;

    const KEYCODE = {
       a: 65,
       two: 98,
       four: 100,
       six: 102,
       eight: 104,
    };

    enum Action {
        MoveLeft,
        MoveRight,
        Jump,
        Stop,
    }

    // グローバルな設定
    class Boot extends Phaser.State {
        public create() {
            game.stage.disableVisibilityChange = true;
            game.physics.startSystem(Phaser.Physics.ARCADE);

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
        private cursors: Phaser.CursorKeys;

        public create() {
            this.cursors = game.input.keyboard.createCursorKeys();

            client.emitMatching();
        }

        public render() {
            this.game.debug.text("Matching...", 1, 16);
        }

        public gameStart() {
            game.state.start('gaming');
        }
    }

    // 試合中
    class Gaming extends Phaser.State {
        // players
        private player1: Phaser.Sprite;
        private player2: Phaser.Sprite;

        // scores
        private scorePlayer1: number = 0;
        private scorePlayer2: number = 0;

        // texts
        private scorePlayer1Text: Phaser.Text;
        private scorePlayer2Text: Phaser.Text;
        private timeLeft: Phaser.Text;

        // groups
        private platforms: Phaser.Group;
        private stars: Phaser.Group;
        private diamonds: Phaser.Group;

        // timers
        private gameTimer;

        // keys
        private cursors: Phaser.CursorKeys;

        public create() {
            game.add.sprite(0, 0, 'sky');

            this.setupField();
            this.setupPlayers();
            this.setupStars();
            this.setupUi();
            this.setupInput();
            this.gameTimer = new Timer(game, game_time, () => {});

            this.gameTimer.start();
        }

        public render() {
            this.refreshUi();
        }

        public update() {
            // あたり判定
            game.physics.arcade.collide(this.player1, this.platforms);
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

            this.handleInput();
        }

        // 入力処理
        private handleInput() {
            let action: Action | undefined = undefined;
            if (this.cursors.left.isDown) {
                action = Action.MoveLeft;
            } else if (this.cursors.right.isDown) {
                action = Action.MoveRight;
            } else {
                action = Action.Stop;
            }
            if (this.cursors.up.isDown && this.player1.body.touching.down) {
                action = Action.Jump;
            }

            if(action != undefined){
                this.handleMove(this.player1, action);
                if(this.prevAction != action) {
                    console.log(action);
                    client.emitAction(action);
                    this.prevAction = action;
                }
            }
        }

        private prevAction: Action = Action.Stop;

        // 移動処理
        private handleMove(player: Phaser.Sprite, action: Action) {
            switch(action) {
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
                case Action.Stop:
                    player.body.velocity.x = 0;
                    player.animations.stop();
                    player.frame = 4;
                    break;
            }
        }

        public enemyMove(action: Action) {
            this.handleMove(this.player2, action);
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

            this.player2 = game.add.sprite(700, game.world.height - 150, 'baddie');
            game.physics.arcade.enable(this.player2);

            this.player2.body.bounce.y = 0
            this.player2.body.gravity.y = 300
            this.player2.body.collideWorldBounds = true

            this.player2.animations.add('left', [0, 1], 10, true);
            this.player2.animations.add('right', [2, 3], 10, true);
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
            this.diamonds = game.add.group();
            this.diamonds.enableBody = true;

            for (let i = 0; i < 12; i++) {
                this.create_star(i * 70, 0);
            }
        }

        // Uiのセットアップ
        private setupUi() {
            this.scorePlayer1Text = game.add.text(16, 16, 'P1.score:', { fontSize: 32, fill: '#000' });
            this.scorePlayer2Text = game.add.text(600, 16, 'P2.score:', { fontSize: 32, fill: '#000' });
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
        }

        // Uiの更新
        private refreshUi() {
            this.scorePlayer1Text.text = 'P1.score: ' + this.scorePlayer1;
            this.scorePlayer2Text.text = 'P2.score: ' + this.scorePlayer2;
            this.timeLeft.text = 'TimeLeft: ' + this.gameTimer.text();
        }
    }

    class Timer {
        private timer: Phaser.Timer;
        private timerEvent: Phaser.TimerEvent;
        private time: number;
        private callback: Function;

        public constructor(game: Phaser.Game, time: number, callback: Function) {
            this.timer = game.time.create();
            this.time = time;
            this.callback = callback;
        }

        public start() {
            this.timerEvent = this.timer.add(Phaser.Timer.MINUTE * 1 + Phaser.Timer.SECOND * 30, () => {
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
            return String("0" + minutes).substr(-2) + ":" + String("0" + seconds).substr(-2);   
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
            switch(action) {
                case Action.MoveLeft:
                    this.socket.emit('moveleft');
                    break;
                case Action.MoveRight:
                    this.socket.emit('moveright');
                    break;
                case Action.Jump:
                    this.socket.emit('jump');
                    break;
                case Action.Stop:
                    this.socket.emit('stop');
                    break;
            }
        }

        private registerHandlers() {
            this.socket.on('playing', () => matchingState.gameStart());
            this.socket.on('moveleft', () => gamingState.enemyMove(Action.MoveLeft));
            this.socket.on('moveright', () => gamingState.enemyMove(Action.MoveRight));
            this.socket.on('jump', () => gamingState.enemyMove(Action.Jump));
            this.socket.on('stop', function() { gamingState.enemyMove(Action.Stop)});
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
