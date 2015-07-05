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
		var self = this;

		// TBD: DB hook
		url = "http://" + this.__req.headers.host + "/data/games/" + gameId + "/contents.json";

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		this._requestJSON(url)
			
			.then (
			function(result) { // success

				// some pain on the server so that the client will recieve a complete data blob... while also
				// keeping documents granular for the back end

				var stillWaiting = self.getKitsForGame.call(self, result, resLocal);

				if (!stillWaiting) {

					// decorate the gameData with _refs of useful data
					self.addKitDataToGame.call(self, result);

					// even though we have all of the kits cached, we may still need to retrieve some of the
					// 'entity types' used by these kits
					var waitLonger = self.getEntityTypesForGame.call(self, result, resLocal);

					if (!waitLonger) {  // all entity types are already cached; send response
						self.addEntityTypeDataToGame.call(self, result);  //
						resLocal.json(result);
					}
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
	 * Add any kit definitions relevant to a game's scenes; returns false if no kits need to be
	 * retrieved from the db, true if they do.
	 * @method
	 */
	StubAPIController.getKitsForGame = function(result, resLocal) {

		var k, kit, kitId, i, r, url;
		var self = this;

		if (result != null) {

			var kitsNeeded = [];

			var scenes = result.scenes;
			if (scenes != null && scenes.length > 0) {
				for (i=0; i<scenes.length; i++) {
					var scene = scenes[i];
					if (scene != null && scene.kits != null && scene.kits.length > 0) {
						var kits = scene.kits;
						for (k=0; k<kits.length; k++) {
							kitId = kits[k];  // this list contains the unique ids of kits
							if (kitId != null && this.app.kitCache[kitId] == null && kitsNeeded.indexOf(kitId) == -1) {
								kitsNeeded.push(kitId);
							}
						}
					}
				}
			}

			if (kitsNeeded.length <= 0) return false;   // let calling code know there's no need to wait; we have all of the data

			// after compiling the list of kits we need to cache, fire off requests for each of them
			// individually and wait for all of them to be ready
				
			var promises = [];
			for (k=0; k<kitsNeeded.length; k++) {
				var url = "http://" + this.__req.headers.host + "/data/kits/" + kitsNeeded[k] + "/contents.json";
				var p = this._requestJSON(url);
				promises.push(p);
			}
			Q.all(promises)
			.then(function(kitResponses) {
				// chache data for new kits
				for (r=0; r<kitResponses.length; r++) {
					kit = kitResponses[r];
					// TBD: might need to rethink this once binary files are stored on a separate server; but maybe
					// the API remains the same
					if (kit.icon != null && kit.icon.length>0 && kit.id != null && kit.id.length>0) {
						url = "http://" + self.__req.headers.host + "/data/kits/" + kit.id + "/" + kit.icon;
						kit.icon = url;
					}
					self.app.kitCache[kit.id] = kit;
				}

				self.addKitDataToGame.call(self, result);

				// now that we have all of the kits, we need to retrieve all of the 'entity types' used by these kits
				var waitLonger = self.getEntityTypesForGame.call(self, result, resLocal);
				if (!waitLonger) {  // data is already cached; we can send a response
					self.addEntityTypeDataToGame.call(self, result);
					resLocal.json(result);
				}

			})
			.fail (function(err) {
				console.log("failed to get kit data. - " + err + " - " + err.message);
			});

		}

		// let calling code know to let the above promise handle the response
		return true;

	};

	/**
	 * Add any kit definitions relevant to a game to obj._refs.kits.
	 */
	StubAPIController.addKitDataToGame = function(gameObj) {

		// we might be duplicating work here, in one code path, but this keeps the function
		// self-contained.

		// find which kits the game references

		var i, kitId, k;
		var kitsNeeded = [];

		if (gameObj != null) {
			var scenes = gameObj.scenes;
			if (scenes != null && scenes.length > 0) {
				for (i=0; i<scenes.length; i++) {
					var scene = scenes[i];
					if (scene != null && scene.kits != null && scene.kits.length > 0) {
						var kits = scene.kits;
						for (k=0; k<kits.length; k++) {
							kitId = kits[k];  // this list contains the unique ids of kits
							// including check of kitCache to make sure we have data for the kit...
							if (kitId != null && this.app.kitCache[kitId] != null && kitsNeeded.indexOf(kitId) == -1) {
								kitsNeeded.push(kitId);
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
			kitId = kitsNeeded[k];
			gameObj._refs.kits[kitId] = this.app.kitCache[kitId];
		}

	};

	/**
	 * Add any entity type definitions relevant to a game's kits; returns false if no entities need to be
	 * retrieved from the db, true if they do.
	 * @method
	 */
	StubAPIController.getEntityTypesForGame = function(result, resLocal) {

		var kit, kitId, i, r, url;
		var self = this;

		var entityTypesNeeded = [];

		for (kitId in result._refs.kits) {
			kit = result._refs.kits[kitId];
			for (i=0; i<kit.entityTypes.length; i++) {
				var entityId = kit.entityTypes[i];
				if (entityId != null && this.app.entityTypeCache[entityId] == null && entityTypesNeeded.indexOf(entityId) == -1) {
					entityTypesNeeded.push(entityId);
				}
			}
		}

		if (entityTypesNeeded.length<=0) return false;   // let calling code know there's no need to wait; we have all of the data

		var promises = [];
		for (i=0; i<entityTypesNeeded.length; i++) {
			url = "http://" + this.__req.headers.host + "/data/entityTypes/" + entityTypesNeeded[i] + "/contents.json";
			var p = this._requestJSON(url);
			promises.push(p);								
		}

		Q.all(promises)
		.then(function(entityTypeResponses) {
			// chache data for new entity types
			for (r=0; r<entityTypeResponses.length; r++) {
				var entityType = entityTypeResponses[r];
				if (entityType.icon != null && entityType.icon.length>0 && entityType.id != null && entityType.id.length>0) {
					url = "http://" + self.__req.headers.host + "/data/entityTypes/" + entityType.id + "/" + entityType.icon;
					entityType.icon = url;
				}
				self.app.entityTypeCache[entityType.id] = entityType;
			}

			// call function to decorate the gameData with _refs from (now complete) caches								
			self.addEntityTypeDataToGame.call(self, result);
			resLocal.json(result);
		})
		.fail (function(err) {
			console.log("failed to get entity type data. - " + err + " - " + err.message);
		});

		return true;  // let calling code know to let the above promise handle the response
	};

	/**
	 * Add any kit definitions relevant to a game to obj._refs.kits.
	 */
	StubAPIController.addEntityTypeDataToGame = function(gameObj) {

		// we might be duplicating work here, in one code path, but this keeps the function
		// self-contained.

		// find which entity types the game references

		var i, kit, kitId, k, e, entityTypeId;
		var entityTypesNeeded = [];

		if (gameObj != null) {
			var scenes = gameObj.scenes;
			if (scenes != null && scenes.length > 0) {
				for (i=0; i<scenes.length; i++) {
					var scene = scenes[i];
					if (scene != null && scene.kits != null && scene.kits.length > 0) {
						var kits = scene.kits;
						for (k=0; k<kits.length; k++) {
							kitId = kits[k];  // this list contains the unique ids of kits
							kit = this.app.kitCache[kitId];
							for (e=0; e<kit.entityTypes.length; e++) {
								entityTypeId = kit.entityTypes[e]								
								// including check of entityTypeCache to make sure we have data...
								if (entityTypeId != null && this.app.entityTypeCache[entityTypeId] != null && entityTypesNeeded.indexOf(entityTypeId) == -1) {
									entityTypesNeeded.push(entityTypeId);
								}
							}
						}
					}
				}
			}
		}

		// add standard _refs tree if it's missing

		if (gameObj._refs == null) gameObj._refs = {};
		if (gameObj._refs.entityTypes == null) gameObj._refs.entityTypes = {};

		// add the kits data
		for (i=0; i<entityTypesNeeded.length; i++) {
			entityTypeId = entityTypesNeeded[i];
			gameObj._refs.entityTypes[entityTypeId] = this.app.entityTypeCache[entityTypeId];
		}

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
