
var maps = {

    VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

    module.exports = {
        maps: maps
    };

}

// ***** Libraries *****


// ***** Module class *****

maps.maps = function() {

    this.allowedClients = [];

};

maps.maps.prototype = {

    constructor: maps.maps

};

maps.maps.prototype.start = function( onStart ) {

    this.yomboServer.mapDirectory( "/public/lib/leaflet" );

    this.yomboServer.mapFile( "/public/modules/maps/testMap.html" );
    this.yomboServer.mapFile( "/public/modules/maps/main_testMap.js" );

    this.yomboServer.mapDirectory( "/tiles/", this.config.tilesPath );

    this.clientEvents.push( "mapsGetTagList" );

    if ( onStart ) {

        onStart();

    }

};

maps.maps.prototype.stop = function( onStop ) {

    if ( onStop ) {

        onStop();

    }

};

maps.maps.prototype.clientConnection = function( client, msg ) {

/*
    if ( ! msg.token || ! msg.token in this.config.privateConfig.tokens ) {
        return false;
    }
*/
    client.map = {
        token: msg.token
    };
/*
    // Add client id to allowed clients
    if ( this.allowedClients.indexOf( client. < 0 ) ) {
        this.allowedClients.push( )
    }
*/
    var scopeModule = this;

    socket.on( "mapsGetTagList", function( msg ) {
        
        if ( scope.config.pbfServiceEnabled ) {
            // TODO...
        }
        
    } );
    return true;

};

maps.maps.prototype.clientDisconnection = function( client ) {

    //this.yomboServer.removeClientFromRoom( client, this.theRoom );

};
