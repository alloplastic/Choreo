/**
 * derived from https://github.com/?/i18n-node
 * 
 */

// dependencies and "private" vars
var	vsprintf = require('sprintf').vsprintf
,	fs = require('fs')
,	qfs = require('q-io/fs')
,	url = require('url')
,	path = require('path')
,	debug = require('debug')('i18n:debug')
,	warn = require('debug')('i18n:warn')
,	error = require('debug')('i18n:error')
,	locales = {}
,	api = [ '__', '__n', 'getLocale','setLocale', 'getCatalog' ]
,	defaultLocale
,	updateFiles
,	cookiename
,	extension
,	directory
,	indent;

// public exports
var i18n = exports;

i18n.version = '0.1';

i18n.configure = function i18nConfigure(opt) {
	// you may register helpers in global scope, up to you
	if (typeof opt.register === 'object') {
		applyAPItoObject(opt.register);
	}

	// sets a custom cookie name to parse locale settings from
	cookiename = (typeof opt.cookie === 'string') ? opt.cookie : null;

	// where the locale subdirectories reside
	directory = (typeof opt.directory === 'string') ? opt.directory : path.join(__dirname, 'locales');

	// write new locale information to disk
	updateFiles = (typeof opt.updateFiles === 'boolean') ? opt.updateFiles : true;

	// what to use as the indentation unit (ex: "\t", "  ")
	indent = (typeof opt.indent === 'string') ? opt.indent : "\t";

	//Extension for the locale files
	extension = (typeof opt.extension === 'string') ? opt.extension : 'json';

	// setting defaultLocale
	defaultLocale = (typeof opt.defaultLocale === 'string') ? opt.defaultLocale : 'en';

	// setting default namespace directory when none is supplied
	defaultnamespace = (typeof opt.namespace === 'string') ? opt.namespace : 'default';

	// implicitly read all locales
	if (typeof opt.locales === 'object') {
		opt.locales.forEach(function(locale) {
			readAll(locale);
		});
	}
};

i18n.init = function i18nInit(request, response, next) {
	if (typeof request === 'object' && typeof response === 'object') {
		guessLanguage(request);
		
		applyAPItoObject(request, response);

		// register locale to res.locals so hbs helpers know this.locale
		if (!response.locale){
			response.locale = request.locale;
		}

		if (response.locals) {
			applyAPItoObject(request, response.locals);

			// register locale to res.locals so hbs helpers know this.locale
			if (!response.locals.locale){
				response.locals.locale = request.locale;
			}
		}
	}

	if (typeof next === 'function') {
		next();
	}
};

/**
 * 
 * @param phrase is either a string, or an object like this: {phrase: "Hello", locale: "en", namespace: "homepage"}
 * 			note that locale and/or namespace can be omitted 
 * 			
 * 
 */
i18n.__ = function i18nTranslate(phrase) {
	var msg = '';
	
	// called like __({phrase: "Hello", locale: "en"})
	if (typeof phrase === 'object' && typeof phrase.phrase === 'string') {
		var locale = defaultLocale;
		var namespace = defaultnamespace;
		
		if (typeof phrase.locale === 'string') {
			locale = phrase.locale;
		}
		if (typeof phrase.namespace === 'string') {
			namespace = phrase.namespace;
		}

		msg = translate(locale, namespace, phrase.phrase);
	} else {
		// get translated message with locale from scope (deprecated) or object
		//TODO: getnamespaceFromObject(this);
		msg = translate(getLocaleFromObject(this), defaultnamespace, phrase);
	}

	// if we have extra arguments with strings to get replaced an additional substitution injects those strings afterwards
	if (arguments.length > 1) {
		msg = vsprintf(msg, Array.prototype.slice.call(arguments, 1));
	}
		
	return msg;
};

i18n.__n = function i18nTranslatePlural(singular, plural, count) {
	var msg = '';

	// called like __n({singular: "%s cat", plural: "%s cats", locale: "en"}, 3)
	if (typeof singular === 'object') {
		if (typeof singular.locale === 'string'
				&& typeof singular.singular === 'string'
				&& typeof singular.plural === 'string') {
			msg = translate(singular.locale, singular.singular, singular.plural);
		}
		if (typeof plural === 'number') {
			count = plural;
		}

		// called like __n({singular: "%s cat", plural: "%s cats", locale: "en", count: 3})
		if (typeof singular.count === 'number'
				|| typeof singular.count === 'string') {
			count = singular.count;
		}
	}
	// called like __n('%s cat', '%s cats', 3)
	else {
		// get translated message with locale from scope (deprecated) or object
		msg = translate(getLocaleFromObject(this), singular, plural);
	}
	// parse translation and replace all digets '%d' by `count`
	// this also replaces extra strings '%%s' to parseble '%s' for next step
	// simplest 2 form implementation of plural, like https://developer.mozilla.org/en/docs/Localization_and_Plurals#Plural_rule_.231_.282_forms.29
	if (parseInt(count, 10) > 1) {
		msg = vsprintf(msg.other, [ count ]);
	} else {
		msg = vsprintf(msg.one, [ count ]);
	}

	// if we have extra arguments with strings to get replaced,
	// an additional substition injects those strings afterwards
	if (arguments.length > 3) {
		msg = vsprintf(msg, Array.prototype.slice.call(arguments, 3));
	}

	return msg;
};

i18n.setLocale = function i18nSetLocale(locale_or_request, locale) {
	var target_locale = locale_or_request
	,	request = null;

	// called like setLocale(req, 'en')
	if (locale_or_request && typeof locale === 'string' && locales[locale]) {
		request = locale_or_request;
		target_locale = locale;
	}

	// called like req.setLocale('en')
	if (locale === undefined && typeof this.locale === 'string' && typeof locale_or_request === 'string') {
		request = this;
		target_locale = locale_or_request;
	}

	if (locales[target_locale]) {

		// called like setLocale('en')
		if (request === undefined) {
			defaultLocale = target_locale;
		} else {
			request.locale = target_locale;
		}
	}
	return i18n.getLocale(request);
};

/**
 * 
 * @param request not compulsory. Will get locale from this object otherwise.
 */
i18n.getLocale = function i18nGetLocale(request) {
	// called like req.getLocale()
	if (request === undefined && typeof this.locale === 'string') {
		return this.locale;
	}
	
	// called like getLocale(req)
	if (request && request.locale) {
		return request.locale;
	}

	// called like getLocale()
	return defaultLocale;
};

i18n.getCatalog = function i18nGetCatalog(locale_or_request, locale) {
	var target_locale = locale_or_request;

	// called like getCatalog(req)
	if (typeof locale_or_request === 'object'
			&& typeof locale_or_request.locale === 'string') {
		target_locale = locale_or_request.locale;
	}

	// called like getCatalog(req, 'en')
	if (typeof locale_or_request === 'object' && typeof locale === 'string') {
		target_locale = locale;
	}

	// called like req.getCatalog()
	if (locale === undefined && typeof this.locale === 'string') {
		target_locale = this.locale;
	}

	// called like req.getCatalog('en')
	if (locale === undefined && typeof locale_or_request === 'string') {
		target_locale = locale_or_request;
	}

	// called like getCatalog()
	if (target_locale === undefined || target_locale === '') {
		return locales;
	}

	if (locales[target_locale]) {
		return locales[target_locale];
	} else {
		logWarn('No catalog found for "' + target_locale + '"');
		return false;
	}
};

i18n.overrideLocaleFromQuery = function(req) {
	if (req === null) {
		return;
	}
	var urlObj = url.parse(req.url, true);
	if (urlObj.query.locale) {
		logDebug("Overriding locale from query: " + urlObj.query.locale);
		i18n.setLocale(req, urlObj.query.locale.toLowerCase());
	}
};

//Unexposed functions

/**
 * registers all public API methods to a given response object when not already declared
 */

function applyAPItoObject(request, response) {

	// attach to itself if not provided
	var object = response || request;
	api.forEach(function(method) {

		// be kind rewind, or better not touch anything already exiting
		if (!object[method]) {
			object[method] = function() {
				return i18n[method].apply(request, arguments);
			};
		}
	});
}

/**
 * guess language setting based on http headers
 */

function guessLanguage(request) {
	if (typeof request === 'object') {
		var language_header = request.headers['accept-language'],
		languages = [],
		regions = [];
		
		request.languages = [ defaultLocale ];
		request.regions = [ defaultLocale ];
		request.language = defaultLocale;
		request.region = defaultLocale;

		if (language_header) {
			language_header.split(',').forEach(function(l) {
				var header = l.split(';', 1)[0], lr = header.split('-', 2);
				if (lr[0]) {
					languages.push(lr[0].toLowerCase());
				}
				if (lr[1]) {
					regions.push(lr[1].toLowerCase());
				}
			});

			if (languages.length > 0) {
				request.languages = languages;
				request.language = languages[0];
			}

			if (regions.length > 0) {
				request.regions = regions;
				request.region = regions[0];
			}
		}

		// setting the language by cookie
		if (cookiename && request.cookies && request.cookies[cookiename]) {
			request.language = request.cookies[cookiename];
		}
		i18n.setLocale(request, request.language);
	}
}

/**
 * searches for locale in given object
 */
function getLocaleFromObject(obj) {
	var locale = undefined;
	
	if (obj && obj.scope) {
		locale = obj.scope.locale;
	}
	if (obj && obj.locale) {
		locale = obj.locale;
	}
	
	return locale;
}

/**
 * read locale file, translate a msg and write to fs if new
 */

function translate(locale, namespace, singular, plural) {
	if (namespace === undefined || namespace === null || namespace === '') {
		namespace = defaultnamespace;
	}
	
	if (locale === undefined) {
		logWarn("WARN: No locale found - check the context of the call to __(). Using "
				+ defaultLocale + " as current locale "
				+ " in namespace: " + namespace);
		locale = defaultLocale;
	}

	// attempt to read when defined as valid locale
	//TODO: wth
	if (!locales[locale] || !locales[locale][namespace]) {
		read(locale, namespace);
	}

	// fallback to default when missed
	if (!locales[locale]) {
		logWarn("WARN: Locale "
				+ locale
				+ " couldn't be read - check the context of the call to $__. Using "
				+ defaultLocale + " (default) as current locale"
				+ " in namespace: " + namespace);
		locale = defaultLocale;
		namespace = defaultnamespace;
		read(locale, namespace);
	}
	
	if (plural) {
		if (!locales[locale][namespace][singular]) {
			locales[locale][namespace][singular] = {
				'one' : singular,
				'other' : plural
			};
			if (updateFiles !== false) {
				write(locale, namespace);
			}
		}
	}

	
	if (!locales[locale][namespace][singular]) {
		locales[locale][namespace][singular] = singular;

		if (updateFiles !== false) {
			write(locale, namespace);
		}
	}
	return locales[locale][namespace][singular];
}


/**
 * Returns an array of namespaces parsed from namespace filesnames
 * @param namespaceFiles
 * @returns array
 */
function getNameSpaces(namespaceFiles){
	var result = [];
	
	namespaceFiles.forEach(function(namespaceFile){
		if(!(namespaceFile.indexOf('.tmp') >= 0)){
			result.push(namespaceFile.replace('.'+extension, ''));
		}
	});
	
	return result;
}

/**
 * Read all namspace files in a locale subdirectory
 * @param locale
 */
function readAll(locale){
	var namespacePath = getStorageLocalePath(locale);
	
	return qfs.list(namespacePath)
	.then(function(namespacesFiles){
		
		getNameSpaces(namespacesFiles).map(function(namespace){
			read(locale, namespace);
		})
	});
}

/**
 * Read a locale/namespace file
 */
function read(locale, namespace) {
	var localeFile = {}
	, file = getStorageFilePath(locale, namespace);
	
	try {
		logDebug('read ' + file + ' for locale: ' + locale + ' with namespace ' + namespace);
		localeFile = fs.readFileSync(file);
		try {
			// parsing filecontents to locales[locale]
			locales[locale] = locales[locale] || {};
			locales[locale][namespace] = JSON.parse(localeFile);
		} catch (parseError) {
			logError('unable to parse locales from file (maybe ' + file + ' is empty or invalid json?): ', parseError);
		}
	} catch (readError) {
		// unable to read, so intialize that file
		// locales[locale][namespace] are already set in memory, so no extra read required
		// or locales[locale][namespace] are empty, which initializes an empty locale.json file
		logDebug('initializing ' + file);

		if (updateFiles !== false) {
			write(locale, namespace);
		}
	}
}

/**
 * Initializes the locales array to have an index for [locale][namespace]
 * @param locale
 * @param namespace
 */
function prepareLocalesArray(locale, namespace){
	if (!locales[locale]) {
		locales[locale] = {};
	}

	if (!locales[locale][namespace]) {
		locales[locale][namespace] = {};
	}
}

/**
 * Write the file to <localeDir>/<namespace>.<extension>
 * The file will first be written to *.tmp, and only then renamed to the proper file. This prevents changes from being fully lost when access changes
 * @param locale
 * @param namespace
 */
function write(locale, namespace) {
	var stats = ''
	, target = ''
	, tmp = '';

	makeLocaleDirectories(locale);
	prepareLocalesArray(locale, namespace);

	// writing to tmp and rename on success
	try {
		target = getStorageFilePath(locale, namespace);
		
		tmp = target + ".tmp";
		fs.writeFileSync(tmp, JSON.stringify(locales[locale][namespace], null, indent), "utf8");
		stats = fs.statSync(tmp);

		if (stats.isFile()) {
			fs.renameSync(tmp, target);
		} else {
			logError('unable to write locales to file (either ' + tmp + ' or ' + target + ' are not writeable?): ', e);
		}
	} catch (e) {
		logError('unexpected error writing files (either ' + tmp + ' or ' + target + ' are not writeable?): ', e);
	}
}
/**
 * Initialize <localeDir> and <localeDir>/<locale>
 * @param locale
 */
function makeLocaleDirectories(locale){
	// Create locale directory - if necessary
	try {
		stats = fs.lstatSync(directory);
	} catch (e) {
		logDebug('creating locales dir in: ' + directory);
		fs.mkdirSync(directory, parseInt('755', 8));
	}

	// Create namespace subdirectory in locale directory - if necessary
	var localePath = getStorageLocalePath(locale);
	try {
		stats = fs.lstatSync(localePath);
	} catch (e) {
		logDebug('creating locales subdirectory in: ' + localePath);
		fs.mkdirSync(localePath, parseInt('755', 8));
	}
}

/**
 * Path to the storage files (e.g. *.json)
 */
function getStorageFilePath(locale, namespace) {
	var ext = extension || 'json'
	,	filepath = path.join(getStorageLocalePath(locale), (namespace + '.' + ext));
	return filepath;
}

/**
 * Path to the locale directory ('en','nl','fr', etc.)
 */
function getStorageLocalePath(locale) {
	return path.join(directory, locale);
}

/**
 * Logging proxies
 */

function logDebug(msg) {
	debug(msg);
}

function logWarn(msg) {
	warn(msg);
}

function logError(msg) {
	error(msg);
	pr(msg);
}
