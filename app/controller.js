/**
 * Parent controller, from which all other controllers are extended.
 * Adds before() and after() to all controllers.  Instantiates this.page.
 * Can be customized to perform user authentication.
 * 
 */

var locomotive = require('locomotive');

// var ParentController = function() {};
// ParentController.prototype = locomotive.Controller.prototype;

// TBD: doesn't quite feel right to use straight assignment to essentially rename and decorate
// locomotive.Controller, rather than finding the right way to subclass.

var ParentController = locomotive.Controller;
var i18n = require('../config/extensions/i18n-namespace');
var Q = require('q');
var request = require("request");



	ParentController.prototype._error = function(res, message, info) {
		console.log(message);
		res.json({status: "error", message: message, info: info});
	};

	ParentController.prototype.beforeAll = function(next) {

		// TBD: This is the place to check whether the current user is logged in and/or
		//      authenticated for this page -- and set "this.loggedIn" appropriately.
		//      This state could also be stored in this.__req.session or, more permanently,
		//      in a cookie or session database.
		
		// pass page parameters to view
		pageName = (this.__req._locomotive.controller.toLowerCase()).replace("controller","") + '-' + this.__req._locomotive.action;
		this.page = {
				name : pageName,
				title : pageName + '_title',
				description : pageName + '_description'
		};
		this.selectedPage = {};
		this.selectedPage[pageName] = true;
		this.__req.session.previousPageName = pageName;

		var protocol = this.__req.socket.encrypted ? 'https' : 'http';

		// pass in current language

		langFromUrl = this.params('lang');
		if (this.app.hrefLangs.indexOf(langFromUrl) !== -1) {
			this.__req.locale = langFromUrl;
		}

		this.langLinks = this.__getLangUrls(this.__req, this.app.hrefLangs);
//		this.langLinks = ParentController.__getLangUrls(this.__req, this.app.hrefLangs);
		this.language = i18n.getLocale(this.__req);
		this.selectedLanguage = {};
		this.selectedLanguage[this.language] = true;
		
		this.__processPage.call(this);
//		ParentController.__processPage.call(this);

		next();
	};

	ParentController.prototype.afterAll = function(err, req, res, next) {
		next();
	};

	ParentController.prototype.parentOf = function(AppController, requireLoggedIn, requireNotLoggedIn){	

		// pass on request state; TBD: any way to "inherit" off of locomotive.Controller?
		//this.__req = AppController.__req;
		//this.__res = AppController.__res;

		// call beforeAll and afterAll; TBD: needed now that ParentController is instanced?

		// AppController.before('*', this.beforeAll);
		// AppController.after('*', this.afterAll);

		// original
		//AppController.before('*', ParentController.beforeAll);
		//AppController.after('*', ParentController.afterAll);

		// This code provides hooks to calling code that might want to redirect the app based
		// on user authentication.  The exact means of authentication and integrations with 
		// the Cumulus skeleton is application-specific.

		if (typeof requireLoggedIn !== 'undefined') {
			AppController.before('*', function(next) {
				if(requireLoggedIn[this.__req._locomotive.action] && !this.loggedIn) {
					this.redirect("/unauthorized");   // TBD: implement this route and view
				}
				next();
			});			
		}
		if (typeof requireNotLoggedIn !== 'undefined') {
			AppController.before('*', function(next) {
				if(requireNotLoggedIn[this.__req._locomotive.action] && this.loggedIn) {
					this.redirect("/publicOnly");   // TBD: implement this route and view
				}
				next();
			});			
		}
	};

/**
 * Generate urls for different language versions based on current page url
 * @private
 */
ParentController.prototype.__getLangUrls = function(request, hrefLangs) {
	
	var template  = null;
	var tmpLang   = null;
	var pattern   = null;
	var langLinks = [];
	var originalUrl = request.originalUrl;

	for (var i = 0; i < hrefLangs.length; i++) {
		var tmpLang  = hrefLangs[i];
		// urls like: /en/any-level/page.html
		if (originalUrl.indexOf('/' + tmpLang + '/') !== -1) {
			pattern = originalUrl.replace('/' + tmpLang + '/', '/{lang}/');
			continue;
		}
		// urls like: /en, /
		else if (originalUrl === '/' || originalUrl.indexOf('/' + tmpLang) === 0) {
			pattern = '/{lang}';
			continue;
		}
	}

	if (pattern) {
		for (var i = 0; i < hrefLangs.length; i++) {
			var tmpLangLink = {};
			tmpLangLink.lang = hrefLangs[i];
			tmpLangLink.href = 'http://' + request.headers['host'] + pattern.replace('{lang}', tmpLangLink.lang);
			if (tmpLangLink.lang == request.locale) {
				tmpLangLink.current = true;
			}
			langLinks.push(tmpLangLink);
		}
	}
	return langLinks;
};

/**
 * Adds helper functions to the controller for checking for errors.
 * @private
 */
ParentController.prototype.__processPage = function() {
	var self = this;
	var template = function(code) {
		return function () {
			return function (text, render) {
				if (self.__res.statusCode == code) {
					return render ? render(text) : text;
				}
				return "";
			};
		}
	};

	self.is404 = template(404);
	self.is500 = template(500);
};

    /**
     * Utility function to prepare no cache headers; TBD: move to a utils module?
     */
    ParentController.prototype.__addNoCacheHeaders = function() {
        // disable caching for content files
        this.__res.header("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
        this.__res.header("Expires", -1);
        this.__res.header("Pragma", "no-cache");
    };
	
	/**
	 * Promise-based request
	 */
	ParentController.prototype.__request = function(requestObj) {
 
		var deferred = Q.defer();

		deferred.promise.timeout(30000, "ERROR - ParentController.__request() - " + requestObj.url + " timed out after 30000 ms.");

		request(requestObj, function(err, res, body) {

			var statusCode = (typeof res!=='undefined' && typeof res.statusCode !=='undefined') ? res.statusCode : "";

			if (typeof body !== 'undefined' && !err) {
				if (body == null || body.length < 1) body = {};
				//Parse result into JSON
				console.log("req:\n\n" + JSON.stringify(body));
				var result = JSON.parse(body);	
				deferred.resolve(result);
			} else {
				deferred.reject({status: "error"});
			}
		});
		
		return deferred.promise;
	};

	/**
	 * Promise-based request
	 */
	ParentController.prototype.__requestRaw = function(requestObj) {
 
		var deferred = Q.defer();
		
		deferred.promise.timeout(30000, "ERROR - ParentController.__requestRaw() - " + requestObj.url + " timed out after 30000 ms.");

		request(requestObj, function(err, res, body) {

			var statusCode = (typeof res!=='undefined' && typeof res.statusCode !=='undefined') ? res.statusCode : "";

//			console.log("code = " + statusCode + "\nerr = " + err + "\nbody = " + body);

			// success on 2xx and 3xx HTTP responses
			if (statusCode && statusCode < 400) {
				deferred.resolve(body);
			} else {
				deferred.reject("");
			}
		});
		
		return deferred.promise;
	};

	// TBD: seems like a ton of code to have every controller inherit, but needed to share this somewhere.

		/**
	 * Top-level entrypoint for logic that determines if any new metadata needs to be retrieved for a
	 * given game.  Once all of the data is cached in this Node instance, a response is sent, with
	 * all of the metadata attached to the game object under the "_refs" property.
	 *
	 * some pain on the server so that the client will recieve a complete data blob... while also
	 * keeping documents granular for the back end.

	 * @method
	 */
	ParentController.prototype.addMetadataToGameResponse = function(result, resLocal) {
		this.getKitsForGame(result, resLocal);  // first data type in an interdependent series of records that need to be retrieved
//		ParentController.getKitsForGame(result, resLocal);  // first data type in an interdependent series of records that need to be retrieved
	};

	/**
	 * Add any kit definitions relevant to a game's scenes; returns false if no kits need to be
	 * retrieved from the db, true if they do.
	 * @method
	 */
	ParentController.prototype.getKitsForGame = function(result, resLocal) {

		var k, kit, kitId, i, r, url;
		var self = this;

		try {

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
//								if (kitId != null && ParentController.app.kitCache[kitId] == null && kitsNeeded.indexOf(kitId) == -1) {
								if (kitId != null && this.app.kitCache[kitId] == null && kitsNeeded.indexOf(kitId) == -1) {
									kitsNeeded.push(kitId);
								}
							}
						}
					}
				}

				if (kitsNeeded.length <= 0) {

					this.addKitDataToGame(result);
//					ParentController.addKitDataToGame(result);

					// now that we have all of the kits, we need to retrieve all of the 'entity types' used by these kits
					var waitLonger = self.getEntityTypesForGame.call(self, result, resLocal);
					if (!waitLonger) {  // data is already cached; we can send a response
						self.addEntityTypeDataToGame.call(self, result);
						resLocal.json(result);
					}

					return waitLonger;   // let calling code know there's no need to wait; we have all of the data
				
				}

				// after compiling the list of kits we need to cache, fire off requests for each of them
				// individually and wait for all of them to be ready
					
				var promises = [];
				for (k=0; k<kitsNeeded.length; k++) {
					// TBD: branch here based on hostEnvironment=web to call into the database.
					var url = "http://" + this.__req.headers.host + "/data/kits/" + kitsNeeded[k] + "/contents.json";
					var p = this._getJSON(url);
					p.timeout(30000, "ERROR - Kit request for " + kitsNeeded[k] + " timed out after 30000 ms.");
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
							// TBD: branch here based on hostEnvironment=web to call into the database.
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
					console.log("ERROR - failed to get kit data. - " + err + " - " + err.message);
				});

			}

		} catch (e) {
			console.log("ERROR - getKitsForGame() - " + e.message);
			resLocal.json({status: "error", f: "getKitsForGame", message: e.message, data: result});
		}


		// let calling code know to let the above promise handle the response
		return true;

	};

	/**
	 * Add any kit definitions relevant to a game to obj._refs.kits.
	 */
	ParentController.prototype.addKitDataToGame = function(gameObj) {

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
	ParentController.prototype.getEntityTypesForGame = function(result, resLocal) {

		var kit, kitId, i, r, url;
		var self = this;

		var entityTypesNeeded = [];

		try {

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
				// TBD: branch here based on hostEnvironment=web to call into the database.
				url = "http://" + this.__req.headers.host + "/data/entityTypes/" + entityTypesNeeded[i] + "/contents.json";
				var p = this._getJSON(url);
				p.timeout(30000, "ERROR - Entity Type request for " + entityTypesNeeded[i] + " timed out after 30000 ms.");
				promises.push(p);								
			}

			Q.all(promises)
			.then(function(entityTypeResponses) {
				// chache data for new entity types
				for (r=0; r<entityTypeResponses.length; r++) {
					var entityType = entityTypeResponses[r];
					if (entityType.icon != null && entityType.icon.length>0 && entityType.id != null && entityType.id.length>0) {
						// TBD: branch here based on hostEnvironment=web to call into the database.
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
				console.log("ERROR - failed to get entity type data. - " + err + " - " + err.message);
			});

		} catch (e) {
			console.log("ERROR - getEntityTypes() - " + e.message);
			resLocal.json({status: "error", message: e.message, data: result});
		}

		return true;  // let calling code know to let the above promise handle the response
	};

	/**
	 * Add any kit definitions relevant to a game to obj._refs.kits.
	 */
	ParentController.prototype.addEntityTypeDataToGame = function(gameObj) {

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

	// ParentController.prototype._getJSON = function(url) {

	// 	// construct a "request" object to pass to Request.js
	// 	var requestObj = {
	// 		uri: url,
	// 		method: 'GET',
	// 		body: "",
	// 		headers: {"Content-Type": "application/x-www-form-urlencoded"}
	// 	};

	// 	var resLocal = this.__res;  // must bind variable directly to __res to maintain correct this pointer context

	// 	// a promise-based call to the data stub URL
	// 	this.__request(requestObj).
	// 		then (
	// 		function(result) { // success
	// 			resLocal.json(result);
	// 		},
	// 		function(result) {   // failure
	// 			resLocal.json({status: "error"});
	// 	});

	// };

	ParentController.prototype._getJSON = function(url) {

		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'GET',
			body: "",
//			headers: {"Content-Type": "application/json"}
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		// a promise-based call to the data stub URL
		return this.__request(requestObj);

	};

	ParentController.prototype._putJSON = function(url, content) {

		try {
		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'PUT',
//			json: true,
//			body: content,
			body: JSON.stringify(content),
			headers: {"Content-Type": "application/json"}
//			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		// a promise-based call to the data stub URL
		return this.__request(requestObj);

		} catch (e) {
			resLocal.json({status: "error", message: e.message});
		}

	};

	ParentController.prototype._getJS = function(url) {

//		console.log("requesting js url = " + url.toString());

		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'GET',
			body: "",
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		var resLocal = this.__res;  // must bind variable directly to __res to maintain this pointer context

		// a promise-based call to the data stub URL
//		ParentController.__requestRaw(requestObj).
		this.__requestRaw(requestObj).
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

	ParentController.prototype._getRaw = function(url) {

		// construct a "request" object to pass to Request.js
		var requestObj = {
			uri: url,
			method: 'GET',
			body: "",
			headers: {"Content-Type": "application/x-www-form-urlencoded"}
		};

		return this.__request(requestObj);

	};

	
module.exports = ParentController;