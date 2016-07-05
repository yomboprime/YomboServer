
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

	this.config = config;

	this.cam = new v4l2camera.Camera( this.config.device );

	var format = this.selectCameraFormat( this.cam.formats, this.config );

	if ( format === null ) {
		// TODO set status to error
		//console.log( "Error: camcap module: couldn't open camera device (no suitable format found) on " + this.config.device );
	}
	else {

		this.cam.configSet( format );

		this.cam.start();

		this.started = true;

	}

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

		onCaptured( {
			what: "frame",
			width: scope.cam.width,
			height: scope.cam.height,
// TODO test just with the buffer
			pixels: frame
		} );

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
