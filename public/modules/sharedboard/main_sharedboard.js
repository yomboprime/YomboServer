
// Canvas for off-screen drawing and for presentation
var firstCanvas = document.createElement( "canvas" );
var presentationCanvas = document.createElement( "canvas" );
presentationCanvas.id = "presentationCanvas";
presentationCanvas.width = 100;
presentationCanvas.height = 100;
firstCanvas.width = presentationCanvas.width;
firstCanvas.height = presentationCanvas.height;
document.body.appendChild( presentationCanvas );

// The shared board object
var sharedBoard = null;


// UI elements
var contextMenu = null;
var toolbar = null;
var textToolDialog = null;
var fileToolDialog = null;

var uiColorPicker = null;


// Wait for gui library to load and then init application
sap.ui.getCore().attachInit( function() {

	init();

} );

function init() {

	// Socket for communications with the server
    var socket = io();

	// The shared board object
	sharedBoard = new sharedboard();

	// Create UI
	contextMenu = createContextMenu();
	toolbar = createToolbar( sharedBoard, function( selectedTool ) {
		var blit = false;
		if ( selectedTool.name !== "text" ) {
			textToolDialog.dialog.close();
			blit = true;
		}
		if ( selectedTool.name !== "file" ) {
			fileToolDialog.dialog.close();
			blit = true;
		}
		if ( blit ) {
			sharedBoard.blit();
		}
	} );
	textToolDialog = createTextToolDialog( sharedBoard );
	fileToolDialog = createFileToolDialog( sharedBoard );

	sharedBoard.init( firstCanvas, presentationCanvas, socket, "thesharedboard" );

	// Add event listeners
	window.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'mouseup', onMouseUp, false );
	window.addEventListener( 'mouseleave', onMouseUp, false );
	window.addEventListener( "resize", onWindowResize, false );

	document.oncontextmenu = function( event ) {

		showContextMenu( event.clientX, event.clientY );

		return false;

	};

	// First resize
	onWindowResize();
	
}

function onWindowResize() {

	var w = window.innerWidth;
	var h = window.innerHeight;

	var size = Math.min( w, h );

	sharedBoard.resize( size );

}

function onMouseDown( event ) {

	if ( event.target !== presentationCanvas ) {
		
		return;
		
	}

	if ( event.button !== 0 ) {

		return;

	}

	var x = event.clientX / presentationCanvas.width;
	var y = event.clientY / presentationCanvas.height;

	if ( uiColorPicker ) {

		pickColor( x, y, true );

	}
	else {

		sharedBoard.guiStartCommand( x, y );

		if ( sharedBoard.currentToolState.selectedTool.name === "text" ) {

			showTextToolDialog();

		}

	}

}

function onMouseMove( event ) {

	if ( event.target !== presentationCanvas ) {

		return;

	}

	var x = event.clientX / presentationCanvas.width;
	var y = event.clientY / presentationCanvas.height;

	if ( uiColorPicker ) {

		pickColor( x, y, false );

	}
	else {

		if ( sharedBoard.currentToolState.selectedTool.name !== "text" ) {

			sharedBoard.guiContinueCommand( x, y );

		}

	}

}

function onMouseUp( event ) {

	if ( event.target !== presentationCanvas ) {

		return;
		
	}

	var currentTool = sharedBoard.currentToolState.selectedTool.name;

	if ( currentTool === "file" ) {

		sharedBoard.guiStateDown = false;

		showFileToolDialog();

	}
	else if ( currentTool !== "text" ) {

		var x = event.clientX / presentationCanvas.width;
		var y = event.clientY / presentationCanvas.height;

		sharedBoard.guiEndCommand( x, y );

	}

}

function showContextMenu( x, y ) {

	contextMenu.close();
	contextMenu.open( false, null, "left top", "left top", presentationCanvas, "" + x + " " + y, "fit" );

}

function showToolbar() {

	toolbar.close();
	toolbar.open();
	toolbar.focus();

}

function showTextToolDialog() {

	textToolDialog.dialog.open();

	refreshTextToolDialogCommand( sharedBoard, textToolDialog );

	textToolDialog.dialog.focus();

}

function showFileToolDialog() {

	fileToolDialog.dialog.open();

	refreshFileToolDialogCommand( sharedBoard, fileToolDialog );

	fileToolDialog.dialog.focus();

}

function pickColor( x, y, store ) {

	if ( ! uiColorPicker ) {
		return;
	}

	var color = getPixelFromCanvas( x * firstCanvas.width, y * firstCanvas.height, firstCanvas );

	uiColorPicker.setColorString( color );
	uiColorPicker.rerender();

	if ( store ) {
		uiColorPicker = null;
	}

}

function getPixelFromCanvas( x, y, canvas ) {

	var ctx = canvas.getContext( "2d" );

	var canvasData = ctx.getImageData( x, y, 1, 1 );
    var pixelData = canvasData.data;

	return "rgb(" + pixelData[ 0 ] + ", " + pixelData[ 1 ] + ", " + pixelData[ 2 ] + ")";

}
