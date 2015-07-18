/**
 * HomeModel - toplevel state of the app; use this for any full-window page
 * 
 */

var HomeModel = function HomeModelConstructor() {
	this.apiRoot = "stubAPI/";   // desktop uses static data, which is equivalent to the "stub" API for the online app
	this.fileRoot = "/";
	this.gameAssetRoot = "/";
	this.hostEnvironment = "desktop";
};

//Expose
module.exports = HomeModel;


