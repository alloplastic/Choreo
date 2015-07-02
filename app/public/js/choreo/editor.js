// A page-specific JavaScript template

//(function ($) {


	$ = jQuery;

	if (!ChoreoEditor) {

		var ChoreoEditor = function (options) {
			options = options || {};

			this.apiRoot = options.apiRoot || _c.apiRoot || '/';
			this.fileRoot = options.fileRoot || _c.fileRoot || '/';

			this.gameData = {};
			this.uiState = new ChoreoEditorModel();

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
								_c.editor.handleFileNew();
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

			_c.editor.loadGame("TestGame");

		};

		/*
		 * Initializes the data model for the editor, which essentially defines what aspect of the loaded game is currently
		 * being rendered and edited.
		 * @method
		 */

		ChoreoEditor.prototype.initEditorState = function(gameData) {

			if (gameData != null) {
				this.uiState.defaultsForGame(gameData);
			}
		};

		ChoreoEditor.prototype.loadGame = function(id) {

			var self = this;

			$.getJSON( this.apiRoot + "games/" + id, function(data) {
				if (data != null && data.status != 'error') {

					// Though observers won't be propagated until after all JS in a given timestep finishes, we still
					// need to be particular about the order of operations when updating the data, since we also want some
					// code to respond to minor changes to UI state later.  So, the most logical sequence of actions is
					// (1) tear down the old player and get a new one loading the new data, (2) replace the editor's
					// gameData, triggering UI refreshes, and (3) recalculate the UI state now that we have new data.
					_c.set(self, "gameData", data);
					self.runGame(data);  // launch a player with the new data
					self.initEditorState(data);  // recalculate this.uiState
				}
			});

			// get the game definition and the 
			// var gameRequest = $.getJSON( this.apiRoot + "games/" + id);
			// var kitsRequest = $.getJSON( this.apiRoot + "games/" + id + '/kits');

			// $.when(gameRequest, jqxhr2).done(function(gameData, jqxhr2) {
			// 	// Though observers won't be propagated until after all JS in a given timestep finishes, we still
			// 	// need to be particular about the order of operations when updating the data, since we also want some
			// 	// code to respond to minor changes to UI state later.  So, the most logical sequence of actions is
			// 	// (1) tear down the old player and get a new one loading the new data, (2) replace the editor's
			// 	// gameData, triggering UI refreshes, and (3) recalculate the UI state now that we have new data.
			// 	_c.set(self, "gameData", data);
			// 	self.runGame(data);  // launch a player with the new data
			// 	self.initEditorState(data);  // recalculate this.uiState
			// })
			// .fail(function() {

			// });

		};

		ChoreoEditor.prototype.runGame = function(gameData) {
			
			// We don't completely destroy old players since they are pretty lightweight and since
			// their SDK downloads can serve as a cache for other players.

			if (_c.player) {
				_c.player.closeGame();
			}

			// individual ui components "observe" the game data and adjust their state accor
			// TBD: determine first scene and first entity and load them into the UI components
			//window.choreo.codeEditor.loadEntityCode(null);

			var self = this;
			setTimeout(function() {
				// load the player dynamically; the player is a fully decoupled component, unaware of its environment
				self.buildPlayerForGame(gameData);
			}, 200);


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
			newPlayer.apiRoot = _c.apiRoot;
			newPlayer.fileRoot = _c.fileRoot;
			newPlayer.gameAssetRoot = _c.gameAssetRoot + gameData.id + "/assets/";

			_c.players[gameData.id] = newPlayer;
			_c.player = newPlayer;

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

	_c.editor = new ChoreoEditor();

	// custom functions

	$(document).ready(function() {
		_c.editor.init();
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