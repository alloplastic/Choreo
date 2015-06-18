// Instantiations of game classes (i.e. entities)

//heavyImage = new Image(); 
//heavyImage.src = "heavyimagefile.jpg";

(function() {

	var player = window.choreo.players['TestGame'];
	var classes = window.choreo.players['TestGame'].classes;

	// Relevant aspects of the game structure are compiled into code here

	player.currentScene = 'SceneOne';  // generated from game.firstScene

	player.scenes = {};
	player.scenes['SceneOne'] = {};

	// each layer in the game instantiates its own instance of an SDK runtime
	player.scenes['SceneOne'].layers = [];
	player.scenes['SceneOne'].layers[0] = new window.choreo.sdks.Phaser(player.elementId, player);
	player.scenes['SceneOne'].layers[0].init();

	player.entities = {};

	player.entities['logoEntity'] = new classes['EPhaserSprite'](player.scenes['SceneOne'].layers[0]);
	player.entities['logoEntity'].addImage({name:'logo', url: player.gameAssetRoot + 'phaser.png'});

	// once instances are built, initialize them to kick off the preloading.

	player.preloadBegun();

	player.entities['logoEntity'].preload();

	// Phaser 'preload done' code
	player.scenes['SceneOne'].layers[0].loader.start();

	player.preloadRequestsInitiated();

})();
