// Locomotive-based routing.  Map routes to controllers with
// "controller#action" syntax.  Express middleware syntax --
// "function(req, res, next)" -- is also supported.
//
// See (http://locomotivejs.org/guide/routing.html)
//

module.exports = function routes() {

	// to build a web app around the choreo editor, change the "main" action in the "default"
	// controller, referenced below, to load a different starting page.

	this.root({ controller: 'default', action: 'main' });

	this.match('/', { controller: 'default', action: 'main' });
	this.match('index', { controller: 'default', action: 'main' });

	// re-enable to be search engine friendly
	this.match(':lang/home', { controller: 'default', action: 'main' });
	this.match(':lang/index', { controller: 'default', action: 'main' });
	this.match(':lang/index.*', { controller: 'default', action: 'main' });

	this.match('setLanguage/:language', { controller: 'default', action: 'setLanguage', via: ['GET', 'POST']});

	// all choreo-specific routes; TBD: would be nice if Locomotive could load this from a file.

	// individual pieces of a game; using .js extension to align with the static/embedded player on mobile,
	// which will (likely) pull from file:///
	this.match('stubAPI/games/:gameId/classes.js', { controller: 'stubAPI', action: 'getGameClasses' });
	this.match('stubAPI/games/:gameId/instances.js', { controller: 'stubAPI', action: 'getGameInstances' });
	this.match('stubAPI/games/:gameId/scripts.js', { controller: 'stubAPI', action: 'getGameScripts' });

	// the game definition itself
	this.match('stubAPI/games/:gameId', { controller: 'stubAPI', action: 'getGame' });

	// mostly aimed at delivering a game to an iframe embed tag on an external site
	this.match('player/:gameId', { controller: 'player', action: 'renderGame' });

	this.namespace('choreo', function() {

	//	this.root({ controller: 'editor', action: 'main' });
		// this.match('editor', { controller: 'editor', action: 'main' });	
		// this.match('setLanguage/:language', { controller: 'editor', action: 'setLanguage', via: ['GET', 'POST']});

	});

};

