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

		// hack to deal with jQuery UI widgets not sizing nicely inside flexbox layout;
		// var self = this;
		// setInterval(function() { self.onTweakSize(); }, 1000);

	};


	// as a sub-component, we presume our parent has provided a jQuery global ($) and waited for the DOM to load
	ChoreoScenePane.prototype.init = function(changes) {

		var self = this;

		this.tabs = $( ".layers-pane-tabs" ).tabs({
			heightStyle: "fill",
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
					_c.editor.nextEdit();   // advance undo stack
				}
				_c.editor.uiState.setCurrentScene(ui.newTab.index());
			}
		});

		this.$tabParent = $(".layers-pane-tabs > ul");


		// register for notifications about the game data changing
		_c.observe(_c.editor, "gameData/scenes/@@@", this, "onSceneDataChanged");
		_c.observe(_c.editor, "uiState/data/@@@", this, "onUIDataChanged");	
		// _c.observe(_c.editor.uiState, "data/currentScene", this, "onUIDataChanged");	
		// _c.observe(_c.editor.uiState, "data/currentLayer", this, "onUIDataChanged");	
	};

	ChoreoScenePane.prototype.onSceneDataChanged = function(changes) {

		if (!this.tabs) {
			console.log('scene-panel: scene data changed before tabs UI initialized.');
			return;
		}

		// for now, just rebuild everything.  TBD: catch low-level changes like scene names for quick transitions
		console.log("Rebuild Scenes Pane.");

		var self = this;
		var i, a, div;

		var $tabTemplate = $(".tab-template.template");
		var $tabContentTemplate = $(".tab-content-template.template");
		var $layerItemTemplate = $(".layer-item-template.template");

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

		// adjust the number of tabs to match the number of scenes

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
		}

		// for each tab, rebuild the content.  The layer lists are not that big.
		$(".layers-pane-tabs > div").remove();
		var $tabsContainer = $('.layers-pane-tabs');

		for (i=0; i<numScenes; i++) {
			var newTabContent = $tabContentTemplate.clone().removeClass('template');
			newTabContent.attr('id', 'layers-pane-tab-' + i);

			// loop through the scene's layers/kits and display them in a list
			var kits = scenes[i].kits;
			if (kits && kits.length>0) {
				for (var j=0; j<kits.length; j++) {

					var kitName = kits[j];
					var newLayerItem = $layerItemTemplate.clone().removeClass('template');

					a = newLayerItem.find('a');
					var span = newLayerItem.find('span');
					var img = newLayerItem.find('img');

					if (kitName != null &&
						_c.editor.gameData._refs != null &&
						_c.editor.gameData._refs.kits != null) {
						var kit = _c.editor.gameData._refs.kits[kitName];
						if (kit != null) {
							if (kit.friendlyName != null) span.text(kit.friendlyName);
							if (kit.icon != null) img.attr('src', kit.icon);  // server provides complete url							
						}
					} 

					a.click(j, function (e) {
						console.log('setting current layer to ' + e.data);
						_c.set(_c.editor, 'uiState/data/currentLayer', e.data);
					});

					newTabContent.append(newLayerItem);
					//newLayerItem.attr('id', 'layers-pane-tab-' + i);
				}
			}

			//for (var x=0; x<4; x++) {
			// add the button for creating a new layer
			var finalLayerItem = $layerItemTemplate.clone().removeClass('template');

			a = finalLayerItem.find('a');
			a.click(function (event) {
					event.preventDefault();
					event.stopPropagation();
					var menu = $( ".mega-menu");
					menu.offset(a.offset());
					// menu.position({
					// 	my: "left top",
					// 	at: "left bottom",
					// 	of: a
					// });
					menu.show();			
				console.log("user added a layer; kick off mega-menu to select type.");
			});

			newTabContent.append(finalLayerItem);
//}

			// highlight the selected layer

			//div = newTabContent.find('div');
			//div.text('This is where Layer ' + i + ' stuff goes.');
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

	ChoreoScenePane.prototype.onUIDataChanged = function(changes) {

		if (!this.tabs) {
			console.log('scene-panel: UI data changed before tabs UI initialized.');
			return;
		}

		// for now, just rebuild everything.  TBD: catch low-level changes like scene names for quick transitions
		console.log("UI changes to Scenes Pane.");

		//var i, a, div;

		//var $tabParent = $(".layers-pane-tabs > ul");
//		var $tabs = $(".layers-pane-tabs > ul > li");

		var curSceneIndex = _c.editor.uiState.data.currentSceneIndex;
		var curLayer = _c.editor.uiState.data.currentLayer;

		// clear any 'selected' highlight state
		$a = $('.layers-pane-tabs > #layers-pane-tab-' + curSceneIndex + ' > div');
		for (i=0; i<$a.length-1; i++) {
			$($a[i]).removeClass('item-selected');
		}

		if (curLayer >= 0) {
			console.log("highlighting layer " + curLayer);
			var a = $($a[curLayer]);
			a.addClass('item-selected');
//			$($a[curScene]).addClass('item-selected')
		}
	};

// 	ChoreoScenePane.prototype.onTweakSize = function() {

// 		var curLayer = _c.get(_c.editor, 'uiState/data/currentLayer');

// 		if (curLayer < 0) return;

// 		var $layersPane = $(".layers-pane");
// 		var $layersPaneTabs = $(".layers-pane-tabs");
// 		var $tabNav = $(".layers-pane-tabs > .ui-tabs-nav");
// 		var $tabContent = $("#layers-pane-tab-" + curLayer);
// //		var $tabContent = $(".layers-pane-tabs > .tab-content-template");

// 		var heightOfParent = $layersPaneTabs.height();
// 		var heightOfHeader = $tabNav.height();
// 		var heightOfContent = $tabContent.height();
// 		var totalHeight = heightOfHeader + heightOfContent + 13;

// 		var remainingHeight = heightOfParent - heightOfHeader;

// 		//$layersPane.height(totalHeight).css({ "max-height": totalHeight + 'px' });
// //		$tabContent.height(remainingHeight).css({ "max-height": remainingHeight + 'px' });
// 		$tabContent.css({ "max-height": remainingHeight + 'px' });

// 		console.log('set height to ' + totalHeight);
// 	};

}
