/**
 * FilesController
 * 
 * A collection of routes for accessing the file system via fs.
 */

//var FilesController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var FilesController = new ParentController();
var i18n = require('../../config/extensions/i18n-namespace');
var Q = require('q');
var fs = require('fs');
var mkdirp = require('mkdirp');

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
			this._error(resLocal, "ERROR - FileController - getFile() - " + e.message);
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
			var editPath = this.param('editPath');   // optional path to a folder to record the history of this file write
			var editSubPath = this.param('editSubPath');   // project-relative path to the file, e.g. /assets/entity5/
			var fileName = this.param('fileName');
			var self = this;

			var r;
			
			// TBD: branch based on content-type header?  Need to worry about delims?
			var contents = this.__req.body;

			if (path == null || path == "" || fileName == null || fileName == "") {
				this._error(resLocal, "ERROR - FileController - putFile() - Bad Parameters");
				return;
			}

			var lastCharOfPath = path.slice(-1);
			if (lastCharOfPath != '/') path += '/';

			var filePath = path + fileName;

			// TBD: evaluate whether sync functions will cause bottlenecks; probably not for this op
			if (!fs.existsSync(path)) fs.mkdirSync(path);

			// calling code can pass an "edit path" to hold history/undo information
			if (editPath != null && editPath.length > 0) {

				// make sure that the "edit" directory structure exists

				lastCharOfPath = editPath.slice(-1);
				if (lastCharOfPath != '/') editPath += '/';

				if (editSubPath == null) {
					editSubPath = "";
				} else {
					lastCharOfPath = editSubPath.slice(-1);
					if (lastCharOfPath != '/') editSubPath += '/';					
				}
				var removedPath = editPath + "removed/" + editSubPath;
				var writtenPath = editPath + "written/" + editSubPath;

				var removedFilePath = removedPath + fileName;
				var writtenFilePath = writtenPath + fileName;

				var q1 = Q.defer();
				mkdirp(removedPath, function (err) {
					if (err) {
						q1.reject({status: "error"});
						self._error(err);
					}
					else {
						q1.resolve({status: "success"});
					}
				});

				var q2 = Q.defer();
				mkdirp(writtenPath, function (err) {
					if (err) {
						q2.reject({status: "error"});
						self._error(err);
					}
					else {
						q2.resolve({status: "success"});
					}
				});

				// wait for both directories to be created, if necessary
				Q.all([q1.promise, q2.promise])
				.then(function(results) {

					for (r=0; r<results.length; r++) {
						if (results[r].status == 'error') {
							self._error(resLocal, "ERROR - FileController - putFile - failed to create edit/history directory structure.");
							return;
						}
					}

					// collect (potentially) multiple processes to wait for
					var promises = [];

					// if the file already exists, and hasn't been archived yet, copy it to the "removed" directory
					if (fs.existsSync(filePath) && !fs.existsSync(removedFilePath)) {

						var write1Deferred = Q.defer();

						var r = fs.createReadStream(filePath);
						var w = fs.createWriteStream(removedFilePath);
						r.pipe(w);

						w.on('finish', function() {
						  write1Deferred.resolve({status: 'success'});
						});

						w.on('error', function(err) {
						  write1Deferred.reject({status: 'error', message: err.message});
						});

						promises.push(write1Deferred.promise);
					} 

					var write2Deferred = Q.defer();

					// always write the new version of the destination file to the history
					fs.writeFile(writtenFilePath, JSON.stringify(contents), function (err, result) {
						if (err) {
							write2Deferred.reject({status: 'error'});
							throw err;
						}
						write2Deferred.resolve({status: 'success'});
					});

					promises.push(write2Deferred.promise);

					Q.all(promises)
					.then(function(results) {

						for (r=0; r<results.length; r++) {
							if (results[r].status == 'error') {
								self._error(resLocal, "ERROR - FileController - putFile - failed to write edit/history files.");
								return;
							}
						}

						// history written successfully; now overwrite the current project file
						self.finishFileWrite.call(self, resLocal, filePath, contents);
					})
					.fail (function(err) {
						self._error(resLocal, "ERROR - FileController - putFile - failed to write edit/history files.");
					});


				})
				.fail (function(err) {
					self._error(resLocal, "ERROR - FileController - putFile - failed to create edit/history directory structure.");
				});


			} else {
				this.finishFileWrite(resLocal, filePath, contents);
			}
		} catch (e) {
			this._error(resLocal, e.message);
		}

	};

	FilesController.finishFileWrite = function(resLocal, path, contents) {

		// TBD: automatically branch based on content type?

		fs.writeFile(path, JSON.stringify(contents), function (err, result) {
			if (err) throw err;
			resLocal.json({status: "success"});
		});

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
			this._error(resLocal, e.message);
		}

		// makes sense only when all of the calls in this method are synchronous
		this._error(resLocal, "ERROR - FileController - createDirectory() - Unknown Error.");

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

									// build out expected directory structure

									var assetsPath = path + "assets";
									var assetsDirectoryUrl = "http://" + self.__req.headers.host + self.app.apiRoot + 'files/directory?path=' + encodeURIComponent(assetsPath);

									var editsPath = path + "edits";
									var editsDirectoryUrl = "http://" + self.__req.headers.host + self.app.apiRoot + 'files/directory?path=' + encodeURIComponent(editsPath);

									var p1 = self._putJSON.call(self, assetsDirectoryUrl, {});
									var p2 = self._putJSON.call(self, editsDirectoryUrl, {});

									Q.all([p1, p2])
									.then(function(results) {

										for (r=0; r<results.length; r++) {
											if (results[r].status == 'error') {
												self._error(resLocal, "ERROR - FileController - newGame - failed to create directory structure: " + results[r].message);
												return;
											}
										}

										// project folder created successfully
										resLocal.json({status: "success", data: newGame});
									})
									.fail (function(err) {
										self._error(resLocal, "ERROR - FileController - newGame - failed to create directory structure. - " + err + " - " + err.message);
									});


									// self._putJSON.apply(self, [assetsDirectoryUrl, {}])

									// 	.then(
									// 		function (result) {  // successfully created asset dir
									// 			// all done creating project dir
									// 			resLocal.json({status: "success", data: newGame});
									// 		},

									// 		function () { // failed to retrieve default icon
									// 			info.assetsDirectoryUrl = assetsDirectoryUrl;
									// 			self._error(resLocal, "ERROR - FileController - newGame - failed to create assets directory.", info);
									// 		}
									// 	);

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
