// Set up the view engine and the list of partials

var hoganExpress = require('hogan-express')
var path = require('path');

// path-based partials; couldn't get this to work
//var partials = require('hogan-express-partials');

// view engine

module.exports = function viewsInitializer() {
	this.set('views', path.join(__dirname, '/../../app/html'));
	this.set('view engine', 'html');
	this.engine('html', hoganExpress);
	this.format('html', { extension: '.html' });

//    this.use(partials.middleware());

	/**
	 * partials
	 */
	this.set('partials', {
    	"head" : "partials/head"
    });
};