// Backing code for the Choreo Player web module

// define a class for the player

if (!ChoreoPlayer) {

	var ChoreoPlayerStateEnum = {
		WAITING_FOR_DOM: 1,
		LOADED: 2,
		DOWNLOADING: 3,
		STARTED_PRELOAD: 4,
		WAITING_FOR_PRELOAD: 5,
		RUNNING: 6,
		PAUSED: 7
	};

	var ChoreoPlayer = function (options) {

		options = options || {};

	//	this.gameId = options.gameId || "EmptyGame";
		this.elementId = options.elementId || "UhOh";

		if (document.readyState == 'complete') {
			this.state = ChoreoPlayerStateEnum.LOADED;
		} else {
			this.state = ChoreoPlayerStateEnum.WAITING_FOR_DOM;
			var self=this;
			document.addEventListener("DOMContentLoaded", function(event) {   // all but IE 8 supports this
	  			self.state=ChoreoPlayerStateEnum.LOADED;
			});
		}

		// these should be set by the player.html frame
		this.apiRoot = '/';
		this.fileRoot = '/';
		this.gameAssetRoot = '/';

		// hack to determine the line number of an error in an evaled script; (didn't work in most browsers)
		//this.lastEvalLine = 0;

		// for the lifetime of the player, we load js files only once; assumption is that every
		// file is retrieved via a unique RESTful path.

	//	this.jsFilesLoaded = {};

		this.newGame();
	};

	ChoreoPlayer.prototype.newGame = function() {

//		this.contents = null;   // TBD: needed?  Possibly compile everything to JS

		this.gameId = "EmptyGame";

		// these are set in the instances.js compiled file
		this.scenes = {};
		this.currentScene = 0;

		this.entities = {};
		this.scripts = [];
		this.runningScripts = [];
		this.classes = {};

		this.numAssetsLoading = 0;
		this.numAssetsLoaded = 0;
		this.numAssetsFailed = 0;

		this.assetLoadInterval = null;
		this.runInterval = null;

		// external JS to be invoked at game load
		this._runtimeFiles = [];
		this._curRuntimeDownload = 0;  // index of the current file being downloaded

		// for speed
		this._curSceneRef = null;
		this._curLayersRef = null;

	};

	ChoreoPlayer.prototype.loadGame = function(gameId) {

		if (this.state != ChoreoPlayerStateEnum.RUNNING &&
			this.state != ChoreoPlayerStateEnum.PAUSED &&
			this.state != ChoreoPlayerStateEnum.LOADED)
			return(false);  // load fails if another game is in the process of loading

		this.newGame();

		this.state = ChoreoPlayerStateEnum.DOWNLOADING;

		this.gameId = gameId;

		// TBD: download contents.json and assign it to this.contents

		// this.element = document.getElementById(this.elementId);
		// if (this.element) {
		// 	this.element.innerHTML = "<p>Yowsa - " + gameId + ".</p>";
		// }

		// loading files indivisually from the client to decouple the player from Node,
		// in anticipation of possibly having to wrap static HTML in Cordova for mobile

		var scriptNames = [];

		scriptNames.push(this.fileRoot + "sdks/phaser/phaser.js");
		scriptNames.push(this.fileRoot + "sdks/phaser/runtime.js");

		scriptNames.push(this.apiRoot + "games/" + gameId + "/classes.js");
		scriptNames.push(this.apiRoot + "games/" + gameId + "/instances.js");
		scriptNames.push(this.apiRoot + "games/" + gameId + "/scripts.js");

		// TBD: optiomize by dowloading multiple at once
		this.loadJSSequence(scriptNames);

		return(true);  // game has successfully started download process
	};

	ChoreoPlayer.prototype.closeGame = function() {

		if (this.runInterval) clearInterval(this.runInterval);

		for (var e in this.entitties) {
			if (this.entities.hasOwnProperty(e)) this.entitites[e].close();
		}

		for (var s in this.scenes) {
			if (this.scenes.hasOwnProperty(s)) {
				var scene = this.scenes[s];
				for (var l=0; l<scene.layers.length; l++) {
					scene.layers[l].close();
				}
			}
		}

		// TBD: parse and load relevant game scripts
		this.unloadJS(this.apiRoot + "games/" + this.gameId + "/classes.js");
		this.unloadJS(this.apiRoot + "games/" + this.gameId + "/instances.js");
		this.unloadJS(this.apiRoot + "games/" + this.gameId + "/scripts.js");		

		//$('#DefaultPlayer').children().not('script').remove();
	}

	// kick off a serial download of all of the needed js files for the current game
	ChoreoPlayer.prototype.loadRuntimeFiles = function() {
		//this._curRuntimeDownload = 0;
	};

	// recursive routine for loading one js file at a time.  TBD: lots of opportunities for optimization here, e.g. precompiling
	ChoreoPlayer.prototype._loadRuntimeFile = function(i) {
		
	};

	// message from instances.js that asset retrieval has begun
	ChoreoPlayer.prototype.preloadBegun = function() {
		this.state = ChoreoPlayerStateEnum.STARTED_PRELOAD;	
	};

	// message (from instances.js, most likely) that n files are being loaded asynchronously
	ChoreoPlayer.prototype.preloadJobsBegun = function(n) {
		this.numAssetsLoading += n;
	};

	// message saying that a file/asset has been loaded
	ChoreoPlayer.prototype.preloadJobsDone = function(n) {
		this.numAssetsLoaded += n;
	};

	// message saying that a file/asset has been loaded
	ChoreoPlayer.prototype.preloadJobsFailed = function(n) {
		this.numAssetsFailed += n;
	};

	// message from instances.js that all asset requests have been fired (asynchronously)
	ChoreoPlayer.prototype.preloadRequestsInitiated = function() {

		this.state = ChoreoPlayerStateEnum.WAITING_FOR_PRELOAD;

		// Wait for actual load to finish, based on method calls from from insatances.js

		var self = this;
		this.assetLoadInterval = setInterval(function () {
			self.__proto__.checkLoadStatus.call(self);
			//self.checkLoadStatus(self);
		}, 100);

	};

	ChoreoPlayer.prototype.checkLoadStatus = function() {
		if (this.numAssetsLoaded + this.numAssetsFailed >= this.numAssetsLoading) {
			clearInterval(this.assetLoadInterval);
			if (this.numAssetsFailed == 0) {
				this.run();
				// game loaded successfully; launch the scripts
//				this.prototype.run.call(self);
				//self.run();
			} else {
				alert("Choreo: failed to load all assets.");
				// missing content; bail
			}
		}
	};

	ChoreoPlayer.prototype.run = function() {

		if (!this.loadScene(this.currentScene)) return;

		//var RunningScript = _c.RunningScript;

//		var scripts = scene.scripts;

		// TBD: identify "start" scripts and load only those into the running-scripts list
		var scene = this._curSceneRef;
		for (var i=0; i<scene.scripts.length; i++) {
			this.runningScripts.push(new _c.RunningScript(scene.scripts[i]));
		}

		// start run loop
		var self = this;
		this.runInterval = setInterval(function () {
			self.__proto__.tick.call(self);
		}, 10);

		this.state = ChoreoPlayerStateEnum.RUNNING;	

	};

	ChoreoPlayer.prototype.loadScene = function(sceneName) {

		var scene = this.scenes[sceneName];

		if (scene==null) {
			console.log('Choreo Player: invalid scene: "' + this.currentScene + '".');
			this.state = ChoreoPlayerStateEnum.PAUSED;
			return false;	
		}

		this._curSceneRef = scene;
		this._curLayersRef = scene.layers;

		return true;
	}

	ChoreoPlayer.prototype.tick = function() {

		var scripts = this.runningScripts;

		for (var i=scripts.length-1; i>=0; i-=1) {
			var interpreter = scripts[i].interpreter;
			if (!interpreter.step()) {
				scripts.splice(i, 1);   // script is done executing; remove from list
			}
		}

		if (this._curLayersRef) {
			for (var i=0; i<this._curLayersRef.length; i += 1) {
				this._curLayersRef[i].tick();
			}
		}

	};

	// external API method, called from the script interpreter; calls a method on an entity

	ChoreoPlayer.prototype.callMethod = function(entityId, method, args) {

		var entity = this.entities[entityId];
		if (!entity) return;

		var method = entity[method];
		if (!method) return;

		method.apply(entity, args);
	};

	// deprecated due to unpredictable asynchronousity
	ChoreoPlayer.prototype.loadJS = function(jsFileName) {
		var id = "choreo_script_" + jsFileName;
		var existingScript = document.getElementById(id);
		if (!existingScript) {
			var scriptElement = document.createElement("script");
			scriptElement.type = "text/javascript";
			scriptElement.src = jsFileName;
			scriptElement.id = id;
			var headElement = document.getElementsByTagName('head')[0] || document.documentElement;
			if (headElement) headElement.appendChild(scriptElement);
		}
	};

	ChoreoPlayer.prototype.unloadJS = function(jsFileName) {
		var id = "choreo_script_" + jsFileName;
		var existingScript = document.getElementById(id);
		if (existingScript) {
			existingScript.parentNode.removeChild(existingScript);
		}
	};

	// recursive function, which loads the js files described by fileNames one at a time
	ChoreoPlayer.prototype.loadJSSequence = function(fileNames) {

		if (!fileNames || fileNames.length <= 0) return;

		var nextFileIndex = 0;
		while (_c.jsFilesLoaded[fileNames[nextFileIndex]]) {
			nextFileIndex++;
			if (nextFileIndex == fileNames.length) return;
		}

		var nextFileName = fileNames[nextFileIndex];
		_c.jsFilesLoaded[nextFileName] = true;  // TBD: deal with service failure

		// using plain JS to avoid jQuery dependency in player

		var req;
		if (window.XMLHttpRequest)  // not providing the "else" for IE 6 compatibility
		{ // code for IE7+, Firefox, Chrome, Opera, Safari
			req = new XMLHttpRequest();
		}

		var self = this;
		req.onreadystatechange=function()
			{
				if (req.readyState == 4 && req.status == 200)
				{
					try {
						//window.choreo.players[self.gameId].globalEval(req.responseText);
						self.globalEval(req.responseText);
					} catch(e) {
						alert('Choreo: failed to load library: ' + nextFileName + '\n\nERROR: '  +  e.message + '\n\n' + e.stack);
//						alert('Choreo: failed to load library: ' + nextFileName + '\n\nERROR: ' + (e.lineNumber - this.lastEvalLine) + ': '  +  e.message + '\n\n' + e.stack);
					}
					fileNames.splice(0, nextFileIndex+1);
					self.loadJSSequence(fileNames);					
				}
			}
		req.open("GET", nextFileName, true);
		req.send();
	};


	ChoreoPlayer.prototype.globalEval = function(src) {
		if (window.execScript) {
			// wasn't supported in Chrome
//			this.lastEvalLine = new Error().lineNumber + 1;
//			if (!Number.isInteger(this.lastEvalLine)) this.lastEvalLine = 0;
			window.execScript(src);
			return;
		}
		var self = this;
		var fn = function() {
//			self.lastEvalLine = new Error().lineNumber + 1;
//			if (!Number.isInteger(self.lastEvalLine)) self.lastEvalLine = 0;
			window.eval.call(window, src);
		};
		fn();
	};

	ChoreoPlayer.prototype.unloadGame = function(gameId) {
	};

	// Let's try to have one "refresh" method that determines what has changed in a game (e.g. a deleted layer)
	// and then rebuilds the player accordingly.
	ChoreoPlayer.prototype.reloadGame = function(gameId) {
	};

}


// scratch code; tried to sequence the loading of <script> elements

		// $.ajax({
		// 	url: "./seeds/Ag.txt",
		// 	async: false,
		// 	success: function (data){
		// 		pageExecute.fileContents = data;
		// 	}
		// });

		// var id = "choreo_script_" + firstFileName;
		// var existingScript = document.getElementById(id);
		// if (!existingScript) {

		// 	var scriptElement = document.createElement("script");
		// 	scriptElement.type = "text/javascript";
		// 	scriptElement.src = firstFileName;
		// 	scriptElement.id = id;

		// 	var done = false;
		// 	var self = this;
			
		// 	scriptElement.onload = scriptElement.onreadystatechange = function() {
		// 		if ( !done && (!this.readyState ||
		// 			this.readyState === "loaded" || this.readyState === "complete") ) {
		// 			done = true;
		// 			// Handle memory leak in IE, partially
		// 			scriptElement.onload = scriptElement.onreadystatechange = null;
		// 			fileNames.splice(0, 1);
		// 			self.loadJSSequence(fileNames);
		// 		}
		// 	}
			
		// 	var headElement = document.getElementsByTagName('head')[0] || document.documentElement;
		// 	if (headElement) headElement.appendChild(scriptElement);

		// } else {
		// 	fileNames.splice(0, 1);
		// 	this.loadJSSequence(fileNames);
		// }


// (function ($) { // Block scoping, to keep it out of the global namespace

// 	$(document).ready(function() {
// 	});

// })(jQuery);