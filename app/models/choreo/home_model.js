/**
 * HomeModel - toplevel state of the app; use this for any full-window page
 * 
 */

var HomeModel = function HomeModelConstructor() {
	this.apiRoot = "/";
	this.fileRoot = "/";
	this.gameAssetRoot = "/";
	this.hostEnvironment = "desktop";
};

//Expose
module.exports = HomeModel;


