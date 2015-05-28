/**
 * EditorController
 * 
 */

var EditorController = new (require('locomotive').Controller)()
,	ParentController = require('./../../controller.js')
,	i18n = require('../../../config/extensions/i18n-namespace');
	
	ParentController.parentOf(EditorController);

module.exports = EditorController;
