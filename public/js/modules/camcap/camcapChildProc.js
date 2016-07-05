
var CameraCapture = require( "./CameraCapture" ).CameraCapture;

var camcap = null;

var config = JSON.parse( process.argv[ 2 ] );

var terminationMarked = false;

var captureFunction = function() {

	camcap.requestFrame( config, function( image ) {

		if ( terminationMarked ) {

			camcap.requestTermination( function() {

				process.exit();

			} );

		}
		else {

			process.send( image );

			setTimeout( captureFunction, config.captureIntervalMs );
			
		}

	} );
};

process.on( "message", function( message ) {

	var what = message.what;
	if ( what === "start" ) {


		camcap = new CameraCapture.CameraCapture();

		camcap.start( config );

process.send( { what: "debug", debug: "Child process camcap started ok: " + camcap.started } );

		setTimeout( captureFunction, config.captureIntervalMs );

	}
	else if ( what === "requestTermination" ) {

		terminationMarked = true;

	}

} );

