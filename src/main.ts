import { ENABLE_DISABLE_REGEX } from 'tslint/lib';
import * as Phaser from 'phaser-ce';
import * as io from 'socket.io-client'

namespace spock {
    const KEYCODE = {
       a: 65,
       two: 98,
       four: 100,
       six: 102,
       eight: 104,
    };

    const screen_width: number = 800;
    const screen_height: number = 600;

    let game: Phaser.Game = new Phaser.Game(screen_width, screen_height, Phaser.AUTO, '', { preload: preload, create: create, update: update });

    let player: Phaser.Sprite;
    let player2: Phaser.Sprite;

    let scorePlayer1: number = 0;
    let scorePlayer2: number = 0;

    // group
    let platforms: Phaser.Group;
    let stars: Phaser.Group;
    let diamonds: Phaser.Group;

    let ui;

    let cursors: Phaser.CursorKeys;
    let a, two, four, six, eight;

    function preload() {
        game.load.image('sky', 'assets/sky.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
        game.load.image('diamond', 'assets/diamond.png');
    }

    function create() {
        // 物理
        game.physics.startSystem(Phaser.Physics.ARCADE);

        game.add.sprite(0, 0, 'sky');

        setup_field();
        setup_players();
        setup_stars();
        ui = new Ui();
        setup_input();

        game.time.events.repeat(Phaser.Timer.SECOND * 2, 10, () =>  {
            var stars = game.add.group();
            stars.enableBody = true;
        }, this);

        // タイマ
        game.time.events.loop(Phaser.Timer.SECOND, updateCounter, this);
    }

    function update() {
        // あたり判定
        game.physics.arcade.collide(player, platforms);
        game.physics.arcade.collide(player2, platforms);
        game.physics.arcade.collide(stars, platforms);

        game.physics.arcade.overlap(player, stars, (_, star) => {
            star.kill();
            create_star(screen_width * Math.random(), 0);

            scorePlayer1 += 10;
            ui.refresh();
        }, undefined, this);
        game.physics.arcade.overlap(player2, stars, (_, star) => {
            star.kill();
            create_star(screen_width * Math.random(), 0);

            scorePlayer2 += 10;
            ui.refresh();
        }, undefined, this);

        // 移動
        player.body.velocity.x = 0;
        player2.body.velocity.x = 0;

        if (cursors.left.isDown) {
            player.body.velocity.x = -150;

            player.animations.play('left');
        }
        else if (cursors.right.isDown) {
            player.body.velocity.x = 150;

            player.animations.play('right');
        }
        else {
            player.animations.stop();

            player.frame = 4;
        }

        if (cursors.up.isDown && player.body.touching.down) {
            player.body.velocity.y = -350;
        }

        if (cursors.down.isDown) {
            player.body.velocity.y = 1000;
        }

        if(a.isUp)
        {
            //var i = 0;
        }else if(a.isDown)
        {
            //if(i == 0)
            //{
            let diamond = diamonds.create(player.x, player.y, 'diamond');
            diamond.body.velocity.x = 300;
            //i = 1;
            //}
        }


        if (four.isDown) {
            player2.body.velocity.x = -150;

            player2.animations.play('left');
        }
        else if (six.isDown) {
            player2.body.velocity.x = 150;

            player2.animations.play('right');
        }
        else {
            player2.animations.stop();

            player2.frame = 1;
        }

        if (eight.isDown && player2.body.touching.down) {
            player2.body.velocity.y = -350;
        }

        if (two.isDown) {
            player2.body.velocity.y = 1000;
        }
    }

    class Ui {
        private scorePlayer1: Phaser.Text;
        private scorePlayer2: Phaser.Text;

        constructor() {
            this.scorePlayer1 = game.add.text(16, 16, 'P1.score: 0', { fontSize: 32, fill: '#000' });
            this.scorePlayer2 = game.add.text(600, 16, 'P2.score: 0', { fontSize: 32, fill: '#000' });
        }

        refresh() {
            this.scorePlayer1.text = 'P1.score: ' + scorePlayer1;
            this.scorePlayer2.text = 'P2.score: ' + scorePlayer2;
        }
    }

    // プレイヤー追加
    function setup_players() {
        player = game.add.sprite(32, game.world.height - 150, 'dude');
        game.physics.arcade.enable(player);

        player.body.bounce.y = 0
        player.body.gravity.y = 300
        player.body.collideWorldBounds = true

        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);

        player2 = game.add.sprite(700, game.world.height - 150, 'baddie');
        game.physics.arcade.enable(player2);

        player2.body.bounce.y = 0
        player2.body.gravity.y = 300
        player2.body.collideWorldBounds = true

        player2.animations.add('left', [0, 1], 10, true);
        player2.animations.add('right', [2, 3], 10, true);
    }

    // 星追加
    function create_star(x: number, y: number) {
        let star = stars.create(x, y, 'star');
        star.body.gravity.y = 300;
        star.body.bounce.y = 0.7 + Math.random() * 0.2;
    }

    // 初期星追加
    function setup_stars() {
        stars = game.add.group();
        stars.enableBody = true;
        diamonds = game.add.group();
        diamonds.enableBody = true;

        for (let i = 0; i < 12; i++) {
            create_star(i * 70, 0);
        }
    }

    // フィールド作成
    function setup_field() {
        // 足場グループ
        platforms = game.add.group();
        platforms.enableBody = true;

        // 足場生成
        let ground = platforms.create(0, game.world.height - 64, 'ground');
        ground.scale.setTo(2, 2);
        ground.body.immovable = true;

        let ledge = platforms.create(400, 400, 'ground');
        ledge.body.immovable = true;
        ledge = platforms.create(-150, 250, 'ground');
        ledge.body.immovable = true;
    }

    // 操作セットアップ
    function setup_input() {
        cursors = game.input.keyboard.createCursorKeys();
        a = game.input.keyboard.addKey(KEYCODE.a);
        two = game.input.keyboard.addKey(KEYCODE.two);
        four = game.input.keyboard.addKey(KEYCODE.four);
        six = game.input.keyboard.addKey(KEYCODE.six);
        eight = game.input.keyboard.addKey(KEYCODE.eight);
    }

    function updateCounter(){
        /*var counter ;
          counter++;
          setText.text('Counter: ' + counter);*/
    }

    let socket = io.connect();
    socket.emit('matching');

    socket.on('playing', () => console.log('Start'));
}
