// A dead simple client-side web "framework," largely tailored to the needs of the Choreo app

// TBD: to deal with cross-references of inner properties, could add the notion of an 'equivalence' a mapping of
// an object to a path off of another object.  On set(), this can be used to generate another queued event for
// matching.  When the set() happens within the original object, the path could be exapnded as it currently is
// using pathways from other objects to the location of the set().  If one of these matches an equivalence rule,
// delete the equivalence path from the beginning of the event path and attempt a match.

// Auto-generating these probably involves searching all objects in the system for occurrences of the
// given object.  A path-to-self calculation, essentially, yielding a list of results, and needing to be recalculated
// every time a new base object is added to the system.  Probably after every set(), actually...

// Worth the pain?

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
		this.relationships =[[{}]];  // path relationships bwtween objects that might reference each other

		// a map of message names to arrays of listeners
		this.messages = {};

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

				if (!obj)
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

				if (!obj)
					return false;
			}

			var lastProp = props[i];
			index = parseInt(lastProp);
			if (!isNaN(index)) lastProp = index;

			var oldObj = obj[lastProp];

			obj[lastProp] = value;   // TBD: should probably strictly require obj to be an array here

			// if we just overwrote a reference to an object that we are observing, recalculate the map of relationships
			// between observed objects;  TBD: could result in two calls to this.recalculateRelationMap(), due to
			// subsequent call to addObservedObjectIfNecessary(), but this should be rare.

			if (this.observedObjects.indexOf(oldObj) != -1) 
				this.recalculateRelationMap();

			// track any root object on which set() has been called, so that observers on parent objects can be called
			this.addObservedObjectIfNecessary(rootObj);

			this.queueObservationEvent(rootObj, propPath, value, "set");

			return(true);
		},

		// remove a property or array item
		remove: function(obj, propPath) {

			// TBD: same logic as set, supporting arrays, except delete

			if (!propPath)
				return false;

			var prop = propPath;
			var lastDelim = prop.lastIndexOf(this.delim);

			// find the parent object of the leaf to be deleted 
			var parent = obj;
			if (lastDelim >= 0) {
				prop = propPath.substring(lastDelim+1);
				var prefixPath = propPath.substring(0, lastDelim);
				parent = this.get(obj, prefixPath);
			}

			if (parent && prop && prop.length>0) {

				var index = parseInt(prop);
				if (!isNaN(index)) {   // integer properties are expected to be array indices
					if (Array.isArray(parent)) {
						parent.splice(index, 1);
					} else {
						return false;
					}
				} else {
					delete parent[prop];
				}

			} else {
				return false;
			}

			this.queueObservationEvent(obj, propPath, null, "remove");
			return true;
		},

		// insert an item into an array at an index specified as the leaf of propPath
		insert: function(obj, propPath, value) {

			if (!propPath)
				return false;

			var prop = propPath;
			var lastDelim = prop.lastIndexOf(this.delim);

			// find the parent object of the leaf to be deleted
			// TBD: reuse this pattern to simplify these functions
			var parent = obj;
			if (lastDelim >= 0) {
				prop = propPath.substring(lastDelim+1);
				var prefixPath = propPath.substring(0, lastDelim);
				parent = this.get(obj, prefixPath);
			}

			if (parent && prop && prop.length>0) {

				var index = parseInt(prop);
				if (!isNaN(index)) {   // integer properties are expected to be array indices
					if (Array.isArray(parent)) {
						parent.splice(index, 0, value);
					} else {
						return false;
					}
				} else {
					return false;
				}

			} else {
				return false;
			}

			this.queueObservationEvent(obj, propPath, value, "insert");
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
				// to match any suffix, just delete the '@@@' and don't anchor the regex at the end
				propPath = '^' + propPath.substring(0, propPath.length-4);
			}

			// replace '@' characters with regex for matching everything between the delimiters ('/')
			propPath = propPath.replace(/@/g, '/[^\/]*/'); 

			// replace '#' characters with regex for matching any single character between the delimiters ('/')
			propPath = propPath.replace(/#/g, '/[^\/]/'); 

			this.addObservedObjectIfNecessary(obj);

			// unpleasant syntax since in JS objects can't be keys, made worse by having to keep parallel data structures for things
			// like callback names.

			var o = this.observedObjects.indexOf(obj);
			var observation = this.observations[o];
			callbackStruct = this.observationCallbacks[o];

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

		// stops a specific observation, leaving intact the data structures representing the space of
		// objects being observed.
		stopObservation: function(obj, propPath, listeningObj) {

			var o = this.observedObjects.indexOf(obj);
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
			this.observationEventQueue = [];  // judgement call to clear this, but stop all is stop all
			this.relationships =[[{}]];
		},

		/*
		 * @protected
		 */
		queueObservationEvent: function(obj, propPath, value, op) {
			// TBD: reject dupes and "parent" value changes when children have already changed
			this.observationEventQueue.push({object: obj, path: propPath, value: value, operation: op});
		},

		/*
		 * @protected
		 */
		addObservedObjectIfNecessary: function(obj) {

			var o = this.observedObjects.indexOf(obj);
			if (o < 0) {

				this.observedObjects.push(obj);   // a way of creating a unique id for each object internally, without decorating
				o = this.observedObjects.length-1;
				observation = {};
				this.observations[o] = observation;

				callbackStruct = {};
				this.observationCallbacks[o] = callbackStruct;

				this.recalculateRelationMap();
			}
		},

		/**
		 * Rebuilds our picture of the relationships between the observed objects, for those that are part of the same
		 * nested js object.  TBD: Is brute force to do this every time there is a change...
		 * @method
		 * @protected
		 */
		recalculateRelationMap: function() {

			for (var i=0; i<this.observedObjects.length; i++) {
				var obj = this.observedObjects[i];
				if (this.relationships.length < i+1) this.relationships.push([]);
				// for each observed object, check to see if any of the *other* objects are contained
				// within it and store a path relationship to be applied to set() notifications
				for (var j=0; j<this.observedObjects.length; j++) {
					var obj2 = this.observedObjects[j];
					if (this.relationships[i].length < j+1) this.relationships[i].push({});
					var relationshipData = this.relationships[i][j];
					if (obj != obj2) {
						// store any response so that we can use the array indices for navigation
						relationshipData.path = this.pathToObject(obj, obj2, []);  // third argument required as an optimization
					}
					else {
						relationshipData.path = null;  // ditto, just want to have a record for every object
					}
				}
			}
		},

		/*
		 * recursive function for tracing the parent-child relationship of two objects
		 * @protected
		 */
		pathToObject: function(startObj, endObj, seenObjects) {

			// success; return a string to kick off the construction of the path
			if (startObj == endObj) return '';

			// ES5 syntax... much better; doesn't work in IE8 and similar era browsers
			// actually works for arrays, too; only issue is that empty values are skipped, but that's fine for this algorithm
			var props = Object.keys(startObj).slice();

			var numProps = props.length;
			if (numProps <= 0) return null;

			for (var i=0; i<numProps; i+=1) {
				var prop = props[i];
				var child = startObj[prop];
				if (child == null || typeof child != 'object') continue;  // bail when hit a non-object leaf
				if (seenObjects.indexOf(child) != -1) return null;  // circular reference & no match found yet
				seenObjects.push(child);
				// each branch of the tree needs its own array; TBD: could reuse a few of the arrays...
				var childPath = this.pathToObject(child, endObj, seenObjects.slice());
				if (childPath!=null) {
					childPath = prop + '/' + childPath;
					return(childPath);
				} else {
					continue;  // try the next property
				}
			}

			return null;
		},

		/*
		 * @protected
		 */
		fireObservationEvents: function() {

			// marshall all events for a particular listener-path combination into a single notification

			var eventsForEachListener = {};
			var listener, allListeners =[];
			var i, record;

			// TBD: possibly optimize by sorting the property lists and looping through once instead of looking up props

			for (var e=0, numEvents=this.observationEventQueue.length; e<numEvents; e+=1) {

				var changeEvent = this.observationEventQueue[e];

				// Find all objects that might care about changes on changeEvent.obj (parent objects, basically),
				// along with the path suffix representing the relatinship between the two.  Then run each one through
				// the matching process below.

				var observationsToCheck = [];

				// should exist for any notification, since set() creates an observer entry for every root object it receives
				var o = this.observedObjects.indexOf(changeEvent.object);
				if (o >= 0) {
					var record = {};
					record.index = o;
					record.observation = this.observations[o];
					record.callbackStruct = this.observationCallbacks[o];
					record.suffix = '';
					observationsToCheck.push(record);
				} else {
					continue;  // current scheme expects any objects passed to set() or observe() to exist in observedObjects
				}

				// find all paths from other objects to us
				for (i=0; i<this.observedObjects.length; i++) {
					if (i==o) continue;
					var relationship = this.relationships[i][o];
					if (relationship.path != null) {
						var record = {};
						record.index = o;
						record.observation = this.observations[i];
						record.callbackStruct = this.observationCallbacks[i];
						record.suffix = relationship.path;
						observationsToCheck.push(record);
					}
				}

				for (var r=0; r<observationsToCheck.length; r++) {

					var observationRecord = observationsToCheck[r];
					var observation = observationRecord.observation;
					var origPath = changeEvent.path;
					var changedPath  = observationRecord.suffix + origPath;

					for (var path in observation) {

						if (observation.hasOwnProperty(path)) {

							// need to match two conditions: (1) the regex definiing the exact piece of data to watch and whether
							// to watch children of this data field and (2) a wholesale change to a parent data field.

							// if the straight observer pattern doesn't match, check to see if the change is happening to a parent
							// of us.

							var match=false;
							if (!changedPath.match(path)) {

								var numDelimsInEventPath = (changedPath.match(/\//g) || []).length;   // TBD: hard-wired to delim = '/'
								var numDelimsInObservationPath = (path.match(/\//g) || []).length;

								if (numDelimsInObservationPath > numDelimsInEventPath) {
									var tokens = path.split(this.delim).slice(0, numDelimsInEventPath+1);
									var subPath = tokens.join(this.delim);
									match = changedPath.match(subPath); 
								}

							} else {
								match = true;
							}

							if (match) {

								var listeners = observation[path];
								if (listeners == null || listeners.length <= 0) continue;

								var callbackStruct = observationRecord.callbackStruct;
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
									eventsForEachListener[l][funcName].push(changeEvent);
								}
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

		/*
		 * @protected
		 */
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

