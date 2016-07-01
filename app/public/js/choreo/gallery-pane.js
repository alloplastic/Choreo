// The library of instances/entities in the scene

// TBD: every game has a unique ID that can be used to prefix and therefore distinguish assets within a game.
// So: each entity gets a simple, immutable id based on a counting integer, stored as a global within the game.
// assets are stored in assets/n/n.jpg.

// TBD: In the future, to play nice with version control & team collaboration, these integers could be embellished with
// a word or two from the firendlyNames of assets/entities, involving the renaming logic that implies.  Regardless,
// the user never explicitly manages a folder hierarchy and filenames.

$ = jQuery;

if (!ChoreoGalleryPane) {

	var ChoreoGalleryPane = function (options) {
		options = options || {};

		// this.apiRoot = options.apiRoot || window.choreo.apiRoot || '/';
		// this.fileRoot = options.fileRoot || window.choreo.fileRoot || '/';

		// this.gameData = {};
		// this.gameState = {};

	};


	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoGalleryPane.prototype.init = function(changes) {

		var self = this;

		this.currentSceneIndex = -1;
		this.entities = []; 

		// create new entities when Entity Type icons are dropped into us
		$( ".gallery-pane" ).droppable({
			accept: ".entity-type-template",
			activate: function( event, ui ) {
				$(event.toElement).addClass('droppable-active');
			},
			deactivate: function( event, ui ) {
				$(event.toElement).removeClass('droppable-active');
			},
			drop: function( event, ui ) {
				if (this.currentSceneIndex < 0) return;   // must have a scene to add entities
				// clone a new copy of the starting entity and assign it a number unique among entities
				// in this scene.
				
				// NOTE: This was a first attempt to add this functionality to the UI, after not looking at the
				// code foe a year.  Not fully realized yet.
				// var entity = $.extend(true, {}, ui.helper._refs.entityType.defaultEntity);
				// var curEntityCount = _c.get(_c.editor, "gameData/scenes/" + this.currentSceneIndex + "/entityCounter");
				// entity.id = curEntityCount;
				// curEntityCount++;
				// _c.set(_c.editor, "gameData/scenes/" + this.currentSceneIndex + "/entityCounter", curEntityCount);
				// _c.insert(_c.editor, "gameData/scenes/" + this.currentSceneIndex + "/entities/0", entity);
				//self.entities.splice(0, 0, entity);
			},
			hoverClass: "droppable-hover"
		});

		// register for notifications about the game data changing
		// TBD: optimize by reacting, here, only to the individual changes to entities
		_c.observe(_c.editor, "gameData/scenes/" + this.currentSceneIndex + "/entities/@@@", this, "onSceneDataChanged");

		// rebuild the entire list of entity types whenever a key ui value changes
		_c.observe(_c.editor.uiState, "data/currentScene", this, "onSceneDataChanged");
		_c.observe(_c.editor.uiState, "data/currentLayer", this, "onSceneDataChanged");


	};

	ChoreoGalleryPane.prototype.onSceneDataChanged = function(changes) {

		// for now, just rebuild everything.
		console.log("Rebuild Gallery Pane.");

		var self = this;
		var i, a, div;

		// before updating local properties, de-register observers for data that may be going away
		_c.stopObservation(_c.editor, "gameData/scenes/" + this.currentSceneIndex + "/entities/@@@", this);

		// rebuild local properties
		this.currentSceneIndex = _c.editor.uiState.data.currentSceneIndex;
		this.entities =  + _c.editor.gameData.scenes[this.currentSceneIndex].entities; 

		// replace observers
		_c.observe(_c.editor, "gameData/scenes/" + this.currentSceneIndex + "/entities/@@@", this, "onSceneDataChanged");


// 		var $entityTypeTemplate = $(".entity-type-template.template");

// 		//var $tabParent = $(".layers-pane-tabs > ul");
// 		var $kitPaneContent = $(".kit-pane-content");
// 		$kitPaneContent.find('.entity-type-template').remove();  // clear list of entity types

// 		var scenes = _c.get(_c.editor.gameData, "scenes");

// 		var numScenes;
// 		if (!scenes || scenes.length <= 0) numScenes = 0;
// 		else numScenes = scenes.length;

// 		if (numScenes <= 0) {
// 			console.log('kit-panel: scene data must contain at least one scene.');
// 			return;
// 		}

// 		var currentSceneIndex = _c.get(_c.editor, 'uiState/data/currentSceneIndex');

// 		if (numScenes <= currentSceneIndex) {
// 			console.log('kit-panel: scene index exceeds the number of scenes: ' + currentSceneIndex);
// 			return;			
// 		}

// 		var currentScene = scenes[currentSceneIndex];
// 		var kits = currentScene.kits;  // a list of unique ids of the kits used by the scene

// 		var currentLayer = _c.get(_c.editor, 'uiState/data/currentLayer');

// 		if (kits == null || kits.length <=0 || currentLayer >= kits.length) {
// 			console.log('kit-panel: unable to locate layer data: ' + currentLayer);
// 			return;			
// 		}

// 		var kitId = kits[currentLayer];
// 		var kit = _c.get(_c.editor, 'gameData/_refs/kits/' + kitId);

// 		if (kit == null) {
// 			console.log('kit-panel: unable to locate kit data: ' + kitId);
// 			return;			
// 		}

// 		for (var x=0; x<20; x++) {
// 		for (i=0; i<kit.entityTypes.length; i++) {
// 			var entityTypeId = kit.entityTypes[i];
// 			if (entityTypeId == null || entityTypeId.length <= 0) continue;
// 			var entityType = _c.get(_c.editor, 'gameData/_refs/entityTypes/' + entityTypeId);
// 			if (entityType == null) continue;

// 			// we have a valid entity type; create a thumbnail for it

// 			var $newEntityType = $entityTypeTemplate.clone().removeClass('template');
// 			var $img = $newEntityType.find('img');
// 			var $span = $newEntityType.find('span');
// 			if (entityType.friendlyName != null) $span.html(entityType.friendlyName);  // set HTML to allow for <br/>
// 			if (entityType.icon != null) $img.attr('src', entityType.icon);  // server provides complete url

// 			$newEntityType.draggable({
// 				helper: 'clone',
// 				opacity: .6,
// 				start: function(event, ui) { ui.helper.removeClass('cursor-grab').addClass('cursor-drag'); },
// 				revert: 'invalid',
// 				zIndex: 1000
// //				stack: '.entity-type-template'
// 			});
// 			$kitPaneContent.append($newEntityType);
// 		}
//
// 		}

	};

	ChoreoKitPane.prototype.onUIDataChanged = function(changes) {

		console.log("UI changes to Gallery Pane.");

		// TBD, if we decide to let the user select entity types
	};

}
