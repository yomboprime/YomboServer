
var selfEasyrtcid = "";

var pendingCalls = { };
var playingVideos = { };

function init() {

    easyrtc.setAcceptChecker( function( easyrtcid, callback ) {

        console.log( "A viewer connected." );

        // Accept all calls
        callback( true );

    } );

    var divVideos = document.getElementById( "divVideos" );
    
    easyrtc.setStreamAcceptor( function( easyrtcid, stream ) {

        var video = document.createElement( "video" );
        video.id = "video_" + easyrtcid;
        video.className = "otherVideo";
        divVideos.appendChild( video );

        playingVideos[ easyrtcid ] = video;

        easyrtc.setVideoObjectSrc( video, stream );

        console.log( "Playing new stream" );

    } );

    easyrtc.setOnStreamClosed( function( easyrtcid ) {

        var video = playingVideos[ easyrtcid ];

        if ( video ) {
            easyrtc.setVideoObjectSrc( video, "" );
            divVideos.removeChild( video );
            playingVideos[ easyrtcid ] = undefined;
        }

    } );

    easyrtc.setOnError( function( errEvent ) {

        console.log( "Error: " + errEvent.errorCode + ", " + errEvent.errorText );

    } );

    // TODO unhardcode
    easyrtc.enableAudio( true );
    easyrtc.enableVideo( true );
    easyrtc.enableDataChannels( false );
    
    easyrtc.setRoomOccupantListener( roomOccupantListener );

    easyrtc.initMediaSource( function() {

        var selfVideo = document.getElementById( "localVideo" );
        easyrtc.setVideoObjectSrc( selfVideo, easyrtc.getLocalStream() );
        selfVideo.muted = true;

        easyrtc.connect( "Yomboserver", loginSuccess, loginFailure );

    }, function( errmesg ) {

        alert( "Error obtaining media source: " + errmesg );

    } );



}

function loginSuccess( easyrtcid ) {

    selfEasyrtcid = easyrtcid;

    console.log( "Logged in." );

}


function loginFailure( errorCode, message ) {

    alert( "Login failure. Error: " + errorCode + ", " + message );

}

function roomOccupantListener( roomName, occupants, isPrimary ) {

    for ( var easyrtcid in occupants ) {

        if ( easyrtcid !== selfEasyrtcid && ! playingVideos[ easyrtcid ] ) {

            performCall( easyrtcid );

        }

    }
}

function performCall( easyrtcid ) {

    var successCB = function() {
        console.log( "Call successful-" );
        pendingCalls[ easyrtcid ] = false;
    };
    var failureCB = function() {
        console.log( "Error: call failure." );
        pendingCalls[ easyrtcid ] = false;
    };

    var acceptedCB = function( accepted, easyrtcid ) {
        if ( ! accepted ) {
            console.log( "Error: call rejected." );
            pendingCalls[ easyrtcid ] = "rejected";
        }
        else {
            pendingCalls[ easyrtcid ] = false;
        }
    };

    if ( ! pendingCalls[ easyrtcid ] ) {

        pendingCalls[ easyrtcid ] = true;

        easyrtc.call( easyrtcid, successCB, failureCB, acceptedCB );

    }

}
