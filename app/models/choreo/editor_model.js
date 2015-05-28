/**
 * EditorModel - toplevel state of the editor layout
 * 
 */

var EditorModel = function EditorModelConstructor(state) {
	this.state = state;
};


/**
 * Set the state of the editor UI.
 */
UserModel.prototype.setState = function(state) {
	this.state = state;
};

//Expose
module.exports = EditorModel;


