
var easyrtc = require( "easyrtc" );

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

    this.yomboServer.mapFile( "/public/modules/rtcsignal/cameraClient.html" );
    this.yomboServer.mapFile( "/public/modules/rtcsignal/main_cameraClient.js" );
    this.yomboServer.mapFile( "/public/modules/rtcsignal/audienceClient.html" );
    this.yomboServer.mapFile( "/public/modules/rtcsignal/main_audienceClient.js" );

    this.yomboServer.registerApplication( "Video viewer", "View video streams", this.yomboServer.gethostURL( "public/modules/rtcsignal/audienceClient.html" ) );
    this.yomboServer.registerApplication( "Video transmitter", "Transmit video streams", this.yomboServer.gethostURL( "public/modules/rtcsignal/cameraClient.html" ) );


    easyrtc.setOption( "logLevel", "debug" );

    var scopeModule = this;

    // Overriding the default easyrtcAuth listener, only so we can directly access its callback
    easyrtc.events.on( "easyrtcAuth", function( socket, easyrtcid, msg, socketCallback, callback ) {

        easyrtc.events.defaultListeners.easyrtcAuth( socket, easyrtcid, msg, socketCallback, function( err, connectionObj ) {

            if ( err || ! msg.msgData || ! msg.msgData.credential || ! connectionObj ) {

                callback( err, connectionObj );
                return;

            }

            connectionObj.setField( "credential", msg.msgData.credential, { "isShared": false } );

            scopeModule.yomboServer.logInfo( "[" + easyrtcid + "] Credential saved! " + connectionObj.getFieldValueSync( "credential" ), "rtcsignal.start", scopeModule.name, scopeModule.instanceName );

            callback( err, connectionObj );
        } );
    } );

    // To test, lets print the credential to the console for every room join!
    easyrtc.events.on( "roomJoin", function( connectionObj, roomName, roomParameter, callback ) {

        scopeModule.yomboServer.logInfo( "[" + connectionObj.getEasyrtcid() + "] Credential retrieved! " + connectionObj.getFieldValueSync( "credential" ), "rtcsignal.start", scopeModule.name, scopeModule.instanceName );

        easyrtc.events.defaultListeners.roomJoin( connectionObj, roomName, roomParameter, callback );

    } );

    // Start EasyRTC server
    this.rtc = easyrtc.listen( this.yomboServer.app, this.yomboServer.io, {

        // Configuration

        appIceServers: [{ url: "stun:stun.l.google.com:19302" }],
        //appAutoCreateEnable: false,
        //roomAutoCreateEnable: false,
        //roomDefaultEnable: false,
        sessionEnable: false,
        sessionCookieEnable: false,
        //demosEnable: false,
        updateCheckEnable: false

    }, function( err, rtcRef ) {

        rtcRef.events.on( "roomCreate", function( appObj, creatorConnectionObj, roomName, roomOptions, callback ) {

            scopeModule.yomboServer.logInfo( "roomCreate fired! Trying to create: " + roomName, "rtcsignal.start", scopeModule.name, scopeModule.instanceName );

            appObj.events.defaultListeners.roomCreate( appObj, creatorConnectionObj, roomName, roomOptions, callback );

        } );

        if ( onStart ) {

            onStart();

        }
    } );

};

rtcsignal.rtcsignal.prototype.stop = function( onStop ) {

    // TODO !!!

    this.yomboServer.unregisterApplication( this.yomboServer.gethostURL( "public/modules/rtcsignal/audienceClient.html" ) );
    this.yomboServer.unregisterApplication( this.yomboServer.gethostURL( "public/modules/rtcsignal/cameraClient.html" ) );

    if ( onStop ) {

        onStop();

    }

};

rtcsignal.rtcsignal.prototype.clientConnection = function( client ) {

    return true;

};

rtcsignal.rtcsignal.prototype.clientDisconnection = function( client ) {

    // Nothing to do here yet

};

