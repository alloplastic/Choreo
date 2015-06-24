// A page-specific JavaScript template

//(function ($) {


	$ = jQuery;

	if (!ChoreoEditor) {

		var ChoreoEditor = function (options) {
			options = options || {};

			this.apiRoot = options.apiRoot || window.choreo.apiRoot || '/';
			this.fileRoot = options.fileRoot || window.choreo.fileRoot || '/';

			this.gameData = {};
			this.gameState = {};

			// sub-components

			this.scenePane = new ChoreoScenePane();
			this.codeEditor = new ChoreoCodeEditor();
		};

		ChoreoEditor.prototype.init = function() {

			// initialize subcomponents
			this.scenePane.init();
			this.codeEditor.init();

			// - jQuery kruft -

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
								window.choreo.editor.handleFileNew();
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

			// some jQuery helpers

			$.fn.inlineEdit = function(replaceWith, connectWith) {

				$(this).hover(function() {
					$(this).addClass('hover');
				}, function() {
					$(this).removeClass('hover');
				});

				$(this).dblclick(function() {

					var elem = $(this);

					elem.hide();
					elem.after(replaceWith);
					replaceWith.focus();

					replaceWith.blur(function() {

						if ($(this).val() != "") {
							connectWith.val($(this).val()).change();
							elem.text($(this).val());
						}

						$(this).remove();
						elem.show();
					});
				});
			};

			// load the player dynamically; the player is a fully decoupled component, unaware of its environment
			window.choreo.editor.loadGame("TestGame");

		};

		ChoreoEditor.prototype.loadGame = function(id) {

			$.getJSON( this.apiRoot + "games/" + id, function(data) {
				if (data != null && data.status != 'error') {
					window.choreo.editor.loadGameData(data);
					_c.set(_c.editor, "gameData", data);
				}
			});

		};

		// TBD: really should define an editor class
		ChoreoEditor.prototype.loadGameData = function(gameData) {
			
			// We don't completely destroy old players since they are pretty lightweight and since
			// their SDK downloads can serve as a cache for other players.

			if (window.choreo.player) {
				window.choreo.player.closeGame();
			}

			// TBD: determine first scene and first entity and load them into the UI components
			//window.choreo.codeEditor.loadEntityCode(null);

			var self = this;
			setTimeout(function() {
				self.buildPlayerForGame(gameData);
			}, 2000);


	//		if (gameData.scenes != null && gameData.scenes.length > 0) {
	//			window.choreo.player.loadGame(gameData.id);
	//			window.choreo.player.loadScene(gameData.scenes[0]);
	//		}

		};

		ChoreoEditor.prototype.buildPlayerForGame = function(gameData) {

			var options = {};
			options.elementId = 'DefaultPlayer';

			//if (window.choreo == null) window.choreo = {};
			//if (window.choreo.players == null) window.choreo.players = {};

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

		ChoreoEditor.prototype.handleFileNew = function(gameData) {
			console.log("Handling File New.");
			this.loadGame("EmptyGame");
		};


	}
	// TBD: is this how we should handle client-side communication?

	window.choreo.editor = new ChoreoEditor();

	// custom functions

	$(document).ready(function() {
		window.choreo.editor.init();
	});

//})(jQuery);

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