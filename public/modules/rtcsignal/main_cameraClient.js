
var selfEasyrtcid = "";

function init() {

    easyrtc.setAcceptChecker( function( easyrtcid, callback ) {

        console.log( "A viewer connected." );

        // Accept all calls
        callback( true );

    } );

    easyrtc.setOnError( function( errEvent ) {

        console.log( "Error: " + errEvent.errorCode + ", " + errEvent.errorText );

    } );


    // TODO unhardcode
    easyrtc.enableAudio( true );
    easyrtc.enableVideo( true );
    easyrtc.enableDataChannels( false );

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
