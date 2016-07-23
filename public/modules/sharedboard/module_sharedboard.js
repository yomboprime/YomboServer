
var sharedboard = {

	VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

	module.exports = {
		sharedboard: sharedboard
	};

}

// ***** Libraries *****


// ***** Module class *****

sharedboard.sharedboard = function() {

	this.latestPaintCommands = [ this.createEraseWhiteCommand() ];

};

sharedboard.sharedboard.prototype = {

	constructor: sharedboard.sharedboard

};

sharedboard.sharedboard.prototype.start = function( onStart ) {

	console.log( "sharedboard module starting on room: " + this.config.room );

	this.yomboServer.mapFile( '/public/modules/sharedboard/sharedboard.html' );
	this.yomboServer.mapFile( '/public/modules/sharedboard/ui_sharedboard.js' );
	this.yomboServer.mapFile( '/public/modules/sharedboard/main_sharedboard.js' );
	this.yomboServer.mapFile( '/public/modules/sharedboard/sharedboard.js' );

	this.yomboServer.mapDirectory( '/public/lib/openui5' );
	this.yomboServer.mapDirectory( '/public/assets/icons/sharedboard' );

	console.log( "sharedboard module started on room: " + this.config.room );

	if ( onStart ) {

		onStart();

	}

};

sharedboard.sharedboard.prototype.stop = function( onStop ) {

	console.log( "sharedboard module stopped." );

	if ( onStop ) {

		onStop();

	}

};

sharedboard.sharedboard.prototype.clientConnection = function( client ) {

	console.log( "sharedboard: Client connected." );

	// TODO insert client into this.config.room

	var scope = this;

	client.socket.on( "yssbGetLatestData", function( msg ) {

		console.log( "Some client sent yssbGetLatestData message. *****" );

		client.socket.emit( "yssbPaintCommand", scope.latestPaintCommands );

	} );

	client.socket.on( "yssbPaintCommand", function( msg ) {

		console.log( "Some client sent paint command." );

		// TODO emit to room, not to module clients array
		scope.yomboServer.emitToClientsArray( scope.clients, "yssbPaintCommand", msg );

		for ( var i = 0, il = msg.length; i < il; i++ ) {

			var cmd = msg[ i ];

			if ( cmd === null ) {
				console.log( "Error: null command." );
				continue;
			}

			if ( cmd.name === "eraseboard" ) {
				scope.latestPaintCommands = [];
			}

			scope.latestPaintCommands.push( cmd );

			if ( scope.latestPaintCommands.length > scope.config.commandStorageClean ) {
				scope.latestPaintCommands.splice( 0, Math.floor( scope.config.commandStorageClean * 0.5 ) );
				scope.latestPaintCommands.unshift( scope.createEraseWhiteCommand() );
			}

		}

	} );

	client.socket.emit( "yssbPaintCommand", scope.latestPaintCommands );

};

sharedboard.sharedboard.prototype.clientDisconnection = function( client ) {

	console.log( "sharedboard: Client disconnected." );

};

sharedboard.sharedboard.prototype.createEraseWhiteCommand = function() {
	return {
		name: "eraseboard",
		fillStyle: "white"
	};
};
