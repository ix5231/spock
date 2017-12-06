import { ENABLE_DISABLE_REGEX } from 'tslint/lib';
import * as Phaser from 'phaser-ce';
import * as io from 'socket.io-client'

namespace spock {
    class Player {
        public sprite: Phaser.Sprite
        public score: number

        constructor(sprite: Phaser.Sprite) {
            this.sprite = sprite
            this.score = 0

            game.physics.arcade.enable(this.sprite);

            this.sprite.body.bounce.y = 0
            this.sprite.body.gravity.y = 300
            this.sprite.body.collideWorldBounds = true
        }

        addAnimation(name: string, frame: Array<number>, num: number, loop: boolean) {
            this.sprite.animations.add(name, frame, num, loop);
        }

        collectStar(star) {
            star.kill();

            this.score += 10;
            scoreText2.text = 'P2.score: ' + this.score;
        }
    }

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

    let player: Player;
    let player2: Player;

    // group
    let platforms;
    let cursors;
    let a, two, four, six, eight;

    let stars;
    let diamonds
    let scoreText;
    let scoreText2;

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
        player = new Player(game.add.sprite(32, game.world.height - 150, 'dude'));
        player2 = new Player(game.add.sprite(700, game.world.height - 150, 'baddie'));

        player.addAnimation('left', [0, 1, 2, 3], 10, true);
        player.addAnimation('right', [5, 6, 7, 8], 10, true);
        player2.addAnimation('left', [0, 1], 10, true);
        player2.addAnimation('right', [2, 3], 10, true);

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

        // スコア
        scoreText = game.add.text(16, 16, 'P1.score: 0', { fontSize: 32, fill: '#000' });
        scoreText2 = game.add.text(600, 16, 'P2.score: 0', { fontSize: 32, fill: '#000' });

        // 操作
        cursors = game.input.keyboard.createCursorKeys();
        a = game.input.keyboard.addKey(KEYCODE.a);
        two = game.input.keyboard.addKey(KEYCODE.two);
        four = game.input.keyboard.addKey(KEYCODE.four);
        six = game.input.keyboard.addKey(KEYCODE.six);
        eight = game.input.keyboard.addKey(KEYCODE.eight);
    }

    function update() {
        // あたり判定
        game.physics.arcade.collide(player.sprite, platforms);
        game.physics.arcade.collide(player2.sprite, platforms);
        game.physics.arcade.collide(stars, platforms);

        game.physics.arcade.overlap(player.sprite, stars, collectStar, null, this);
        game.physics.arcade.overlap(player2.sprite, stars, collectStar2, null, this);

        // 移動
        player.sprite.body.velocity.x = 0;
        player2.sprite.body.velocity.x = 0;

        if (cursors.left.isDown) {
            player.sprite.body.velocity.x = -150;

            player.sprite.animations.play('left');
        }
        else if (cursors.right.isDown) {
            player.sprite.body.velocity.x = 150;

            player.sprite.animations.play('right');
        }
        else {
            player.sprite.animations.stop();

            player.sprite.frame = 4;
        }

        if (cursors.up.isDown && player.sprite.body.touching.down) {
            player.sprite.body.velocity.y = -350;
        }

        if (cursors.down.isDown) {
            player.sprite.body.velocity.y = 1000;
        }

        if(a.isUp)
    {
        var i = 0;
    }else if(a.isDown)
    {
        if(i == 0)
        {
        var diamond = diamonds.create(player.sprite.x, player.sprite.y, 'diamond');
        diamond.body.velocity.x = 300;
        i = 1;
        }
    }


        if (four.isDown) {
            player2.sprite.body.velocity.x = -150;

            player2.sprite.animations.play('left');
        }
        else if (six.isDown) {
            player2.sprite.body.velocity.x = 150;

            player2.sprite.animations.play('right');
        }
        else {
            player2.sprite.animations.stop();

            player2.sprite.frame = 1;
        }

        if (eight.isDown && player2.sprite.body.touching.down) {
            player2.sprite.body.velocity.y = -350;
        }

        if (two.isDown) {
            player2.sprite.body.velocity.y = 1000;
        }


    }

    function collectStar(_, star) {
        star.kill();

        player.score += 10;
        scoreText.text = 'P1.score: ' + player.score;
    }

    function collectStar2(_, star) {
        star.kill();

        player2.score += 10;
        scoreText2.text = 'P2.score: ' + player2.score;
    }

    const socket = io('http://localhost')
    socket.on('connect', () => console.log('Hello'))
}
