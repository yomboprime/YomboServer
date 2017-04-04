
var games = {

    VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

    module.exports = {
        games: games
    };

}

// ***** Libraries *****


// ***** Module class *****

games.games = function() {

    // Nothing to do

};

games.games.prototype = {

    constructor: games.games

};

games.games.prototype.start = function( onStart ) {

    this.gameCode = require( "./" + this.config.gameName + "/" + this.config.gameName + ".js" );

    var functions = ["init", "shutdown", "onClientConnection", "onClientDisconnection", "onClientInput"];

    var errorMessage = null;
    if ( ! this.gameCode ) {
        errorMessage = "Game module terminated: can't find code file " + this.config.gameName + ".js";
    }
    else {
        for ( var i = 0; i < functions.length; i ++ ) {
            if ( ! this.gameCode[ functions[ i ] ] ) {
                errorMessage = "Game module terminated: can't find " + functions[ i ] + " function in code file: " + this.config.gameName + ".js";
                break;
            }
        }
    }

    this.theRoom = this.yomboServer.createRoom( this, "gm" + this.instanceName, this.config.maxPlayersPerRoom, false );
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

        // Init module data
        this.entityClasses = [];
        this.entities = [];
        this.nextPlayerId = 0;

        this.clientEvents.push( "gmInput" );

        // Start the game
        this.gameCode.init( this );
    }

    if ( onStart ) {

        onStart();

    }

};

games.games.prototype.stop = function( onStop ) {

    this.gameCode.shutdown( this );

    if ( onStop ) {

        onStop();

    }

};

games.games.prototype.clientConnection = function( client, msg ) {

    client.gm = {
        playerId: this.nextPlayerId ++,
        entity: null
    };

    // Insert client into the room
    if ( ! this.yomboServer.joinClientToRoom( client, this.theRoom ) ) {
        return false;
    }

    var gameCode = this.gameCode;
    var scopeModule = this;

    client.socket.on( "gmInput", function( inputData ) {

        gameCode.onClientInput( scopeModule, client, inputData );

    } );

    this.gameCode.onClientConnection( this, client );

    return true;

};

games.games.prototype.clientDisconnection = function( client ) {

    this.gameCode.onClientDisconnection( this, client );

    this.yomboServer.removeClientFromRoom( client, this.theRoom );

};

games.games.prototype.createNewEntityClass = function( entityClassName, createNewInstanceServer, createNewInstanceClient, updateEntityClient ) {

    var entityClass = this.yomboServer.searchByValue( this.entityClasses, "name", entityClassName );

    if ( entityClass ) {
        this.yomboServer.logError( "Entity class already exists", "games.createNewEntityClass", this.name, this.instanceName );
        return null;
    }

    entityClass = {
        id: - 1,
        name: entityClassName,
        createNewInstanceServer: createNewInstanceServer,
        createNewInstanceClient: createNewInstanceClient,
        updateEntityClient: updateEntityClient
    };

    var entityClassId = this.entityClasses.push( entityClass ) - 1;

    entityClass.id = entityClassId;

    var entityClassMsg = this.getEntityClassMsg( entityClass );
    this.yomboServer.emitToRoom( this.theRoom, "gmNewEntityClass", entityClassMsg );

    return entityClass;

};

games.games.prototype.getEntityClassMsg = function( entityClass ) {

    return {
        name: entityClass.name,
        id: entityClass.id,
        createNewInstance: this.yomboServer.getFunctionBody( entityClass.createNewInstanceClient ),
        updateEntity: this.yomboServer.getFunctionBody( entityClass.updateEntityClient )
    };

};

games.games.prototype.createNewEntityInstance = function( entityClassName, instanceDataServer, instanceDataClient ) {

    var entityClass = this.yomboServer.searchByValue( this.entityClasses, "name", entityClassName );

    if ( ! entityClass ) {
        this.yomboServer.logError( "Entity class not found: " + entityClassName, "games.createNewEntityInstance", this.name, this.instanceName );
        return null;
    }

    // Entity constructor must define entity.instanceData, the data that will be updated (must be at least an empty object)
    var entity = entityClass.createNewInstanceServer( this, instanceDataServer, instanceDataClient );

    if ( ! entity ) {
        this.yomboServer.logError( "Error while creating entity instance of class " + entityClassName, "games.createNewEntityInstance", this.name, this.instanceName );
        return null;
    }

    var entityInstanceId = this.entities.push( entity ) - 1;

    instanceDataClient.entityId = entityInstanceId;
    instanceDataClient.entityClassId = entityClass.id;

    entity.instanceCreationData = instanceDataClient;

    entity.instanceData.entityId = entityInstanceId;
    entity.instanceData.destroyed = false;

    // Emit "new instance" message to clients
    this.yomboServer.emitToRoom( this.theRoom, "gmNewEntity", instanceDataClient );

    return entity;

};

games.games.prototype.destroyEntityInstance = function( entity ) {

    entity.instanceData.destroyed = true;

    this.entities[ entity.instanceData.entityId ] = null;

};

games.games.prototype.emitEntityInstanceData = function( entity ) {

    this.yomboServer.emitToRoom( this.theRoom, "gmData", [ entity.instanceData ] );

};

games.games.prototype.emitEntitiesInstanceData = function( entitiesArray ) {

    var msgArray = [];
    var n = entitiesArray.length;
    for ( var i = 0; i < n; i ++ ) {
        var e = entitiesArray[ i ];
        if ( e ) {
            msgArray.push( e.instanceData );
        }
    }

    this.yomboServer.emitToRoom( this.theRoom, "gmData", msgArray );

};

games.games.prototype.emitEntitiesInstanceDataArray = function( instanceDataArray ) {

    this.yomboServer.emitToRoom( this.theRoom, "gmData", instanceDataArray );

};

games.games.prototype.emitEntitiesCreationData = function( socket ) {

    var msgArray = [];
    var n = this.entities.length;
    for ( var i = 0; i < n; i ++ ) {
        var e = this.entities[ i ];
        if ( e ) {
            msgArray.push( e.instanceCreationData );
        }
    }

    socket.emit( "gmNewEntities", msgArray );

};

games.games.prototype.initPlayer = function( client, playerEntityClassName, instanceDataServer, instanceDataClient ) {

    // Creates player entity and sends to the client all the information on all entity classes and entity instances

    var socket = client.socket;

    // Send player id message
    socket.emit( "gmPlayerId", client.gm.playerId );

    // Send all entity classes definitions
    // TODO send an initial "classes count" message so the client can make a progress bar. Perhaps in the gmPlayerId message
    var nc = this.entityClasses.length;
    for ( var i = 0; i < nc; i ++ ) {
        var entityClassMsg = this.getEntityClassMsg( this.entityClasses[ i ] );
        socket.emit( "gmNewEntityClass", entityClassMsg );
    }

    // Send all entities creation messages
    this.emitEntitiesCreationData( socket );

    // Create player entity
    var entity = this.createNewEntityInstance( playerEntityClassName, instanceDataServer, instanceDataClient );
    client.entity = entity;

    return entity;
};
