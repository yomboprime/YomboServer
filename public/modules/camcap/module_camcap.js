
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

	this.yomboServer.mapFile( '/public/modules/camcap/camcap.html' );
	this.yomboServer.mapFile( '/public/modules/camcap/main_camcap.js' );

	this.yomboServer.mapFile( '/public/modules/camcap/camcap2.html' );
	this.yomboServer.mapFile( '/public/modules/camcap/main_camcap2.js' );

	this.yomboServer.logInfo( "Starting camera capture. Device: " + this.config.device, "camcap.start", this.name, this.instanceName );

	this.camcapChildProcess = fork( "public/modules/camcap/camcapChildProc", [ JSON.stringify( this.config ) ] );

	var scopeModule = this;
	this.camcapChildProcess.on( "message", function( message ) {

		// Worker response

		var what = message.what;
		if ( what === "frame" ) {

			if ( message.error ) {
				scopeModule.yomboServer.logError( "Worker reported error in frame message: " + message.error, "camcap.start", scopeModule.name, scopeModule.instanceName );
			}

			scopeModule.lastFrame = message;

			scopeModule.yomboServer.emitToClientsArray( scopeModule.clients, "ysCamcapFrame", scopeModule.lastFrame );

		}
		else if ( what === "error" ) {

			scopeModule.yomboServer.stopModule( scopeModule, function() {
				scopeModule.yomboServer.logError( "camcap terminated due to subprocess error: " + message.error, "camcap.start", scopeModule.name, scopeModule.instanceName );
			} );

		}
		else if ( what === "debug" ) {

			scopeModule.yomboServer.logInfo( "Child process debug: " + message.debug, "camcap.start", scopeModule.name, scopeModule.instanceName );
			
		}

	} );

	this.camcapChildProcess.on( "exit", function() {

		scopeModule.camcapChildProcess = null;

		if ( scopeModule.onTermination ) {

			scopeModule.onTermination();

		}
		else {

			scopeModule.yomboServer.stopModule( scopeModule, function() {

				scopeModule.yomboServer.logError( "camcap module stopped abnormally", "camcap.start", scopeModule.name, scopeModule.instanceName );

			} );

		}

	} );

	this.camcapChildProcess.send( { what: "start" } );

	if ( onStart ) {

		onStart();

	}

};

camcap.camcap.prototype.stop = function( onStop ) {

	if ( this.camcapChildProcess ) {
		this.onTermination = onStop;
		this.camcapChildProcess.send( { what: "requestTermination" } );
	}
	else {
		if ( onStop ) {
			onStop();
		}
	}

};

camcap.camcap.prototype.clientConnection = function( client ) {

	return true;

};

camcap.camcap.prototype.clientDisconnection = function( client ) {

	// Nothing to do here yet

};
