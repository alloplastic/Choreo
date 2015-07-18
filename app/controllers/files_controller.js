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

		console.log("Ribbit");

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
			console.log("ERROR - FileController - getGame() - " + e.message);
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
