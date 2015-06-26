// A dead simple client-side web "framework," largely tailored to the needs of the Choreo app

// TBD: extract to Straight.js: "the non-framework"




if (_c === undefined || _c === null) {

	// since JS doen't align nicely with classical OOP, just parasite Choreo on top of an
	// instance of Straight.
	var _Choreo = function() {
		// seems like funky syntax, but any instance of "Choreo" would require its own instance of Straight
		this.__proto__.__proto__ = new Straight();
	};


	_Choreo.prototype = {

		/**
		* A representation of a machine-generated script.
		*
		* @param {Script} script - the Choreo Script being run.
		*/
		Script: function (code) {
			this.id = "";
			this.turbo = false;
			this.startConditions = [];
			this.code = code;
		},

		/**
		* A live instance of a script being run by an interpreter.
		*
		* @param {Script} script - the Choreo Script being run.
		*/
		RunningScript: function (script, player) {

			this.script = script;
			this.player = player;

			// The external API for script code to talk to Choreo

			var choreoPlayer = player;   // think we need the player bound to local scope for the sake of closure; TBD: not sure

			function choreoApi(interpreter, scope) {
				
				// Add an generic method to allow scripts to communicate with the player and Choreo
				var wrapper = function(playerId, entityId, method, args) {
					entityId = entityId ? entityId.toString() : '';
					args = args ? args : [];
					return interpreter.createPrimitive(_c.players[playerId].callMethod(entityId, method, args));
				};
				interpreter.setProperty(scope, 'callMethod', interpreter.createNativeFunction(wrapper));

			}

			this.interpreter = new Interpreter(script.code, choreoApi);
		},

		/**
		* Abstract base class for the required compiler of each "kit."  The compiuler must be able to transform a 
		* collection of visual blocks into code files to be loaded into the player dynamically.
		*/
		Compiler: function () {

			// probably really bad style, but oh well...
			this.__proro__ = {

				codeFromBlockly: function(ßblockly) {}
			}

		},

	};

	var _c = new _Choreo();
	//_c.__proto__.__proto__ = new Straight();

	/*
	* A representation of a machine-generated script.
	*
	* @param {Script} script - the Choreo Script being run.
	*/

	// _c.Script = 
	// 	function (code) {
	// 		this.id = "";
	// 		this.turbo = false;
	// 		this.startConditions = [];
	// 		this.code = code;
	// 	};

}
