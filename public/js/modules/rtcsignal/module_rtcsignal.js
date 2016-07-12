
var easyrtc = require( "../../lib/easyrtc/lib/easyrtc_server" );

var rtcsignal = {

	VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

	module.exports = {
		rtcsignal: rtcsignal
	};

}

// ***** Libraries *****


// ***** Module class *****

rtcsignal.rtcsignal = function() {

	// Nothing to do

};

rtcsignal.rtcsignal.prototype = {

	constructor: rtcsignal.rtcsignal

};

rtcsignal.rtcsignal.prototype.start = function( onStart ) {

	this.yomboServer.mapFile( "/public/js/modules/rtcsignal/demo_multiparty.html" );
	this.yomboServer.mapFile( "/public/js/modules/rtcsignal/demo_multiparty.js" );
	this.yomboServer.mapFile( "/public/js/modules/rtcsignal/demo_room.css" );


	easyrtc.setOption( "logLevel", "debug" );

	// Overriding the default easyrtcAuth listener, only so we can directly access its callback
	easyrtc.events.on( "easyrtcAuth", function( socket, easyrtcid, msg, socketCallback, callback ) {

		easyrtc.events.defaultListeners.easyrtcAuth( socket, easyrtcid, msg, socketCallback, function( err, connectionObj ) {

			if ( err || !msg.msgData || !msg.msgData.credential || !connectionObj ) {

				callback( err, connectionObj );
				return;

			}

			connectionObj.setField( "credential", msg.msgData.credential, { "isShared": false } );

			console.log( "[" + easyrtcid + "] Credential saved!", connectionObj.getFieldValueSync( "credential" ) );

			callback(err, connectionObj);
		} );
	} );

	// To test, lets print the credential to the console for every room join!
	easyrtc.events.on( "roomJoin", function( connectionObj, roomName, roomParameter, callback ) {
		console.log( "[" + connectionObj.getEasyrtcid() + "] Credential retrieved!", connectionObj.getFieldValueSync( "credential" ) );
		easyrtc.events.defaultListeners.roomJoin( connectionObj, roomName, roomParameter, callback );
	} );

	// Start EasyRTC server
	this.rtc = easyrtc.listen( this.yomboServer.app, this.yomboServer.io, {

		// Configuration

		appIceServers: [ { url: "stun:stun.l.google.com:19302" } ],
		//appAutoCreateEnable: false,
		//roomAutoCreateEnable: false,
		//roomDefaultEnable: false,
		sessionEnable: false,
		sessionCookieEnable: false,
		demosEnable: false,
		updateCheckEnable: false,

	}, function( err, rtcRef ) {

		rtcRef.events.on( "roomCreate", function( appObj, creatorConnectionObj, roomName, roomOptions, callback ) {

			console.log( "roomCreate fired! Trying to create: " + roomName );

			appObj.events.defaultListeners.roomCreate( appObj, creatorConnectionObj, roomName, roomOptions, callback );

		} );

		console.log( "WebRTC signal server module started." );

		if ( onStart ) {

			onStart();

		}
	} );

};

rtcsignal.rtcsignal.prototype.stop = function( onStop ) {

	console.log( "WebRTC signal server module stopped." );

	if ( onStop ) {

		onStop();

	}

};

rtcsignal.rtcsignal.prototype.clientConnection = function( client ) {

	console.log( "webrtc module: Client connected." );

/*
	client.socket.emit( "adminAllData", msg );

	var scope = this;
	client.socket.on( "specificMessage", function( msg ) {

	} );
*/

};

rtcsignal.rtcsignal.prototype.clientDisconnection = function( client ) {

	console.log( "webrtc module: Client disconnected." );

};

