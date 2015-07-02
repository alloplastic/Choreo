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
		var k, kit, i;

		// TBD: DB hook
		var url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/contents.json";

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		var self = this;
		this._requestJSON(url)
			
			.then (
			function(result) { // success

				// some pain on the server so that the client will recieve a complete data blob... while also
				// keeping documents granular for the back end

				var stillWaiting = false;  // flag indicating whether we needed to fire off more requests to fill in the return object

				if (result != null) {
					var scenes = result.scenes;
					if (scenes != null && scenes.length > 0) {
						var kitsNeeded = [];
						for (i=0; i<scenes.length; i++) {
							var scene = scenes[i];
							if (scene != null && scene.kits != null && scene.kits.length > 0) {
								var kits = scene.kits;
								for (k=0; k<kits.length; k++) {
									kit = kits[k];  // this list contains the unique ids of kits
									if (kit != null && self.app.kitCache[kit] == null && kitsNeeded.indexOf(kit) == -1) {
										kitsNeeded.push(kit);
									}
								}
							}
						}
					}

					// after compiling the list of kits we need to cache, fire off requests for each of them
					// individually and wait for all of them to be ready
					if(kitsNeeded.length > 0) {
						
						stillWaiting = true;

						var promises = [];
						for (k=0; k<kitsNeeded.length; k++) {
							var url = "http://" + self.__req.headers.host + "/data/kits/" + kitsNeeded[k] + "/contents.json";
							var p = self._requestJSON(url);
							promises.push(p);
						}
						Q.all(promises)
						.then(function(kitResponses) {
							// chache data for new kits
							for (var r=0; r<kitResponses.length; r++) {
								kit = kitResponses[r];
								// TBD: might need to rethink this once binary files are stored on a separate server; but maybe
								// the API remains the same
								if (kit.icon != null && kit.icon.length>0 && kit.id != null && kit.id.length>0) {
									var imageURL = "http://" + self.__req.headers.host + "/data/kits/" + kit.id + "/" + kit.icon;
									kit.icon = imageURL;
								}
								self.app.kitCache[kit.id] = kit;
							}

							self.addKitDataToGame.call(self, result);
							resLocal.json(result);
							// (call function) to decorate the gameData with _refs from (now complete) caches
						})
						.fail (function(err) {
							console.log("failed to get kit data. - " + err + " - " + err.message);
						});
					}

				}

				if (!stillWaiting) {
					// decorate the gameData with _refs of useful data
					self.addKitDataToGame.call(self, result);
					resLocal.json(result);
				}

			},
			function(result) {   // failure
				resLocal.json({status: "error"});
		});;

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

	/**
	 * Add any kit definitions relevant to a game to obj._refs.kits.
	 */
	StubAPIController.addKitDataToGame = function(gameObj) {

		// we might be duplicating work here, in one code path, but this keeps the function
		// self-contained.

		// find which kits the game references

		var i, kit, k;
		var kitsNeeded = [];

		if (gameObj != null) {
			var scenes = gameObj.scenes;
			if (scenes != null && scenes.length > 0) {
				for (i=0; i<scenes.length; i++) {
					var scene = scenes[i];
					if (scene != null && scene.kits != null && scene.kits.length > 0) {
						var kits = scene.kits;
						for (k=0; k<kits.length; k++) {
							kit = kits[k];  // this list contains the unique ids of kits
							// including check of kitCache to make sure we have data for the kit...
							if (kit != null && this.app.kitCache[kit] != null && kitsNeeded.indexOf(kit) == -1) {
								kitsNeeded.push(kit);
							}
						}
					}
				}
			}
		}

		// add standard _refs tree if it's missing

		if (gameObj._refs == null) gameObj._refs = {};
		if (gameObj._refs.kits == null) gameObj._refs.kits = {};

		// add the kits data
		for (k=0; k<kitsNeeded.length; k++) {
			kit = kitsNeeded[k];
			gameObj._refs.kits[kit] = this.app.kitCache[kit];
		}

	}

	// TBD: move to superclass?

	StubAPIController._requestJSON = function(url) {

		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'GET',
			body: "",
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		//var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		// a promise-based call to the data stub URL
		return ParentController.__request(requestObj);

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

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		// a promise-based call to the data stub URL
		ParentController.__requestRaw(requestObj).
			then (
			function(result) { // success
				resLocal.setHeader('content-type', 'text/javascript');
				resLocal.write(result);
				resLocal.end();
			},
			function(result) {   // failure (silent for now)
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
