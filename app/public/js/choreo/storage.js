// A module for automotically persisting and undoing changes

if (!ChoreoStorage) {

	var ChoreoStorage = function (options) {
	};

	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoStorage.prototype.init = function(changes) {

		console.log("storage initializing...");

		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData/@@@", this, "onGameDataChanged");
	};

	ChoreoStorage.prototype.onGameDataChanged = function(changes) {

		console.log("storage: saving new game data.");

		var projectPath = _c.get(_c.editor, "uiState/data/currentProject");

		if (!projectPath || !projectPath.length) return;

		// TBD: create an "undo" folder for each change.
		//     /undo/timestamp/contents.json
		//     /undo/timestamp/new/assets/Fish_9884747348.png
		//     /undo/timestamp/deleted/assets/Cow_34234234234.png

		// on desktop, we resave the main content file every time there is a change
		this.saveContent(projectPath);

	};

	ChoreoStorage.prototype.saveContent = function(path) {

		// temporarily delete extra data aggregated by server; TBD: any risk here?
		var contents = _c.editor.gameData;
		var refs = contents._refs;

		if (contents._refs != null) delete contents._refs;

		$.ajax(_c.editor.apiRoot + 'files?path=' + encodeURIComponent(path) + '&fileName=contents.json', {
			type: 'POST',
			data: JSON.stringify(contents),
			contentType: 'application/json',
			success: function(response) { 
				console.log("Successfully saved game data.")
			},
			error  : function(err) {
				// TBD: could become irritating?
				alert ("Sorry, something went wrong with autosave:\n\n" + err.responseText);
			}
		});

		// can restore these as soon as the data is sent to the web service
		contents._refs = refs;

	};

}
