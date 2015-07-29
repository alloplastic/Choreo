/**
 * API Controller
 * 
 * a shell for building out the real web services for online access or an online version of the tool
 * 
 * TBD: who knows, maybe the /data routes used by the stub could operate equivalently online, but most likelu
 * most of these endpoints will need to be rewritten with the cloud services in mind.
 *
 * TBD: refactor the stub code below.
 */

//var APIController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var APIController = new ParentController();
var i18n = require('../../config/extensions/i18n-namespace');
var Q = require('q');

	/**
	 * Retrieve a game by name, pulling from a directory of static JSON files
	 */
	APIController.getGame = function() {

		try {
			var gameId = this.param('gameId');
			var self = this;

			// TBD: DB hook
			url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/contents.json";

			var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

			this._getJSON(url)			
				
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
	 * TBD: create a new game in the system and return the id.  A no-op for the stub, maybe, but in the real API
	 * this probably involves creating the S3 documents for the main content.json file, defualt entity icon; etc.,
	 * and then linking these into a record in SimpleDB.
	 */
	APIController.newGame = function() {

	};

	/**
	 * Retrieve the .js file containing a game's class definitions
	 */
	APIController.getGameClasses = function() {

		var gameId = this.param('gameId');

		console.log("API classes");

		// TBD: DB hook
		//var url = "/data/games/" + gameId + "/classes.js";
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/classes.js";

		this._getJS(url);

	};

	/**
	 * Retrieve the .js file containing a game's instance definitions
	 */
	APIController.getGameInstances = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/instances.js";

		this._getJS(url);

	};

	/**
	 * Retrieve the .js file containing a game's scripts
	 */
	APIController.getGameScripts = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/scripts.js";

		this._getJS(url);

	};

	/**
	 * After the controller's functions are created, before() and after() methods can be registered with
	 * Locomotive; these will be called before and after particular routes are handled.  '*' is a valid wildcard.
	 */
	 
	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
//	this.parentOf(APIController);
	//ParentController.parentOf(APIController);
	APIController.parentOf(APIController);
		

	APIController.before(['getGame'], function(next) {

		// Add global logic for processing page logic, session info; etc.

		next();
	});
		
module.exports = APIController;
