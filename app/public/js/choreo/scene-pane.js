// The tabbed panel where the user manages his scenes and what kits they contain

if (!ChoreoScenePane) {

	var ChoreoScenePane = function (options) {
		options = options || {};

		// this.apiRoot = options.apiRoot || window.choreo.apiRoot || '/';
		// this.fileRoot = options.fileRoot || window.choreo.fileRoot || '/';

		// this.gameData = {};
		// this.gameState = {};

	};


	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoScenePane.prototype.init = function(changes) {
		$( ".layers-pane-tabs" ).tabs();

		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData/scenes", this, "onSceneDataChanged");		
	};

	ChoreoScenePane.prototype.onSceneDataChanged = function(changes) {

		// for now, just rebuild everything.  TBD: catch low-level changes like scene names for quick transitions
		console.log("Rebuild Scenes Pane.");

		var $tabTemplate = $(".tab-template.template");
		var $tabContentTemplate = $(".tab-content-template.template");

		var $tabParent = $(".layers-pane-tabs > ul");
		var $tabs = $(".layers-pane-tabs > ul > li");

		var scenes = _c.get(_c.editor.gameData, "scenes");

		var numScenes;
		if (!scenes || scenes.length <= 0) numScenes = 0;
		else numScenes = scenes.length;

		if (numScenes < $tabs.length-1) {
			$tabs.slice(numScenes, $tabs.length - numScenes -1).remove();
			for (var i = $tabs.length; i<numScenes; i++) {
			}			
		} else if (numScenes > $tabs.length-1) {
			for (var i = $tabs.length-1; i>=numScenes; i--) {

				var newTab = $tabTemplate.clone().removeClass('template');
				var a = newTab.find('a');
				a.attr('href', '#layers-pane-tab-' + i);
				a.text('-' + i + '-');
				$tabs.eq(i).before(newTab);
			}
		}

		// for each tab...

		var tab = $tabTemplate.clone().removeClass('template');
		var tabContent = $tabContentTemplate.clone().removeClass('template');

		// tab.find(...).html();
		// tab.attr(...);


	};

}
