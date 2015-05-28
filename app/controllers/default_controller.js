/**
 * DefaultController
 * 
 * Build out this controller to create a web app around the choreo editor.
 */

var DefaultController = new (require('locomotive').Controller)()
,	ParentController = require('./../controller.js')
,	i18n = require('../../config/extensions/i18n-namespace');

	/**
	 * Main page containing the full editor layout
	 */
	DefaultController.main = function() {
		ParentController.__addNoCacheHeaders.call(this);
		this.page = false;
		this.render('./index');
	};	

	/**
	 * Set the default language in a cookie. i18n picks this cookie up.
	 * @param language - the language code to set the locale to
	 */
	DefaultController.setLanguage = function() {
		var language = this.param('language');
		
		var expiryDate = new Date(Number(new Date()) + 315360000000); //10 * 365 * 24 * 60 * 60 * 1000 === 315360000000, or 10 years in milliseconds
		this.__res.cookie('lang', language, { expires: expiryDate, httpOnly: true });
		
		// Behave like a pure API call.  Let the client refresh the page.
		this.__res.json({result: "thanks"});
	};


	/**
	 * After the controller's functions are created, before() and after() methods can be registered with
	 * Locomotive; these will be called before and after particular routes are handled.  '*' is a valid wildcard.
	 */
	 
	/**
	 * First extend ParentController before and after. This can instantiate properties like this.user,
	 * this.loggedIn, this.language, etc.
	 */
	ParentController.parentOf(DefaultController);
		

	DefaultController.before(['show','main'], function(next) {

		// Add global logic for processing page logic, session info; etc.

		next();
	});
		
module.exports = DefaultController;
