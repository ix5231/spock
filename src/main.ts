import { ENABLE_DISABLE_REGEX } from 'tslint/lib';
import * as Phaser from 'phaser-ce';

namespace spock {
    class Player {
        public sprite: Phaser.Sprite
        public score: number

        constructor(sprite: Phaser.Sprite) {
            this.sprite = sprite
            this.score = 0
        }
    }

    const KEYCODE = {
        a: 65,
        two: 98,
        four: 100,
        six: 102,
        eight: 104,
    };

    var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

    function preload() {
        game.load.image('sky', 'assets/sky.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
    }

    let player: Player;
    let player2: Player;

    var platforms;
    var cursors;
    var a, two, four, six, eight;

    var stars;
    var scoreText;
    var scoreText2;

    function create() {
        //  We're going to be using physics, so enable the Arcade Physics system
        game.physics.startSystem(Phaser.Physics.ARCADE);

        //  A simple background for our game
        game.add.sprite(0, 0, 'sky');

        //  The platforms group contains the ground and the 2 ledges we can jump on
        platforms = game.add.group();

        //  We will enable physics for any object that is created in this group
        platforms.enableBody = true;

        // Here we create the ground.
        var ground = platforms.create(0, game.world.height - 64, 'ground');

        //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
        ground.scale.setTo(2, 2);

        //  This stops it from falling away when you jump on it
        ground.body.immovable = true;

        //  Now let's create two ledges
        var ledge = platforms.create(400, 400, 'ground');
        ledge.body.immovable = true;

        ledge = platforms.create(-150, 250, 'ground');
        ledge.body.immovable = true;

        // The player and its settings
        player = new Player(game.add.sprite(32, game.world.height - 150, 'dude'));
        player2 = new Player(game.add.sprite(700, game.world.height - 150, 'baddie'));


        //  We need to enable physics on the player
        game.physics.arcade.enable(player);
        game.physics.arcade.enable(player2);


        //  Player physics properties. Give the little guy a slight bounce.
        player.sprite.body.bounce.y = 0;
        player.sprite.body.gravity.y = 300;
        player.sprite.body.collideWorldBounds = true;

        player2.sprite.body.bounce.y = 0;
        player2.sprite.body.gravity.y = 300;
        player2.sprite.body.collideWorldBounds = true;

        //  Our two animations, walking left and right.
        player.sprite.animations.add('left', [0, 1, 2, 3], 10, true);
        player.sprite.animations.add('right', [5, 6, 7, 8], 10, true);
        player2.sprite.animations.add('left', [0, 1], 10, true);
        player2.sprite.animations.add('right', [2, 3], 10, true);

        //  Finally some stars to collect
        stars = game.add.group();

        //  We will enable physics for any star that is created in this group
        stars.enableBody = true;

        //  Here we'll create 12 of them evenly spaced apart
        for (var i = 0; i < 12; i++) {
            //  Create a star inside of the 'stars' group
            var star = stars.create(i * 70, 0, 'star');

            //  Let gravity do its thing
            star.body.gravity.y = 300;

            //  This just gives each star a slightly random bounce value
            star.body.bounce.y = 0.7 + Math.random() * 0.2;
        }

        //  The score
        scoreText = game.add.text(16, 16, 'P1.score: 0', { fontSize: 32, fill: '#000' });
        scoreText2 = game.add.text(650, 16, 'P2.score: 0', { fontSize: 32, fill: '#000' });

        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
        a = game.input.keyboard.addKey(KEYCODE.a);
        two = game.input.keyboard.addKey(KEYCODE.two);
        four = game.input.keyboard.addKey(KEYCODE.four);
        six = game.input.keyboard.addKey(KEYCODE.six);
        eight = game.input.keyboard.addKey(KEYCODE.eight);


    }

    function update() {

        //  Collide the player and the stars with the platforms
        game.physics.arcade.collide(player, platforms);
        game.physics.arcade.collide(player2, platforms);
        game.physics.arcade.collide(stars, platforms);

        //  Checks to see if the player overlaps with any of the stars, if he does call the collectStar function
        game.physics.arcade.overlap(player, stars, collectStar, null, this);
        game.physics.arcade.overlap(player2, stars, collectStar2, null, this);

        //  Reset the players velocity (movement)
        player.sprite.body.velocity.x = 0;
        player2.sprite.body.velocity.x = 0;

        if (cursors.left.isDown) {
            //  Move to the left
            player.sprite.body.velocity.x = -150;

            player.sprite.animations.play('left');
        }
        else if (cursors.right.isDown) {
            //  Move to the right
            player.sprite.body.velocity.x = 150;

            player.sprite.animations.play('right');
        }
        else {
            //  Stand still
            player.sprite.animations.stop();

            player.sprite.frame = 4;
        }

        //  Allow the player to jump if they are touching the ground.
        if (cursors.up.isDown && player.sprite.body.touching.down) {
            player.sprite.body.velocity.y = -350;
        }

        if (cursors.down.isDown) {
            player.sprite.body.velocity.y = 1000;
        }


        if (four.isDown) {
            //  Move to the left
            player2.sprite.body.velocity.x = -150;

            player2.sprite.animations.play('left');
        }
        else if (six.isDown) {
            //  Move to the right
            player2.sprite.body.velocity.x = 150;

            player2.sprite.animations.play('right');
        }
        else {
            //  Stand still
            player2.sprite.animations.stop();

            player2.sprite.frame = 1;
        }

        //  Allow the player to jump if they are touching the ground.
        if (eight.isDown && player2.sprite.body.touching.down) {
            player2.sprite.body.velocity.y = -350;
        }

        if (two.isDown) {
            player2.sprite.body.velocity.y = 1000;
        }


    }

    function collectStar(player, star) {

        // Removes the star from the screen
        star.kill();

        //  Add and update the score
        player.score += 10;
        scoreText.text = 'Score: ' + player.score;

    }

    function collectStar2(player2, star) {

        // Removes the star from the screen
        star.kill();

        //  Add and update the score
        player2.score += 10;
        scoreText2.text = 'Score: ' + player2.score;

    }
}