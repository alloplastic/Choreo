// A dead simple client-side web "framework," largely tailored to the needs of the Choreo app

if (!Choreo) {

	var Choreo = function (options) {

		options = options || {};

		// super-simple observer/reaction framework based on pattern=matching of nested JSON paths
		this.observers = {};
		this.observerEventQueue = [];

		this.apiRoot = options.apiRoot || '/';
		this.fileRoot = options.fileRoot || '/';
		this.gameAssetRoot = '/';

		this.player = null;
		this.players = {};

		this.sdks = {};

	};

	// safe calling of functions, as an alternative to actions, events, messages; etc.
	Choreo.prototype.invoke = function(obj, funcName, args) {
		var f = obj[funcName];
		if (f) return f.apply(obj, args);
		else return null;
	};

	// safe, nested access to data, in lieu of automatic data binding
	Choreo.prototype.get = function(obj, propPath) {

		if (!propPath)
			return obj;

		var prop, props = propPath.split('.');

		for (var i=0, len=props.length-1; i<len; i+=1) {
			
			prop = props[i];
			var candidate = obj[prop];
			if (candidate !== undefined) {
				obj = candidate;
			} else {
				break;
			}
		}

		// TBD: if candidate is an array and the final prop is an int, get by index
		return obj[props[i]];
	};

	// safe, nested access to data, in lieu of automatic data binding
	Choreo.prototype.set = function(obj, propPath, value) {

		if (!propPath)
			return false;

		var prop, props = propPath.split('.');

		for (var i=0, len=props.length-1; i<len; i+=1) {
			
			prop = props[i];
			var candidate = obj[prop];
			if (candidate !== undefined) {
				obj = candidate;
			} else {
				return false;
			}
		}

		obj[props[i]] = value;

		this.queueObserverEvent(obj, propPath, value, "set");

		// var self = this;
		// setTimeout(function () {
		// 	// Behold, virtual functions in Javascript
		// 	Choreo.prototype.__proto__.fireObservers(self, obj, propPath, value);
		// }, 1);   // poor man's event queue

		// TBD: if candidate is an array and the final prop is an int, set by index

		return(true);
	};

	// remove a property or array item
	Choreo.prototype.remove = function(obj, propPath, value) {

		// TBD: same logic as set, supporting arrays, except delete

		this.queueObserverEvent(obj, propPath, value, "remove");

	}

	Choreo.prototype.addObserver = function(obj, propPath, listeningObj) {

		var observer = this.observers[obj];

		if (observer == null) {
			observer = {};
			this.observers[obj] = observer;
		}

		var listeners = observer[propPath];

		if (listeners == null) {
			listeners = [];
			observer[propPath] = listeners;
		}

		if (listeners.indexOf(listeningObj) < 0)
			listeners.push(listeningObj);
	};

	Choreo.prototype.removeObserver = function(obj, propPath, listeningObj) {

		var observer = this.observers[obj];
		if (observer == null) return;

		var listeners = observer[propPath];
		if (listeners == null) return;

		var i = listeners.indexOf(listeningObj);
		if (i >= 0) listeners.splice(i, 1);
	};

	Choreo.prototype.removeAllObservers = function() {
		this.observers = {};
	};

	Choreo.prototype.queueObserverEvent = function(obj, propPath, value, op) {
		// TBD: reject dupes and "parent" value changes when children have already changed
		this.observerEventQueue.push({object: obj, path: propPath, value: value, operation: op});
	};

	Choreo.prototype.fireObserverEvents = function() {

		// TBD: possibly optimize by sorting the property lists and looping through once instead of looking up props
		for (var e=0, numEvents=this.observerEventQueue.length; e<numEvents; e+=1) {

			var observerEvent = this.observerEventQueue[e];

			var observer = this.observers[observerEvent.object];
			if (observer == null) continue;

			for (var path in observer) {
				if (observer.hasOwnProperty(path)) {
					if (path.indexOf(observerEvent.path) >= 0) {   // match more generic observers, e.g. /schools to /schools/majors

						var listeners = observer[observerEvent.path];
						if (listeners == null || listeners.length <= 0) continue;

						for (var i=0, len=listeners.length; i<len; i+=1) {
							var listener = listeners[i];
							this.invoke(listener, "onDataChanged", [observerEvent]);
						}
					}
				}
			}
		}

		observerEventQueue = [];
	};

	Choreo.prototype.tick = function() {
		this.fireObserverEvents();
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

// TBD: a lot of options here; could at least let calling code set the speed or drive the
// events synchronously.
//	var self = this;
if (!window.choreo.clock) {
	this.clock = setInterval(function() {
		window.choreo.__proto__.tick.call(window.choreo);
	}, 100);
}
