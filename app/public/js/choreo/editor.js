// A page-specific JavaScript template

(function ($) { // Block scoping, to keep it out of the global namespace

	// custom functions

	$(document).ready(function() {

		// DOM is ready; put initialization here

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

})(jQuery);