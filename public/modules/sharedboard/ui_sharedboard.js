
var iconSize = 48;

var colorChoosePanelStroke = null;
var colorChoosePanelFill = null;

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

	// Tool select button
	var toolSelectButton = new sap.m.Button( {
		icon: "/public/assets/icons/sharedboard/toolFreeDrawing.png",
		press: function() {

			toolSelectMenu.open( false, null, "left top", "left bottom", toolSelectButton, "0 0", "fit" );

		},
		tooltip: 'Select tool for drawing.'
	} );

	function toolSelectFunction( oControlEvent ) {

        var button = oControlEvent.getSource();
        var toolIndex = button.data( "toolIndex" );

		sharedBoard.selectTool( toolIndex );

		toolSelectButton.setIcon( button.getIcon() );

	}

	// Tool select menu

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

	// Stroke and Fill color buttons and panels

	var canvasStrokeColor = document.createElement( "canvas" );
	canvasStrokeColor.width = iconSize;
	canvasStrokeColor.height = iconSize;

	var strokeColorButton = new sap.m.Button( {
		press: function() {
			colorChoosePanelStroke.open( false, null, "left top", "left bottom", strokeColorButton, "0 0", "fit" );
		},
		tooltip: 'Set stroke color.'
	} );

	paintIconWithColor( canvasStrokeColor, strokeColorButton, sharedBoard.currentToolState.strokeStyle );

	var canvasFillColor = document.createElement( "canvas" );
	canvasFillColor.width = iconSize;
	canvasFillColor.height = iconSize;

	var fillColorButton = new sap.m.Button( {
		press: function() {
			colorChoosePanelFill.open( false, null, "left top", "left bottom", fillColorButton, "0 0", "fit" );
		},
		tooltip: 'Set fill color.'
	} );

	paintIconWithColor( canvasFillColor, fillColorButton, sharedBoard.currentToolState.fillStyle );

	colorChoosePanelStroke = createColorChoosePanel( sharedBoard, "stroke", "Choose stroke color", function( color ) {

		sharedBoard.currentToolState.strokeStyle = color;

		paintIconWithColor( canvasStrokeColor, strokeColorButton, color );

	} );

	colorChoosePanelFill = createColorChoosePanel( sharedBoard, "fill", "Choose fill color", function( color ) {

		sharedBoard.currentToolState.fillStyle = color;

		paintIconWithColor( canvasFillColor, fillColorButton, color );

	} );

	var toolbarItems = [
		toolSelectButton,
		new sap.m.Button( {
			icon: "/public/assets/icons/sharedboard/toolEraseBoard.png",
			press: function() {
				sharedboard.toolList[ 0 ].guiStartFunction( sharedBoard, 0, 0 );
			},
			tooltip: 'Erase all the board with fill color.'
		} ),
		strokeColorButton,
		fillColorButton
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

function paintIconWithColor( canvas, button, color ) {

	var ctx2d = canvas.getContext( "2d" );
	if ( color === "transparent" ) {
		ctx2d.fillStyle = "white";
		ctx2d.fillRect( 0, 0 , canvas.width, canvas.height );
	}
	else {
		ctx2d.fillStyle = color;
		ctx2d.fillRect( 0, 0 , canvas.width, canvas.height );
	}

	setCanvasAsButtonIcon( button, canvas );

}

function createColorChoosePanel( sharedBoard, id, title, onColorChanged ) {

	var colorPalette = null;//localStorage.colorPalette;

	if ( ! colorPalette ) {

		colorPalette = [
			[ "transparent", "#FF8080", "#FFFF80", "#80FF80", "#408040", "#80FFFF", "#8080FF", "#FF80FF" ],
			[ "#FF0000", "#FF8000", "#FFFF00", "#00FF00", "#008000", "#00FFFF", "#0000FF", "#FF00FF" ],
			[]
		];

		var j = colorPalette.length - 1;
		for ( var i = 0; i < 8; i++ ) {
			var gray = Math.floor( i * 255 / 7 );
			colorPalette[ j ].push( "rgb(" + gray + ", " + gray + ", " + gray + ")" );
		}

		colorPalette.push( [ "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF" ] );
		colorPalette.push( [ "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF" ] );

		localStorage.colorPalette = colorPalette;

	}

	var canvasColorChoose = document.createElement( "canvas" );
	canvasColorChoose.width = iconSize;
	canvasColorChoose.height = iconSize;

	var rowsItems = [];

	// Rows of colors
	for ( var k = 0; k < colorPalette.length; k++ ) {

		var rowColors = colorPalette[ k ];

		var rowItems = [];

		for ( var i = 0; i < rowColors.length; i++ ) {

			var color = rowColors[ i ];

			var colorButton = new sap.m.Button( {
				press: function( oControlEvent ) {
					var button = oControlEvent.getSource();
					var color = button.data( "customColor" );

					onColorChanged( color );

					// TODO remember last button pressed to modify its color from color chooser?

				},
				customData: { Type: "sap.ui.core.CustomData", key: "customColor", value: color }
			} );

			paintIconWithColor( canvasColorChoose, colorButton, color );

			rowItems.push( colorButton );

		}

		var rowHorizontalLayout = new sap.ui.layout.HorizontalLayout( "rowColorChoosePanel" + id + "_" + k, {
			content: [
				rowItems
			]
		} );

		rowsItems.push( rowHorizontalLayout );
	}

	// Color picker

	var colorPicker = new sap.ui.commons.ColorPicker();
	var colorPickerFunction = function( oControlEvent ) {
		var color = oControlEvent.getParameters().hex;
		onColorChanged( color );
	};
	colorPicker.attachChange( colorPickerFunction );
	colorPicker.attachLiveChange( colorPickerFunction );

	var colorChoosePanelContent = new sap.ui.layout.VerticalLayout( "theColorChoosePanelContent_" + id, {
		content: [
			rowsItems,
			colorPicker
		]
	} );

	var colorChooseDialog = new sap.ui.commons.Dialog();

	colorChooseDialog.setWidth( "340px" );
    colorChooseDialog.setHeight( "470px" );
    colorChooseDialog.addStyleClass( "unselectable" );
    colorChooseDialog.setKeepInWindow( true );

    colorChooseDialog.attachClosed( function() {
        // TODO (when needed)
    } );

	colorChooseDialog.setTitle( title );

	colorChooseDialog.addContent( colorChoosePanelContent );

	return colorChooseDialog;

}