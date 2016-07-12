
var SerialPort = require( "serialport" );

SerialPort.list( function ( err, ports) {

	function printProperty( object, name ) {
		console.log( name + ": " + object[ name ] );
	}

	var numPorts = 0;
	ports.forEach( function( port ) {

		if ( ! port.comName.startsWith( "/dev/ttyS" ) ) {
			numPorts++;
		}

	} );

	console.log( "Found " + numPorts + " ports:" );

	ports.forEach( function( port ) {

		if ( ! port.comName.startsWith( "/dev/ttyS" ) ) {

			console.log( "----------------------------" );
			printProperty( port, "comName" );
			printProperty( port, "manufacturer" );
			printProperty( port, "serialNumber" );
			printProperty( port, "pnpId" );
			printProperty( port, "locationId" );
			printProperty( port, "vendorId" );
			printProperty( port, "productId" );
			console.log( "----------------------------" );
			
		}

	} );

} );
