/**
 * Extends hogan-express to support localization tags
 * {{#__}} indicates translation
 * 
 * Namespaces defined in the text, like this <namespace>__<text>, direct the engine to read/write content to separate files.
 * (an optional feature) 
 */ 
module.exports = function(app){
	return function(req, res, next) {
		var lambdaFunction = false; // needed to get the Hogan parse function
		var self = false;
		
		function lambdaLize(context){
			if(self && typeof context.lambdas === 'undefined'){
				for(var item in context){
					self._locals[item] = context[item];
				}
			} else if(context.lambdas) {
				lambdaFunction = context.lambdas.localizeLambda();
				self = context;
			}
		};
		
		res.locals.__ = function() {
			return function(text){

				if (typeof text === "undefined") {
					text = "undefined";
				}

				lambdaLize(this);
						
				if(typeof lambdaFunction !== 'function'){
					log("view-locale.js: __ lambda function not found; check Hogan config : " + text);
					return res.__(getNameSpacedPhrase(text, req.locale));
				}
				
				return res.__(getNameSpacedPhrase(lambdaFunction(text), req.locale));
			};
		}
		
		next();
	};
};
 
/**
 * Parses a namespace for the localization directive, which should precede the "__"
 * Use of namespaces is optional.
 */
function getNameSpacedPhrase(key, locale){

	if(typeof key === 'undefined'){
		key = "undefined";
	}
	
	var result = {phrase:key, namespace:'', locale:locale};
	
	var items = key.match(/^([^_]*)__(.*)$/);
	if(items && items.length>2){
		result.namespace = items[1];
		result.phrase = items[2];
	}

	return result;
}