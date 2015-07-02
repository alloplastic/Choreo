var express = require('express')
,	path = require('path')
,	util = require('util')
,	viewLocale = require('../extensions/view-locale')
,	crypto = require('crypto')
,	i18n = require('../extensions/i18n-namespace'),
	oembed = require('connect-oembed');
	Q = require('q');
//	http = require('http');

//http.globalAgent.maxSockets = 10;

module.exports = function() {
	var FAVICON_FULL_PATH = '/../../app/public/favicon.ico';
	var STATIC_CONTENT_FULL_PATH = '/../../app/public';
	var AES_CIPHER_KEY = 'uMcSqK48Q3yAOYLVkgsk9meMSMv5jgtJyKzsC9c9sKR=';
	var COOKIE_SECRET = 'pBPagG3gUX2y9mhsGu08QKfaomeufCrIkiUGHr5hUtg=';
	var SESSION_SECRET = 'kIaP2a3J9flzssByDc8SsiNUeV80bDa5I4pTzbqaFHI=';
	
	var env = process.env.NODE_ENV || 'development';
	var staticContentMaxAge = getStaticContentMaxAge(env);
	
	if (this.version !== require('locomotive').version) {
		console.warn(util.format('error: local (%s) and global (%s) Locomotive modules do not match', require('locomotive').version, this.version));
	}

	this.apiRoot = "/stubAPI/";
	this.fileRoot = "/";
	
	// cache to minimize the number of asynchronous requests for individual kits
	this.kitCache = {};

	this.cipher = crypto.createCipher('aes-256-cbc', AES_CIPHER_KEY);
	this.decipher = crypto.createDecipher('aes-256-cbc', AES_CIPHER_KEY);

	// Path for images
	this.imgPathMobile = "/img/mobile";
	this.imgPathX1     = "/img/x1";
	this.imgPathX2     = "/img/x2";

	this.use(express.logger());
	this.use(express.cookieParser(COOKIE_SECRET));
	this.use(express.session({secret: SESSION_SECRET}));
	this.use(express.bodyParser());
	this.use(express.methodOverride());  // Emulate full REST capabilities (GET, POST, PUT & DELETE) via a hidden form field named _method
	this.use(express.compress());
	this.use(express.favicon(path.join(__dirname, FAVICON_FULL_PATH), {maxAge: staticContentMaxAge}));
	this.use(express.static(path.join(__dirname, STATIC_CONTENT_FULL_PATH)));
//	this.use(express.static(path.join(__dirname, STATIC_CONTENT_FULL_PATH), {maxAge: staticContentMaxAge}));
	this.use(i18n.init); // localization
	this.use(viewLocale(this)); // set up "lambdas" for {{#__}} and {{#localize}} in the markup
	
	// oembed support for the player
	this.use('/oembed', oembed(function(req, res, next) {

		// check to see if our 'player' endpoint has been called and extract the id of a game	 
		var urlRegEx = /^http:\/\/choreo\.co\/player\/([a-zA-Z0-9_]+)/;
		var matched = urlRegEx.exec(req.oembed.url);
		if (matched != null) {
			var gameId = matched[1];
			if (gameId == null || gameId == "") gameId = "No game parameter specified.";

			var options = {
				"title": "Choreo Game",
//				"author_name": "Bees",
//				"author_url": "http://www.flickr.com/photos/bees/",
				"provider_name": "Choreo",
				"provider_url": "http://www.choreo.co"
			};

			res.oembed.rich(
				"<p>" + gameId + "</p>", // html -- TBD: serve the real fragment
				200,  // width 
				100,  // height
				options);
		}
		else
			next();
		}));

	//Route requests
	this.use(this.router);
	this.use(express.errorHandler());  // must be last middleware in chain

	// hrefLangs contains a list of supported languages; helps with search engine optimization
	// see: https://support.google.com/webmasters/answer/189077?hl=en
	this.hrefLangs = ["fr", "en"];

	// TBD: okay to kick off queries right away to prepopulate a cache?

};

/**
 * Different refresh times depending on type of session
 */
function getStaticContentMaxAge(env){
	var result;
	switch(env){
		case 'development':
			result = 0; // always refresh
			break;
		case 'production':
		case 'integration':
		case 'staging':
		default:
			result = 43200000;  // 12 hours
			break;
	}
	return result;
}