/**
 * PlayerController
 * 
 */

//var PlayerController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var PlayerController = new ParentController();
var PlayerModel = require('../models/choreo/player_model');

var i18n = require('../../config/extensions/i18n-namespace');
	
	/**
	 * Render/run a game
	 */
	PlayerController.renderGame = function() {

		ParentController.__addNoCacheHeaders.call(this);
		this.page = false;

		var gameId = this.param('gameId');
		if (gameId == null) gameId = "";

		var model = new PlayerModel();
		model.gameId = gameId;
		model.uniqueName = "player_" + gameId + "_" + parseInt((Math.random() * 9007199254740992), 10);
		// TBD: change these based on platform/context
		model.apiRoot = this.app.apiRoot;
		model.fileRoot = this.app.fileRoot;
		model.gameAssetRoot = this.app.fileRoot + 'data/games/';  // individual players append gameId + '/assets/'
		model.hostEnvironment = this.app.hostEnvironment;
		
		this.render('./choreo/player', model);
	};	

	//ParentController.parentOf(PlayerController);
	PlayerController.parentOf(PlayerController);

module.exports = PlayerController;
