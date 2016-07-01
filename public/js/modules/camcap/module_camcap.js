
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

	this.someVariable = "someValue";

};

camcap.camcap.prototype = {

	constructor: camcap.camcap

};

camcap.camcap.prototype.start = function( onStart ) {

	console.log( "camcap module started on " + this.config.device );

	this.yomboServer.mapFile( '/public/camcap.html' );
	this.yomboServer.mapFile( '/public/js/modules/camcap/main_camcap.js' );

	if ( onStart ) {

		onStart();

	}

};

camcap.camcap.prototype.stop = function( onStop ) {

	console.log( "camcap module stopped." );

	if ( onStop ) {

		onStop();

	}

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
