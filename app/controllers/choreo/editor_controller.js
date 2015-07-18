/**
 * EditorController
 * 
 */

//var EditorController = new (require('locomotive').Controller)();
var ParentController = require('./../../controller.js');
var EditorController = new ParentController();

var i18n = require('../../../config/extensions/i18n-namespace');
	
	EditorController.parentOf(EditorController);

module.exports = EditorController;
