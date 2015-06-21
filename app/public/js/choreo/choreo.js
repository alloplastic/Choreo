// A dead simple client-side web "framework," largely tailored to the needs of the Choreo app

if (!Choreo) {

	var Choreo = function (options) {

		options = options || {};

		// super-simple observer/reaction framework based on pattern=matching of nested JSON paths
		this.observations = [];
		this.observedObjects = [];   // hack to derive an index/id for each observed object
		this.observationEventQueue = [];

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

		for (var i=0, len=props.length; i<len; i+=1) {

			prop = props[i];

			// allow array indices as part of the path
			var index = parseInt(prop);
			if (!isNaN(index)) prop = index;

			obj= obj[prop];  // TBD: should probably strictly require obj to be an array here

			if (obj == undefined)
				break;
		}

		return obj;
	};

	// safe, nested access to data, in lieu of automatic data binding
	Choreo.prototype.set = function(obj, propPath, value) {

		var index;

		if (!propPath)
			return false;

		var prop, props = propPath.split('.');

		for (var i=0, len=props.length-1; i<len; i+=1) {
			
			prop = props[i];

			// allow array indices as part of the path
			index = parseInt(prop);
			if (!isNaN(index)) prop = index;

			obj = obj[prop];

			if (obj == undefined)
				return false;
		}

		var lastProp = props[i];
		index = parseInt(lastProp);
		if (!isNaN(index)) lastProp = index;

		obj[lastProp] = value;   // TBD: should probably strictly require obj to be an array here

		this.queueObservationEvent(obj, propPath, value, "set");

		return(true);
	};

	// remove a property or array item
	Choreo.prototype.remove = function(obj, propPath) {

		// TBD: same logic as set, supporting arrays, except delete

		if (!propPath)
			return false;

		var prop = propPath;
		var lastDelim = prop.lastIndexOf(".");

		// find the parent object of the leaf to be deleted 
		if (lastDelim >= 0) {
			prop = propPath.substring(lastDelim+1);
			var prefixPath = propPath.substring(0, lastDelim);
			obj = this.get(obj, prefixPath);
		}

		if (obj && prop && prop.length>0) {

			var index = parseInt(prop);
			if (!isNaN(index)) {   // integer properties are expected to be array indices
				if (Array.isArray(obj)) {
					obj.splice(index, 1);
				} else {
					return false;
				}
			} else {
				delete obj[prop];
			}

		} else {
			return false;
		}

		this.queueObservationEvent(obj, propPath, null, "remove");
		return true;
	}

	Choreo.prototype.observe = function(obj, propPath, listeningObj) {

		// unpleasant syntax since in JS objects can't be keys
		var observation;

		var o = this.observedObjects.indexOf(obj);
		if (o < 0) {
			this.observedObjects.push(obj);   // a way of creating a unique id for each object internally, without decorating
			o = this.observedObjects.length-1;
			observation = {};
			this.observations[o] = observation;
		} else {
			observation = this.observations[o];
		}
		var listeners = observation[propPath];

		if (listeners == null) {
			listeners = [];
			observation[propPath] = listeners;
		}

		if (listeners.indexOf(listeningObj) < 0)
			listeners.push(listeningObj);
	};

	Choreo.prototype.stopObservation = function(obj, propPath, listeningObj) {

		var o = this.observadObjects.indexOf(obj);
		if (o < 0) return;

		var observation = this.observations[o];

		var listeners = observation[propPath];
		if (listeners == null) return;

		var i = listeners.indexOf(listeningObj);
		if (i >= 0) listeners.splice(i, 1);
	};

	Choreo.prototype.stopAllObservations = function() {
		this.observations = [];
		this.observedObjects = [];
	};

	Choreo.prototype.queueObservationEvent = function(obj, propPath, value, op) {
		// TBD: reject dupes and "parent" value changes when children have already changed
		this.observationEventQueue.push({object: obj, path: propPath, value: value, operation: op});
	};

	Choreo.prototype.fireObservationEvents = function() {

		// marshall all events for a particular listening object into a single notification
		var eventsForEachListener = {};
		var listener, allListeners =[];

		// TBD: possibly optimize by sorting the property lists and looping through once instead of looking up props
		for (var e=0, numEvents=this.observationEventQueue.length; e<numEvents; e+=1) {

			var observationEvent = this.observationEventQueue[e];

			var observation;
			var o = this.observedObjects.indexOf(observationEvent.object);
			if (o < 0) continue;
			var observation = this.observations[o];

			for (var path in observation) {
				if (observation.hasOwnProperty(path)) {
					if (path.indexOf(observationEvent.path) == 0) {   // match more generic observations, e.g. /schools to /schools/majors

						var listeners = observation[path];
						if (listeners == null || listeners.length <= 0) continue;

						for (var i=0, len=listeners.length; i<len; i+=1) {
							listener = listeners[i];
							var l = allListeners.indexOf(listener);
							if (l<0) {
								allListeners.push(listener);
								l = allListeners.length-1;
							}
							if (eventsForEachListener[l] == null) eventsForEachListener[l] = [];
							eventsForEachListener[l].push(observationEvent);
						}
					}
				}
			}
		}

		for (var i=0; i<allListeners.length; i++) {
			this.invoke(allListeners[i], "onDataChanged", [eventsForEachListener[i]]);			
		}

		// for (listener in eventsForEachListener) {
		// 	if (eventsForEachListener.hasOwnProperty(listener)) {
		// 		this.invoke(listener, "onDataChanged", [eventsForEachListener[listener]]);
		// 	}
		// }

		this.observationEventQueue = [];
	};

	Choreo.prototype.tick = function() {
		this.fireObservationEvents();
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
if (!_c) var _c = window.choreo;  // TBD: is this a good idea?

// TBD: a lot of options here; could at least let calling code set the speed or drive the
// events synchronously.
//	var self = this;
if (!window.choreo.clock) {
	this.clock = setInterval(function() {
		_c.__proto__.tick.call(_c);
//		window.choreo.__proto__.tick.call(window.choreo);
	}, 100);
}
