
var v4l2camera = require( "v4l2camera" );

var CameraCapture = {

	VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

	module.exports = {
		CameraCapture: CameraCapture
	};

}

// ***** Libraries *****


// ***** Module class *****

CameraCapture.CameraCapture = function() {

	this.cam = null;
	this.config = null;
	this.started = false;
	this.imageNumber = 1;

};

CameraCapture.CameraCapture.prototype = {

	constructor: CameraCapture.CameraCapture

};


CameraCapture.CameraCapture.prototype.start = function( config ) {

	// Returns null on success, or error string

	this.config = config;

	try {
		this.cam = new v4l2camera.Camera( this.config.device );
	}
	catch ( e ) {
		return "Couldn't open the media device (device not found)";
	}

	var format = this.selectCameraFormat( this.cam.formats, this.config );

	if ( format === null ) {
		return "Couldn't open media device (no suitable format found)";
	}

	this.cam.configSet( format );

	this.cam.start();

	this.started = true;

	return null;

};

CameraCapture.CameraCapture.prototype.requestFrame = function( config, onCaptured ) {

	if ( ! this.started ) {

		return;

	}

	this.config = config;

	var scope = this;
	this.cam.capture( function( success ) {

		//console.log( "Captured image." );

		if ( ! success ) {
			//console.log( "Error: success=false when capturing frame." );
		}

		//var frame = cam.frameRaw();
		var frame = scope.cam.toRGB();

		var image = null;

		var width = scope.cam.width;
		var height = scope.cam.height;

		var encodingType = scope.config.encodingType;
		if ( encodingType === "pixels" ) {
			image = {
				what: "frame",
				encodingType: encodingType,
				width: width,
				height: height,
				pixels: frame
			};
		}
		else if ( encodingType === "runLength" ) {

			var components = scope.config.components;
			var shiftBits = scope.config.shiftBits;

			image = {
				what: "frame",
				encodingType: encodingType,
				width: width,
				height: height,
				components: components,
				shiftBits: shiftBits,
				encodedData: scope.runLengthEncodeImage( width, height, components, shiftBits, 3, frame )
			};
			
		}

		if ( image ) {
			onCaptured( image );
		}

		//fs.createWriteStream( path + "image-" + this.imageNumber + ".jpg" ).end( Buffer( frame ) );

		this.imageNumber++;

	} );

};

CameraCapture.CameraCapture.prototype.requestTermination = function( onTerminated ) {

	this.cam.stop( onTerminated );

};

CameraCapture.CameraCapture.prototype.getFPS = function( format ) {

	return format.interval.denominator / format.interval.numerator;

};

CameraCapture.CameraCapture.prototype.selectCameraFormat = function( formats, config ) {

	var height = config.format.height;
	var fps = config.format.framesPerSecond;
	var scope = this;
	function compareFormats( f1, f2 ) {

		// Returns -1 if f1 is better than f2, 1 if f2 is better than f1, and 0 if they are equal

		if ( f1.formatName !== config.format.type ) {
			if ( f2.formatName !== config.format.type ) {
				return 0;
			}
			else {
				return 1;
			}
		}
		else {
			if ( f2.formatName !== config.format.type ) {
				return -1;
			}
		}

		var difference = 0;

		if ( height === "max") {
			difference = f2.height - f1.height;
		}
		else if ( height === "min") {
			difference = f1.height - f2.height;
		}
		else {
			difference = ( f2.height - height === 0 ?  1 : 0 ) +
						 ( f1.height - height === 0 ? -1 : 0 );
		}

		if ( difference !== 0 ) {
			return difference;
		}

		if ( fps === "max" ) {
			difference = scope.getFPS( f2 ) - scope.getFPS( f1 );
		}
		else if ( fps === "min") {
			difference = scope.getFPS( f1 ) - scope.getFPS( f2 );
		}
		else {
			difference = ( scope.getFPS( f2 ) - fps === 0 ?  1 : 0 ) +
						 ( scope.getFPS( f1 ) - fps === 0 ? -1 : 0 );
		}

		return difference;

	}

	if ( formats.length < 1 ) {
		return null;
	}

	if ( formats.length === 1 ) {
		return formats[ 0 ];
	}

	var selFormat = formats[ 0 ];

	for ( var i = 1, il = formats.length; i < il; i++ ) {

		var format = formats[ i ];

		var comp = compareFormats( selFormat, format );

		if ( comp > 0 ) {
			selFormat = format;
		}

	}

	return selFormat;

};

CameraCapture.CameraCapture.prototype.runLengthEncodeImage = function( width, height, components, shiftBits, increment, pixels ) {

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

		encodedData.push( ( p2 - p1 ) / increment );
		encodedData.push( value.gray );

	}

	function writeEncodedValueRGB( value, p1, p2 ) {

		if ( p1 >= p2 ) {
			return;
		}

		encodedData.push( ( p2 - p1 ) / increment );
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
	var p = 3;
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

		p += increment;
	}

	writeEncodedValue( value1, lastP, p );

	return encodedData;

};
