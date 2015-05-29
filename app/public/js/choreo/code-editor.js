// Backing code for the Choreo Code Editor web module

(function ($) { // Block scoping, to keep it out of the global namespace


	var programInBlocks = null;

	$(document).ready(function() {

		var blocklyArea = $('.workspace-pane-content').get(0);
		var blocklyDiv = $('.code-editor').get(0);

		programInBlocks = Blockly.inject(blocklyDiv, {toolbox: document.getElementById('toolbox')});

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