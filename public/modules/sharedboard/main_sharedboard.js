
var firstCanvas = document.createElement( "canvas" );
var presentationCanvas = document.createElement( "canvas" );
presentationCanvas.id = "presentationCanvas";
//presentationCanvas.style = "margin: auto;"

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

	window.addEventListener( "resize", onWindowResize, false );



	onWindowResize();
}

function onWindowResize() {

	console.log( "main_resize" );

	var w = window.innerWidth - 20;
	var h = window.innerHeight - 20;

	var size = Math.min( w, h );

	sharedBoard.resize( size );

}
