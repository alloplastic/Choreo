// TBD: create an object of an expected name (Kit2dGamePhaserCompiler) with expected names
// of functions for compiling entities into script code, writing out a runtime.js file; etc.

_c.kits = _c.kits || {};
_c.kits.Kit2dGamePhaserCompiler = function () {
	this.__proto__.__proto__ = new _c.Compiler();
};

_c.kits.Kit2dGamePhaserCompiler.prototype = {

	codeFromBlockly: function(blockly) {
		// compilation goes here
	}
}