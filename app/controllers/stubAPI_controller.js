/**
 * DefaultController
 * 
 * Build out this controller to create a web app around the choreo editor.
 */

var StubAPIController = new (require('locomotive').Controller)();
var ParentController = require('./../controller.js');
var i18n = require('../../config/extensions/i18n-namespace');

	/**
	 * Retrieve a game by name, pulling from a directory of static JSON files
	 */
	StubAPIController.getGame = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/contents.json";

		this._requestJSON(url);

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

	};

	/**
	 * Retrieve the .js file containing a game's instance definitions
	 */
	StubAPIController.getGameInstances = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/instances.js";

		this._requestJS(url);

	};

	/**
	 * Retrieve the .js file containing a game's scripts
	 */
	StubAPIController.getGameScripts = function() {

		var gameId = this.param('gameId');

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/scripts.js";

		this._requestJS(url);

	};


	// TBD: move to superclass?

	StubAPIController._requestJSON = function(url) {

		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'GET',
			body: "",
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		var resLocal = this.__res;  // must bind variable directly to __res to maintain correct this pointer context

		// a promise-based call to the data stub URL
		ParentController.__request(requestObj).
			then (
			function(result) { // success
				resLocal.json(result);
			},
			function(result) {   // failure
				resLocal.json({status: "error"});
		});

	};

	StubAPIController._requestJS = function(url) {

		console.log("url = " + url.toString());

		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'GET',
			body: "",
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		var resLocal = this.__res;  // must bind variable directly to __res to maintain correct this pointer context

		// a promise-based call to the data stub URL
		ParentController.__requestRaw(requestObj).
			then (
			function(result) { // success
				console.log("S = " + result.toString());
				resLocal.setHeader('content-type', 'text/javascript');
				resLocal.write(result);
				resLocal.end();
			},
			function(result) {   // failure (silent for now)
				console.log("F = " + result.toString());
				resLocal.setHeader('content-type', 'text/javascript');
				resLocal.write("");
				resLocal.end();
		});

	};

	/**
	 * After the controller's functions are created, before() and after() methods can be registered with
	 * Locomotive; these will be called before and after particular routes are handled.  '*' is a valid wildcard.
	 */
	 
	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
	ParentController.parentOf(StubAPIController);
		

	StubAPIController.before(['getGame'], function(next) {

		// Add global logic for processing page logic, session info; etc.

		next();
	});
		
module.exports = StubAPIController;
