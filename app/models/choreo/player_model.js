/**
 * PlayerModel - toplevel state of the player layout
 * 
 */

var PlayerModel = function PlayerModelConstructor() {
	this.gameId = "EmptyGame";
	this.uniqueName = "DefaultPlayer";
	this.apiRoot = "/";
	this.fileRoot = "/";
	this.gameAssetRoot = "/";
};

//Expose
module.exports = PlayerModel;


