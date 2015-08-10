// A module for automotically persisting and undoing changes

if (!ChoreoStorage) {

	var ChoreoStorage = function (options) {

		// track the edit sequence in order to automatically store undo info.  'editQueueCurrent' is the
		// current edit of changes being received via the observer path, which might me different than the
		// "real-time" edit in the UI.  For a real-time save (i.e. of a binary file) we directly read this
		// value when the save is requested.

		this.editQueueCurrent = 0;
	};

	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoStorage.prototype.init = function(changes) {

		console.log("storage initializing...");

		//this.editQueueCurrent = _c.get(_c.editor, "gameData/editCurrent");

		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData/@@@", this, "onGameDataChanged");
		_c.observe(_c.editor, "gameData", this, "onGameDataReloaded");
	};

	ChoreoStorage.prototype.onGameDataReloaded = function(changes) {
		this.editQueueCurrent = _c.get(_c.editor, "gameData/editCurrent");
	}

	ChoreoStorage.prototype.onGameDataChanged = function(changes) {

		console.log("storage: processing new game data.");

		for (var i=0; i<changes.length; i++) {

			var change = changes[i];

			// first chack to see if a logical edit has concluded
			if (change.path == 'gameData/editCurrent') {
				this.editQueueCurrent = change.value;
				continue;
			}

			var projectPath = _c.get(_c.editor, "uiState/data/currentProject");

			if (!projectPath || !projectPath.length) return;

			// TBD: in the web app, might want to inspect what changed and queue up indovidual property writes
			// and/or store undo information as these writes.

			// on desktop, we resave the main content file every time there is a change
			this.saveContent(projectPath);

		}

	};

	ChoreoStorage.prototype.saveContent = function(path) {

		// temporarily delete extra data aggregated by server; TBD: any risk here?
		var contents = _c.editor.gameData;
		var refs = contents._refs;

		if (contents._refs != null) delete contents._refs;

		this.saveJSON(contents, path, '', 'contents.json');

		// $.ajax(_c.editor.apiRoot + 'files?path=' + encodeURIComponent(path) + '&fileName=contents.json', {
		// 	type: 'POST',
		// 	data: JSON.stringify(contents),
		// 	contentType: 'application/json',
		// 	success: function(response) { 
		// 		console.log("Successfully saved game data.")
		// 	},
		// 	error  : function(err) {
		// 		// TBD: could become irritating?
		// 		alert ("Sorry, something went wrong with autosave:\n\n" + err.responseText);
		// 	}
		// });

		// can restore these as soon as the data is sent to the web service
		contents._refs = refs;

	};

	ChoreoStorage.prototype.saveJSON = function(obj, path, subPath, fileName) {

		var undoParam = this.getUndoParamString(this.editQueueCurrent);
		var subDirParam = '&editSubPath=' + subPath;   // no subdorectory for contents.json since it goes at the root

		var url = _c.editor.apiRoot + 'files?path=' + encodeURIComponent(path) + '&fileName=' + fileName + undoParam + subDirParam;

		console.log("saving JSON via: " + url);

		$.ajax(url, {
			type: 'POST',
			data: JSON.stringify(obj),
			contentType: 'application/json',
			success: function(response) { 
				console.log("Successfully saved file: " + fileName)
			},
			error  : function(err) {
				// TBD: could become irritating?
				alert ("Sorry, something went wrong with autosave:\n\n" + err.responseText);
			}
		});

	};

	// use the current project "edit number" to back up the old value of the target file in the appropriate place.
	ChoreoStorage.prototype.getUndoParamString = function(editNum) {
		var params = "";

		var projectPath = _c.get(_c.editor, "uiState/data/currentProject");
		//var editNumber = _c.get(_c.editor, "gameData/editCurrent");

		if (!projectPath || !projectPath.length) return params;
//		if (!editNumber || !editNumber.length) return params;

		// TBD: sloppy to have this everywhere
		var lastCharOfPath = projectPath.slice(-1);
		if (lastCharOfPath != '/') projectPath += '/';

		params = "&editPath=" + encodeURIComponent(projectPath + "edits/edit_" + editNum);
		return(params);

	};

}
