
var firstCanvas = document.createElement( "canvas" );
var presentationCanvas = document.createElement( "canvas" );
presentationCanvas.id = "presentationCanvas";

presentationCanvas.width = 100;
presentationCanvas.height = 100;

firstCanvas.width = presentationCanvas.width;
firstCanvas.height = presentationCanvas.height;

document.body.appendChild( presentationCanvas );

var sharedBoard = null;

init();

function init() {

	console.log( "main_init" );

    var socket = io();

	sharedBoard = new sharedboard();

	sharedBoard.init( firstCanvas, presentationCanvas, socket, "thesharedboard" );

	window.addEventListener( 'mousedown', onMouseDown, false );
	window.addEventListener( 'mousemove', onMouseMove, false );
    window.addEventListener( 'mouseup', onMouseUp, false );
	window.addEventListener( 'mouseleave', onMouseUp, false );
	window.addEventListener( "resize", onWindowResize, false );

	onWindowResize();
	
}

function onWindowResize() {

	console.log( "main_resize" );

	var w = window.innerWidth;
	var h = window.innerHeight;

	var size = Math.min( w, h );

	sharedBoard.resize( size );

}

function onMouseDown( event ) {

	if ( event.target !== presentationCanvas ) {
		
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
