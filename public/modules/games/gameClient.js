
var socket = null;
var entityClasses = [];
var entities = [];
var thePlayerId = null;

if ( sap ) {
    sap.ui.getCore().attachInit( init );
}
else {
    init();
}

function init() {

    function createNewEntity( instanceDataClient ) {

        var entityClass = entityClasses[ instanceDataClient.entityClassId ];

        if ( ! entityClass ) {
            console.error( "Error creating entity instance: can't find entity class: " + instanceDataClient.entityClassId );
            return;
        }

        var entity = entityClass.createNewInstanceFunction( instanceDataClient );

        entity.entityId = instanceDataClient.entityId;
        entity.entityClassId = instanceDataClient.entityClassId;

        if ( ! entity ) {
            console.error( "Error creating instance of class " + entityClass.name );
            return;
        }

        entities[ instanceDataClient.entityId ] = entity;

        console.log( "Entity instance of class " + entityClass.name + " created." );

    }

    // Socket for communications with the server
    socket = io();

    socket.on( "gmPlayerId", function( playerId ) {
        thePlayerId = playerId;
    } );

    socket.on( "gmNewEntityClass", function( entityClass ) {

        // New entity class definition comes from the server

        entityClass.createNewInstanceFunction = new Function( "instanceDataClient", entityClass.createNewInstance );
        entityClass.updateEntityFunction = new Function( "entity", "instanceDataClient", entityClass.updateEntity );

        entityClasses[ entityClass.id ] = entityClass;

        console.log( "Entity class " + entityClass.name + " created." );

    } );

    socket.on( "gmNewEntity", function( instanceDataClient ) {

        createNewEntity( instanceDataClient );

    } );

    socket.on( "gmNewEntities", function( instanceDataClientArray ) {

        var n = instanceDataClientArray.length;
        for ( var i = 0; i < n; i ++ ) {
            createNewEntity( instanceDataClientArray[ i ] );
        }

    } );

    socket.on( "gmData", function( data ) {

        // Here comes updated data for the entities
        var n = data.length;
        for ( var i = 0; i < n; i ++ ) {
            var d = data[ i ];
            var e = entities[ d.entityId ];
            entityClasses[ e.entityClassId ].updateEntityFunction( e, d );
        }

    } );

    socket.on( "ysConnectedToModule", function( msg ) {
        // Nothing to do yet
        console.log( "Connected to module." );
    } );

    socket.on( "ysDisconnectedFromModule", function( msg ) {
        // Nothing to do yet
        console.log( "Disconnected from module." );
    } );

    socket.on( "disconnect", function( msg ) {
        alert( "The connection with the server was closed." );
    } );

    // Connect to server game module
    socket.emit( "ysConnectToModule", { moduleName: "games", instanceName: gameModuleName } );

}