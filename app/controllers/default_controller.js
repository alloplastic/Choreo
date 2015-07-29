/**
 * DefaultController
 * 
 * Build out this controller to create a web app around the choreo editor.
 */

//var DefaultController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var DefaultController = new ParentController();
var HomeModel = require('../models/choreo/home_model');
var PlayerModel = require('../models/choreo/player_model');
var i18n = require('../../config/extensions/i18n-namespace');

	/**
	 * Main page containing the full editor layout
	 */
	DefaultController.main = function() {

		this.__addNoCacheHeaders.call(this);
//		ParentController.__addNoCacheHeaders.call(this);
		this.page = false;

		var model = new HomeModel();
		var playerModel = new PlayerModel();

		// TBD: maybe not so elegant: adding all player-model props to the main model so that it can render correctly
		for (var p in playerModel) {
			if (playerModel.hasOwnProperty(p)) model[p] = playerModel[p];
		}

		model.apiRoot = this.app.apiRoot;
		model.fileRoot = this.app.fileRoot;
		model.gameAssetRoot = this.app.fileRoot + 'data/games/';

		var envHint;
		if (this.param) {
			envHint = this.param('env');	
		} 

		if (envHint) {
			model.hostEnvironment = envHint;
		} else {
			model.hostEnvironment = this.app.hostEnvironment;  // default env=='web'
		}

		// to temporarility test something in the browser
		//model.hostEnvironment = "desktop";

		this.render('./index', model);
	};	

	/**
	 * Set the default language in a cookie. i18n picks this cookie up.
	 * @param language - the language code to set the locale to
	 */
	DefaultController.setLanguage = function() {
		var language = this.param('language');
		
		var expiryDate = new Date(Number(new Date()) + 315360000000); //10 * 365 * 24 * 60 * 60 * 1000 === 315360000000, or 10 years in milliseconds
		this.__res.cookie('lang', language, { expires: expiryDate, httpOnly: true });
		
		// Behave like a pure API call.  Let the client refresh the page.
		this.__res.json({result: "thanks"});
	};

	/**
	 * After the controller's functions are created, before() and after() methods can be registered with
	 * Locomotive; these will be called before and after particular routes are handled.  '*' is a valid wildcard.
	 */
	 
	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
	//ParentController.parentOf(DefaultController);
	DefaultController.parentOf(DefaultController);
		

	DefaultController.before(['show','main'], function(next) {

		// Add global logic for processing page logic, session info; etc.

		next();
	});
		
module.exports = DefaultController;
