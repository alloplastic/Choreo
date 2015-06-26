// The tabbed panel where the user manages his scenes and what kits they contain

if (!ChoreoScenePane) {

	var ChoreoScenePane = function (options) {
		options = options || {};

		this.tabs = null;
		this.$tabParent = null;

		// this.apiRoot = options.apiRoot || window.choreo.apiRoot || '/';
		// this.fileRoot = options.fileRoot || window.choreo.fileRoot || '/';

		// this.gameData = {};
		// this.gameState = {};

	};


	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoScenePane.prototype.init = function(changes) {

		var self = this;

		this.tabs = $( ".layers-pane-tabs" ).tabs({
			beforeActivate: function(event, ui) {
				console.log("tab.");
				var $lastTab = self.$tabParent.find('li:last-child');
				if (ui.newTab[0] == $lastTab[0]) {
					console.log("Clicked plus.");
					// add a new scene to the game and (implicitly) trigger the ui to redraw
					var scenes = _c.get(_c.editor, 'gameData/scenes');
					var newScene = _c.newSceneData();
					newScene.name = '- ' + (scenes.length + 1) + ' -';
					scenes.push(newScene);
					_c.set(_c.editor, 'gameData/scenes', scenes);
				}
			}
		});

		this.$tabParent = $(".layers-pane-tabs > ul");


		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData/scenes", this, "onSceneDataChanged");		
	};

	ChoreoScenePane.prototype.onSceneDataChanged = function(changes) {

		if (!this.tabs) {
			console.log('scene-panel: scene data changed before tabs UI initialized.');
			return;
		}

		// for now, just rebuild everything.  TBD: catch low-level changes like scene names for quick transitions
		console.log("Rebuild Scenes Pane.");

		var i, a, div;

		var $tabTemplate = $(".tab-template.template");
		var $tabContentTemplate = $(".tab-content-template.template");

		//var $tabParent = $(".layers-pane-tabs > ul");
		var $tabs = $(".layers-pane-tabs > ul > li");

		var scenes = _c.get(_c.editor.gameData, "scenes");

		var numScenes;
		if (!scenes || scenes.length <= 0) numScenes = 0;
		else numScenes = scenes.length;

		if (numScenes <= 0) {
			console.log('scene-panel: scene data must contain at least one scene.');
			return;
		}

		if (numScenes < $tabs.length-1) {
			$tabs.slice(numScenes, $tabs.length - numScenes).remove();
		} else if (numScenes > $tabs.length-1) {
			for (i = numScenes; i>=$tabs.length-1; i--) {
				var newTab = $tabTemplate.clone().removeClass('template');
				a = newTab.find('a');
				a.attr('href', '#layers-pane-tab-' + i);
				a.text('-' + i + '-');
				$tabs.eq(i).before(newTab);
			}
			//this.tabs.tabs("option", "active", 0);			
		}

		// for each tab, rebuild the content.  The layer lists are not that big.
		$(".layers-pane-tabs > div").remove();
		var $tabsContainer = $('.layers-pane-tabs');

		for (i=0; i<numScenes+1; i++) {
			var newTabContent = $tabContentTemplate.clone().removeClass('template');
			newTabContent.attr('id', 'layers-pane-tab-' + i);
			div = newTabContent.find('div');
			div.text('This is where Layer ' + i + ' stuff goes.');
			$tabsContainer.append(newTabContent);
		}

// 		var $lastTab = this.$tabParent.find('li:last-child');
// //		var $selectedTabs=this.tabs.tabs().data("selected.tabs");
// 		var selectedTab=this.tabs.tabs('option', 'active');

// 		// never allow the plus sign to be selected, so that it will remain clickable
// 		if (selectedTab >= numScenes) {
// 			//var index = $('#tabs a[href="#simple-tab-2"]').parent().index();
// 			$("#tabs").tabs("option", "active", numScenes-1);

// 		}


		this.tabs.tabs('refresh');

		//var $tabParent = $(".layers-pane-tabs > ul");
		$a = $(".layers-pane-tabs > ul > li > a");
		for (i=0; i<$a.length-1; i++) {
			$a[i].textContent = scenes[i].name;
		}

		this.tabs.tabs("option", "active", numScenes-1);


	};

}
