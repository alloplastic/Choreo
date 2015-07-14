For production builds, we need only:

     blocky_compressed.js
     blocks_compressed.js
     javascript_compressed.js (needed?)
     /media
     /msg (not loading languages dynamically yet)




     replacing with "Blockly.mainWorkspace" fixes the issue.

     In workspace_svg.js

     Blockly.WorkspaceSvg.prototype.zoom()

       center = center.matrixTransform(workspace.getCanvas().getCTM().inverse());
       ...
  	   var canvas = workspace.getCanvas();


     Blockly.WorkspaceSvg.prototype.zoomReset()

     workspace.scrollbar.set(-metrics.contentLeft, -metrics.contentTop);
