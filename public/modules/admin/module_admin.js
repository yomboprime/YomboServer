
var admin = {

    VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

    module.exports = {
        admin: admin
    };

}

// ***** Libraries *****


// ***** Module class *****

admin.admin = function() {

    // Nothing to do

};

admin.admin.prototype = {

    constructor: admin.admin

};

admin.admin.prototype.start = function( onStart ) {

    var scope = this;
    this.yomboServer.registerListener( this, "startModule", function( module ) {
        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminModuleStarted", {
            name: module.name,
            instanceName: module.instanceName,
            numberOfClients: module.clients.length
        } );

    } );

    this.yomboServer.registerListener( this, "stopModule", function( module ) {
        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminModuleStopped", {
            name: module.name,
            instanceName: module.instanceName
        } );

    } );

    this.yomboServer.registerListener( this, "clientConnected", function( client ) {

        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminClientConnected", { totalNumberOfClients: scope.yomboServer.clients.length } );

    } );

    this.yomboServer.registerListener( this, "clientDisconnected", function( client ) {

        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminClientDisconnected", { totalNumberOfClients: scope.yomboServer.clients.length } );

    } );

    this.yomboServer.registerListener( this, "clientConnectedToModule", function( params ) {

        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminClientConnectedToModule", {
            instanceName: params.module.instanceName,
            numberOfClients: params.module.clients.length
        } );

    } );

    this.yomboServer.registerListener( this, "clientDisconnectedFromModule", function( params ) {

        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminClientDisconnectedFromModule", {
            instanceName: params.module.instanceName,
            numberOfClients: params.module.clients.length
        } );

    } );

    this.yomboServer.registerListener( this, "log", function( logEntry ) {

        scope.yomboServer.emitToClientsArray( scope.clients, "ysAdminLog", logEntry );

    } );

    this.clientEvents.push( "ysAdminStartModule", "ysAdminStopModule" );

    this.yomboServer.registerApplication( "Admin", "Admin page", this.yomboServer.gethostURL( "public/modules/admin/admin.html" ) );

    if ( onStart ) {

        onStart();

    }

};

admin.admin.prototype.stop = function( onStop ) {

    // This module can't be stopped

    if ( onStop ) {

        onStop();

    }

};

admin.admin.prototype.clientConnection = function( client, msg ) {

    if ( ! client.isGod ) {

        return false;

    }

    var allDataMsg = {
        modules: [],
        launchConfigurations: [],
        totalNumberOfClients: this.yomboServer.clients.length
    };
    var modules = this.yomboServer.modules;
    for ( var i = 0, il = modules.length; i < il; i ++ ) {
        var module = modules[ i ];
        allDataMsg.modules[ i ] = {
            name: module.name,
            instanceName: module.instanceName,
            numberOfClients: module.clients.length
        };
    }
    var launchConfigs = this.yomboServer.config.launchConfigurations;
    for ( var i = 0, il = launchConfigs.length; i < il; i ++ ) {
        var launchConfig = launchConfigs[ i ];
        allDataMsg.launchConfigurations[ i ] = {
            name: launchConfig.name,
            instanceName: launchConfig.instanceName
        };
    }

    var scope = this;
    client.socket.on( "ysAdminStartModule", function( msg ) {

        if ( ! client.isGod ) {
            return;
        }

        var launchConfig = null;
        if ( msg.instanceName ) {
            launchConfig = scope.yomboServer.searchByValue( scope.yomboServer.config.launchConfigurations, "instanceName", msg.instanceName );
        }
        else {
            launchConfig = scope.yomboServer.searchByValue( scope.yomboServer.config.launchConfigurations, "name", msg.name );
        }

        if ( launchConfig ) {

            scope.yomboServer.startModule( launchConfig.name, launchConfig.instanceName, launchConfig.config );

        }

    } );

    client.socket.on( "ysAdminStopModule", function( msg ) {

        if ( ! client.isGod ) {
            return;
        }

        var module = scope.yomboServer.searchByValue( scope.yomboServer.modules, "instanceName", msg.instanceName );
        if ( module ) {

            scope.yomboServer.stopModule( module );

        }

    } );

    client.socket.on( "ysAdminGetAllTheLog", function( msg ) {

        if ( ! client.isGod ) {
            return;
        }

        client.socket.emit( "ysAdminAllTheLog", scope.yomboServer.theLog );

    } );


    client.socket.emit( "ysAdminAllData", allDataMsg );

    return true;

};

admin.admin.prototype.clientDisconnection = function( client ) {

    // Nothing to do here yet

};
