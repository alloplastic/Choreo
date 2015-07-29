/**
 * FilesController
 * 
 * A collection of routes for accessing the file system via fs.
 */

//var FilesController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var FilesController = new ParentController();
var i18n = require('../../config/extensions/i18n-namespace');
//var Q = require('q');
var fs = require('fs');
	 

	 /**
	 * Retrieve a file specified by "path" and "fileName" URL parameters.
	 */
	FilesController.getFile = function() {

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		try {

			var path = this.param('path');
			var fileName = this.param('fileName');
			var self = this;

			if (path == null || path == "" || fileName == null || fileName == "") {
				this._error(resLocal, "ERROR - FileController - getFile() - Bad Parameters");
				return;
			}

			var lastCharOfPath = path.slice(-1);
			if (lastCharOfPath != '/') path += '/';

			var filePath = path + fileName;

			console.log("reading file from disk:" + filePath);

			fs.readFile(filePath, {encoding: 'utf8'}, function (err, result) {
				if (err) throw err;
				var gameData = eval("(" + result + ")");
//				var gameData = JSON.stringify(eval("(" + result + ")"));
				self.addMetadataToGameResponse.call(self, gameData, resLocal);
			});
				
		} catch (e) {
			console.log("ERROR - FileController - getFile() - " + e.message);
			resLocal.json({status: "error", message: e.message});
		}

	};

	 /**
	 * Writes a file specified by "path" and "fileName" URL parameters.  The file contents are delivered in the
	 * body of the request.
	 */
	FilesController.putFile = function() {

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		try {

			var path = this.param('path');
			var fileName = this.param('fileName');
			var self = this;

			// TBD: branch based on content-type header?  Need to worry about delims?
			var contents = this.__req.body;

			if (path == null || path == "" || fileName == null || fileName == "") {
				this._error(resLocal, "ERROR - FileController - putFile() - Bad Parameters");
				return;
			}

			var lastCharOfPath = path.slice(-1);
			if (lastCharOfPath != '/') path += '/';

			// TBD: evaluate whether sync functions will cause bottlenecks; probably not for this op
			if (!fs.existsSync(path)) fs.mkdirSync(path);

			fs.writeFile(path + fileName, JSON.stringify(contents), function (err, result) {

				if (err) throw err;
				resLocal.json({status: "success"});
				return;
			});
				
		} catch (e) {
			resLocal.json({status: "error", message: e.message});
		}

	};

	 /**
	 * Create the specified diretory
	 */
	FilesController.createDirectory = function() {

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		try {

			var path = this.param('path');

			if (path == null || path == "") {
				this._error(resLocal, "ERROR - FileController - createDirectory() - Bad Parameters - null path");
				return;
			}

			// TBD: evaluate whether sync functions will cause bottlenecks; probably not for this op
			// TBD: does this recursively create the whole path?
			if (!fs.existsSync(path)) fs.mkdirSync(path);

			resLocal.json({status: "success"});	
			return;

		} catch (e) {
			resLocal.json({status: "error", message: e.message});
		}

		// makes sense only when all of the calls in this method are synchronous
		resLocal.json({status: "error", message: "ERROR - FileController - createDirectory() - Unknown Error."});

	};

	 /**
	 * Convenience routine for creating a new project folder on the local file system.
	 */
	FilesController.newGame = function() {

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context
		var path = this.param('path');
		var self = this;

		if (path == null || path == "") {
			this._error(resLocal, "ERROR - FileController - newGame() - Bad Parameters - null path");
			return;
		}

		var lastCharOfPath = path.slice(-1);
		if (lastCharOfPath != '/') path += '/';

		// extra info sent back with error messages
		var info = {};

		try {

			// Since we're accessing the file system, we know we're running locally, so we use the stub API
			// to retrieve the static data built into the running app.

			var emptyGameUrl = "http://" + this.__req.headers.host + "/stubAPI/games/EmptyGame";

			// We get the JSON of the default "empty game" from the server, then we tell the server to write this JSON
			// to the location on disk chosen by the user.  Server creates the new directory if needed.

			this._getJSON(emptyGameUrl)

				.then (
					function(newGame) { // success

						// delete extra data aggregated by server
						if (newGame._refs != null) delete newGame._refs;

						// need to create the project folder in a certain order, creating the top level directory first
						// (by writing /<ProjectName/contents.json) and so on.

						// var contentsFileUrl = "http://" + self.__req.headers.host + '/files?path=' + path + '&fileName=contents.json';
						var contentsFileUrl = "http://" + self.__req.headers.host + self.app.apiRoot + 'files?path=' + encodeURIComponent(path) + '&fileName=contents.json';

						self._putJSON.apply(self, [contentsFileUrl, newGame])

							.then (

								function (result) {  // contents.json written successfully

									// create assets directory
									var assetPath = path + "assets";
									var assetsDirectoryUrl = "http://" + self.__req.headers.host + self.app.apiRoot + 'files/directory?path=' + encodeURIComponent(assetPath);

									self._putJSON.apply(self, [assetsDirectoryUrl, {}])

										.then(
											function (result) {  // successfully created asset dir
												// all done creating project dir
												resLocal.json({status: "success", data: newGame});
											},

											function () { // failed to retrieve default icon
												info.assetsDirectoryUrl = assetsDirectoryUrl;
												self._error(resLocal, "ERROR - FileController - newGame - failed to create assets directory.", info);
											}
										);

								},
								function () {  // error writing contents.json
									info.contentsUrl = contentsFileUrl;
									info.emptyGame = emptyGame;
									self._error(resLocal, "ERROR - FileController - newGame - failed to write contents.json.", info);
								});

					},
					function(result) {   // failure
						info.emptyGameUrl = emptyGameUrl;
						self._error(resLocal, "ERROR - FileController - newGame - failed to retrieve EmptyGame.", info);
					}
				);

		} catch (e) {
			self._error(resLocal,  e.message);
		}

	};


	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
//	ParentController.parentOf(FilesController);
	FilesController.parentOf(FilesController);
		

	// FilesController.before(['getGame'], function(next) {

	// 	// Add global logic for processing page logic, session info; etc.

	// 	next();
	// });
		
module.exports = FilesController;
