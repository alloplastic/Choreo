
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
				currentProject: "",   // file or REST path to the currently loaded project
				currentScene: "",
				currentSceneIndex: 0,
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

				var sceneIndex = -1;
				for (var i=0; i<gameData.scenes.length; i++) {
					if (gameData.scenes[i].id == gameData.firstScene) {
						sceneIndex = i;
						break;
					}
				}

				if (sceneIndex == -1) {
					console.log('ChoreoEditorModel: first scene not found: ' + gameData.firstScene);
					return;
				}

				var curScene = gameData.scenes[sceneIndex];

				_c.set(this, 'data/currentSceneIndex', sceneIndex);
				_c.set(this, 'data/currentScene', gameData.firstScene);

				if (!curScene.kits || curScene.kits.length<=0) {
					_c.set(this, 'data/currentLayer', -1);
					_c.set(this, 'data/currentEntity', -1);

				} else if (!curScene.entitites || curScene.entitites.length <= 0) {
					_c.set(this, 'data/currentLayer', 0);
					_c.set(this, 'data/currentEntity', -1);
				} else {
					_c.set(this, 'data/currentLayer', 0);
					_c.set(this, 'data/currentEntity', 0);
				}
			}

		},

		setCurrentScene: function(index) {

			var gameData = _c.editor.gameData;

			if (index<0 ||
				!gameData.scenes ||
				gameData.scenes.length < index)
				return;

			var sceneId = gameData.scenes[index].id;

			_c.set(this, 'data/currentSceneIndex', index);
			_c.set(this, 'data/currentScene', sceneId);
		}

	};

}

