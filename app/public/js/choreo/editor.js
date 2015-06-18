// A page-specific JavaScript template

(function ($) {

	// TBD: is this how we should handle client-side communication?

	window.choreo.editor = this;

	// TBD: really should define an editor class
	window.choreo.editor.loadGame = function(gameData) {
		
		// TBD: destroy old player, build new player

		if (window.choreo.player) {
			window.choreo.player.closeGame();
		}

		var self = this;
		setTimeout(function() {
			self.buildPlayerForGame(gameData);
		}, 2000);


//		if (gameData.scenes != null && gameData.scenes.length > 0) {
//			window.choreo.player.loadGame(gameData.id);
//			window.choreo.player.loadScene(gameData.scenes[0]);
//		}

	}

	window.choreo.editor.buildPlayerForGame = function(gameData) {

		var options = {};
		options.elementId = 'DefaultPlayer';

		if (window.choreo == null) window.choreo = {};
		if (window.choreo.players == null) window.choreo.players = {};

		var newPlayer = new ChoreoPlayer(options);
		newPlayer.apiRoot = window.choreo.apiRoot;
		newPlayer.fileRoot = window.choreo.fileRoot;
		newPlayer.gameAssetRoot = window.choreo.gameAssetRoot + gameData.id + "/assets/";

		window.choreo.players[gameData.id] = newPlayer;
		window.choreo.player = newPlayer;

		// TBD: uniqueName would be a better index, but using the gameId allows for
		// easier mashups on target pages.

		newPlayer.loadGame(gameData.id);

	};

	// custom functions

	$(document).ready(function() {

		// load the player dynamically; the player is a fully decoupled component, unaware of its environment

		// TBD: revert to old test: load empty game and then load a test game to show that player can restart itself

		$.getJSON( window.choreo.apiRoot + "games/TestGame", function(data) {
			if (data != null && data.status != 'error') {
				window.choreo.editor.loadGame(data);
			}
		});

		// $.ajax({
		// 	url: "player/TestGame",
		// 	context: document.body
		// }).done(function(data) {
		// 	if (data) {
		// 		var elems = $(".player-pane-content");
		// 		if (elems.length > 0) elems[0].innerHTML = data;
		// 	}	
		// });

		//$(".player-pane-content").load("player/TestGame");

		// // load the player dynamically; the player is a fully decoupled component, unaware of its environment
		// $(".player-pane-content").load("player/EmptyGame",
		// 	function() {
		// 		// load the data structure for an empty game so that the editor will function immediately
		// 		$.getJSON( window.choreo.apiRoot + "games/TestGame", function(data) {
		// 			if (data != null && data.status != 'error') {
		// 				window.choreo.editor.loadGame(data);
		// 		}
		// 	});
		// });

		// menu management

		$('html').click(function() {
			//Hide any visible menus if a click propagates up to the body
			$( ".file-menu").hide();
			$( ".language-menu").hide();
		});

		$( ".file-menu").menu({
			select: function( event, ui ) {
				$(this).hide();
				if (event.toElement != null) {
					switch(event.toElement.id) {
						case "menu_file_new":
							console.log("NEW");
							break;
						case "menu_file_save":
							console.log("SAVE");
							break;
						case "menu_file_load":
							console.log("LOAD");
							break;
						case "menu_file_export_to_desktop":
							console.log("EXPORT TO DESKTOP");
							break;
						case "menu_file_export_to_mobile":
							console.log("EXPORT TO MOBILE");
							break;
					}
				}
			}
		});

		$( ".file-button" )
		  .button()
		  .click(function( event ) {
			event.preventDefault();
			event.stopPropagation();
			var menu = $( ".file-menu");
			menu.position({
				my: "left top",
				at: "left bottom",
				of: ".file-button"
			});
			menu.show();
		  });

		$( ".language-menu").menu({
			select: function( event, ui ) {
				$(this).hide();
				if (event.toElement != null) {
					switch(event.toElement.innerText) {
						case "English":
							$.post("/setLanguage/en", {}, function() {
								window.location.reload();					    	
							});
							break;
						case "Français":
							$.post("/setLanguage/fr", {}, function() {
								window.location.reload();					    	
							});
							break;
					}
				}
			}
		});

		$( ".language-button" )
		  .button()
		  .click(function( event ) {
			event.preventDefault();
			event.stopPropagation();
			var menu = $( ".language-menu");
			menu.position({
				my: "left top",
				at: "left bottom",
				of: ".language-button"
			});
			menu.show();
		  });

		  // on initial load, populate the editor with blank game data


	});

})(jQuery);

// spritesheet generation in Phaser:

// var dataURL, bmd, ctx, width, height;
// width = 100;
// height = 100;
// bmd = game.add.bitmapData( width * 2, height );
// ctx = bmd.context;
// bmd.clear();
// ctx.fillStyle = "#2E8B57";
// ctx.fillRect(0,0,width,height);
// ctx.fillStyle = "#FFFFFF";
// ctx.fillRect(0,0,width/2,height/2);
// ctx.fillRect(width/2,height/2,width/2,height/2);
// ctx.fillStyle = "#2E8B57";
// ctx.fillRect(width,0,width,height);
// ctx.fillStyle = "#FFFFFF";
// ctx.fillRect(width+width/2,0,width/2,height/2);
// ctx.fillRect(width,height/2,width/2,height/2);
// dataURL = bmd.canvas.toDataURL();
// game.load.spritesheet('myDynamicSpritesheet', dataURL, width, height);