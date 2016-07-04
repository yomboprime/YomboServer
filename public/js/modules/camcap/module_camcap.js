
var camcap = {

	VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

	module.exports = {
		camcap: camcap
	};

}

// ***** Libraries *****


// ***** Module class *****

camcap.camcap = function() {

	this.cam = null;

	this.onTermination = null;

};

camcap.camcap.prototype = {

	constructor: camcap.camcap

};

camcap.camcap.prototype.start = function( onStart ) {

	console.log( "camcap module starting on " + this.config.device );

	this.yomboServer.mapFile( '/public/camcap.html' );
	this.yomboServer.mapFile( '/public/js/modules/camcap/main_camcap.js' );

	this.yomboServer.mapFile( '/public/camcap2.html' );
	this.yomboServer.mapFile( '/public/js/modules/camcap/main_camcap2.js' );

	var v4l2camera = require( "v4l2camera" );

	this.cam = new v4l2camera.Camera( this.config.device );
	
	var format = this.selectCameraFormat( this.cam.formats, this.config );

	if ( format === null ) {
		// TODO set status to error
		console.log( "Error: camcap module: couldn't open camera device (no suitable format found) on " + this.config.device );
	}
	else {

		this.cam.configSet( format );

		this.beginCapture();

	}

	console.log( "camcap module started on " + this.config.device );

	if ( onStart ) {

		onStart();

	}

};

camcap.camcap.prototype.stop = function( onStop ) {

	this.endCapture( function() {

		console.log( "camcap module stopped." );

		if ( onStop ) {

			onStop();

		}

	} );

};

camcap.camcap.prototype.clientConnection = function( client ) {

	console.log( "camcap: Client connected." );

	client.socket.on( "someMessage", function( msg ) {

		console.log( "camcap:Some client sent someMessage. *****" );

	} );

};

camcap.camcap.prototype.clientDisconnection = function( client ) {

	console.log( "camcap: Client disconnected." );

};

camcap.camcap.prototype.getFPS = function( format ) {

	return format.interval.denominator / format.interval.numerator;

};

camcap.camcap.prototype.selectCameraFormat = function( formats, config ) {

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

camcap.camcap.prototype.beginCapture = function() {

	var scope = this;
	var fs = this.yomboServer.fs;
	var cam = this.cam;

	var path = __dirname + "/" + this.config.storeImagesPath;
	if ( path[ path.length - 1 ] !== "/" ) {
		path += "/";
	}

	var imageNumber = 1;

	function captureFunction() {

		if ( scope.onTermination ) {

			cam.stop( scope.onTermination );

			return;
		}

		scope.cam.capture( function( success ) {

			if ( ! success ) {
				console.log( "Error: success=false when capturing frame." );
			}

			//var frame = cam.frameRaw();
			var frame = cam.toRGB();

			scope.yomboServer.emitToClientsArray( scope.clients, "camcapFrame", {
				instanceName: scope.instanceName,
				width: cam.width,
				height: cam.height,
				pixels: frame
			} );

			//fs.createWriteStream( path + "image-" + imageNumber + ".jpg" ).end( Buffer( frame ) );



			imageNumber++;

			if ( scope.onTermination ) {

				cam.stop( scope.onTermination );

			}
			else {

				setTimeout( captureFunction, scope.config.captureIntervalMs );

			}

		} );

	}

	this.cam.start();

	setTimeout( captureFunction, scope.config.captureIntervalMs );

};

camcap.camcap.prototype.endCapture = function( onEnd ) {

	this.onTermination = onEnd;

};
