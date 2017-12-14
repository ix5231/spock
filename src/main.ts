import { ENABLE_DISABLE_REGEX } from 'tslint/lib';
import * as Phaser from 'phaser-ce';
import * as io from 'socket.io-client'

namespace spock {
    const KEYCODE = {
        a: 65,
        two: 98, four: 100,
        six: 102,
        eight: 104,
    };

    let game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

    function preload() {
        game.load.image('sky', 'assets/sky.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
        game.load.image('diamond', 'assets/diamond.png');
    }

    let player: Phaser.Sprite;
    let player2: Phaser.Sprite;

    let score_player;
    let score_player2;

    // group
    let platforms;
    let cursors;
    let a, two, four, six, eight;

    let stars;
    let diamonds;
    let scoreText;
    let scoreText2;
    let setText;

    function create() {
        // 物理
        game.physics.startSystem(Phaser.Physics.ARCADE);


        game.add.sprite(0, 0, 'sky');

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

        // プレイヤー作成
        player = game.add.sprite(32, game.world.height - 150, 'dude');
        player2 = game.add.sprite(700, game.world.height - 150, 'baddie');

        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);
        player2.animations.add('left', [0, 1], 10, true);
        player2.animations.add('right', [2, 3], 10, true);

        // 星追加
        stars = game.add.group();
        stars.enableBody = true;
        diamonds = game.add.group();
        diamonds.enableBody = true;

        for (var i = 0; i < 12; i++) {
            var star = stars.create(i * 70, 0, 'star');
            star.body.gravity.y = 300;
            star.body.bounce.y = 0.7 + Math.random() * 0.2;
        }

        game.time.events.repeat(Phaser.Timer.SECOND * 2, 10, createstar, this);

        // スコア
        scoreText = game.add.text(16, 16, 'P1.score: 0', { fontSize: 32, fill: '#000' });
        scoreText2 = game.add.text(600, 16, 'P2.score: 0', { fontSize: 32, fill: '#000' });
        setText = game.add.text(300, 16, 'Counter: 0', { fontSize: 32, fill: '#000' });
        
        // 操作
        cursors = game.input.keyboard.createCursorKeys();
        a = game.input.keyboard.addKey(KEYCODE.a);
        two = game.input.keyboard.addKey(KEYCODE.two);
        four = game.input.keyboard.addKey(KEYCODE.four);
        six = game.input.keyboard.addKey(KEYCODE.six);
        eight = game.input.keyboard.addKey(KEYCODE.eight);
        // タイマ
        game.time.events.loop(Phaser.Timer.SECOND, updateCounter, this);
    }

    function update() {
        // あたり判定
        game.physics.arcade.collide(player, platforms);
        game.physics.arcade.collide(player2, platforms);
        game.physics.arcade.collide(stars, platforms);

        //game.physics.arcade.overlap(player, stars, collectStar, undefined, this);
        game.physics.arcade.overlap(player, stars, collectStar, undefined, this);
        game.physics.arcade.overlap(player2, stars, collectStar2, undefined, this);

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
            var diamond = diamonds.create(player.x, player.y, 'diamond');
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

    function collectStar(_, star) {
        star.kill();

        score_player += 10;
        scoreText.text = 'P1.score: ' + score_player;
    }

    function collectStar2(_, star) {
        star.kill();

        score_player2 += 10;
        scoreText2.text = 'P2.score: ' + score_player2;
    }

    function createstar(){
        var stars = game.add.group();
        stars.enableBody = true;
    }

    function updateCounter(){
        /*var counter ;
        counter++;
        setText.text('Counter: ' + counter);*/
    }

    let socket = io.connect()
    socket.emit('matching')

    socket.on('playing', () => console.log('Start'))
}
