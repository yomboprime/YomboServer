
var socket;

init();

function init() {

    socket = io();

    socket.on( "serverMessage", function( msg ) {
		console.log( "Server message received." );
	} );

    socket.emit( "connectToModule", { moduleName: "camcap" } );

	//socket.emit( "someMessage", { } );

}
