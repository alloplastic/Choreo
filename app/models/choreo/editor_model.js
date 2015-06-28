/**
 * EditorModel - toplevel state of the editor layout.
 *
 * Since the models in this folder are mostly intended for server-side code, this one is not used
 * becuase the client manages the UI state dynamically with another model (/public/js/choreo/editor_model.js).
 */

var EditorModel = function EditorModelConstructor() {

	// not needed since these are set in home.js
	// this.apiRoot = "/";
	// this.fileRoot = "/";
	// this.gameAssetRoot = "/";
};


/**
 * Set the state of the editor UI.
 */
// UserModel.prototype.setState = function(state) {
// 	this.state = state;
// };

//Expose
module.exports = EditorModel;


