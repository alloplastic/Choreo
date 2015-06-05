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
		var gameName = this.param('name');
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameName + ".json";

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
