/**
 * Created by crispin on 3/06/16.
 */

function find(key, array) {
	// The variable results needs var in this case (without 'var' a global variable is created)
	var results = [];
	for (var i = 0; i < array.length; i++) {
		if (array[i].indexOf(key) == 0) {
			results.push(array[i]);
		}
	}
	return results;
}

//thanks mozilla
function getRandomIntInclusive(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

var scale = 7;
var game = new Phaser.Game((scale + 1) * 100, (scale + 1) * 100, Phaser.AUTO, 'div');


//takes grid [x, y] returns game [x, y]
var getRealCoords = function(x, y){
	if (x > map.width || y > map.height || x <= 0 || y <= 0) {
		throw RangeError("x or y is too big or too small: x: " + x + ', y: ' + y);
	}
	return [bg.x + (map.tileWidth * scale * (x - 1)), bg.y + (map.tileHeight * scale * (y - 1))];
};

//takes game [x,y] returns grid [x,y]
//hopefully
var getGridCoords = function (x, y) {
	return [Math.round(bg.getTileX(x) / scale), Math.round(bg.getTileY(y) / scale)];
};

var isLocationInRange = function (x, y){
	if (x > 0 && x <= map.height && y > 0 && y <= map.height) {
		return true;
	} else {
		return false;
	}
};

var isLocationAccessable = function (x, y) {
	if (map.getTile(x - 1, y - 1, "Foreground") == null && isLocationInRange(x, y)) {
		return true;
	} else {
		return false;
	}
};

var isLocationOccupied = function (x, y) {
	for (var i = 0; i < sprites.children.length; i++) {
		if (x == sprites.children[i].gridX && y == sprites.children[i].gridY) {
			return true
		}
	}
	return false;
};

var isEnemyAtLocation = function (x, y) {
	for (var i = 0; i < evil_people.length; i++) {
		if (x == evil_people[i].gridX && y == evil_people[i].gridY) {
			return true
		}
	}
	return false;
};

var loadState = {
	preload: function () {
		game.time.advancedTiming = true;
		game.stage.smoothed = false;
		game.antialias = false;
		game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		// //  This sets a limit on the up-scale
		// game.scale.maxWidth = 800;
		// game.scale.maxHeight = 800;
		// game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
		// game.scale.setGameSi();
		game.load.tilemap('arena', 'assets/battleground.json', null, Phaser.Tilemap.TILED_JSON);
		game.load.image('tileset', 'assets/spritesheet.png');

		game.load.image('p_archer', 'assets/friendly-people/archer.png');
		game.load.image('p_chainmail-knight', 'assets/friendly-people/chainmail-knight.png');
		game.load.image('p_horse-knight', 'assets/friendly-people/horse-knight.png');
		game.load.image('p_knight', 'assets/friendly-people/knight.png');
		game.load.image('p_lady-peasant', 'assets/friendly-people/lady-peasant.png');
		game.load.image('p_peasant', 'assets/friendly-people/peasant.png');

		game.load.image('e_archer', 'assets/evil-people/archer.png');
		game.load.image('e_chainmail-knight', 'assets/evil-people/chainmail-knight.png');

		game.load.image('target', 'assets/target.png');
		game.load.image('trans-grey', 'assets/trans-grey.png');
		game.load.image('trans-blue', 'assets/trans-blue.png');
		game.load.image('trans-red', 'assets/trans-red.png');
			},

	create: function () {
		game.stage.backgroundColor = "#4488AA";
		game.state.start('play');
	}
};

var playState = {
	create: function () {
		point = new Phaser.Point();

		//map setup
		map = game.add.tilemap('arena');
		map.addTilesetImage('spritesheet', 'tileset');
		map.x = this.world.centerX - (map.widthInPixels * scale / 2);
		map.y = this.world.centerY - (map.heightInPixels * scale / 2);
		bg = map.createLayer('Background');
		fg = map.createLayer('Foreground');

		//initial tilemap setup
		bg.scale = {x:scale, y:scale};
		fg.scale = {x:scale, y:scale};

		bg.fixedToCamera = false;
		bg.x = this.world.centerX - (map.widthInPixels * scale / 2);
		bg.y = this.world.centerY - (map.heightInPixels * scale / 2);

		fg.fixedToCamera = false;
		fg.x = this.world.centerX - (map.widthInPixels * scale / 2);
		fg.y = this.world.centerY - (map.heightInPixels * scale / 2);

		//sprite setup
		sprites = game.add.group();
		ui_elements = game.add.group();
		friendly_sprites = find('p_', game.cache.getKeys(Phaser.Cache.IMAGE));
		friendly_people = [];
		evil_sprites = find('e_', game.cache.getKeys(Phaser.Cache.IMAGE));
		evil_people = [];

		target = game.add.sprite(0, 0, 'target');
		sprites.add(target);
		ui_elements.add(target);
		target.gridX = 1;
		target.gridY = 1;
		target.scale = {x: scale, y: scale};
		[target.x,target.y] = getRealCoords(target.gridX, target.gridY);
		target.on = false;

		//making friendly_people
		for (var i = 0; i < 2; i++) {
			friendly_people[i] = game.add.sprite(0, 0, friendly_sprites[Math.floor(Math.random() * friendly_sprites.length)]);
			friendly_people[i].scale = {x: scale, y: scale};
			do {
				friendly_people[i].gridX = getRandomIntInclusive(1, map.width);
				friendly_people[i].gridY = getRandomIntInclusive(1, map.height);
			} while (!isLocationAccessable(friendly_people[i].gridX, friendly_people[i].gridY));
			sprites.add(friendly_people[i]);
			[friendly_people[i].x, friendly_people[i].y] = getRealCoords(friendly_people[i].gridX, friendly_people[i].gridY);
			friendly_people[i].inputEnabled = true;
		}

		//making evil_people
		for (var i = 0; i < 1; i++) {
			evil_people[i] = game.add.sprite(0, 0, evil_sprites[Math.floor(Math.random() * evil_sprites.length)]);
			evil_people[i].scale = {x: scale, y: scale};
			do {
				evil_people[i].gridX = getRandomIntInclusive(1, map.width);
				evil_people[i].gridY = getRandomIntInclusive(1, map.height);
			} while (!isLocationAccessable(evil_people[i].gridX, evil_people[i].gridY));
			sprites.add(evil_people[i]);
			[evil_people[i].x, evil_people[i].y] = getRealCoords(evil_people[i].gridX, evil_people[i].gridY);
			evil_people[i].inputEnabled = true;
		}

		//control and debug setup
		fps = game.add.text(game.world.centerX + (game.world.width / 2.3), game.world.centerY - (game.world.height / 2.3), 00 + " FPS", {
			font: "12px Arial"
		});

		game.world.bringToTop(ui_elements);

		cursors = game.input.keyboard.createCursorKeys();
		space = game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);

		//movement stuff
		for (var i = 0; i < friendly_people.length; i++) {
			friendly_people[i].events.onInputDown.add(function () {
				//index stuff is a horrible hack (probably) but it works
				target.on = true;
				game.input.onDown.addOnce(function () {
					[pointer_x, pointer_y] = [game.input.activePointer.x, game.input.activePointer.y];
					[pointer_grid_x, pointer_grid_y] = getGridCoords(game.input.activePointer.x, game.input.activePointer.y);
					//long line mofo
					if (isLocationInRange(pointer_grid_x, pointer_grid_y) && isLocationAccessable(pointer_grid_x, pointer_grid_y)
						&& !isLocationOccupied(pointer_grid_x, pointer_grid_y)) {
						[friendly_people[this.index].gridX, friendly_people[this.index].gridY] = getGridCoords(pointer_x, pointer_y);
						[friendly_people[this.index].x, friendly_people[this.index].y] = getRealCoords(friendly_people[this.index].gridX, friendly_people[this.index].gridY);
						target.on = false;
					}
				}, this);
			}, {index: i})
		}
	},
	update: function () {
		fps.setText(game.time.fps + " FPS");


		[pointer_grid_x, pointer_grid_y] = getGridCoords(game.input.activePointer.x, game.input.activePointer.y);
		if (isLocationInRange(pointer_grid_x, pointer_grid_y)) {
			[target.gridX, target.gridY] = getGridCoords(game.input.activePointer.x, game.input.activePointer.y);
			[target.x, target.y] = getRealCoords(target.gridX, target.gridY);
		}

		if (space.isDown){
			console.log(isEnemyAtLocation(target.gridX, target.gridY));
		}

		if (target.on && isEnemyAtLocation(pointer_grid_x, pointer_grid_y)) {
			target.loadTexture('trans-red');
		} else if (target.on && isLocationOccupied(pointer_grid_x, pointer_grid_y) || target.on && !isLocationAccessable(pointer_grid_x, pointer_grid_y)) {
			target.loadTexture('trans-grey')
		} else if (target.on) {
			target.loadTexture('trans-blue');
		} else {
			target.loadTexture('target')
		}

	}

};

game.state.add('load', loadState);
game.state.add('play', playState);

game.state.start('load');