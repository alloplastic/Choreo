// A page-specific JavaScript template

(function ($) { // Block scoping, to keep it out of the global namespace

	// TBD: is this how we should handle client-side communication?
	window.choreo.editor = this;

	// TBD: really should define an editor class
	window.choreo.editor.loadGame = function(gameData) {
		if (gameData.scenes != null && gameData.scenes.length > 0) {
			window.choreo.player.loadScene(gameData.scenes[0]);
		}
	}

	// custom functions

	$(document).ready(function() {

		// load the data structure for an empty game so that the editor will function immediately
		$.getJSON( window.choreo.apiRoot + "games/TestGame", function(data) {
			if (data != null && data.status != 'error') {
				window.choreo.editor.loadGame(data);
			}
		});

		// menu management

		$('html').click(function() {
			//Hide any visible menus if a click propagates up to the body
			$( ".language-menu").hide();
		});

		$( ".language-menu").menu({
			select: function( event, ui ) {
				$(this).hide();
				if (event.toElement != null) {
					switch(event.toElement.innerText) {
						case "English":
							$.post("/setLanguage/en", {}, function() {
								window.location.reload();					    	
							});
							break;
						case "Français":
							$.post("/setLanguage/fr", {}, function() {
								window.location.reload();					    	
							});
							break;
					}
				}
			}
		});

		$( ".language-button" )
		  .button()
		  .click(function( event ) {
			event.preventDefault();
			event.stopPropagation();
			var menu = $( ".language-menu");
			menu.position({
				my: "left top",
				at: "left bottom",
				of: ".language-button"
			});
			menu.show();
		  });

		  // on initial load, populate the editor with blank game data


	});

})(jQuery);