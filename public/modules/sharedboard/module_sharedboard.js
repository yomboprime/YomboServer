
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

	// Nothing to do

};

sharedboard.sharedboard.prototype = {

	constructor: sharedboard.sharedboard

};

sharedboard.sharedboard.prototype.start = function( onStart ) {

	console.log( "sharedboard module starting" );

	this.yomboServer.mapFile( '/public/modules/sharedboard/sharedboard.html' );
	this.yomboServer.mapFile( '/public/modules/sharedboard/ui_sharedboard.js' );
	this.yomboServer.mapFile( '/public/modules/sharedboard/main_sharedboard.js' );
	this.yomboServer.mapFile( '/public/modules/sharedboard/sharedboard.js' );

	this.yomboServer.mapDirectory( '/public/assets/icons/sharedboard' );

	this.yomboServer.mapDirectory( '/public/lib/openui5' );

	this.yomboServer.mapDirectory( '/public/lib/three' );

	console.log( "sharedboard module started" );

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

	// Get the room name from the referer url
	var referer = this.yomboServer.getClientReferer( client );
	var index = referer.indexOf( "?room=" );
	if ( index < 0 ) {
		return;
	}
	var roomName = referer.substring( index + 6 );

	var room = this.yomboServer.findRoom( this, roomName );
	if ( room === null ) {
		room = this.yomboServer.createRoom( this, roomName );
		room.sharedboard = {
			latestPaintCommands: [ this.createEraseWhiteCommand() ]
		}
	}

	client.sharedboard = {
		room: room
	}

	// Insert client into the room
	this.yomboServer.joinClientToRoom( client, room );

	var scope = this;

	client.socket.on( "yssbGetLatestData", function( msg ) {

		console.log( "Some client sent yssbGetLatestData message. *****" );

		client.socket.emit( "yssbPaintCommand", room.sharedboard.latestPaintCommands );

	} );

	client.socket.on( "yssbPaintCommand", function( msg ) {

		console.log( "Some client sent paint command." );

		scope.yomboServer.emitToRoom( room, "yssbPaintCommand", msg );

		for ( var i = 0, il = msg.length; i < il; i++ ) {

			var cmd = msg[ i ];

			if ( cmd === null ) {
				console.log( "Error: null command." );
				continue;
			}

			if ( cmd.name === "eraseboard" ) {
				room.sharedboard.latestPaintCommands = [];
			}

			var latestPaintCommands = room.sharedboard.latestPaintCommands;

			latestPaintCommands.push( cmd );

			if ( latestPaintCommands.length > scope.config.commandStorageClean ) {
				latestPaintCommands.splice( 0, Math.floor( scope.config.commandStorageClean * 0.5 ) );
				latestPaintCommands.unshift( scope.createEraseWhiteCommand() );
			}

		}

	} );

	client.socket.emit( "yssbPaintCommand", room.sharedboard.latestPaintCommands );

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
