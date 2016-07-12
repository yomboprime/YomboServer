
var fork = require('child_process').fork;

var camcap = {

	VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

	module.exports = {
		camcap: camcap
	};

}

// ***** Libraries *****


// ***** Module class *****

camcap.camcap = function() {

	this.camcapChildProcess = null;

	this.lastFrame = null;

	this.onTermination = null;

};

camcap.camcap.prototype = {

	constructor: camcap.camcap

};

camcap.camcap.prototype.start = function( onStart ) {

	console.log( "camcap module starting on " + this.config.device );

	this.yomboServer.mapFile( '/public/camcap.html' );
	this.yomboServer.mapFile( '/public/js/modules/camcap/main_camcap.js' );

	this.yomboServer.mapFile( '/public/camcap2.html' );
	this.yomboServer.mapFile( '/public/js/modules/camcap/main_camcap2.js' );


	this.camcapChildProcess = fork( "public/js/modules/camcap/camcapChildProc", [ JSON.stringify( this.config ) ] );

	var scopeModule = this;
	this.camcapChildProcess.on( "message", function( message ) {

		// Worker response
		//console.log( "Child process said something: " + message.what );

		var what = message.what;
		if ( what === "frame" ) {

			if ( message.error ) {
				console.log( "Worker reported error in frame message: " + message.error );
			}

			scopeModule.lastFrame = message;

			scopeModule.yomboServer.emitToClientsArray( scopeModule.clients, "ysCamcapFrame", scopeModule.lastFrame );

		}
		else if ( what === "debug" ) {

			console.log( "Child process debug: " + message.debug );
			
		}

	} );

	this.camcapChildProcess.on( "exit", function() {

		if ( scopeModule.onTermination ) {

			console.log( "camcap module stopped. instanceName=" + scopeModule.instanceName );

			scopeModule.onTermination();

		}
		else {

			scopeModule.yomboServer.stopModule( scopeModule, function() {

				console.log( "camcap module stopped abnormally. instanceName=" + scopeModule.instanceName );

			} );

		}

	} );

	this.camcapChildProcess.send( { what: "start" } );

/*
	setTimeout( function() {

		scopeModule.camcapWorker.postMessage( "requestFrame" );

	}, this.config.captureIntervalMs );
	*/

	console.log( "camcap module started on " + this.config.device );

	if ( onStart ) {

		onStart();

	}

};

camcap.camcap.prototype.stop = function( onStop ) {

	this.onTermination = onStop;

	this.camcapChildProcess.send( { what: "requestTermination" } );

};

camcap.camcap.prototype.clientConnection = function( client ) {

	console.log( "camcap: Client connected." );

	client.socket.on( "someMessage", function( msg ) {

		console.log( "camcap:Some client sent someMessage. *****" );

	} );

};

camcap.camcap.prototype.clientDisconnection = function( client ) {

	console.log( "camcap: Client disconnected." );

};
