
// Creating this data structure as a model in anticipation of wanting to ecapsulate business logic,
// in particular an 'upgrade' path if/when we decide to persist editor state and preferences.

if (!ChoreoEditorModel) {

	var ChoreoEditorModel = function (options) {
		options = options || {};
		// for better or worse, store the model data in a single property for the sake of serialization
		this.data = {};
		this.init();  // wasteful, perhaps, but guarantees the existence of certain fields

	};

	ChoreoEditorModel.prototype = {

		init: function() {

			// flat structure since each panel only displays one "current" thing at a time
			this.data = {
				choreoVersion: 1,
				currentScene: "",
				currentLayer: 0,
				currentEntity: "",
				playerState: {
					// TBD
				}
			}
		},

		defaultsForGame: function(gameData) {

			this.init();

			this.data.currentScene = gameData.firstScene;

			if (gameData.scenes && gameData.scenes.length > 0) {
				this.data.currentScene = gameData.firstScene;
				if (!gameData.scenes[0].kits || gameData.scenes[0].kits.length<=0) {
					_c.set(this, 'data/currentLayer', -1);
					_c.set(this, 'data/currentEntity', -1);
	//				this.data.currentLayer = -1;  // else start at 0
	//				this.data.currentEntity = -1;
				} else if (!gameData.scenes[0].entitites || gameData.scenes[0].entitites.length <= 0) {
					_c.set(this, 'data/currentEntity', -1);
	//				this.data.currentEntity = -1;
				}
				// otherwise, the 0 default indices are what we want
			}

		}

	};

}

