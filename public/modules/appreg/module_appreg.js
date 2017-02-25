
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

	var appFunction = function() {

		scope.yomboServer.emitToClientsArray( scope.clients, "ysAppReg", scope.getApplicationsMessage() );

	};
	this.yomboServer.registerListener( this, "registerApplication", appFunction );
	this.yomboServer.registerListener( this, "unregisterApplication", appFunction );

	if ( onStart ) {

		onStart();

	}

};

appreg.appreg.prototype.stop = function( onStop ) {

	if ( onStop ) {

		onStop();

	}

};

appreg.appreg.prototype.clientConnection = function( client ) {

	client.socket.emit( "ysAppReg", this.getApplicationsMessage() );

};

appreg.appreg.prototype.clientDisconnection = function( client ) {

	// Nothing to do here yet

};

appreg.appreg.prototype.getApplicationsMessage = function() {

	return this.yomboServer.applications;

};