import * as Phaser from 'phaser-ce';

namespace spock {
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

    var player;
    var player2;

    var platforms;
    var cursors;
    var a, two, four, six, eight;

    var stars;
    var score = 0;
    var score2 = 0;
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
        player = game.add.sprite(32, game.world.height - 150, 'dude');
        player2 = game.add.sprite(700, game.world.height - 150, 'baddie');


        //  We need to enable physics on the player
        game.physics.arcade.enable(player);
        game.physics.arcade.enable(player2);


        //  Player physics properties. Give the little guy a slight bounce.
        player.body.bounce.y = 0;
        player.body.gravity.y = 300;
        player.body.collideWorldBounds = true;

        player2.body.bounce.y = 0;
        player2.body.gravity.y = 300;
        player2.body.collideWorldBounds = true;

        //  Our two animations, walking left and right.
        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);
        player2.animations.add('left', [0, 1], 10, true);
        player2.animations.add('right', [2, 3], 10, true);

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
        player.body.velocity.x = 0;
        player2.body.velocity.x = 0;

        if (cursors.left.isDown) {
            //  Move to the left
            player.body.velocity.x = -150;

            player.animations.play('left');
        }
        else if (cursors.right.isDown) {
            //  Move to the right
            player.body.velocity.x = 150;

            player.animations.play('right');
        }
        else {
            //  Stand still
            player.animations.stop();

            player.frame = 4;
        }

        //  Allow the player to jump if they are touching the ground.
        if (cursors.up.isDown && player.body.touching.down) {
            player.body.velocity.y = -350;
        }

        if (cursors.down.isDown) {
            player.body.velocity.y = 1000;
        }


        if (four.isDown) {
            //  Move to the left
            player2.body.velocity.x = -150;

            player2.animations.play('left');
        }
        else if (six.isDown) {
            //  Move to the right
            player2.body.velocity.x = 150;

            player2.animations.play('right');
        }
        else {
            //  Stand still
            player2.animations.stop();

            player2.frame = 1;
        }

        //  Allow the player to jump if they are touching the ground.
        if (eight.isDown && player2.body.touching.down) {
            player2.body.velocity.y = -350;
        }

        if (two.isDown) {
            player2.body.velocity.y = 1000;
        }


    }

    function collectStar(player, star) {

        // Removes the star from the screen
        star.kill();

        //  Add and update the score
        score += 10;
        scoreText.text = 'Score: ' + score;

    }

    function collectStar2(player2, star) {

        // Removes the star from the screen
        star.kill();

        //  Add and update the score
        score2 += 10;
        scoreText2.text = 'Score: ' + score2;

    }
}