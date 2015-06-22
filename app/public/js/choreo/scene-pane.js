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
		_c.observe(_c.editor, "gameData", this, "onGameDataChanged");		
	};

	ChoreoScenePane.prototype.onGameDataChanged = function(changes) {

		// for now, just rebuild everything.  TBD: catch low-level changes like scene names for quick transitions
		console.log("Rebuild Scenes Pane.");

	};

}
