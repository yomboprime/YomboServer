
var CameraCapture = require( "./CameraCapture" ).CameraCapture;

var camcap = null;

var config = JSON.parse( process.argv[ 2 ] );

process.on( "message", function( message ) {

	var what = message.what;
	if ( what === "start" ) {


		camcap = new CameraCapture.CameraCapture();

		camcap.start( config );

		process.send( { what: "debug", debug: "Child process camcap started ok: " + camcap.started } );


	}
	else if ( what === "requestTermination" ) {

		camcap.requestTermination( function() {

			process.exit();

		} );

	}

} );

//	postMessage( { what: "debug", debug: "camcap creation: " + theError } );

/*
	var data = event.data;
	var what = data.what;
	if ( what === "start" ) {
		camcap.start( scopeModule.config );
		postMessage( { what: "debug", debug: "Worker camcap started ok: " + camcap.started } );
	}
	else if ( what === "requestFrame" ) {
		camcap.requestFrame( scopeModule.config, function( image ) {
			postMessage( image );
		} );
	}
	else if ( what === "requestTermination" ) {
		camcap.requestTermination( function() {
			postMessage( {
				what: "termination"
			} );
			self.close();
		} );
	}
*/
