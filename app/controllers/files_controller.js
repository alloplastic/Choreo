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
	 * Retrieve a game by name, pulling from a directory of static JSON files
	 */
	FilesController.getFile = function() {

		try {
			var path = this.param('path');
			var self = this;

			var filePath = path + "/contents.json";

			console.log("reading file from disk:" + filePath);

			var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

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
	 * Retrieve a game by name, pulling from a directory of static JSON files
	 */
	FilesController.putFile = function() {

		try {
			var path = this.param('path');
			var fileName = this.param('fileName');
			var self = this;

			// TBD: branch based on content-type header?  Need to worry about delims?
			var contents = this.__req.body;

			// TBD: evaluate whether sync functions will cause bottlenecks; probably not for this op
			if (!fs.existsSync(path)) fs.mkdirSync(path);

			var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

			fs.writeFile(path + fileName, JSON.stringify(contents), function (err, result) {

				if (err) throw err;
				resLocal.json({status: "success"});
			});
				
		} catch (e) {
			resLocal.json({status: "error", message: e.message});
		}

	};

	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
//	ParentController.parentOf(FilesController);
	FilesController.parentOf(FilesController);
		

	FilesController.before(['getGame'], function(next) {

		// Add global logic for processing page logic, session info; etc.

		next();
	});
		
module.exports = FilesController;
