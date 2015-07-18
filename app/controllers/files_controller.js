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
