
var loadJSONFileSync = require( "./public/lib/fileUtils/fileUtils.js" ).loadJSONFileSync;
var isNumeric = require( "./public/lib/mathUtils/mathUtils.js" ).isNumeric;

var YomboServer = {

    VERSION_STRING: "r1",

    DEFAULT_MAX_LOG_SIZE: 100

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

    module.exports = YomboServer;

}

// ***** Libraries *****

var fs = require( 'fs' );
var express = require( 'express' );
var app = express();
var http = require( 'http' ).Server( app );
var io = require( 'socket.io' )( http );

// ***** YomboServer class *****

YomboServer.TheServer = function() {

    process.title = "Yomboserver";

    this.inited = false;

    this.config = null;

    this.theLog = [];
    this.logConsoleTypes = ["System"];
    this.logConsoleFields = ["type", "category", "instanceName", "moduleName", "message"];
    this.maxLogSize = YomboServer.DEFAULT_MAX_LOG_SIZE;

    // Active modules
    this.modules = [];

    // Routes that have been served (can't un-serve)
    this.servedRoutes = [];

    // Resources
    this.fs = fs;
    this.http = http;
    this.app = app;
    this.express = express;
    this.io = io;

    // Listeners
    this.listenerFunctionNames = [
        "startModule",
        "stopModule",
        "clientConnected",
        "clientDisconnected",
        "clientConnectedToModule",
        "clientDisconnectedFromModule",
        "registerApplication",
        "unregisterApplication",
        "log",
        "shutdown"
    ];
    this.listeners = { };
    for ( var i = 0, il = this.listenerFunctionNames.length; i < il; i ++ ) {

        this.listeners[ this.listenerFunctionNames[ i ] ] = [];

    }

    // Clients
    this.clients = [];

    // Registered applications
    this.applications = [];

    this.LOCAL_HOST_V4 = "::ffff:127.0.0.1";
    this.LOCAL_HOST_V6 = "::1";
};

YomboServer.TheServer.prototype = {

    constructor: YomboServer

};

YomboServer.TheServer.prototype.run = function() {

    if ( this.inited ) {
        this.logWarning( "Server already running", "YomboServer.run" );
        return;
    }

    this.logSystem( "YomboServer " + YomboServer.VERSION_STRING + " is starting" );

    var scope = this;

    // Termination signal
    process.on( "SIGINT", function() {
        scope.logSystem( "SIGINT Signal Received, shutting down" );
        scope.shutDown();
    } );

    // Load config
    this.config = this.loadConfig();
    if ( this.config === null ) {
        return;
    }

    // Serve internal yomboserver services
    this.serveInternalServices();

    // Setup connection with socket.io client
    io.on( 'connection', function( socket ) {

        scope.clientConnection( socket );

    } );

    // Start listening
    var scope = this;
    http.listen( scope.config.listenPort, function() {

        // Start YomboServer modules
        scope.startModules();

        scope.inited = true;

        scope.logSystem( "YomboServer inited and listening on port " + scope.config.listenPort );

    } );

};

YomboServer.TheServer.prototype.shutDown = function() {

    this.logSystem( "YomboServer is shutting down" );

    // Send shutdown event to listeners
    this.talkToListeners( "shutdown" );

    var scope = this;

    this.stopModules( function() {

        setImmediate( function() {

            scope.logSystem( "YomboServer closed. Have a nice day! :-)" );

            process.exit( 0 );

        } );

    } );

};

YomboServer.TheServer.prototype.serveInternalServices = function() {

    if ( this.inited ) {
        this.logWarning( "Server already running", "YomboServer.serveInternalServices" );
        return;
    }

    // Serve root index.html
    this.app.get( '/', function( req, res ) {

        res.sendFile( __dirname + '/public/index.html' );

    } );

    // Serve favicon
    this.app.get( '/favicon.png', function( req, res ) {

        res.sendFile( __dirname + '/public/favicon.png' );

    } );

    // Serve changefavicon lib
    this.mapFile( "/public/lib/changefavicon/changefavicon.js" );

    // Serve favicons asset directory
    this.mapDirectory( '/public/assets/favicons' );

    var scope = this;

    // Serve Application registry service
    var appRegFunction = function( req, res ) {

        var result = "ERROR";

        if ( scope.isLocalRequest( req ) ) {
            var params = scope.getURLParameters( req.url );
            var appURL = scope.searchByValue( params, "name", "appURL" );
            if ( appURL ) {
                var action = scope.searchByValue( params, "name", "action" );
                if ( action.value === "register" ) {
                    var appName = scope.searchByValue( params, "name", "appName" );
                    if ( appName ) {
                        var description = "";
                        var appDescription = scope.searchByValue( params, "name", "appDescription" );
                        if ( appDescription ) {
                            description = appDescription.value;
                        }
                        scope.registerApplication( appName.value, description, appURL.value );
                        result = "OK";
                    }
                }
                else if ( action.value === "unregister" ) {
                    scope.unregisterApplication( appURL.value )
                    result = "OK";
                }
            }
        }
        res.end( result );
    };

    this.app.get( '/appRegService', appRegFunction );
    this.app.post( '/appRegService', appRegFunction );

};

YomboServer.TheServer.prototype.createFunctionWaitNCalls = function( numCalls, onFinish ) {

    var numCallsPerformed = 0;

    return function waitNCalls() {

        numCallsPerformed ++;

        if ( numCallsPerformed >= numCalls ) {

            if ( onFinish ) {

                onFinish();

            }

        }

    };

};

YomboServer.TheServer.prototype.startModules = function( onStart ) {

    // Starts all current module instances. The onStart executes when all modules have started.

    this.logSystem( "Starting all module instances" );

    var launchConfigurations = this.config.launchConfigurations;

    var numModules = launchConfigurations.length;

    var onStartInternal = null;
    if ( onStart ) {

        onStartInternal = createFunctionWaitNCalls( numModules, onStart );

    }

    for ( var i = 0; i < numModules; i ++ ) {

        var launchConfig = launchConfigurations[ i ];

        if ( launchConfig.enabled ) {

            this.startModule( launchConfig.name, launchConfig.instanceName, launchConfig.config, onStartInternal, true );

        }

    }

};

YomboServer.TheServer.prototype.stopModules = function( onStop ) {

    // Stops all current module instances. The onStop executes when all modules have stopped.

    this.logSystem( "Stopping all module instances" );

    var numModules = this.modules.length;

    if ( numModules === 0 ) {

        if ( onStop ) {
            onStop();
        }

    }
    else {

        var onStopInternal = null;
        if ( onStop ) {
            onStopInternal = this.createFunctionWaitNCalls( numModules, onStop );
        }

        var j = 0;
        for ( var i = 0; i < numModules; i ++ ) {

            var module = this.modules[ j ];

            if ( module.moduleDefinition.canStop ) {
                this.stopModule( module, onStopInternal );
            }
            else {

                j ++;

                if ( onStopInternal ) {
                    onStopInternal();
                }
            }
        }
    }
};

YomboServer.TheServer.prototype.restart = function( onRestart ) {

    // Stops all modules. When all modules have stopped, then starts them all. Finally, when all modules are loaded, onRestart is called.

    var scope = this;
    this.stopModules( function() {
        setImmediate( function() {
            scope.startModules( function() {

                if ( onRestart ) {

                    onRestart();

                }

            } );
        } );
    } );

};

YomboServer.TheServer.prototype.startModule = function( name, instanceName, config, onStart, ignoreUniqueInstanceError ) {

    // Starts instance of module
    // Returns error message or null if success.

    var moduleDefinition = this.searchByValue( this.config.moduleDefinitions, "name", name );

    if ( moduleDefinition === null ) {

        var msg = "Tried to load undefined module: " + name + ". Ignoring module.";
        this.logError( msg, "YomboServer.startModule", name, instanceName );
        return msg;

    }

    if ( moduleDefinition.uniqueInstance && this.searchByValue( this.modules, "name", name ) ) {

        var msg = "Tried to create a module with uniqueInstance=true and a module with same name already exists. Ignoring module.";

        if ( ! ignoreUniqueInstanceError ) {
            this.logError( msg, "YomboServer.startModule", name, instanceName );
        }

        return msg;

    }

    if ( ! moduleDefinition.uniqueInstance && ! moduleDefinition.canStop ) {

        var msg = "Error while creating module: configuration is inconsistent: canStop=false and uniqueInstance=false. Ignoring attempt.";
        this.logError( msg, "YomboServer.startModule", name, instanceName );
        return msg;

    }

    this.logSystem( "Starting module", "YomboServer.startModule", name, instanceName );

    // Obtain module code

    var modulePath = "./public/modules/" + name + "/module_" + name;

    var moduleCode = require( modulePath );

    if ( ! moduleCode ) {

        var msg = "Error while creating module: " + name + ". Module code could not be loaded. Ignoring module. Tried path: " + modulePath;
        this.logError( msg, "YomboServer.startModule", name, instanceName );
        return msg;

    }

    var moduleNameSpace = moduleCode[ name ];

    if ( ! moduleNameSpace || ! moduleNameSpace[ name ] ) {

        var msg = "Error while creating module: " + name + ". Namespace or module class invalid. Ignoring module.";
        this.logError( msg, "YomboServer.startModule", name, instanceName );
        return msg;

    }

    // Create instance of module
    var moduleClass = moduleNameSpace[ name ];
    var module = new moduleClass();

    if ( ! module ) {

        var msg = "Error while creating module: " + name + ". Newly created instance is invalid. Ignoring module.";
        this.logError( msg, "YomboServer.startModule", name, instanceName );
        return msg;

    }

    module.name = name;
    module.instanceName = this.getInstanceName( module, instanceName );
    module.config = config;
    module.moduleDefinition = moduleDefinition;
    module.clients = [];
    module.yomboServer = this;
    module.rooms = [];
    module.clientEvents = [];
    module.listenersObject = { };

    this.modules.push( module );

    var scope = this;

    module.start( function() {

        scope.talkToListeners( "startModule", module );

        scope.logSystem( "Module started", "YomboServer.startModule", name, instanceName );

        if ( onStart ) {

            onStart();

        }

    } );

    return null;

};

YomboServer.TheServer.prototype.stopModule = function( module, onStop, ignoreUniqueInstanceError ) {

    // Stops instance of module
    // Returns error message or null if success.

    var index = this.modules.indexOf( module );

    if ( index < 0 ) {
        var msg = "Error stopping module: unknown module";
        this.logError( msg, "YomboServer.stopModule" );
        return msg;
    }

    this.logSystem( "Stopping module", "YomboServer.stopModule", module.name, module.instanceName );

    if ( ! module.moduleDefinition.canStop ) {

        var msg = "Tried to stop a module with canStop=false. Ignoring attempt.";

        if ( ! ignoreUniqueInstanceError ) {
            this.logError( msg, "YomboServer.stopModule", module.name, module.instanceName );
        }

        if ( onStop ) {
            onStop();
        }
        return msg;

    }

    // Emit module disconnection event
    this.emitToClientsArray( module.clients, "ysDisconnectedFromModule", { moduleName: module.name, instanceName: module.instanceName } );

    // Remove module clients sockets listeners
    for ( var i = 0; i < module.clients.length; i ++ ) {
        this.removeClientEvents( module, module.clients[ i ] );
    }

    this.unregisterListener( module );

    module.clients = [];

    this.modules.splice( index, 1 );

    var scope = this;
    setImmediate( function() {
        module.stop( function() {

            scope.talkToListeners( "stopModule", module );

            scope.logSystem( "Module stopped", "YomboServer.stopModule", module.name, module.instanceName );

            if ( onStop ) {
                onStop();
            }
        } );
    } );

    return null;

};

YomboServer.TheServer.prototype.getInstanceName = function( module, instanceName ) {

    var scope = this;

    function findFreeName( name ) {

        // Finds a free instance name of the form "name_<number>" starting with number=1

        var num = 1;
        var found = false;
        var freeName = null;
        while ( ! found && num < 1000000 ) {

            freeName = name + "_" + num;

            if ( scope.searchByValue( scope.modules, "instanceName", freeName ) === null ) {

                found = true;

                break;
            }
            else {

                num ++;

            }

        }

        if ( found ) {

            return freeName;

        }

        return "Number of instances exceeded.";

    }

    if ( instanceName ) {

        if ( this.searchByValue( this.modules, "instanceName", instanceName ) !== null ) {

            instanceName = findFreeName( instanceName );

        }

    }
    else {

        instanceName = findFreeName( module.name );

    }

    return instanceName;

};

YomboServer.TheServer.prototype.removeClientEvents = function( module, client ) {

    var socket = client.socket;
    var events = module.clientEvents;
    for ( var i = 0; i < events.length; i ++ ) {
        socket.removeAllListeners( events[ i ] );
    }

};

YomboServer.TheServer.prototype.searchByValue = function( array, member, value ) {

    for ( var i = 0, il = array.length; i < il; i ++ ) {

        var element = array[ i ];

        if ( element[ member ] === value ) {

            return element;

        }

    }

    return null;

};

YomboServer.TheServer.prototype.getFunctionBody = function( theFunction ) {

    var str = theFunction.toString();

    var first = str.indexOf( '\n' );
    first = first < 0 ? 0 : first;
    var last = str.lastIndexOf( '\n' );
    last = last < 0 ? str.length : last;

    return str.substring( first, last );

};

YomboServer.TheServer.prototype.loadConfig = function() {

    this.logSystem( "Loading config file in ./config.json", "YomboServer.loadConfig" );
    
    var config = loadJSONFileSync( __dirname + "/config.json" );

    if ( ! config ) {
        this.logError( "Error while loading config file in ./config.json", "YomboServer.loadConfig" );
        return null;
    }

    // Apply default values if they don't exist in the config
    this.applyDefaultConfigValues( config );

    return config;

};

YomboServer.TheServer.prototype.applyDefaultConfigValues = function( config ) {

    if ( ! isNumeric( config.maxLogSize ) || ! Number.isInteger( config.maxLogSize ) || config.maxLogSize <= 0 ) {
        this.logWarning( "Config Warning: maxLogSize is not properly set. Setting default value." );
        config.maxLogSize = YomboServer.DEFAULT_MAX_LOG_SIZE;
    }

    this.maxLogSize = config.maxLogSize;
    this.logConsoleTypes = config.logConsoleTypes;

};

// *****  Services *****

// ***** Regiter application service *****

YomboServer.TheServer.prototype.registerApplication = function( name, description, url ) {

    var found = false;
    for ( var i = 0; i < this.applications.length; i ++ ) {
        var app = this.applications[ i ];
        if ( app.url === url ) {
            app.name = name;
            app.description = description;
            found = true;
            break;
        }
    }

    if ( ! found ) {
        this.applications.unshift( {
            name: name,
            description: description,
            url: url
        } );
    }

    this.talkToListeners( "registerApplication" );

};

YomboServer.TheServer.prototype.unregisterApplication = function( url ) {

    for ( var i = 0; i < this.applications.length; i ++ ) {
        if ( this.applications[ i ].url === url ) {

            this.applications.splice( i, 1 );
            this.talkToListeners( "unregisterApplication" );

        }
    }

};

// ***** Log service *****

YomboServer.TheServer.prototype.logInfo = function( message, category, moduleName, instanceName ) {
    this.log( message, "Info", category, moduleName, instanceName );
};

YomboServer.TheServer.prototype.logWarning = function( message, category, moduleName, instanceName ) {
    this.log( message, "Warning", category, moduleName, instanceName );
};

YomboServer.TheServer.prototype.logError = function( message, category, moduleName, instanceName ) {
    this.log( message, "Error", category, moduleName, instanceName );
};

YomboServer.TheServer.prototype.logSystem = function( message, category, moduleName, instanceName ) {
    this.log( message, "System", category, moduleName, instanceName );
};

YomboServer.TheServer.prototype.log = function( message, type, category, moduleName, instanceName ) {

    var logEntry = {
        message: message.toString(),
        type: type,
        category: category,
        moduleName: moduleName,
        instanceName: instanceName,
        timestamp: new Date()
    };

    // Circular log max length control
    if ( this.theLog.length >= this.maxLogSize ) {
        this.theLog.shift();
    }

    this.theLog.push( logEntry );

    this.talkToListeners( "log", logEntry );

    // Output to server console
    if ( this.logConsoleTypes.indexOf( type ) >= 0 ) {
        var logText = "";
        var previousField = false;
        for ( var i = 0; i < this.logConsoleFields.length; i ++ ) {
            var field = logEntry[ this.logConsoleFields[ i ] ];
            if ( field !== undefined ) {
                if ( previousField ) {
                    logText += " - ";
                }
                logText += field;
                previousField = true;
            }
        }
        console.log( logText );
    }
};

// ***** Rooms service *****

YomboServer.TheServer.prototype.internalRoomName = function( module, roomName ) {

    return module.instanceName + "_" + roomName;

};

YomboServer.TheServer.prototype.getModuleMaxRooms = function( module ) {

    if ( module.config.maxRooms > 0 ) {
        return module.config.maxRooms;
    }

    return 0;

}

YomboServer.TheServer.prototype.createRoom = function( module, roomName, maxClients ) {

    var room = this.findRoom( module, roomName );
    if ( room !== null ) {
        return room;
    }

    var maxRooms = this.getModuleMaxRooms( module );
    if ( module.rooms.length >= maxRooms ) {
        return null;
    }

    // In addition to these members, the room will have an object named after the module it belongs to.
    room = {
        name: roomName,
        internalName: this.internalRoomName( module, roomName ),
        clients: [],
        maxClients: maxClients
    };

    module.rooms.push( room );

    return room;

};

YomboServer.TheServer.prototype.removeRoom = function( module, roomName ) {

    var room = this.findRoom( module, roomName );

    if ( room !== null ) {
        for ( var i = 0; i < room.clients.length; i ++ ) {
            this.removeClientFromRoom( room.clients[ i ], room );
        }

        var index = module.rooms.indexOf( room );
        if ( index >= 0 ) {
            module.rooms.splice( index, 1 );
        }

    }

};

YomboServer.TheServer.prototype.findRoom = function( module, roomName ) {

    var internalName = this.internalRoomName( module, roomName );

    return this.searchByValue( module.rooms, "internalName", internalName );

};

YomboServer.TheServer.prototype.joinClientToRoom = function( client, room ) {

    // TODO check max number of clients in a room

    client.socket.join( room.internalName );

    if ( room.clients.indexOf( client ) < 0 ) {
        room.clients.push( client );
    }
    
    return true;

};

YomboServer.TheServer.prototype.removeClientFromRoom = function( client, room ) {

    client.socket.leave( room.internalName );

    var index = room.clients.indexOf( client );
    if ( index >= 0 ) {
        room.clients.splice( index, 1 );
    }

};

YomboServer.TheServer.prototype.emitToRoom = function( room, name, message ) {

    io.to( room.internalName ).emit( name, message );

};

// ***** Security service *****

YomboServer.TheServer.prototype.isLocalClient = function( client ) {

    return this.LOCAL_HOST_V4 === client.socket.handshake.address ||
        this.LOCAL_HOST_V6 === client.socket.handshake.address;

};

YomboServer.TheServer.prototype.isLocalRequest = function( req ) {

    return this.LOCAL_HOST_V4 === req.connection.remoteAddress ||
        this.LOCAL_HOST_V6 === req.connection.remoteAddress;

};

// ***** Net Services *****

YomboServer.TheServer.prototype.mapFile = function( path ) {

    var index = this.servedRoutes.indexOf( path );

    if ( index < 0 ) {

        this.servedRoutes.push( path );

        this.app.get( path, function( req, res ) {

            res.sendFile( __dirname + path );

        } );

    }

};

YomboServer.TheServer.prototype.mapDirectory = function( webPath, path ) {

    path = path || webPath;
    
    var index = this.servedRoutes.indexOf( webPath );

    if ( index < 0 ) {

        this.servedRoutes.push( webPath );

        this.app.use( webPath, this.express.static( __dirname + path ) );

    }

};

YomboServer.TheServer.prototype.mapFileArray = function() {
    
    for ( var i = 0, il = pathArray.length; i < il; i ++ ) {

        this.mapFile( pathArray[ i ] );

    }

};

YomboServer.TheServer.prototype.mapDirectoryWithToken = function( path, pathPreamble, tokenArray ) {

    // Obsolete.

    /*
    // The token must be the first parameter of the request

    var index = this.servedRoutes.indexOf( path );

    if ( index < 0 ) {

        this.servedRoutes.push( path );

        this.app.use( path, function( req, res, next ) {

            var reqToken = req.query.token;
//            if ( reqToken && reqToken in tokenArray ) {
                var originalUrl = req.originalUrl;
                var index = originalUrl.indexOf( "?" );
                if ( index >= 0 ) {
                    console.log( "CONNECTION: token = " + reqToken );
                    res.sendFile( __dirname + pathPreamble + originalUrl.substring( 0, index ) );
                }
//            }
        } );
    }
    */
};

YomboServer.TheServer.prototype.emitToClientsArray = function( array, name, message ) {
    
    for ( var i = 0, il = array.length; i < il; i ++ ) {

        array[ i ].socket.emit( name, message );

    }

};

YomboServer.TheServer.prototype.removeClient = function( client ) {

    client.socket.client.disconnect();

};

YomboServer.TheServer.prototype.getClientParameters = function( client ) {
    return this.getURLParameters( this.getClientReferer( client ) );
}

YomboServer.TheServer.prototype.getClientReferer = function( client ) {

    return client.socket.client.request.headers.referer;

};

YomboServer.TheServer.prototype.getURLParameters = function( url ) {

    var params = [];

    var url = decodeURI( url );

    var index = url.indexOf( "?" );
    if ( index >= 0 ) {
        var paramString = url.substring( index + 1 );
        var paramStringArray = paramString.split( "&" );
        for ( var i = 0; i < paramStringArray.length; i ++ ) {
            var p = paramStringArray[ i ];
            var index2 = p.indexOf( "=" );
            if ( index2 >= 0 ) {
                params.push( {
                    name: p.substring( 0, index2 ),
                    value: p.substring( index2 + 1 )
                } );
            }
        }

    }

    return params;

};

YomboServer.TheServer.prototype.gethostURL = function( path ) {
    
    if ( this.config.host !== "" ) {

        return "http://" + this.config.host + ":" + this.config.listenPort + "/" + path;

    }
    else {

        return "/" + path;

    }

};


// ***** Module Administration Services *****

YomboServer.TheServer.prototype.registerListener = function( module, functionName, listenerFunction ) {

    var listeners = this.listeners[ functionName ];

    if ( ! listeners ) {

        this.logError( "Couldn't register module listener of unknown function name: " + functionName, "YomboServer.registerListener", module.name, module.instanceName );
        return;

    }

    module.listenersObject[ functionName ] = listenerFunction;

    listeners.push( module );

};

YomboServer.TheServer.prototype.unregisterListener = function( module ) {

    var found = false;

    for ( var i = 0, il = this.listenerFunctionNames.length; i < il; i ++ ) {

        var listeners = this.listeners[ this.listenerFunctionNames[ i ] ];

        var index = listeners.indexOf( module );

        if ( index >= 0 ) {

            found = true;

            listeners.splice( index, 1 );

        }

    }

    module.listenersObject = { };

};

YomboServer.TheServer.prototype.talkToListeners = function( functionName, params ) {

    var listeners = this.listeners[ functionName ];

    if ( ! listeners ) {

        this.logError( "functionName not found: " + functionName, "YomboServer.talkToListeners" );

    }

    for ( var i = 0, il = listeners.length; i < il; i ++ ) {

        listeners[ i ].listenersObject[ functionName ]( params );

    }

};

// ***** Main client connection function *****

YomboServer.TheServer.prototype.clientConnection = function( socket ) {

    // In addition to these members, clients will have objects named after the modules they connect to
    var client = {
        isGod: false,
        socket: socket,
        connectedModules: [],
        events: []
    };

    client.isGod = this.isLocalClient( client );

    this.clients.push( client );

    this.talkToListeners( "clientConnected", client );

    var scope = this;

    socket.on( "disconnect", function( msg ) {

        scope.logInfo( "Client disconnected: " + socket.id, "YomboServer.clientConnection" );

        for ( var i = 0, il = client.connectedModules.length; i < il; i ++ ) {

            var module = client.connectedModules[ i ];

            var indexModule = module.clients.indexOf( client );
            if ( indexModule >= 0 ) {

                module.clients.splice( indexModule, 1 );

            }

            module.clientDisconnection( client );

            scope.talkToListeners( "clientDisconnectedFromModule", { client: client, module: module } );
        }

        var index = scope.clients.indexOf( client );

        if ( index >= 0 ) {

            scope.clients.splice( index, 1 );

        }

        scope.talkToListeners( "clientDisconnected", client );

    } );

    socket.on( "ysConnectToModule", function( msg ) {

        var moduleName = msg.moduleName;
        var instanceName = msg.instanceName;

        var module = null;

        if ( instanceName ) {

            module = scope.searchByValue( scope.modules, "instanceName", instanceName );

        }

        if ( module === null ) {

            // Find first instance

            module = scope.searchByValue( scope.modules, "name", moduleName );

        }

        if ( module !== null ) {

            var index = client.connectedModules.indexOf( module );

            if ( index < 0 ) {

                if ( module.clientConnection( client, msg ) ) {

                    client.connectedModules.push( module );

                    if ( module.clients.indexOf( client ) < 0 ) {

                        module.clients.push( client );

                    }

                    scope.talkToListeners( "clientConnectedToModule", { client: client, module: module } );

                    socket.emit( "ysConnectedToModule", { moduleName: module.name, moduleInstanceName: module.instanceName } );

                }
                // TODO
                // else ... disconnect/remove the client?

            }

        }

    } );

    this.logInfo( "Client connected: " + socket.id, "YomboServer.clientConnection" );

};
