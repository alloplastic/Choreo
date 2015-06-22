// Backing code for the Choreo Code Editor web module

//$ = jQuery;

if (!ChoreoCodeEditor) {

	var ChoreoCodeEditor = function (options) {
		options = options || {};

		// this.apiRoot = options.apiRoot || window.choreo.apiRoot || '/';
		// this.fileRoot = options.fileRoot || window.choreo.fileRoot || '/';

		this.programInBlocks = null;
		this.blocklyArea = null;
		this.blocklyDiv = null;
		this.blocklySVG = null;
	};

	ChoreoCodeEditor.prototype.init = function() {

		var self = this;

		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData", this);

		this.blocklyArea = $('.workspace-pane-content').get(0);
		this.blocklyDiv = $('.code-editor').get(0);

		var toolbox = this.constructToolboxForEntity(null);
		this.programInBlocks = Blockly.inject(this.blocklyDiv, {toolbox: toolbox, css: false});

		this.blocklySVG = $('.code-editor > svg').get(0);
//		blocklySVG.setAttribute('viewBox', "0 0 800 800");

		// resize blockly when our bounds change
	 	window.addEventListener('resize', function(e) { self.onResize(e); }, false);

		// hack to correct the inexact resizing of the above method
		setInterval(function() { self.onResize(null); }, 1000);

	 	this.onResize();

	};

	ChoreoCodeEditor.prototype.onDataChanged = function(changes) {

		console.log("Code Editor handle data change");
		
		var handledReload = false;  // only reload our state once

		// it's up to us how to parse the list of changes in order to take actions.

		for (var i=0; i<changes.length; i++) {
			var change = changes[i];
			switch (change.object) {
				case _c.editor:
					// if the change was at the top level, do a complete reload
					if (change.path == "gameData" && !handledReload) {
						handledReload = true;
						// TBD: look up the new current entity
						this.loadEntityCode(null);
					}
				break;
			}
		}
	}

	ChoreoCodeEditor.prototype.loadEntityCode = function(e) {

		this.clear();

		var toolbox = this.constructToolboxForEntity(e);
		this.programInBlocks.updateToolbox(toolbox);
	}

	ChoreoCodeEditor.prototype.clear = function() {
		Blockly.mainWorkspace.clear();
	};

	ChoreoCodeEditor.prototype.onResize = function(e) {

		// Compute the absolute coordinates and dimensions of blocklyArea.

		if (this.blocklyDiv == null || this.blocklyDiv == undefined) {
			this.blocklyDiv = {};
		}

		var element = this.blocklyArea;
		var x = 0;
		var y = 0;
		do {
			x += element.offsetLeft;
			y += element.offsetTop;
			element = element.offsetParent;
		} while (element);

		// Position blocklyDiv over blocklyArea.

		var offsetWidth = this.blocklyArea.offsetWidth;
		var offsetHeight = this.blocklyArea.offsetHeight;

		this.blocklyDiv.style.left = x + 'px';
		this.blocklyDiv.style.top = y + 'px';
		this.blocklyDiv.style.width = offsetWidth + 'px';
		this.blocklyDiv.style.height = offsetHeight + 'px';
		this.blocklySVG.style.width = offsetWidth + 'px';
		this.blocklySVG.style.height = offsetHeight + 'px';
 	};

	ChoreoCodeEditor.prototype.constructToolboxForEntity = function(e) {

		var toolbox = '<xml>';
		toolbox += '<category name="Control">'
		toolbox += '  <block type="controls_if"></block>';
		toolbox += '  <block type="controls_if_else"></block>';
		toolbox += '  <block type="controls_whileUntil"></block>';
		toolbox += '  <block type="controls_repeat_ext"></block>';
		toolbox += '  <block type="controls_for"></block>';
		toolbox += '  <block type="controls_forEach"></block>';
		toolbox += '  <block type="controls_flow_statements"></block>';
		toolbox += '</category>'
		toolbox += '<category name="Logic">'
		toolbox += '  <block type="logic_compare"></block>';
		toolbox += '  <block type="logic_operation"></block>';
		toolbox += '  <block type="logic_boolean"></block>';
		toolbox += '  <block type="logic_negate"></block>';
		toolbox += '</category>'
		toolbox += '<category name="Text">'
		toolbox += '  <block type="text"></block>';
		toolbox += '  <block type="text_print"></block>';
		toolbox += '  <block type="text_prompt_ext"></block>';
		toolbox += '  <block type="text_join"></block>';
		toolbox += '  <block type="text_create_join_container"></block>';
		toolbox += '  <block type="text_create_join_item"></block>';
		toolbox += '  <block type="text_append"></block>';
		toolbox += '  <block type="text_length"></block>';
		toolbox += '  <block type="text_isEmpty"></block>';
		toolbox += '  <block type="text_indexOf"></block>';
		toolbox += '  <block type="text_charAt"></block>';
		toolbox += '  <block type="text_getSubstring"></block>';
		toolbox += '  <block type="text_changeCase"></block>';
		toolbox += '  <block type="text_trim"></block>';
		toolbox += '</category>'
		toolbox += '<category name="Math">'
		toolbox += '  <block type="math_number"></block>';
		toolbox += '  <block type="math_random_int"></block>';
		toolbox += '  <block type="math_arithmetic"></block>';
		toolbox += '  <block type="math_single"></block>';
		toolbox += '  <block type="math_trig"></block>';
		toolbox += '  <block type="math_constant"></block>';
		toolbox += '  <block type="math_number_property"></block>';
		toolbox += '  <block type="math_change"></block>';
		toolbox += '  <block type="math_round"></block>';
		toolbox += '  <block type="math_on_list"></block>';
		toolbox += '  <block type="math_modulo"></block>';
		toolbox += '  <block type="math_constrain"></block>';
		toolbox += '</category>'
		toolbox += '<category name="Variables" custom="VARIABLE"></category>'
		toolbox += '<category name="Functions" custom="PROCEDURE"></category>'
		toolbox += '</xml>';

  		return (toolbox);
	}

}
// // TBD: is this how we should handle client-side communication?

// window.choreo.codeEditor = new ChoreoCodeEditor();


// //(function ($) {

// 	$(document).ready(function() {

// 		window.choreo.codeEditor.init();
		
// 	});

//})(jQuery);