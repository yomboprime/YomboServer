
var YomboServer = {

	VERSION_STRING: "r1"

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

YomboServer.TheServer = function () {

	process.title = "Yomboserver";

	this.inited = false;

	this.config = null;

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

	// Serve /public directory
//	this.mapDirectory( '/public' );

	// Listeners
	this.listenerFunctionNames = [
		"startModule",
		"stopModule",
		"clientConnected",
		"clientDisconnected",
		"clientConnectedToModule",
		"clientDisconnectedFromModule",
		"registerApplication",
		"unregisterApplication"
	];
	this.listeners = {};
	for ( var i = 0, il = this.listenerFunctionNames.length; i < il; i++ ) {

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
		console.log( "YomboServer.run: Server already running." );
		return;
	}

	console.log( "YomboServer " + YomboServer.VERSION_STRING + " initing..." );

	// Load config
	this.config = this.loadConfig();
	if ( this.config === null ) {
		console.error( "YomboServer.init: Couldn't load config file." );
		return;
	}

	// Serve root index.html
    app.get( '/', function( req, res ) {

        res.sendFile( __dirname + '/public/index.html' );

    } );

	var scope = this;

	// Serve Application registry service
    var appRegFunction = function( req, res ) {

		var result = "ERROR";

		if ( scope.isLocalRequest( req ) ) {
			var params = scope.getRequestParameters( req );
			var appURL = scope.findRequestParameter( params, "appURL" );
			if ( appURL ) {
				var action = scope.findRequestParameter( params, "action" );
				if ( action === "register") {
					var appName = scope.findRequestParameter( params, "appName" );
					if ( appName ) {
						var appDescription = scope.findRequestParameter( params, "appDescription" );
						if ( ! appDescription ) {
							appDescription = "";
						}
						scope.registerApplication( appName, appDescription, appURL );
						result = "OK";
					}
				}
				else if ( action === "unregister" ) {
					scope.unregisterApplication( appURL )
					result = "OK";
				}
			}
		}
		res.end( result );
    };
	app.get( '/appRegService', appRegFunction );
	app.post( '/appRegService', appRegFunction );

    // Setup connection with client
	var scope = this;
    io.on( 'connection', function( socket ) {

		scope.clientConnection( socket );

	} );

	// Start listening
	var port = this.config.listenPort;
	var scope = this;
	http.listen( port, function() {

		scope.startModules();

		scope.inited = true;

		console.log( "YomboServer inited and listening on port " + port );

	} );

};

YomboServer.TheServer.prototype.shutDown = function() {
	
	var scope = this;
	this.stopModules( function() {

		scope.http.stop();

		process.exit();

	} );

};

YomboServer.TheServer.prototype.createFunctionWaitNCalls = function( numCalls, onFinish ) {

	var numCallsPerformed = 0;

	return function waitNCalls() {

		numCallsPerformed++;

		if ( numCallsPerformed >= numCalls ) {

			if ( onFinish ) {

				onFinish();

			}

		}

	};

};

YomboServer.TheServer.prototype.startModules = function( onStart ) {

	// Starts all current module instances. The onStart executes when all modules have started.

	console.log( "Starting all module instances..." );

	var launchConfigurations = this.config.launchConfigurations;

	var numModules = launchConfigurations.length;

	var onStartInternal = null;
	if ( onStart ) {

		onStartInternal = createFunctionWaitNCalls( numModules, onStart );

	};

	for ( var i = 0; i < numModules; i++ ) {

		var launchConfig = launchConfigurations[ i ];

		if ( launchConfig.enabled ) {

			this.startModule( launchConfig.name, launchConfig.instanceName, launchConfig.config, onStartInternal );

		}

	}

};

YomboServer.TheServer.prototype.stopModules = function( onStop ) {

	// Stops all current module instances. The onStop executes when all modules have stopped.

	console.log( "Stopping all module instances..." );

	var numModules = this.modules.length;

	if ( numModules === 0 ) {

		if ( onStop ) {
			onStop();
		}

	}
	else {

		var onStopInternal = null;

		if ( onStop ) {

			onStopInternal = createFunctionWaitNCalls( numModules, onStop );

		};

		for ( var i = 0; i < numModules; i++ ) {

			var module = this.modules[ i ];

			this.stopModule( module, onStopInternal );

		}
	}

};

YomboServer.TheServer.prototype.restart = function( onRestart ) {

	// Stops all modules. When all modules have stopped, then starts them all. Finally, when all modules are loaded, onRestart is called.

	var scope = this;
	this.stopModules( function() {

		scope.startModules( function() {

			if ( onRestart ) {

				onRestart();

			}
			
		} );

	} );

};

YomboServer.TheServer.prototype.startModule = function( name, instanceName, config, onStart ) {

	// Starts instance of module
	// Returns error message or null if success.

	var moduleDefinition = this.searchByValue( this.config.moduleDefinitions, "name", name );

	if ( moduleDefinition === null ) {

		var msg = "Error: tried to load undefined module: " + name + ". Ignoring module.";
		console.log( msg );
		return msg;

	}

	if ( moduleDefinition.uniqueInstance && this.searchByValue( this.modules, "name", name ) ) {

		var msg = "Error: tried to create a module with uniqueInstance=true and a module with same name already exists. Module name: " + name + ". Ignoring module.";
		console.log( msg );
		return msg;

	}

	if ( ! moduleDefinition.uniqueInstance && ! moduleDefinition.canStop ) {

		var msg = "Error while creating module: configuration is inconsistent: canStop=false and uniqueInstance=false. Module name: " + name + ". Ignoring attempt.";
		console.log( msg );
		return msg;

	}

	console.log( "Loading module " + name + "..." );

	// Obtain module code

	var modulePath = "./public/modules/" + name + "/module_" + name;
	
	var moduleCode = require( modulePath );

	if ( ! moduleCode ) {

		var msg = "Error while creating module: " + name + ". Module code could not be loaded. Ignoring module. Tried path: " + modulePath;
		console.log( msg );
		return msg;

	}

	var moduleNameSpace = moduleCode[ name ];

	if ( ! moduleNameSpace || ! moduleNameSpace[ name ] ) {

		var msg = "Error while creating module: " + name + ". Namespace or module class invalid. Ignoring module.";
		console.log( msg );
		return msg;

	}

	// Create instance of module
	var moduleClass = moduleNameSpace[ name ];
	var module = new moduleClass();

	if ( ! module ) {

		var msg = "Error while creating module: " + name + ". Newly created instance is invalid. Ignoring module.";
		console.log( msg );
		return msg;

	}

	module.name = name;
	module.instanceName = this.getInstanceName( module, instanceName );
	module.config = config;
	module.clients = [];
	module.yomboServer = this;
	module.rooms = [];

	this.modules.push( module );

	var scope = this;

	module.start( function() {

		scope.talkToListeners( "startModule", { module: module } );

		if ( onStart ) {

			onStart();

		}

	} );

	return null;
	
};

YomboServer.TheServer.prototype.stopModule = function( module, onStop ) {

	// Stops instance of module
	// Returns error message or null if success.

	var index = this.modules.indexOf( module );

	if ( index < 0 ) {
		var msg = "Error stopping module: unknown module";
		console.log( msg );
		return msg;
	}

	var moduleDefinition = this.searchByValue( this.config.moduleDefinitions, "name", module.name );

	if ( ! moduleDefinition.canStop ) {

		var msg = "Error: tried to stop a module with canStop=false. Module name: " + module.name + ". Ignoring attempt.";
		console.log( msg );
		return msg;

	}

	var scope = this;
	module.stop( function() {

		scope.talkToListeners( "stopModule", { module: module } );

		if ( onStop ) {

			onStop();

		}

	} );

	this.modules.splice( index, 1 );

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

YomboServer.TheServer.prototype.searchByValue = function( array, member, value ) {

	for ( var i = 0, il = array.length; i < il; i++ ) {

		var element = array[ i ];

		if ( element[ member ] === value ) {

			return element;

		}

	}

	return null;

};

YomboServer.TheServer.prototype.loadConfig = function() {

	console.log( "Loading config file in ./config.json ..." );

	var configFileContent = null;

	try {
		configFileContent = fs.readFileSync( "./config.json", "utf-8" );
	}
	catch( e ) {
		if ( e.code === 'ENOENT' ) {
			console.error( "Error: Config file not found (path: ./config.json)" );
		}
		else {
			throw e;
		}
	}

	var config = JSON.parse( configFileContent );

	if ( ! config ) {
		console.error( "Error while loading config file in ./config.json" );
	}

	return config;

};

// *****  Services *****

// ***** Regiter application service *****

YomboServer.TheServer.prototype.registerApplication = function( name, description, url ) {

	var found = false;
	for ( var i = 0; i < this.applications.length; i++ ) {
		var app = this.applications[ i ];
		if ( app.url === url ) {
			app.name = name;
			app.description = description;
			found = true;
		}
	}

	if ( ! found ) {
		this.applications.push( {
			name: name,
			description: description,
			url: url
		} );
	}

	this.talkToListeners( "registerApplication", null );

};

YomboServer.TheServer.prototype.unregisterApplication = function( url ) {

	for ( var i = 0; i < this.applications.length; i++ ) {
		if ( this.applications[ i ].url === url ) {

			this.applications.splice( i, 1 );
			this.talkToListeners( "unregisterApplication", null );

		}
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

YomboServer.TheServer.prototype.createRoom = function( module, roomName ) {

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
		clients: []
	};

	module.rooms.push( room );

	return room;

};

YomboServer.TheServer.prototype.removeRoom = function( module, roomName ) {

	var room = this.findRoom( module, roomName );

	if ( room !== null ) {
		for ( var i = 0; i < room.clients.length; i++ ) {
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
	for ( var i = 0; i < module.rooms.length; i++ ) {
		if ( module.rooms[ i ].internalName === internalName ) {
			return module.rooms[ i ];
		}
	}

	return null;

};

YomboServer.TheServer.prototype.joinClientToRoom = function( client, room ) {

	client.socket.join( room.internalName );
	if ( room.clients.indexOf( client ) < 0 ) {
		room.clients.push( client );
	}

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

YomboServer.TheServer.prototype.mapDirectory = function( path ) {

	var index = this.servedRoutes.indexOf( path );

	if ( index < 0 ) {

		this.servedRoutes.push( path );

		this.app.use( path, this.express.static( __dirname + path ) );

	}

};

YomboServer.TheServer.prototype.mapFileArray = function() {

	for ( var i = 0, il = pathArray.length; i < il; i++ ) {

		this.mapFile( pathArray[ i ] );

	}

};

YomboServer.TheServer.prototype.emitToClientsArray = function( array, name, message ) {

	for ( var i = 0, il = array.length; i < il; i++ ) {

		array[ i ].socket.emit( name, message );

	}

};

YomboServer.TheServer.prototype.getClientReferer = function( client ) {

	return client.socket.client.request.headers.referer;
	
};

YomboServer.TheServer.prototype.getRequestParameters = function( request ) {

	var params = [];

	var url = decodeURI( request.url );

	var index = url.indexOf( "?" );
	if ( index >= 0 ) {
		var paramString = url.substring( index + 1 );
		var paramStringArray = paramString.split( "&" );
		for ( var i = 0; i < paramStringArray.length; i++ ) {
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

YomboServer.TheServer.prototype.findRequestParameter = function( params, paramName ) {

	for ( var i = 0; i < params.length; i++ ) {
		if ( params[ i ].name === paramName ) {
			return params[ i ].value;
		}
	}

	return null;

};

YomboServer.TheServer.prototype.gethostURL = function( path ) {

	return "http://" + this.config.host + ":" + this.config.listenPort + "/" + path;

};


// ***** Module Administration Services *****

YomboServer.TheServer.prototype.registerListener = function( functionName, listener ) {

	var listeners = this.listeners[ functionName ];
	
	if ( ! listeners ) {

		console.log( "Couldn't register listener of unknown function name: " + functionName );
		return;

	}

	listeners.push( listener );

};

YomboServer.TheServer.prototype.unregisterListener = function( listener ) {

	for ( var i = 0, il = this.listenerFunctionNames.length; i < il; i++ ) {

		var listeners = this.listeners[ this.listenerFunctionNames[ i ] ];

		var index = listeners.indexOf( listener );

		if ( index >= 0 ) {

			listeners.splice( index, 1 );
			return;

		}

	}

	if ( ! listeners ) {

		console.log( "Unregister listener: Couldn't locate listener." );

	}

};

YomboServer.TheServer.prototype.talkToListeners = function( functionName, params ) {

	var listeners = this.listeners[ functionName ];

	if ( ! listeners ) {

		console.log( "talkToListeners: Error, functionName not found: " + functionName );

	}

	for ( var i = 0, il = listeners.length; i < il; i++ ) {

		listeners[ i ]( params );

	}
	
};

// ***** Main client connection function *****

YomboServer.TheServer.prototype.clientConnection = function( socket ) {

	console.log( "Client connected: " + socket.id );

	// In addition to these members, clients will have objects named after the modules they connect to
	var client = {

		isGod: false,
		socket: socket,
		connectedModules: []

	};

	client.isGod = this.isLocalClient( client );

	console.log( "Client is God: " + client.isGod );

	this.clients.push( client );

	this.talkToListeners( "clientConnected", { client: client } );

	var scope = this;

	socket.on( "disconnect", function( msg ) {

		console.log( "Client disconnected: " + socket.id );

		for ( var i = 0, il = client.connectedModules.length; i < il; i++ ) {

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

		scope.talkToListeners( "clientDisconnected", { client: client } );

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

			module.clientConnection( client );

			var index = client.connectedModules.indexOf( module );

			if ( index < 0 ) {

				client.connectedModules.push( module );

			}

			if ( module.clients.indexOf( client ) < 0 ) {
				
				module.clients.push( client );

			}

			scope.talkToListeners( "clientConnectedToModule", { client: client, module: module } );


		}

	} );

};
