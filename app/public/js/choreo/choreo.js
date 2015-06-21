// A dead simple client-side web "framework," largely tailored to the needs of the Choreo app

if (!Choreo) {

	var Choreo = function (options) {

		options = options || {};

		this.apiRoot = options.apiRoot || '/';
		this.fileRoot = options.fileRoot || '/';
		this.gameAssetRoot = '/';

		this.player = null;
		this.players = {};

		this.sdks = {};
	};

	// safe calling of functions, as an alternative to actions, events, messages; etc.
	Choreo.prototype.call = function(obj, func) {
		if (obj[func]) return obj[func]();
		else return null;
	};

	// safe, nested access to data, in lieu of automatic data binding
	Choreo.prototype.get = function(obj, propPath) {

		if (!propPath)
			return obj;

		var prop, props = propPath.split('.');

		for (var i=0, iLen=props.length-1; i<iLen; i += 1) {
			
			prop = props[i];
			var candidate = obj[prop];
			if (candidate !== undefined) {
				obj = candidate;
			} else {
				break;
			}
		}
		return obj[props[i]];
	};

	// safe, nested access to data, in lieu of automatic data binding
	Choreo.prototype.set = function(obj, propPath, value) {

		if (!propPath)
			return false;

		var prop, props = propPath.split('.');

		for (var i=0, iLen=props.length-1; i<iLen; i += 1) {
			
			prop = props[i];
			var candidate = obj[prop];
			if (candidate !== undefined) {
				obj = candidate;
			} else {
				return false;
			}
		}

		obj[props[i]] = value;
		return(true);
	};

	// some Choreo system classes

	/**
	* A representation of a machine-generated script.
	*
	* @param {Script} script - the Choreo Script being run.
	*/
	Choreo.prototype.Script = function (code) {
		this.id = "";
		this.turbo = false;
		this.startConditions = [];
		this.code = code;
	};

	/**
	* A live instance of a script being run by an interpreter.
	*
	* @param {Script} script - the Choreo Script being run.
	*/
	Choreo.prototype.RunningScript = function (script, player) {

		this.script = script;
		this.player = player;

		// The external API for script code to talk to Choreo

		var choreoPlayer = player;   // think we need the player bound to local scope for the sake of closure; TBD: not sure

		function choreoApi(interpreter, scope) {
			
			// Add an generic method to allow scripts to communicate with the player and Choreo
			var wrapper = function(playerId, entityId, method, args) {
				entityId = entityId ? entityId.toString() : '';
				args = args ? args : [];
				return interpreter.createPrimitive(window.choreo.players[playerId].callMethod(entityId, method, args));
			};
			interpreter.setProperty(scope, 'callMethod', interpreter.createNativeFunction(wrapper));

		}

		this.interpreter = new Interpreter(script.code, choreoApi);
	};	
}

if (!window.choreo) window.choreo = new Choreo();
