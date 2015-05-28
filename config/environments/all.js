var express = require('express')
,	path = require('path')
,	util = require('util')
,	viewLocale = require('../extensions/view-locale')
,	crypto = require('crypto')
,	i18n = require('../extensions/i18n-namespace');

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
	this.use(express.static(path.join(__dirname, STATIC_CONTENT_FULL_PATH), {maxAge: staticContentMaxAge}));
	this.use(i18n.init); // localization
	this.use(viewLocale(this)); // set up "lambdas" for {{#__}} and {{#localize}} in the markup
	
	//Route requests
	this.use(this.router);

	// hrefLangs contains a list of supported languages; helps with search engine optimization
	// see: https://support.google.com/webmasters/answer/189077?hl=en
	this.hrefLangs = ["fr", "en"];

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