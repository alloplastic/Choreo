
// Each runtime provides a class that can be instantiated as one of the Layers of a Scene.

//window.choreo = window.choreo || {};
//window.choreo.sdks = window.choreo.sdks || {};

if (window.choreo.sdks.Phaser == null) {

	window.choreo.sdks.Phaser = function(element, player) {
		this.element = element;
		this.game = null;
		this.loader = null;

		this.player = player;  // communication channel to the Choeo Player running the game
	};

	(function() {

		var phaserSDK = window.choreo.sdks.Phaser;

		phaserSDK.prototype.init = function() {

			//alert("coords = " + this.element);

			this.game = new Phaser.Game("80", "80", Phaser.AUTO, this.element);
//			this.game = new Phaser.Game(this.element.width, this.element.height, Phaser.AUTO, this.element);
//			this.game = new Phaser.Game("100", "100", Phaser.AUTO, this.element);
			this.loader = new Phaser.Loader(this.game);
			var self = this;
			this.loader.onFileComplete.addOnce(function(progress, key, result, total_loaded, total_files) {
				if (result == true) {
					self.player.preloadJobsDone(1);
				} else {
					self.player.preloadJobsFailed(1);
				}
			});

//			this.game = new Phaser.Game("100", "100", Phaser.AUTO, element, { preload: preload, create: create });

		};

		phaserSDK.prototype.close = function() {
			console.log("Phaser runtime closing.");
			this.game.destroy();
		};

		phaserSDK.prototype.tick = function() {
			this.game.update();
		};

	})();
}


//window.onload = function() {

// setTimeout(function () {

// 	var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create });

// 	function preload () {

// 		game.load.image('logo', 'phaser.png');

// 	}

// 	function create () {

// 		var logo = game.add.sprite(game.world.centerX, game.world.centerY, 'logo');
// 		logo.anchor.setTo(0.5, 0.5);

// 	}
	
// }, 1000);

//};