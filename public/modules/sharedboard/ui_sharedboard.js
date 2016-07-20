
function createContextMenu() {


	var contextMenu = new sap.ui.unified.Menu(
	{
		items: [
			new sap.ui.unified.MenuItem( {
				text: "Show/hide toolbar",
				//icon: "images/icons/open.png",
				select: function( oControlEvent ) {
					showToolbar();
				},
				tooltip: "Select tool for drawing."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Show/hide users",
				//icon: "images/icons/save.png",
				select: function( oControlEvent ) {

				},
				tooltip: "Show list of users currently connected."
			} )

		]
	} );

	contextMenu.addStyleClass( "unselectable" );

	return contextMenu;

}

function createToolbar( sharedBoard ) {

	var iconSize = 48;

	// Tool select button
	var toolSelectButton = new sap.m.Button( {
		icon: "/public/assets/icons/sharedboard/toolFreeDrawing.png",
		press: function() {
			toolSelectMenu.open( false, null, "left top", "left bottom", toolSelectButton, "0 0", "fit" );
/*
			var canvas1 = document.createElement( "canvas" );
			canvas1.width = iconSize;
			canvas1.height = iconSize;
			var ctx2d = canvas1.getContext( "2d" );
			ctx2d.fillStyle = "red";
			ctx2d.fillRect( 0, 0 , canvas1.width, canvas1.height );

			setCanvasAsButtonIcon( items[ 0 ], canvas1 );
*/

			//items[ 0 ].setIcon( "/public/assets/icons/sharedboard/2.png" );
		},
		tooltip: 'Select tool for drawing.'
	} );

	function toolSelectFunction( oControlEvent ) {

        var button = oControlEvent.getSource();
        var toolIndex = button.data( "toolIndex" );

		sharedBoard.selectTool( toolIndex );

		toolSelectButton.setIcon( button.getIcon() );

	}

	var toolSelectMenu = new sap.ui.unified.Menu(
	{
		items: [
			new sap.ui.unified.MenuItem( {
				text: "Free drawing",
				icon: "/public/assets/icons/sharedboard/toolFreeDrawing.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 1 },
				tooltip: "Free drawing tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Line",
				icon: "/public/assets/icons/sharedboard/toolLine.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 2 },
				tooltip: "Straight line tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Rectangle",
				icon: "/public/assets/icons/sharedboard/toolRectangle.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 3 },
				tooltip: "Rectangle tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Ellipse",
				icon: "/public/assets/icons/sharedboard/toolEllipse.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 4 },
				tooltip: "Ellipse tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Flood fill",
				icon: "/public/assets/icons/sharedboard/toolFloodFill.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 5 },
				tooltip: "Flood fill tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Text",
				icon: "/public/assets/icons/sharedboard/toolText.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 6 },
				tooltip: "Text tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "File",
				icon: "/public/assets/icons/sharedboard/toolFile.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 7 },
				tooltip: "File send tool."
			} )
		]
	} );

	toolSelectMenu.addStyleClass( "unselectable" );

	var toolbarItems = [
		toolSelectButton,
		new sap.m.Button( {
			icon: "/public/assets/icons/sharedboard/toolEraseBoard.png",
			press: function() {
				sharedboard.toolList[ 0 ].guiStartFunction( sharedBoard, 0, 0 );
			},
			tooltip: 'Erase all the board with fill color.'
		} )
	];

	var toolbarContent = new sap.ui.layout.HorizontalLayout( "theToolbarContent", {
		content: [
			toolbarItems
		]
	} );

	var toolbarDialog = new sap.ui.commons.Dialog();

	toolbarDialog.setWidth( "500px" );
    toolbarDialog.setHeight( "110px" );
    toolbarDialog.addStyleClass( "unselectable" );
    toolbarDialog.setKeepInWindow( true );

    toolbarDialog.attachClosed( function() {
        // TODO (when needed)
    } );

	toolbarDialog.setTitle( "Shared Board Tools" );

	toolbarDialog.addContent( toolbarContent );

	return toolbarDialog;

}

function setCanvasAsButtonIcon( sapmButton, canvas ) {

	sapmButton.setIcon( canvas.toDataURL() );

}