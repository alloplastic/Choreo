// Scripts operating on Instances of Classes

(function() {

	var Script = _c.Script;

	var player = _c.players['TestGame'];
	var classes = _c.players['TestGame'].classes;

	var scene, script;

	scene = player.scenes['SceneOne'];

	// All scripts for all layers are collected in a top-level list of scripts at the scene level.  These are the scripts
	// active during a given scene.  Technically, these scripts have access to all features (blocks) contained in the gmae
	// (i.e. all scenes).  In the UI this access should be offered, but only in a tiered fashion that does not clutter the
	// focus of a given layer.

	scene.scripts = [];


	script = new Script();
	script.id = "some_id";
	script.code = "callMethod('TestGame', 'logoEntity', 'show');";

	scene.scripts.push(script);

})();
