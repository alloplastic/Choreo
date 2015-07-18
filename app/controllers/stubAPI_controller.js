/**
 * StubController
 * 
 * Static stub date mirroring the real or envisioned services.
 */

//var StubAPIController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var StubAPIController = new ParentController();
var i18n = require('../../config/extensions/i18n-namespace');
var Q = require('q');

	/**
	 * Retrieve a game by name, pulling from a directory of static JSON files
	 */
	StubAPIController.getGame = function() {

		try {
			var gameId = this.param('gameId');
			var self = this;

			// TBD: DB hook
			url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/contents.json";

			var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

			console.log("THIS = " + this);
			console.log("THIS.__res = " + this.__res);
			console.log("THIS._requestJSON = " + this._requestJSON);

			this._requestJSON(url)			
//			ParentController._requestJSON(url)
				
				.then (
				function(result) { // success
					self.addMetadataToGameResponse.call(self, result, resLocal);
				},
				function(result) {   // failure
					resLocal.json({status: "error"});
			});;

			console.log("Urp.");

		} catch (e) {
			console.log("ERROR - getGame() - " + e.message);
			resLocal.json({status: "error", message: e.message});
		}
	};

	/**
	 * Retrieve the .js file containing a game's class definitions
	 */
	StubAPIController.getGameClasses = function() {

		var gameId = this.param('gameId');

		console.log("API classes");

		// TBD: DB hook
		//var url = "/data/games/" + gameId + "/classes.js";
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/classes.js";

		this._requestJS(url);
//		ParentController._requestJS(url);

	};

	/**
	 * Retrieve the .js file containing a game's instance definitions
	 */
	StubAPIController.getGameInstances = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/instances.js";

		this._requestJS(url);
//		ParentController._requestJS(url);

	};

	/**
	 * Retrieve the .js file containing a game's scripts
	 */
	StubAPIController.getGameScripts = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/scripts.js";

		this._requestJS(url);
//		ParentController._requestJS(url);

	};

	/**
	 * After the controller's functions are created, before() and after() methods can be registered with
	 * Locomotive; these will be called before and after particular routes are handled.  '*' is a valid wildcard.
	 */
	 
	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
//	this.parentOf(StubAPIController);
	//ParentController.parentOf(StubAPIController);
	StubAPIController.parentOf(StubAPIController);
		

	StubAPIController.before(['getGame'], function(next) {

		// Add global logic for processing page logic, session info; etc.

		next();
	});
		
module.exports = StubAPIController;
