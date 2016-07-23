
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
	toolbar = createToolbar( sharedBoard );

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

	sharedBoard.guiStartCommand( x, y );

}

function onMouseMove( event ) {

	if ( event.target !== presentationCanvas ) {

		return;

	}

	var x = event.clientX / presentationCanvas.width;
	var y = event.clientY / presentationCanvas.height;

	sharedBoard.guiContinueCommand( x, y );

}

function onMouseUp( event ) {

	if ( event.target !== presentationCanvas ) {

		return;
		
	}

	var x = event.clientX / presentationCanvas.width;
	var y = event.clientY / presentationCanvas.height;

	sharedBoard.guiEndCommand( x, y );

}

function showContextMenu( x, y ) {

	contextMenu.close();
	contextMenu.open( false, null, "left top", "left top", presentationCanvas, "" + x + " " + y, "fit" );

}

function showToolbar() {

	toolbar.close();
	toolbar.open();

}