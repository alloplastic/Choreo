/**
 * Parent controller, from which all other controllers are extended.
 * Adds before() and after() to all controllers.  Instantiates this.page.
 * Can be customized to perform user authentication.
 * 
 */

var locomotive = require('locomotive');
var ParentController = locomotive.Controller;
var i18n = require('../config/extensions/i18n-namespace');
var Q = require('q');
var request = require("request");

//Begin Parent Controller
	ParentController.parentOf = function(AppController, requireLoggedIn, requireNotLoggedIn){		
		// call beforeAll and afterAll
		AppController.before('*', ParentController.beforeAll);

		AppController.after('*', ParentController.afterAll);

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
	
	ParentController.beforeAll = function(next) {

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

		this.langLinks = ParentController.__getLangUrls(this.__req, this.app.hrefLangs);
		this.language = i18n.getLocale(this.__req);
		this.selectedLanguage = {};
		this.selectedLanguage[this.language] = true;
		
		ParentController.__processPage.call(this);

		next();
	};

	ParentController.afterAll = function(err, req, res, next) {
		next();
	};


/**
 * Generate urls for different language versions based on current page url
 * @private
 */
ParentController.__getLangUrls = function(request, hrefLangs) {
	
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
ParentController.__processPage = function() {
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
	ParentController.__addNoCacheHeaders = function() {
		// disable caching for content files
		this.__res.header("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
		this.__res.header("Expires", -1);
		this.__res.header("Pragma", "no-cache");
	};

	/**
	 * Promise-based request
	 */
	ParentController.__request = function(requestObj) {
 
		var deferred = Q.defer();
		
		request(requestObj, function(err, res, body) {

			var statusCode = (typeof res!=='undefined' && typeof res.statusCode !=='undefined') ? res.statusCode : "";

			if (typeof body !== 'undefined' && !err) {
				//Parse result into JSON
				var result = JSON.parse(body);				
				deferred.resolve(result);
			} else {
				deferred.reject({status: "error"});
			}
		});
		
		return deferred.promise;
	};
	
module.exports = ParentController;