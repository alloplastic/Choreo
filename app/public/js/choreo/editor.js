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
			this.kitPane = new ChoreoKitPane();
			this.galleryPane = new ChoreoGalleryPane();
			this.codeEditor = new ChoreoCodeEditor();

			// NOTE: web app needs its own module for storage
			if (_c.hostEnvironment == "desktop") {
				this.storage = new ChoreoStorage();
			}

			this.directoryOpenDialog = null;
		};

		ChoreoEditor.prototype.init = function() {

			var self=this;

			// initialize subcomponents
			this.scenePane.init();
			this.kitPane.init();
			this.galleryPane.init();
			this.codeEditor.init();

			if (_c.hostEnvironment == "desktop") {
				this.storage.init();
			}

			// UI variants based on the host platform.  UI can't be completely agnostic to this, right?

			if (_c.hostEnvironment == "desktop") {

				$('#menu_file_open_from_web').hide();
				$('#menu_file_export_to_zip').hide();
				$('#menu_file_import_from_zip').hide();

			} else if (_c.hostEnvironment == "web") {

				$('#menu_file_open').hide();

				$('.boot-screen').hide();
				$('.scrim.full').hide();

//				$('#menu_file_save').hide();
//				$('#menu_file_save_as').hide();
			}
			
			// - jQuery kruft -

			// simple boot menu (two buttons)

			$(".create-new-button")
				.button()
				.click(function( event ) {
					event.preventDefault();
					event.stopPropagation();
					if (self.uiState.data.modalState == "None") {
						_c.set(self.uiState, 'data/modalState', "CreateNewProjectFolder");  // "New Project" = save pre-loaded empty game to a folder
						self.selectSaveLocation.apply(self);									
					}
			});

			$(".load-existing-button")
				.button()
				.click(function( event ) {
					event.preventDefault();
					event.stopPropagation();
					if (self.uiState.data.modalState == "None") {
						_c.set(self.uiState, 'data/modalState', "Open");
						self.selectDirectory.apply(self);
					}
			});


			// menu management

			$('html').click(function() {
				//Hide any visible menus if a click propagates up to the body
				$(".file-menu").hide();
				$(".language-menu").hide();
				$(".mega-menu").hide();
			});

			$( ".file-menu").menu({
				select: function( event, ui ) {
					$(this).hide();
					if (event.toElement != null) {
						switch(event.toElement.id) {
							case "menu_file_new":
								if (self.uiState.data.modalState == "None") {
									_c.set(self.uiState, 'data/modalState', "CreateNewProjectFolder");  // "New Project" = save pre-loaded empty game to a folder
									self.selectSaveLocation();									
								}
								break;
							// case "menu_file_save":
							// 	if (self.uiState.data.currentProject != "") {
							// 		console.log("SAVE " + self.uiState.data.currentProject);
							// 	} else {
							// 		_c.set(self.uiState, 'data/modalState', "SaveAs");
							// 		self.selectSaveLocation.apply(self);									
							// 	}
							// 	break;
							// case "menu_file_save_as":
							// 	if (self.uiState.data.modalState == "None") {
							// 		_c.set(self.uiState, 'data/modalState', "SaveAs");
							// 		self.selectSaveLocation.apply(self);
							// 	}
							// 	break;
							case "menu_file_open":
								console.log("LOAD");
								if (self.uiState.data.modalState == "None") {
									_c.set(self.uiState, 'data/modalState', "Open");
									self.selectDirectory.apply(self);
								}
								break;
							case "menu_file_open_from_web":
								console.log("OPEN FROM WEB");
								// temp test -- self.openFromFile.apply(self, ['/Users/sheldon/Documents/dev/Choreo/tests/G5']);
								break;
							case "menu_file_export_to_zip":
								console.log("EXPORT TO ZIP");
								break;
							case "menu_file_import_from_zip":
								console.log("IMPORT FROM ZIP");
								break;
							case "menu_file_publish_to_desktop":
								console.log("PUBLISH TO DESKTOP");
								break;
							case "menu_file_publish_to_mobile":
								console.log("PUBLISH TO MOBILE");
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

								// temp test
								//self.createNewProjectFolder("/Users/sheldon/Documents/dev/Choreo/tests/G9");

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

			var megaMenuItems = $(".mega-menu-category-item");
			for (var i=0; i<megaMenuItems.length; i++) {
				var item = $(megaMenuItems[i]);
				item.click(function(event) {
					var layerId = $(event.target).data('id');
					self.addLayer.apply(self, [layerId]);
					$('.mega-menu').hide();
				});
			}

			this.directoryOpenDialog = $('#directoryOpenDialog');
			this.directoryOpenDialog.change(function(evt) {

				var newDirectory = $(this).val();
				if (newDirectory && newDirectory.length > 0) {
					self.openFromFile.apply(self, [newDirectory]);
				}
			});

			this.saveAsDialog = $('#saveAsDialog');
			this.saveAsDialog.change(function(evt) {
				var saveDirectory = $(this).val();
				if (saveDirectory && saveDirectory.length > 0) {
					// currently, we use the dialog only to create a new project; in the future we can check
					// 'uiState/data/modelState' to determine what action the user intends.
					self.createNewProjectFolder.apply(self, [saveDirectory]);
				}
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

			_c.editor.loadGame("EmptyGame");
//			_c.editor.loadGame("TestGame");

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

		ChoreoEditor.prototype.selectDirectory = function() {
			this.directoryOpenDialog.trigger('click');  
		};

		ChoreoEditor.prototype.selectSaveLocation = function() {
			this.saveAsDialog.show().trigger('click');  
		};

		// adds a layer (i.e. a "kit") to the current scene
		ChoreoEditor.prototype.addLayer = function(kitId) {
			
			var self = this;

			var currentSceneIndex = _c.get(this.uiState, 'data/currentSceneIndex');
			var pathToKits = "gameData/scenes/" + currentSceneIndex + "/kits";
			var currentLayerArray = _c.get(_c.editor, pathToKits);

			if (!currentLayerArray || !Array.isArray(currentLayerArray)) return;

			// if kit data already exists on the client, create the new layer
			var gameData = _c.editor.gameData;
			if (gameData._refs && gameData._refs.kits && gameData._refs.kits[kitId]) {
				_c.insert(_c.editor, pathToKits + "/" + currentLayerArray.length, kitId);
				if (_c.get(_c.editor, 'uiState/data/currentLayer') == -1)
					_c.set(_c.editor, 'uiState/data/currentLayer', 0);
				return;
			}

			// if we don't already have the kit cached, retrieve it from the server
			$.getJSON( this.apiRoot + "kits/" + kitId, function(data) {
				if (data != null && data.status != 'error') {
					self.addKitToGame.call(self, data.data);
					// append by "inserting" at an index one greater than the last element.
					_c.insert(_c.editor, pathToKits + "/" + currentLayerArray.length, kitId);
					if (_c.get(_c.editor, 'uiState/data/currentLayer') == -1)
						_c.set(_c.editor, 'uiState/data/currentLayer', 0);
				}
			});
		};

		// parses a /kits response from the server, storing the results in gameData._refs.
		ChoreoEditor.prototype.addKitToGame = function(kitResponse) {

			var gameData = _c.editor.gameData;

			if (gameData._refs == null) gameData._refs = {};
			if (gameData._refs.kits == null) gameData._refs.kits = {};
			if (gameData._refs.entityTypes == null) gameData._refs.entityTypes = {};

			var kit = kitResponse.kit;
			var entityTypes = kitResponse.entityTypes;

			gameData._refs.kits[kit.id] = kit;

			for (var i=0; i<entityTypes.length; i++) {
				var entityType = entityTypes[i];
				gameData._refs.entityTypes[entityType.id] = entityType;
			}

		};

		/** Loads a game from a file on the local disk.  Current assumption is that this
		 * function is only called in Desktop mode.  A corollary to that is that apiRoot
		 * shoiuld be "api/v1" or the like.
		 *
		 * @Method
		 */
		ChoreoEditor.prototype.openFromFile = function(path) {

			var self = this;

			console.log("Opening from file: " + path);

			_c.set(this.uiState, 'data/modalState', "None");

			$.getJSON( this.apiRoot + "files?path=" + encodeURIComponent(path) + "&fileName=contents.json", function(data) {
				if (data != null && data.status != 'error') {

					// don't need the scrim anymore
					$('.boot-screen').hide();
					$('.scrim.full').hide();

					self.setNewGameData.apply(self, [data]);
					_c.set(this.uiState, 'data/currentProject', path);
				}
				else {
					alert ("Sorry, something went wrong:\n\n" + data.message);
				}
			});

			// TBD: perform service call to read data from path/contents.json.

			// then make this call:

			//self.setNewGameData.apply(self, data);

		};

		/** Retrieves a representation of an "empty" game and saves it to a location specified by the user.
		 *
		 * @Method
		 */
		ChoreoEditor.prototype.createNewProjectFolder = function(path) {

			// NOTE: currently we use this routine only for saving out a blank/new game.  No Save As in the UI for now.

			var self = this;
			var pathLocal = path;

			_c.set(this.uiState, 'data/modalState', "None");

			 $.ajax(self.apiRoot + 'files/game?path=' + encodeURIComponent(path), {
				type: 'POST',   // we are "posting" a new game, but really the server is doing the content creation
				data: JSON.stringify({}),
				contentType: 'application/json',
//				data: JSON.stringify(newGame),
//				contentType: 'application/json',
				success: function(response) { 
					if (response != null && response.status != 'error') {
						// don't need the scrim anymore
						$('.boot-screen').hide();
						$('.scrim.full').hide();

						self.setNewGameData.apply(self, [response.data]);
						_c.set(_c.editor.uiState, 'data/currentProject', pathLocal);
					}
				},
				error  : function(err) {
					alert ("Sorry, something went wrong:\n\n" + err.responseText);
				}
			});



			// We get the JSON of the default "empty game" from the server, then we tell the server to write this JSON
			// to the location on disk chosen by the user.  Server creates the new directory if needed.

			// TBD: need different delim for Windows?

			// $.getJSON( this.apiRoot + "games/EmptyGame", function(data) {
			// 	if (data != null && data.status != 'error') {

			// 		var newGame = data;

			// 		// delete extra data aggregated by server
			// 		if (newGame._refs != null) delete newGame._refs;

			// 		 $.ajax(self.apiRoot + 'files?path=' + encodeURIComponent(path + '/') + '&fileName=contents.json', {
			// 			type: 'POST',
			// 			data: JSON.stringify(newGame),
			// 			contentType: 'application/json',
			// 			success: function(response) { 
			// 				// don't need the scrim anymore
			// 				$('.boot-screen').hide();
			// 				$('.scrim.full').hide();

			// 				self.setNewGameData.apply(self, [newGame]);
			// 			},
			// 			error  : function(err) {
			// 				alert ("Sorry, something went wrong:\n\n" + err.responseText);
			// 			}
			// 		});

			// 	}
			// 	else {
			// 		alert ("Sorry, something went wrong:\n\n" + data.message);
			// 	}
			// });

			_c.set(this.uiState, 'data/modalState', "None");


		};

		// TBD: rename to "openFromWeb"
		ChoreoEditor.prototype.loadGame = function(id) {

			var self = this;

			$.getJSON( this.apiRoot + "games/" + id, function(data) {
				if (data != null && data.status != 'error') {
					self.setNewGameData.apply(self, [data]);
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

		ChoreoEditor.prototype.setNewGameData = function(data) {

			// Though observers won't be propagated until after all JS in a given timestep finishes, we still
			// need to be particular about the order of operations when updating the data, since we also want some
			// code to respond to minor changes to UI state later.  So, the most logical sequence of actions is
			// (1) tear down the old player and get a new one loading the new data, (2) replace the editor's
			// gameData, triggering UI refreshes, and (3) recalculate the UI state now that we have new data.
			_c.set(this, "gameData", data);
			this.runGame(data);  // launch a player with the new data
			this.initEditorState(data);  // recalculate this.uiState
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

		// ChoreoEditor.prototype.handleFileNew = function(gameData) {
		// 	console.log("Handling File New.");
		// 	this.loadGame("EmptyGame");
		// };


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