
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

    this.yomboServer.mapFile( "/public/modules/sharedboard/sharedboard.html" );
    this.yomboServer.mapFile( "/public/modules/sharedboard/ui_sharedboard.js" );
    this.yomboServer.mapFile( "/public/modules/sharedboard/main_sharedboard.js" );
    this.yomboServer.mapFile( "/public/modules/sharedboard/sharedboard.js" );
    this.yomboServer.mapFile( "/public/modules/sharedboard/sharedboardLoader.html" );
    this.yomboServer.mapFile( "/public/modules/sharedboard/sharedboardLoader.js" );

    this.yomboServer.mapDirectory( "/public/assets/icons/sharedboard" );

    this.yomboServer.mapDirectory( "/public/lib/openui5" );

    this.yomboServer.mapDirectory( "/public/lib/three" );

    this.clientEvents.push( "yssbGetLatestData", "yssbPaintCommand" );

    this.yomboServer.registerApplication( "SharedBoard", "A shared board for drawing", this.yomboServer.gethostURL( "public/modules/sharedboard/sharedboardLoader.html" ) );

    if ( onStart ) {

        onStart();

    }

};

sharedboard.sharedboard.prototype.stop = function( onStop ) {

    this.yomboServer.unregisterApplication( this.yomboServer.gethostURL( "public/modules/sharedboard/sharedboardLoader.html" ) );

    if ( onStop ) {

        onStop();

    }

};

sharedboard.sharedboard.prototype.clientConnection = function( client, msg ) {

    // Get the room name from client url parameter
    var params = this.yomboServer.getClientParameters( client );
    var roomName = this.yomboServer.searchByValue( params, "name", "room" );
    if ( ! roomName ) {
        client.socket.emit( "yssbError", "Please specify a room name with parameter, \"?room=<room_name>\"" );
        return false;
    }
    /*
     var index = referer.indexOf( "?room=" );
     if ( index < 0 ) {
     client.socket.emit( "yssbError", "Please specify a room name with parameter, \"?room=<room_name>\"" );
     return;
     }
     var roomName = referer.substring( index + 6 );
     */

    var room = this.yomboServer.findRoom( this, roomName.value );
    if ( room === null ) {
        room = this.yomboServer.createRoom( this, roomName.value, this.config.maxPlayersPerRoom, false );
        if ( room === null ) {
            client.socket.emit( "yssbError", "Sorry, server is plenty of rooms. Please try again later." );
            return false;
        }
        room.sharedboard = {
            latestPaintCommands: [this.createEraseWhiteCommand()]
        };
    }

    // Insert client into the room
    if ( ! this.yomboServer.joinClientToRoom( client, room ) ) {
        client.socket.emit( "yssbError", "Sorry, room is full. Please try again later." );
        return false;
    }

    client.sharedboard = {
        room: room
    };

    var scope = this;

    client.socket.on( "yssbGetLatestData", function( msg ) {

        client.socket.emit( "yssbPaintCommand", room.sharedboard.latestPaintCommands );

    } );

    client.socket.on( "yssbPaintCommand", function( msg ) {

        scope.yomboServer.emitToRoom( room, "yssbPaintCommand", msg );

        for ( var i = 0, il = msg.length; i < il; i ++ ) {

            var cmd = msg[ i ];

            if ( cmd === null ) {
                scope.yomboServer.logError( "Received null paint command.", "sharedboard.clientConnection", scope.name, scope.instanceName );
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

    return true;

};

sharedboard.sharedboard.prototype.clientDisconnection = function( client ) {

    var room = client.sharedboard.room;

    if ( room.clients.length <= 1 ) {
        this.yomboServer.removeRoom( this, room.name );
    }
    else {
        this.yomboServer.removeClientFromRoom( client, room );
    }

};

sharedboard.sharedboard.prototype.createEraseWhiteCommand = function() {
    return {
        name: "eraseboard",
        fillStyle: "white"
    };
};
