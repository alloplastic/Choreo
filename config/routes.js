// Locomotive-based routing.  Map routes to controllers with
// "controller#action" syntax.  Express middleware syntax --
// "function(req, res, next)" -- is also supported.
//
// See (http://locomotivejs.org/guide/routing.html)
//
// The philosophy here is to build APIs that directly do what they say

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
	this.match('stubAPI/games/:gameId/classes.js', { controller: 'stubAPI', action: 'getGameClasses', via: ['GET'] });
	this.match('stubAPI/games/:gameId/instances.js', { controller: 'stubAPI', action: 'getGameInstances', via: ['GET'] });
	this.match('stubAPI/games/:gameId/scripts.js', { controller: 'stubAPI', action: 'getGameScripts', via: ['GET'] });

	// the game definition itself
	this.match('stubAPI/games/:gameId', { controller: 'stubAPI', action: 'getGame', via: ['GET'] });

	// to parallel the functionality under "files," the main API will probably need this functional endpoint for
	// creating a new game in the system and returning its id.
	// TBD...
	this.match('stubAPI/games', { controller: 'stubAPI', action: 'newGame', via: ['POST', 'PUT'] });

	// mostly aimed at delivering a game to an iframe embed tag on an external site
	this.match('player/:gameId', { controller: 'player', action: 'renderGame' });

	// file-system based routes for clients using data from an external folder
//	this.match('api/v1/files/newGame', { controller: 'files', action: 'newGame' });
	this.match('api/v1/files', { controller: 'files', action: 'getFile', via: ['GET'] });
	this.match('api/v1/files', { controller: 'files', action: 'putFile', via: ['POST', 'PUT'] });
	this.match('api/v1/files/directory', { controller: 'files', action: 'createDirectory', via: ['POST', 'PUT'] });

	// convenience function to create a project directory containing the proper subdirectories, default
	// game file; etc.  URL parameter: "path," the complete desired path to the project folder.

	this.match('api/v1/files/game', { controller: 'files', action: 'newGame', via: ['PUT', 'POST'] });

	// TBD: someday, maybe this returns a ZIP of the whole game?
//	this.match('api/v1/files/game', { controller: 'files', action: 'getGame', via: ['GET'] });

	// for local development, the client is responsible for knowing that it is writing local files,
	// but we still want to abstract the idea of storing assets.  Developers of entity editors
	// (e.g. sprite sheet animation) should not be managing a hierarchy of files within a game directory.
	// They should simply express the intention to read/write an asset, or retrieve a particular file by name.
	// In online mode, the base URL changes from /files/assets (+ path & fileName params) to /games/<id>/assets.

	// plan for writing assets to file system: take id of entity and original filename of file.  Construct
	// following path on disk, where the entity directory is already created:
	// /assets/<entityType>_<entityId>/<fileName>_<fileId>.<extension>.  Perhaps use everything after /assets/
	// as a (descriptive) S3 file identifier for the web app.
	
	this.match('api/v1/files/assets', { controller: 'files', action: 'putAsset', via: ['POST', 'PUT'] });
	this.match('api/v1/files/assets', { controller: 'files', action: 'getAsset', via: ['GET'] });

	// adding these stub routes, too, since even during offline testing we want to access the local disk
	this.match('stubAPI/files', { controller: 'files', action: 'getFile', via: ['GET'] });
	this.match('stubAPI/files', { controller: 'files', action: 'putFile', via: ['POST', 'PUT'] });
	this.match('stubAPI/files/game', { controller: 'files', action: 'newGame', via: ['PUT', 'POST'] });
	this.match('stubAPI/files/directory', { controller: 'files', action: 'createDirectory', via: ['POST', 'PUT'] });
	this.match('stubAPI/assets', { controller: 'files', action: 'putAsset', via: ['POST', 'PUT'] });
	this.match('stubAPI/assets', { controller: 'files', action: 'getAsset', via: ['GET'] });


//	this.match('stubAPI/files/newGame', { controller: 'files', action: 'getFile' });

//	this.match('api/v1/files/game/:game', { controller: 'files', action: 'getFile' });

	// needed? :
	// this.match('files/js/:path', { controller: 'stubAPI', action: 'getJSFile' });
	// this.match('files/json/:path', { controller: 'stubAPI', action: 'getJSONFile' });
	// this.match('files/asset/:path', { controller: 'stubAPI', action: 'getAssetFile' });

	this.match('player/file', { controller: 'player', action: 'renderGameFromFile' });

	this.namespace('choreo', function() {

	//	this.root({ controller: 'editor', action: 'main' });
		// this.match('editor', { controller: 'editor', action: 'main' });	
		// this.match('setLanguage/:language', { controller: 'editor', action: 'setLanguage', via: ['GET', 'POST']});

	});

};

