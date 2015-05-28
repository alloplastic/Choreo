// Relegate choreo-specific initialization to its own file for ease up upgrading

module.exports = function choreoInitializer() {
    
	/**
	 * append choreo-specific partials to the list registered in 01_view_engine.js
	 */

	var partials = this.get('partials');

	var needSet = false;
	
	if (partials == null) {
		needSet = true;
		partials = {};
	}

	partials["editor"] =  "choreo/editor";

	if (needSet) this.set('partials', partials);
};