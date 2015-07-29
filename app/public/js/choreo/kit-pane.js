// The tabbed panel where the user manages his scenes and what kits they contain

if (!ChoreoKitPane) {

	var ChoreoKitPane = function (options) {
		options = options || {};

		this.tabs = null;
		this.$tabParent = null;

		// this.apiRoot = options.apiRoot || window.choreo.apiRoot || '/';
		// this.fileRoot = options.fileRoot || window.choreo.fileRoot || '/';

		// this.gameData = {};
		// this.gameState = {};

	};


	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoKitPane.prototype.init = function(changes) {

		var self = this;

		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData/scenes/@@@", this, "onSceneDataChanged");

		// rebuild the entire list of entity types whenever a key ui value changes
		_c.observe(_c.editor.uiState, "data/currentScene", this, "onSceneDataChanged");
		_c.observe(_c.editor.uiState, "data/currentLayer", this, "onSceneDataChanged");

//		_c.observe(_c.editor, "uiState/@@@", this, "onUIDataChanged");	
	};

	ChoreoKitPane.prototype.onSceneDataChanged = function(changes) {

		// for now, just rebuild everything.
		console.log("Rebuild Kits Pane.");

		var self = this;
		var i, a, div;

		var $entityTypeTemplate = $(".entity-type-template.template");

		//var $tabParent = $(".layers-pane-tabs > ul");
		var $kitPaneContent = $(".kit-pane-content");
		$kitPaneContent.find('.entity-type-template').remove();  // clear list of entity types

		var scenes = _c.get(_c.editor.gameData, "scenes");

		var numScenes;
		if (!scenes || scenes.length <= 0) numScenes = 0;
		else numScenes = scenes.length;

		if (numScenes <= 0) {
			console.log('kit-panel: scene data must contain at least one scene.');
			return;
		}

		var currentSceneIndex = _c.get(_c.editor, 'uiState/data/currentSceneIndex');

		if (numScenes <= currentSceneIndex) {
			console.log('kit-panel: scene index exceeds the number of scenes: ' + currentSceneIndex);
			return;			
		}

		var currentScene = scenes[currentSceneIndex];
		var kits = currentScene.kits;  // a list of unique ids of the kits used by the scene

		var currentLayer = _c.get(_c.editor, 'uiState/data/currentLayer');

		if (kits == null || kits.length <=0 || currentLayer >= kits.length) {
			console.log('kit-panel: unable to locate layer data: ' + currentLayer);
			return;			
		}

		var kitId = kits[currentLayer];
		var kit = _c.get(_c.editor, 'gameData/_refs/kits/' + kitId);

		if (kit == null) {
			console.log('kit-panel: unable to locate kit data: ' + kitId);
			return;			
		}

		//for (var x=0; x<20; x++) {
		for (i=0; i<kit.entityTypes.length; i++) {
			var entityTypeId = kit.entityTypes[i];
			if (entityTypeId == null || entityTypeId.length <= 0) continue;
			var entityType = _c.get(_c.editor, 'gameData/_refs/entityTypes/' + entityTypeId);
			if (entityType == null) continue;

			// we have a valid entity type; create a thumbnail for it

			var $newEntityType = $entityTypeTemplate.clone().removeClass('template');
			var $img = $newEntityType.find('img');
			var $span = $newEntityType.find('span');
			if (entityType.friendlyName != null) $span.html(entityType.friendlyName);  // set HTML to allow for <br/>
			if (entityType.icon != null) $img.attr('src', entityType.icon);  // server provides complete url

			$newEntityType.draggable({
				helper: 'clone',
				opacity: .6,
				start: function(event, ui) { 
					ui.helper.removeClass('cursor-grab').addClass('cursor-drag');
					ui.helper._refs = {};  // TBD: should we feel ashamed for passing data this way?
					ui.helper._refs.entityType = entityType;
				},
				revert: 'invalid',
				zIndex: 1000
//				stack: '.entity-type-template'
			});
			$kitPaneContent.append($newEntityType);
		//}
}

	};

	ChoreoKitPane.prototype.onUIDataChanged = function(changes) {

		console.log("UI changes to Kit Pane.");

		// TBD, if we decide to let the user select entity types
	};

}
