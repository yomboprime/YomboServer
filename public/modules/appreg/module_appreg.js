
var appreg = {

	VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

	module.exports = {
		appreg: appreg
	};

}

// ***** Libraries *****


// ***** Module class *****

appreg.appreg = function() {

	// Nothing to do

};

appreg.appreg.prototype = {

	constructor: appreg.appreg

};

appreg.appreg.prototype.start = function( onStart ) {

	this.yomboServer.mapFile( "/public/modules/appreg/main_appreg.js" );

	this.yomboServer.mapDirectory( '/public/lib/openui5' );

	var scope = this;

	var appFunction = function( params ) {

		scope.yomboServer.emitToClientsArray( scope.clients, "ysAppReg", scope.getApplicationsMessage() );

	};
	this.yomboServer.registerListener( "registerApplication", appFunction );
	this.yomboServer.registerListener( "unregisterApplication", appFunction );

	console.log( "Application Registry module started." );

	if ( onStart ) {

		onStart();

	}

};

appreg.appreg.prototype.stop = function( onStop ) {

	console.log( "Application Registry module stopped." );

	if ( onStop ) {

		onStop();

	}

};

appreg.appreg.prototype.clientConnection = function( client ) {

	console.log( "Admin module: Client connected." );

	client.socket.emit( "ysAppReg", this.getApplicationsMessage() );

};

appreg.appreg.prototype.clientDisconnection = function( client ) {

	console.log( "Admin module: Client disconnected." );

};

appreg.appreg.prototype.getApplicationsMessage = function() {

	return this.yomboServer.applications;

};