// Claas definitions

// classes.js will be exported as part of a game save-game, with the name of the game embedded at that time

//window.choreo = window.choreo || {};
//window.choreo.players['TestGame'].assetStore = {loaded: false};
//window.choreo.players['TestGame'].assetBaseUrl = "/data/games/TestGame/assets/";

// Choreo system classes
//window.choreo.classes = {};

(function() {

	var classes = window.choreo.classes;

	// classes not needed due to player.contents?

})();

(function() {

	// game classes

	window.choreo.players['TestGame'].classes = {};
	var player = window.choreo.players['TestGame'];
	var classes = player.classes;

	// This will come out of a partial, with the var being a model param
	classes['EPhaserSprite'] = function (runtime) {
		this.runtime = runtime;
		this.player = player;  // compiled ref in every entity to create a communication path
		this.images = [];
		this.sprite = null;
	};

	//classes['EPhaserSprite'] = window.choreo.players['TestGame'].classes['EPhaserSprite'];

	classes['EPhaserSprite'].prototype.preload = function() {
		var numImages = this.images.length;
		this.player.preloadJobsBegun(numImages);
		for (var i=0; i<numImages; i += 1) {
			var image = this.images[i];
			this.runtime.loader.image(image.name, image.url);
		}
	};

	// a required function, a noop for us
	classes['EPhaserSprite'].prototype.close = function() {
	};

	classes['EPhaserSprite'].prototype.show = function() {
		if (this.images.length < 1) return;
		this.sprite = new this.runtime.game.add.sprite(20, 20, this.images[0].name, 0, this.runtime.game.world);
//		this.sprite = new Phaser.Sprite(this.runtime.game, 20, 20, this.images[0].name);
	};

	classes['EPhaserSprite'].prototype.setImage = function(n) {
		this.sprite.loadTexture(this.images[n].name);  // Phaser sprite manages only one texture at a time
	};

	classes['EPhaserSprite'].prototype.addImage = function(image) {
		this.images.push(image);
	};

})();
