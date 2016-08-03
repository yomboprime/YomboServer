
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

function createToolbar( sharedBoard, onToolSelected ) {

	// Tool select button
	var toolSelectButton = new sap.m.Button( {
		icon: "/public/assets/icons/sharedboard/mejias/lapiz.png",
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

		onToolSelected( sharedBoard.currentToolState.selectedTool );

	}

	// Tool select menu

	var toolSelectMenu = new sap.ui.unified.Menu(
	{
		items: [
			new sap.ui.unified.MenuItem( {
				text: "Free drawing",
				icon: "/public/assets/icons/sharedboard/mejias/lapiz.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 1 },
				tooltip: "Free drawing tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Line",
				icon: "/public/assets/icons/sharedboard/mejias/icono_linea.png",
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
				text: "Eraser",
				icon: "/public/assets/icons/sharedboard/mejias/goma.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 5 },
				tooltip: "Eraser tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Flood fill",
				icon: "/public/assets/icons/sharedboard/mejias/cubo_pintura.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 6 },
				tooltip: "Flood fill tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "Text",
				icon: "/public/assets/icons/sharedboard/toolText.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 7 },
				tooltip: "Text tool."
			} ),
			new sap.ui.unified.MenuItem( {
				text: "File",
				icon: "/public/assets/icons/sharedboard/mejias/archivo.png",
				select: toolSelectFunction,
				customData: { Type: "sap.ui.core.CustomData", key: "toolIndex", value: 8 },
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
			colorChoosePanelStroke.dialog.open( false, null, "left top", "left bottom", strokeColorButton, "0 0", "fit" );
			colorChoosePanelStroke.dialog.focus();
		},
		tooltip: 'Set stroke color.'
	} );

	paintIconWithColor( canvasStrokeColor, strokeColorButton, sharedBoard.currentToolState.strokeStyle );

	var canvasFillColor = document.createElement( "canvas" );
	canvasFillColor.width = iconSize;
	canvasFillColor.height = iconSize;

	var fillColorButton = new sap.m.Button( {
		press: function() {
			colorChoosePanelFill.dialog.open( false, null, "left top", "left bottom", fillColorButton, "0 0", "fit" );
			colorChoosePanelFill.dialog.focus();
		},
		tooltip: 'Set fill color.'
	} );

	paintIconWithColor( canvasFillColor, fillColorButton, sharedBoard.currentToolState.fillStyle );

	var storage = localStorage.colorPalette;
	var colorPalette = null;
	if ( storage ) {
		colorPalette = JSON.parse( storage );
	}

	if ( ! colorPalette ) {

		colorPalette = getDefaultColorPalette();

		localStorage.colorPalette = JSON.stringify( colorPalette );

	}

	colorChoosePanelStroke = createColorChoosePanel( colorPalette, "stroke", "Choose stroke color", function( color ) {

		sharedBoard.setCurrentStrokeColor( color );

		paintIconWithColor( canvasStrokeColor, strokeColorButton, color );

	} );

	colorChoosePanelFill = createColorChoosePanel( colorPalette, "fill", "Choose fill color", function( color ) {

		sharedBoard.setCurrentFillColor( color );

		paintIconWithColor( canvasFillColor, fillColorButton, color );

	} );

	var confirmClearBoardDialog = new sap.ui.commons.Dialog();
	confirmClearBoardDialog.setWidth( "200px" );
    confirmClearBoardDialog.setHeight( "90px" );
    confirmClearBoardDialog.addStyleClass( "unselectable" );
    confirmClearBoardDialog.setKeepInWindow( true );
	confirmClearBoardDialog.setModal( true );
	confirmClearBoardDialog.setTitle( "Confirm clear board" );
	confirmClearBoardDialog.addButton( new sap.ui.commons.Button( {
        text: "Cancel",
        press: function() {

			confirmClearBoardDialog.close();
			
		}
    } ) );
	confirmClearBoardDialog.addButton( new sap.ui.commons.Button( {
        text: "Confirm",
        press: function() {

			// Issue "Clear the board" command
			sharedboard.toolList[ 0 ].guiStartFunction( sharedBoard, 0, 0 );

			confirmClearBoardDialog.close();

		}
    } ) );

	// Line width icon

	var lineWidthDialog = createLineWidthDialog( sharedBoard );

	var lineWidthButton = new sap.m.Button( {
		press: function() {
			lineWidthDialog.dialog.open( false, null, "left top", "left bottom", lineWidthButton, "0 0", "fit" );
		},
		tooltip: 'Set line width'
	} );

	var canvasLineWidth = document.createElement( "canvas" );
	canvasLineWidth.width = iconSize;
	canvasLineWidth.height = iconSize;

	lineWidthDialog.canvasLineWidth = canvasLineWidth;
	lineWidthDialog.lineWidthButton = lineWidthButton;

	paintLineWidthIcon( canvasLineWidth, lineWidthButton, lineWidthDialog.lineWidthSlider.getValue() );


	// Create toolbar items and the toolbar dialog

	var toolbarItems = [
		toolSelectButton,
		strokeColorButton,
		fillColorButton,
		lineWidthButton,
		new sap.m.Button( {
			icon: "/public/assets/icons/sharedboard/trash/recyclebin_empty_48.png",
			press: function() {
				confirmClearBoardDialog.open();
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

function paintIconWithColor( canvas, button, color ) {

	var ctx2d = canvas.getContext( "2d" );
	if ( color === "transparent" ) {
		ctx2d.fillStyle = "white";
		ctx2d.fillRect( 0, 0 , canvas.width, canvas.height );

		ctx2d.fillStyle = "#808080";

		var n = 6;
		var d = iconSize / n;
		for ( var j = 0; j < 6; j++ ) {
			for ( var i = 0; i < 6; i++ ) {
				if ( ( i + j ) & 1 ) {
					ctx2d.fillRect( i * d, j * d, d, d );
				}
			}
		}
	}
	else {
		ctx2d.fillStyle = color;
		ctx2d.fillRect( 0, 0 , canvas.width, canvas.height );
	}

	setCanvasAsButtonIcon( button, canvas );

}

function paintLineWidthIcon( canvas, button, lineWidth ) {

	var ctx2d = canvas.getContext( "2d" );
	ctx2d.fillStyle = "white";
	ctx2d.fillRect( 0, 0 , canvas.width, canvas.height );

	ctx2d.fillStyle = "black";
	var d = Math.min( 40, lineWidth );
	ctx2d.fillRect( canvas.width * 0.5 - d * 0.5, 25 , d, 12 );

	ctx2d.font = "12px Courier New";
	ctx2d.textAlign = "center";
	ctx2d.fillStyle = "black";
	ctx2d.fillText( "Width", iconSize * 0.5, iconSize * 0.3 );

	setCanvasAsButtonIcon( button, canvas );

}

function createColorChoosePanel( colorPalette, id, title, onColorChanged ) {

	var canvasColorChoose = document.createElement( "canvas" );
	canvasColorChoose.width = iconSize;
	canvasColorChoose.height = iconSize;

	var rowsLayouts = [];
	var rows = [];

	var lastColorButtonPressed = null;

	// Create rows of color buttons
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

					// Remember last button pressed to modify its color from color chooser
					lastColorButtonPressed = button;

				}
			} );

			colorButton.data( "customColor", color );
			colorButton.data( "customRow", k );
			colorButton.data( "customColumn", i );

			paintIconWithColor( canvasColorChoose, colorButton, color );

			rowItems.push( colorButton );

		}

		var rowHorizontalLayout = new sap.ui.layout.HorizontalLayout( "rowColorChoosePanel" + id + "_" + k, {
			content: [
				rowItems
			]
		} );

		rowsLayouts.push( rowHorizontalLayout );
		rows.push( rowItems );
	}

	function updateColorButtonsFromPalette( rows ) {

		for ( var k = 0; k < colorPalette.length; k++ ) {

			var rowColors = colorPalette[ k ];

			var rowItems = rows[ k ];

			for ( var i = 0; i < rowColors.length; i++ ) {

				var color = rowColors[ i ];

				var colorButton = rowItems[ i ];

				paintIconWithColor( canvasColorChoose, colorButton, color );

				colorButton.data( "customColor", color );

			}

		}

	}

	updateColorButtonsFromPalette( rows );

	// Color picker

	var colorPicker = new sap.ui.commons.ColorPicker();
	var lastColorPickerColor = "#000000";
	var colorPickerFunction = function( oControlEvent ) {
		var color = oControlEvent.getParameters().hex;
		lastColorPickerColor = color;
		onColorChanged( color );
	};
	colorPicker.attachChange( colorPickerFunction );
	colorPicker.attachLiveChange( colorPickerFunction );

	// Color picker related buttons

	var storeColorInPaletteButton = new sap.m.Button( {
		icon: "/public/assets/icons/sharedboard/paletteArrows/arrow_up.png",
		press: function( oControlEvent ) {

			if ( lastColorButtonPressed !== null ) {

				var row = lastColorButtonPressed.data( "customRow" );
				var column = lastColorButtonPressed.data( "customColumn" );

				if ( row === 0 && column === 0 ) {
					// Don't let change the transparent color
					return;
				}

				colorPalette[ row ][ column ] = lastColorPickerColor;

				localStorage.colorPalette = JSON.stringify( colorPalette );

				updateColorButtonsFromPalette( colorChoosePanelStroke.rows );
				updateColorButtonsFromPalette( colorChoosePanelFill.rows );

				onColorChanged( lastColorPickerColor );

			}

		},
		tooltip: "Set last selected palette entry to the color picker current color."
	} );

	var storePaletteInColorChooserButton = new sap.m.Button( {
		icon: "/public/assets/icons/sharedboard/paletteArrows/arrow_down.png",
		press: function( oControlEvent ) {

			if ( lastColorButtonPressed !== null ) {

				var row = lastColorButtonPressed.data( "customRow" );
				var column = lastColorButtonPressed.data( "customColumn" );

				var color = colorPalette[ row ][ column ];

				colorPicker.setColorString( color );

				colorPicker.rerender();

				onColorChanged( color );

			}

		},
		tooltip: "Set current picker color to the last selected palette entry color."
	} );

	var getColorFromBoard = new sap.m.Button( {
		icon: "/public/assets/icons/sharedboard/cc/Inkscape_icons_color_picker.png",
		press: function( oControlEvent ) {
			uiColorPicker = colorPicker;
		},
		tooltip: "Get a color by clicking on the board."
	} );

	var colorPickerVerticalLayout = new sap.ui.layout.VerticalLayout( "theColorChooseVerticalLayout_" + id, {
		content: [
			storeColorInPaletteButton,
			storePaletteInColorChooserButton,
			getColorFromBoard
		]
	} );

	var colorPickerHorizontalLayout = new sap.ui.layout.HorizontalLayout( "theColorChooseHorizontalLayout_" + id, {
		content: [
			colorPicker,
			colorPickerVerticalLayout
		]
	} );

	var colorChoosePanelContent = new sap.ui.layout.VerticalLayout( "theColorChoosePanelContent_" + id, {
		content: [
			rowsLayouts,
			colorPickerHorizontalLayout
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

	return {
		dialog: colorChooseDialog,
		rows: rows
	};

}

function getDefaultColorPalette() {

	var colorPalette = [
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

	return colorPalette;

}

function createTextToolDialog( sharedBoard ) {

	// Font family combo box

	var fontFamilies = sharedboard.getTextFontFamilyList();
	
	var fontFamilyData = [];
	
	for ( var i = 0, il = fontFamilies.length; i < il; i++ ) {
		
		fontFamilyData.push( { name: fontFamilies[ i ] } );
		
	}

	var model = new sap.ui.model.json.JSONModel( {

		fontFamilyData: fontFamilyData
		
	} );
	sap.ui.getCore().setModel( model );


	var fontFamilyCombo = new sap.m.ComboBox( {
		items : {
		path : "/fontFamilyData",
			template : new sap.ui.core.ListItem( {
				key: "{name}",
				text: "{name}"
			} )
		},
		selectionChange: function() {
			
			refreshTextToolDialogCommand( sharedBoard, textToolDialogObject );

			//var model = sap.ui.getCore().getModel();
			//model.setProperty('/selected', obj.text);
		}
	} );

	fontFamilyCombo.setSelectedKey( fontFamilies[ 0 ] );
	fontFamilyCombo.setTooltip( "Select font family" );

	// Text size text edit field

	var textSizeTextField = new sap.ui.commons.TextField();
	textSizeTextField.attachChange( function( oControlEvent ) {

		refreshTextToolDialogCommand( sharedBoard, textToolDialogObject );
		
	} );
	textSizeTextField.setWidth( "129px" );
	textSizeTextField.setValue( 20 );
	var textSizeWidget = createDialogLabelForWidget( "Text height (pixels): ", textSizeTextField );

	// Italic checkbox

	var italicCheckbox = new sap.ui.commons.CheckBox( { text: "Italic" } );
	italicCheckbox.attachChange( function( oControlEvent ) {

		refreshTextToolDialogCommand( sharedBoard, textToolDialogObject );

	} );

	// Bold checkbox

	var boldCheckbox = new sap.ui.commons.CheckBox( { text: "Bold" } );
	boldCheckbox.attachChange( function( oControlEvent ) {

		refreshTextToolDialogCommand( sharedBoard, textToolDialogObject );

	} );

	// Text area

	var textArea = new sap.ui.commons.TextArea();
	textArea.setCols( 28 );
	textArea.setRows( 5 );
	textArea.attachLiveChange( function( oControlEvent ) {

		refreshTextToolDialogCommand( sharedBoard, textToolDialogObject, oControlEvent.getParameters().liveValue );

	} );

	var textToolPanelContent = new sap.ui.layout.VerticalLayout( "theTextToolPanelContent", {
		content: [
			fontFamilyCombo,
			textSizeWidget,
			italicCheckbox,
			boldCheckbox,
			textArea
		]
	} );

	var textToolDialog = new sap.ui.commons.Dialog();

	textToolDialog.setWidth( "255px" );
    textToolDialog.setHeight( "315px" );
    textToolDialog.addStyleClass( "unselectable" );
    textToolDialog.setKeepInWindow( true );

    textToolDialog.attachClosed( function() {
        sharedBoard.currentToolState.currentCommand = null;
		textToolDialog.close();
		sharedBoard.blit();
    } );

	textToolDialog.setTitle( "Enter text and style" );

	textToolDialog.addContent( textToolPanelContent );

	textToolDialog.addButton( new sap.ui.commons.Button( {
        text: "Cancel",
        press: function() {
			textToolDialog.close();
		}
    } ) );

	textToolDialog.addButton( new sap.ui.commons.Button( {
        text: "Accept",
        press: function() {
            var cmd = sharedBoard.currentToolState.currentCommand;
			if ( cmd ) {
				sharedBoard.guiEndCommand( cmd.x, cmd.y );
				textToolDialog.close();
			}
		}
    } ) );


	var textToolDialogObject = {
		dialog: textToolDialog,
		fontFamilyCombo: fontFamilyCombo,
		textSizeTextField: textSizeTextField,
		italicCheckbox: italicCheckbox,
		boldCheckbox: boldCheckbox,
		textArea: textArea
	};

	return textToolDialogObject;

}

function createDialogLabelForWidget( labelString, widget ) {

    // Returns a horizontal layout containing the label and the widget

    return new sap.ui.layout.HorizontalLayout( {
        content: [
            new sap.ui.commons.TextView( { text: labelString } ),
            widget
        ]
    } );

};

function refreshTextToolDialogCommand( sharedBoard, textToolDialogObject, liveText ) {

	var cmd = sharedBoard.currentToolState.currentCommand;
	if ( cmd ) {

		var selObj = textToolDialog.fontFamilyCombo.getSelectedItem().getBindingContext().getObject();
		if ( selObj ) {
			cmd.fontFamily = selObj.name;
		}


		var v = textToolDialog.textSizeTextField.getValue();
		var value = new Number( v );
		if ( Number.isNaN( value ) ) {
			return;
		}
		value = Math.floor( value );
		if ( 1000 < value ) {
			value = 1000;
		}
		if ( 1 > value ) {
			value = 1;
		}
		textToolDialog.textSizeTextField.setValue( value );
		cmd.fontSize = value;

		cmd.italic = textToolDialog.italicCheckbox.getChecked();

		cmd.bold = textToolDialog.boldCheckbox.getChecked();

		cmd.text = liveText || textToolDialog.textArea.getValue();

		sharedBoard.guiContinueCommand( cmd.x, cmd.y );

	}

}

function createLineWidthDialog( sharedBoard ) {

	var lineWidthSlider = new sap.ui.commons.Slider( {
		min: 1,
		max: 20,
		smallStepWidth: 1,
		stepLabels: true,
		totalUnits: 5,
		value: 1,
		vertical: true,
		width: "50px",
		height: "200px"
	} );

	lineWidthSlider.attachLiveChange( function() {

		var lineWidth = lineWidthSlider.getValue();

		sharedBoard.setCurrentLineWidth( lineWidth );

		paintLineWidthIcon( lineWidthDialogObject.canvasLineWidth, lineWidthDialogObject.lineWidthButton, lineWidth );

	} );


	var lineWidthPanelContent = new sap.ui.layout.VerticalLayout( "theLineWidthPanelContent", {
		content: [
			lineWidthSlider
		]
	} );

	var lineWidthDialog = new sap.ui.commons.Dialog();

	lineWidthDialog.setWidth( "105px" );
    lineWidthDialog.setHeight( "280px" );
    lineWidthDialog.addStyleClass( "unselectable" );
    lineWidthDialog.setKeepInWindow( true );

    lineWidthDialog.attachClosed( function() {
        // TODO (when needed)
    } );

	lineWidthDialog.setTitle( "Width" );

	lineWidthDialog.addContent( lineWidthPanelContent );

	var lineWidthDialogObject = {
		dialog: lineWidthDialog,
		lineWidthSlider: lineWidthSlider
	};

	return lineWidthDialogObject;

}

function createFileToolDialog( sharedBoard ) {

	var constraintAspectCheckbox = new sap.ui.commons.CheckBox( { text: "Constraint aspect to original image" } );
	constraintAspectCheckbox.attachChange( function( oControlEvent ) {

		refreshFileToolDialogCommand( sharedBoard, fileToolDialogObject );

	} );


	var fileToolImageOptionsPanelContent = new sap.ui.layout.VerticalLayout( "theFileToolImageOptionsPanelContent", {
		content: [
			constraintAspectCheckbox
		]
	} );

	var fileToolDialog = new sap.ui.commons.Dialog();

	fileToolDialog.setWidth( "500px" );
    fileToolDialog.setHeight( "500px" );
    fileToolDialog.addStyleClass( "unselectable" );
    fileToolDialog.setKeepInWindow( true );

    fileToolDialog.attachClosed( function() {
        sharedBoard.currentToolState.currentCommand = null;
		fileToolDialog.close();
		sharedBoard.blit();
    } );

	fileToolDialog.setTitle( "File tool" );

	fileToolDialog.addContent( fileToolImageOptionsPanelContent );

	fileToolDialog.addButton( new sap.ui.commons.Button( {
        text: "Cancel",
        press: function() {
			fileToolDialog.close();
		}
    } ) );

	fileToolDialog.addButton( new sap.ui.commons.Button( {
        text: "Accept",
        press: function() {
            var cmd = sharedBoard.currentToolState.currentCommand;
			if ( cmd ) {
				sharedBoard.guiEndCommand( cmd.x, cmd.y );
				fileToolDialog.close();
			}
		}
    } ) );


	var fileToolDialogObject = {
		dialog: fileToolDialog,
		constraintAspectCheckbox: constraintAspectCheckbox
	};

	return fileToolDialogObject;

}

function refreshFileToolDialogCommand( sharedBoard, fileToolDialogObject ) {

	var cmd = sharedBoard.currentToolState.currentCommand;
	if ( cmd ) {

		var previousConstraintAspect = cmd.constraintAspect;
		cmd.constraintAspect = fileToolDialogObject.constraintAspectCheckbox.getChecked();
		if ( ! cmd.constraintAspect && previousConstraintAspect ) {

			cmd.width = cmd.userWidth;
			cmd.height = cmd.userHeight;

		}

		sharedBoard.guiContinueCommand( cmd.x, cmd.y );

	}

}
