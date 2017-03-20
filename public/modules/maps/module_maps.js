
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

    // Nothing to do

};

maps.maps.prototype = {

    constructor: maps.maps

};

maps.maps.prototype.start = function( onStart ) {

    /*
     this.theRoom = this.yomboServer.createRoom( this, "gm" + this.instanceName );
     if ( this.theRoom === null ) {
     errorMessage = "Error: room already exists";
     }
     
     var scopeModule = this;
     
     if ( errorMessage ) {
     setImmediate( function() {
     scopeModule.yomboServer.stopModule( scopeModule, function() {
     scopeModule.yomboServer.logError( errorMessage, "games.start", scopeModule.name, scopeModule.instanceName );
     } );
     } );
     
     }
     else {
     */
    // Init module data


    this.yomboServer.mapDirectoryWithToken( "/tiles/", "../../private/yomboserver", this.tokensRaw );

//todo obtener tokens de todos los modulos de un fichero json obtenido de la ruta privada configurada en la config normal
//esa ruta es "../../private/yomboserver", a la que se agrega "/privateConfig.json"
//las private config pueden ir por launch y por instancia, y se agregan como privateConfig en la config de cada modulo
    //this.clientEvents.push( "gmInput" );

    if ( onStart ) {

        onStart();

    }

};

maps.maps.prototype.stop = function( onStop ) {

    if ( onStop ) {

        onStop();

    }

};

maps.maps.prototype.clientConnection = function( client ) {

    client.map = {
        token: null
    };

    // Insert client into the room
    //this.yomboServer.joinClientToRoom( client, this.theRoom );

    var scopeModule = this;

//	client.socket.on( "mapXXX", function( inputData ) {


//	} );

    return true;

};

maps.maps.prototype.clientDisconnection = function( client ) {

    //this.yomboServer.removeClientFromRoom( client, this.theRoom );

};
