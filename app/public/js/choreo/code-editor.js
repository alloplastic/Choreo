// Backing code for the Choreo Code Editor web module

(function ($) { // Block scoping, to keep it out of the global namespace


	var programInBlocks = null;

	function constructToolbox(tags) {

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

	$(document).ready(function() {

		var blocklyArea = $('.workspace-pane-content').get(0);
		var blocklyDiv = $('.code-editor').get(0);


		var toolbox = constructToolbox(null);
		programInBlocks = Blockly.inject(blocklyDiv, {toolbox: toolbox});

		// to update the list of blocks:
		// programInBlocks.updateToolbox(newTree);

		var blocklySVG = $('.code-editor > svg').get(0);

		var onResize = function(e) {

			// Compute the absolute coordinates and dimensions of blocklyArea.

			var element = blocklyArea;
			var x = 0;
			var y = 0;
			do {
				x += element.offsetLeft;
				y += element.offsetTop;
				element = element.offsetParent;
			} while (element);

			// Position blocklyDiv over blocklyArea.

			var offsetWidth = blocklyArea.offsetWidth;
			var offsetHeight = blocklyArea.offsetHeight;

			blocklyDiv.style.left = x + 'px';
			blocklyDiv.style.top = y + 'px';
			blocklyDiv.style.width = offsetWidth + 'px';
			blocklyDiv.style.height = offsetHeight + 'px';
			blocklySVG.style.width = offsetWidth + 'px';
			blocklySVG.style.height = offsetHeight + 'px';
	 	};

	 	window.addEventListener('resize', onResize, false);

	 	// Add an interval, too, since the thing gets janked up sometimes.
		setInterval(function() { onResize(); }, 1000);

	 	onResize();
	});

})(jQuery);