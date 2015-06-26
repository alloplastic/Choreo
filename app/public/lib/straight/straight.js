// A dead simple client-side web "framework," largely tailored to the needs of the Choreo app

// TBD: extract to Straight.js: "the non-framework"

(function(window) {

	// allows us to undo the Straight definition in the context of AMD module definitions
	var _Straight = window.Straight;

	var Straight = function (options) {

		options = options || {};

		// super-simple observer/reaction framework based on pattern=matching of nested JSON paths
		this.observations = [];
		this.observedObjects = [];   // hack to derive an index/id for each observed object
		this.observationCallbacks = [];
		this.observationEventQueue = [];

		// a map of message names to arrays of listeners
		this.messages = {};

		this.apiRoot = options.apiRoot || '/';
		this.fileRoot = options.fileRoot || '/';
		this.gameAssetRoot = '/';

		this.player = null;
		this.players = {};

		this.sdks = {};

		this.delim = '/';   //aligns with REST syntax and doesn't conflict with regex (unlike '.')

		// set up a clock for processing queues of events and whatnot

		var clockInterval = options.clockInterval || 50;
		var useClock = !options.disableClock;

		if (useClock) {
			var self = this;
			this.clock = setInterval(function() {
				self.__proto__.tick.call(self);
			}, clockInterval);
		}
	
	};

	// safe calling of functions, as an alternative to actions, events, messages; etc.

	Straight.prototype = {

		invoke: function(obj, funcName, args) {
			var f = obj[funcName];
			if (f) return f.apply(obj, args);
			else return null;
		},

		// basic actions/eventing, based on a broadcast model for simplicity

		listen: function(messageName, listeningObj, funcName) {

			if (this.messages[messageName] == null) {
				this.messages[messageName] = [];
			} else {
				this.stopListener(messageName, listeningObj);   // extra precaution, to protect people from duplicate registrations
			}

			var listener = {};
			listener.obj = listeningObj;
			listener.funcName = funcName;

			this.messages[messageName].push(listener);
		},

		broadcast: function(obj, messageName, callbackProcName, data) {

			var listeners = this.messages[messageName];
			if (!listeners || listeners.length <= 0) return;

			var message = {};
			message.name = messageName;
			message.sender = obj;
			message.callbackProcName = callbackProcName;
			message.data = data;

			for (var i = 0; i<listeners.length; i++) {
				var listener = listeners[i];
				this.invoke(listener.obj, listener.funcName, [message]);
			}

		},

		stopListener: function(messageName, listeningObj) {

			var listeners = this.messages[messageName];
			if (!listeners || listeners.length <= 0) return;

			for (var i = listeners.length; i >= 0; i--) {
				var listener = listeners[i];
					if (listener.obj == listeningObj) listeners.splice(i, 1);
					// keep looping through the whole list, just in case there are dupes
			}
		},

		stopAllListeners: function(messageName, listeningObj) {
			this.messages = {};
		},

		// *** JSON data models and observation ***

		// safe, nested access to data, in lieu of automatic data binding
		get: function(obj, propPath) {

			if (!propPath)
				return null;

			var prop, props = propPath.split(this.delim);

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
		},

		// safe, nested access to data, in lieu of automatic data binding
		set: function(rootObj, propPath, value) {

			var index;

			if (!propPath)
				return false;

			var prop, props = propPath.split(this.delim);
			var obj = rootObj;

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

			this.queueObservationEvent(rootObj, propPath, value, "set");

			return(true);
		},

		// remove a property or array item
		remove: function(obj, propPath) {

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
		},

		observe: function(obj, propPath, listeningObj, funcName) {

			if (!funcName) funcName = "onDataChanged";

			// parse a few basic wildcards out of propPath to create a regular expression for pattern-matching;
			// use non-regex wildcards so that regex directives can be passesd in as well

			// "@@@" at end allows for matching against all child/leaf data changes
			if (propPath.indexOf('@@@', propPath.length - 3) == -1) {
				// if *** not present, anchor the match string to the end
				propPath = '^' + propPath + '$';
			} else {
				// to match any suffix, just delete the '***' and don't anchor the regex at the end
				propPath = '^' + propPath.substring(0, propPath.length-4);
			}

			// replace '@' characters with regex for matching everything between the delimiters ('/')
			propPath = propPath.replace(/@/g, '/[^\/]*/'); 

			// replace '#' characters with regex for matching any single character between the delimiters ('/')
			propPath = propPath.replace(/#/g, '/[^\/]/'); 

			// unpleasant syntax since in JS objects can't be keys, made worse by having to keep parallel data structures for things
			// like callback names.

			var observation;

			var o = this.observedObjects.indexOf(obj);
			if (o < 0) {

				this.observedObjects.push(obj);   // a way of creating a unique id for each object internally, without decorating
				o = this.observedObjects.length-1;
				observation = {};
				this.observations[o] = observation;

				callbackStruct = {};
				this.observationCallbacks[o] = callbackStruct;			

			} else {
				observation = this.observations[o];
				callbackStruct = this.observationCallbacks[o];
			}

			var listeners = observation[propPath];
			var funcNames = callbackStruct[propPath];

			if (listeners == null) {

				listeners = [];
				observation[propPath] = listeners;

				funcNames = [];
				callbackStruct[propPath] = funcNames;
			}

			var l = listeners.indexOf(listeningObj);
			if (l < 0) {
				listeners.push(listeningObj);
				funcNames.push(funcName);
			} else {
				funcNames[l] = funcName;
			}
		},

		stopObservation: function(obj, propPath, listeningObj) {

			var o = this.observadObjects.indexOf(obj);
			if (o < 0) return;

			var observation = this.observations[o];

			var listeners = observation[propPath];
			if (listeners == null) return;

			var i = listeners.indexOf(listeningObj);
			if (i >= 0) listeners.splice(i, 1);
		},

		stopAllObservations: function() {
			this.observations = [];
			this.observedObjects = [];
			this.observationCallbacks = [];
		},

		queueObservationEvent: function(obj, propPath, value, op) {
			// TBD: reject dupes and "parent" value changes when children have already changed
			this.observationEventQueue.push({object: obj, path: propPath, value: value, operation: op});
		},

		fireObservationEvents: function() {

			// marshall all events for a particular listener-path combination into a single notification

			var eventsForEachListener = {};
			var listener, allListeners =[];

			// TBD: possibly optimize by sorting the property lists and looping through once instead of looking up props

			for (var e=0, numEvents=this.observationEventQueue.length; e<numEvents; e+=1) {

				var observationEvent = this.observationEventQueue[e];

				var o = this.observedObjects.indexOf(observationEvent.object);
				if (o < 0) continue;
				var observation = this.observations[o];
				var callbackStruct = this.observationCallbacks[o];

				for (var path in observation) {
					if (observation.hasOwnProperty(path)) {

						// need to match two conditions: (1) the regex definiing the exact piece of data to watch and whether
						// to watch children of this data field and (2) a wholesale change to a parent data field.

						// if the straight observer pattern doesn't match, check to see if the change is happening to a parent
						// of us.

						var match=false;
						if (!observationEvent.path.match(path)) {

							var numDelimsInPath = (observationEvent.path.match(/\//g) || []).length;   // TBD: hard-wired to delim = '/'
							var numDelimsInObservationPath = (path.match(/\//g) || []).length;

							if (numDelimsInObservationPath > numDelimsInPath) {
								var tokens = path.split(this.delim).slice(0, numDelimsInPath+1);
								var subPath = tokens.join(this.delim);
								match = observationEvent.path.match(subPath); 
							}

						} else {
							match = true;
						}

						if (match) {

							var listeners = observation[path];
							if (listeners == null || listeners.length <= 0) continue;

							var funcNames = callbackStruct[path];

							for (var i=0, len=listeners.length; i<len; i+=1) {
								listener = listeners[i];
								funcName = funcNames[i];
								var l = allListeners.indexOf(listener);
								if (l<0) {
									allListeners.push(listener);
									l = allListeners.length-1;
								}
								if (eventsForEachListener[l] == null) eventsForEachListener[l] = {};
								if (eventsForEachListener[l][funcName] == null) eventsForEachListener[l][funcName] = [];
								eventsForEachListener[l][funcName].push(observationEvent);
							}
						}
					}
				}
			}

			for (var i=0; i<allListeners.length; i++) {
				for (funcName in eventsForEachListener[i]) {  // trust we don't need to check for "own property" here
					this.invoke(allListeners[i], funcName, [eventsForEachListener[i][funcName]]);	
				}		
			}

			this.observationEventQueue = [];
		},

		tick: function() {
			this.fireObservationEvents();
		},

		// something for AMD module definitions, to roll back the global scope if necessary
		noConflict: function(deep) {
			if (window.Straight === Straight) {
				window.Straight = _Straight;
			}
			return Straight;
		}
	}

	// logic from jQuery for supporting modules.
	if ( typeof module === "object" && module && typeof module.exports === "object" ) {
		module.exports = Straight;
	} else {

		// define global if we are not loaded as a module

		window.Straight = Straight;

		// AMD module support, patterned after jQuery.

		if ( typeof define === "function" && define.amd ) {
			define( "straight", [], function () { return window.Straight; } );
		}
	}

})( window );

