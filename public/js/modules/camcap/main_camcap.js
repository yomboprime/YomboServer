
var socket;

var theCanvas = document.getElementById( "theCanvas" );

var theCanvas2 = document.getElementById( "theCanvas2" );

init();

function init() {

    socket = io();

    socket.on( "camcapFrame", function( msg ) {

		console.log( "Server frame message received." );

		var width = msg.width;
		var height = msg.height;

		if ( theCanvas.width !== width || theCanvas.height !== height ) {
			theCanvas.width = width;
			theCanvas.height = height;
		}

		var ctx2d = theCanvas.getContext( "2d" );

		var destImageData = ctx2d.getImageData( 0, 0, width, height);
		var destPixels = destImageData.data;

		var encodingType = msg.encodingType;
		if ( encodingType === "pixels" ) {

			var pixels = msg.pixels;

			var n = width * height;
			var p = 0;
			var pDest = 0;
			for ( var i = 0; i < n; i++ ) {
				destPixels[ pDest ] = pixels[ p + 0 ];
				destPixels[ pDest + 1 ] = pixels[ p + 1 ];
				destPixels[ pDest + 2 ] = pixels[ p + 2 ];
				destPixels[ pDest + 3 ] = 255;
				p += 3;
				pDest += 4;
			}

		}
		else if ( encodingType === "runLength" ) {

			var components = msg.components;
			var shiftBits = msg.shiftBits;

			var encodedData = msg.encodedData;

			runLengthDecodeImage( width, height, encodedData, destPixels, components, shiftBits );

		}
		ctx2d.putImageData( destImageData, 0, 0 );


/*
		theCanvas2.width = width;
		theCanvas2.height = height;

		var ctx2d2 = theCanvas2.getContext( "2d" );

		ctx2d2.drawImage( theCanvas, 0, 0 );

		var destImageData2 = ctx2d2.getImageData( 0, 0, width, height);
		var destPixels2 = destImageData2.data;

		var encodedData = runLengthEncodeImage( width, height, destPixels2, 1, 7 );

		var np = width * height * 4;
		for ( var i = 0; i < np; i+=4 ) {
			destPixels2[ i  ] = 255;
			destPixels2[ i + 1 ] = 0;
			destPixels2[ i + 2 ] = 0;
			destPixels2[ i + 3 ] = 255;
		}

		runLengthDecodeImage( width, height, encodedData, destPixels2, 1, 7 );

		ctx2d2.putImageData( destImageData2, 0, 0 );
*/


		
	} );

    socket.emit( "connectToModule", { moduleName: "camcap", instanceName: "camcap_vid0" } );

	//socket.emit( "someMessage", { } );

}

function runLengthEncodeImage( width, height, pixels, components, shiftBits ) {

	var encodedData = [];

	var numPixels = width * height;

	function readValueGray( p, value ) {
		value.gray = Math.floor( ( pixels[ p ] + pixels[ p + 1 ] + pixels[ p + 2 ] ) / 3 ) >> shiftBits;
	}

	function readValueRGB( p, value ) {
		value.r = pixels[ p ] >> shiftBits;
		value.g = pixels[ p + 1 ] >> shiftBits;
		value.b = pixels[ p + 2 ] >> shiftBits;
	}

	function compareValuesGray( value1, value2 ) {
		return value1.gray === value2.gray ? 0 : 1;
	}

	function compareValuesRGB( value1, value2 ) {
		return ( value1.r === value2.r &&
				value1.g === value2.g &&
				value1.b === value2.b ) ? 0 : 1;
	}

	function writeEncodedValueGray( value, p1, p2 ) {

		if ( p1 >= p2 ) {
			return;
		}

		encodedData.push( ( p2 - p1 ) >> 2 );
		encodedData.push( value.gray );

	}

	function writeEncodedValueRGB( value, p1, p2 ) {

		if ( p1 >= p2 ) {
			return;
		}

		encodedData.push( ( p2 - p1 ) >> 2 );
		encodedData.push( value.r );
		encodedData.push( value.g );
		encodedData.push( value.b );

	}

	var readValue = readValueGray;
	var compareValues = compareValuesGray;
	var writeEncodedValue = writeEncodedValueGray;
	if ( components === 3 ) {
		readValue = readValueRGB;
		compareValues = compareValuesRGB;
		writeEncodedValue = writeEncodedValueRGB;
	}

	var value1 = { r: 0, g: 0, b: 0, gray: 0 };
	var value2 = { r: 0, g: 0, b: 0, gray: 0 };

	readValue( 0, value1 );

	var lastP = 0;
	var p = 4;
	for ( var i = 1; i < numPixels; i++ ) {

		readValue( p, value2 );

		if ( compareValues( value1, value2 ) !== 0 ) {

			writeEncodedValue( value1, lastP, p );
			value1.r = value2.r;
			value1.g = value2.g;
			value1.b = value2.b;
			value1.gray = value2.gray;
			value1.valid = true;
			lastP = p;
		}

		p += 4;
	}

	writeEncodedValue( value1, lastP, p );

	return encodedData;

}

function runLengthDecodeImage( width, height, encodedData, pixels, components, shiftBits ) {

	var encDataLength = encodedData.length;

	var p = 0;
	var pEncData = 0;
	while ( pEncData < encDataLength ) {

		var numPixelsRow = encodedData[ pEncData++ ];
		var r = encodedData[ pEncData++ ] << shiftBits;
		var g = r;
		var b = r;
		if ( components === 3 ) {
			g = encodedData[ pEncData++ ] << shiftBits;
			b = encodedData[ pEncData++ ] << shiftBits;
		}

		var pDest = p + numPixelsRow * 4;
		while ( p < pDest ) {
			pixels[ p ] = r;
			pixels[ p + 1 ] = g;
			pixels[ p + 2 ] = b;
			pixels[ p + 3 ] = 255;
			p += 4;
		}

	}

}
