
var sharedboard = function() {

	this.firstCanvas = null;

	this.presentationCanvas = null;

	this.socket = null;
	
	this.currentToolState = {

		selectedTool: sharedboard.toolList[ 1 ],
		strokeStyle: "black",
		fillStyle: "transparent",
		lineWidth: 1,

		currentCommand: null

	};

	this.guiStateDown = false;

};

sharedboard.prototype = {

	constructor: sharedboard
	
};

sharedboard.commandList = [
	{
		name: "eraseboard",
		paintFunction: function( ctx2d, width, height, cmd ) {
			var color = cmd.fillStyle;
			if ( color === "transparent" ) {
				color = "white";
			}
			ctx2d.fillStyle = color;
			ctx2d.fillRect( 0, 0, width, height );
		}
	},
	{
		name: "polyline",
		paintFunction: function( ctx2d, width, height, cmd ) {
			var points = cmd.points;
			var numPoints = points.length;
			if ( numPoints === 0 ) {
				return;
			}
			ctx2d.strokeStyle = cmd.strokeStyle;
			ctx2d.lineWidth = cmd.lineWidth;
			ctx2d.beginPath();
			var point = points[ 0 ];
			ctx2d.moveTo( point.x * width, point.y * height );
			for ( var i = 1; i < numPoints; i++ ) {
				point = points[ i ];
				ctx2d.lineTo( point.x * width, point.y * height );
			}
			ctx2d.stroke();
		}
	},
	{
		name: "rectangle",
		paintFunction: function( ctx2d, width, height, cmd ) {
			if ( cmd.fillStyle !== "transparent" ) {
				ctx2d.fillStyle = cmd.fillStyle;
				ctx2d.fillRect( cmd.x * width, cmd.y * height, cmd.width * width, cmd.height * height );
			}
			if ( cmd.strokeStyle !== "transparent" ) {
				ctx2d.strokeStyle = cmd.strokeStyle;
				ctx2d.strokeRect( cmd.x * width, cmd.y * height, cmd.width * width, cmd.height * height );
			}
		}
	},
	{
		name: "ellipse",
		paintFunction: function( ctx2d, width, height, cmd ) {
			if ( ! ctx2d.ellipse ) {
				return;
			}
			if ( cmd.fillStyle !== "transparent" ) {
				ctx2d.fillStyle = cmd.fillStyle;
				ctx2d.beginPath();
				ctx2d.ellipse( cmd.x * width, cmd.y * height, cmd.width * width, cmd.height * height, 0, 0, 2 * Math.PI, false );
				ctx2d.fill();
			}
			if ( cmd.strokeStyle !== "transparent" ) {
				ctx2d.strokeStyle = cmd.strokeStyle;
				ctx2d.beginPath();
				ctx2d.ellipse( cmd.x * width, cmd.y * height, cmd.width * width, cmd.height * height, 0, 0, 2 * Math.PI, false );
				ctx2d.stroke();
			}
		}
	},
	{
		name: "text",
		paintFunction: function( ctx2d, width, height, cmd ) {
			var fontSize = cmd.fontSize;
			var font = sharedboard.getTextFontSpecifier( cmd.fontFamily, fontSize, cmd.italic, cmd.bold );
			ctx2d.font = font;
			var lines = cmd.text.split( "\n" );
			if ( cmd.fillStyle !== "transparent" ) {
				var x = cmd.x * width;
				var y = cmd.y * height;
				ctx2d.fillStyle = cmd.fillStyle;
				for ( var i = 0, il = lines.length; i < il; i++ ) {
					ctx2d.fillText( lines[ i ], x, y );
					y += fontSize;
				}
			}
			if ( cmd.strokeStyle !== "transparent" ) {
				var x = cmd.x * width;
				var y = cmd.y * height;
				ctx2d.strokeStyle = cmd.strokeStyle;
				for ( var i = 0, il = lines.length; i < il; i++ ) {
					ctx2d.strokeText( lines[ i ], x, y );
					y += fontSize;
				}
			}
		}
	}
];

sharedboard.commandHash = {};
for ( var i = 0, il = sharedboard.commandList.length; i < il; i++ ) {
	var cmd = sharedboard.commandList[ i ];
	sharedboard.commandHash[ cmd.name ] = cmd;
}

sharedboard.getTextFontFamilyList = function() {

	return [
		"Arial",
		"Courier New",
		"Georgia",
		"Times New Roman",
		"Verdana"
	];

};

sharedboard.getTextFontSpecifier = function( fontFamily, fontSize, italic, bold ) {

	var font = italic ? "italic " : "";

	if ( bold ) {
		font += "bolder ";
	}

	font += fontSize + "px " + fontFamily;

	return font;

};

sharedboard.commonGuiContinueFunction = function( sharedBoard, x, y, down ) {

	if ( sharedboard.drawPointerCircle( sharedBoard, x, y, down ) ) {
		return;
	}

	var ts = sharedBoard.currentToolState;
	var x0 = ts.x0;
	var y0 = ts.y0;
	var w = x - x0;
	var h = y - y0;
	if ( w < 0 ) {
		x0 = x;
		w = -w;
	}
	if ( h < 0 ) {
		y0 = y;
		h = -h;
	}
	var cmd = ts.currentCommand;
	cmd.x = x0;
	cmd.y = y0;
	cmd.width = w;
	cmd.height = h;

	sharedBoard.drawLocal( cmd );

};

sharedboard.commonGuiEndFunction = function( sharedBoard, x, y ) {

	sharedBoard.sendCommandArray( [ sharedBoard.currentToolState.currentCommand ] );
	sharedBoard.currentToolState.currentCommand = null;

};

sharedboard.drawPointerCircle = function( sharedBoard, x, y, down, lineWidthScale ) {

	if ( ! down ) {

		sharedBoard.blit();

		lineWidthScale = lineWidthScale || 1;

		var canvas = sharedBoard.presentationCanvas;
		var ctx2d = canvas.getContext( "2d" );
		sharedboard.strokeCircle( ctx2d, x * canvas.width, y * canvas.height, sharedBoard.currentToolState.lineWidth * 0.5 * lineWidthScale, sharedBoard.currentToolState.strokeStyle );

		return true;
	}

	return false;

};

sharedboard.strokeCircle = function( ctx2d, x, y, radius, color ) {

	ctx2d.fillStyle = color;
	ctx2d.beginPath();
	ctx2d.arc( x, y, radius, 0, 2 * Math.PI, false );
	ctx2d.fill();
	ctx2d.closePath();

};

sharedboard.toolList = [
	{
		name: "eraseboard",
		guiStartFunction: function( sharedBoard, x, y ) {
			var command = {
				name: "eraseboard",
				fillStyle: sharedBoard.currentToolState.fillStyle
			};
			sharedBoard.sendCommandArray( [ command ] );
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "freeDrawing",
		guiStartFunction: function( sharedBoard, x, y ) {
			sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y, sharedBoard.currentToolState.lineWidth, sharedBoard.currentToolState.strokeStyle );
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			if ( sharedboard.drawPointerCircle( sharedBoard, x, y, down ) ) {
				return;
			}

			var currentCommand = sharedBoard.currentToolState.currentCommand;
			currentCommand.points.push( { x: x, y: y } );
			if ( currentCommand.points.length >= 10 ) {
				sharedBoard.sendCommandArray( [ currentCommand ] );
				sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y, sharedBoard.currentToolState.lineWidth, sharedBoard.currentToolState.strokeStyle );
			}
			else {
				sharedBoard.drawLocal( currentCommand );
			}
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			var currentCommand = sharedBoard.currentToolState.currentCommand;
			currentCommand.points.push( { x: x, y: y } );
			sharedBoard.sendCommandArray( [ currentCommand ] );
			sharedBoard.currentToolState.currentCommand = null;
		}
	},
	{
		name: "line",
		guiStartFunction: function( sharedBoard, x, y ) {
			sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y, sharedBoard.currentToolState.lineWidth, sharedBoard.currentToolState.strokeStyle );
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			if ( sharedboard.drawPointerCircle( sharedBoard, x, y, down ) ) {
				return;
			}
			var points = sharedBoard.currentToolState.currentCommand.points;
			if ( points.length < 2 ) {
				points.push( { x: x, y: y } );
			}
			else {
				points[ 1 ].x = x;
				points[ 1 ].y = y;
			}
			sharedBoard.drawLocal( sharedBoard.currentToolState.currentCommand );
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			var currentCommand = sharedBoard.currentToolState.currentCommand;
			var points = currentCommand.points;
			if ( points.length < 2 ) {
				points.push( { x: x, y: y } );
			}
			else {
				points[ 1 ].x = x;
				points[ 1 ].y = y;
			}
			sharedBoard.sendCommandArray( [ currentCommand ] );
			sharedBoard.currentToolState.currentCommand = null;
		}
	},
	{
		name: "rectangle",
		guiStartFunction: function( sharedBoard, x, y ) {
			var ts = sharedBoard.currentToolState;
			ts.x0 = x;
			ts.y0 = y;
			ts.currentCommand = {
				name: "rectangle",
				strokeStyle: ts.strokeStyle,
				fillStyle: ts.fillStyle,
				lineWidth: ts.lineWidth,
				x: x,
				y: y,
				width: 0,
				height: 0
			};

		},
		guiContinueFunction: sharedboard.commonGuiContinueFunction,
		guiEndFunction: sharedboard.commonGuiEndFunction
	},
	{
		name: "ellipse",
		guiStartFunction: function( sharedBoard, x, y ) {
			var ts = sharedBoard.currentToolState;
			ts.x0 = x;
			ts.y0 = y;
			ts.currentCommand = {
				name: "ellipse",
				strokeStyle: ts.strokeStyle,
				fillStyle: ts.fillStyle,
				lineWidth: ts.lineWidth,
				x: x,
				y: y,
				width: 0,
				height: 0
			};

		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			if ( sharedboard.drawPointerCircle( sharedBoard, x, y, down ) ) {
				return;
			}
			var ts = sharedBoard.currentToolState;
			var x0 = ts.x0;
			var y0 = ts.y0;
			var w = Math.abs( x - x0 );
			var h = Math.abs( y - y0 );
			var cmd = ts.currentCommand;
			cmd.width = w;
			cmd.height = h;

			sharedBoard.drawLocal( cmd );
		},
		guiEndFunction: sharedboard.commonGuiEndFunction
	},
	{
		name: "eraser",
		guiStartFunction: function( sharedBoard, x, y ) {
			var color = sharedBoard.currentToolState.fillStyle;
			if ( color === "transparent" ) {
				color = "white";
			}
			sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y, sharedBoard.currentToolState.lineWidth * 3, color );
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			if ( sharedboard.drawPointerCircle( sharedBoard, x, y, down, 3 ) ) {
				return;
			}

			var currentCommand = sharedBoard.currentToolState.currentCommand;
			currentCommand.points.push( { x: x, y: y } );
			if ( currentCommand.points.length >= 10 ) {
				sharedBoard.sendCommandArray( [ currentCommand ] );
				var color = sharedBoard.currentToolState.fillStyle;
				if ( color === "transparent" ) {
					color = "white";
				}
				sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y, sharedBoard.currentToolState.lineWidth * 3, color );
			}
			else {
				sharedBoard.drawLocal( currentCommand );
			}
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			var currentCommand = sharedBoard.currentToolState.currentCommand;
			currentCommand.points.push( { x: x, y: y } );
			sharedBoard.sendCommandArray( [ currentCommand ] );
			sharedBoard.currentToolState.currentCommand = null;
		}
	},
	{
		name: "floodfill",
		guiStartFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "text",
		guiStartFunction: function( sharedBoard, x, y ) {
			var ts = sharedBoard.currentToolState;
			ts.currentCommand = {
				name: "text",
				fontSize: 10,
				fontFamily: "Arial",
				italic: false,
				bold: false,
				strokeStyle: ts.strokeStyle,
				fillStyle: ts.fillStyle,
				text: "",
				x: x,
				y: y
			};
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			sharedBoard.drawLocal( sharedBoard.currentToolState.currentCommand );
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			var currentCommand = sharedBoard.currentToolState.currentCommand;
			if ( currentCommand ) {
				sharedBoard.sendCommandArray( [ currentCommand ] );
				sharedBoard.currentToolState.currentCommand = null;
			}
		}
	},
	{
		name: "file",
		guiStartFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( sharedBoard, x, y, down ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	}

];

sharedboard.prototype.init = function( firstCanvas, presentationCanvas, socket, instanceName ) {

	this.firstCanvas = firstCanvas;

	this.presentationCanvas = presentationCanvas;

	this.socket = socket;

	var scope = this;

	socket.on( "yssbPaintCommand", function( msg ) {

		console.log( "Arrived paint command." );

		scope.executeCommandArray( scope.firstCanvas, msg );

		scope.blit();

	} );

	socket.emit( "ysConnectToModule", { moduleName: "sharedboard", instanceName: instanceName } );

};

sharedboard.prototype.guiStartCommand = function( x, y ) {

	this.currentToolState.selectedTool.guiStartFunction( this, x, y );

	this.guiStateDown = true;

};

sharedboard.prototype.guiContinueCommand = function( x, y ) {

	this.currentToolState.selectedTool.guiContinueFunction( this, x, y, this.guiStateDown );

};

sharedboard.prototype.guiEndCommand = function( x, y ) {

	if ( this.guiStateDown ) {
		this.currentToolState.selectedTool.guiEndFunction( this, x, y );
	}

	this.guiStateDown = false;

};

sharedboard.prototype.drawLocal = function( command ) {

	this.blit();

	this.executeCommandArray( this.presentationCanvas, [ command ] );

};

sharedboard.prototype.sendCommandArray = function( commandArray ) {

	this.socket.emit( "yssbPaintCommand", commandArray );

};

sharedboard.prototype.executeCommandArray = function( canvas, cmdArray ) {

	var ctx2d = canvas.getContext( "2d" );
	var width = canvas.width;
	var height = canvas.height;

	for ( var i = 0, il = cmdArray.length; i < il; i++ ) {

		var cmd = cmdArray[ i ];

		var cmdDefinition = sharedboard.commandHash[ cmd.name ];

		cmdDefinition.paintFunction( ctx2d, width, height, cmd );

	}

};

sharedboard.prototype.resize = function( size ) {

	console.log( "resize." );

	// TODO setTimeout, and if resized meanwhile, cancel it and relaunch

	this.presentationCanvas.width = size;
	this.presentationCanvas.height = size;

	this.firstCanvas.width = size;
	this.firstCanvas.height = size;

	this.socket.emit( "yssbGetLatestData", {} );

};

sharedboard.prototype.blit = function() {

	var ctx2d = this.presentationCanvas.getContext( "2d" );
	ctx2d.drawImage( this.firstCanvas, 0, 0 );

};

sharedboard.prototype.createPolylineCommand = function( x, y, lineWidth, strokeStyle ) {

	var ts = this.currentToolState;

	return {
		name: "polyline",
		strokeStyle: strokeStyle,
		fillStyle: ts.fillStyle,
		lineWidth: lineWidth,
		points: [ { x: x, y: y } ]
	};

};

sharedboard.prototype.selectTool = function( toolIndex ) {

	if ( toolIndex < 0 || toolIndex >= sharedboard.toolList.length ) {
		return;
	}

	this.currentToolState.selectedTool = sharedboard.toolList[ toolIndex ];

};

sharedboard.prototype.setCurrentStrokeColor = function( color ) {

	this.currentToolState.strokeStyle = color;

	var cmd = this.currentToolState.currentCommand;

	if ( cmd ) {

		cmd.strokeStyle = color;

		sharedBoard.guiContinueCommand( cmd.x, cmd.y );

	}

};

sharedboard.prototype.setCurrentFillColor = function( color ) {

	this.currentToolState.fillStyle = color;

	var cmd = this.currentToolState.currentCommand;

	if ( cmd ) {

		cmd.fillStyle = color;

		sharedBoard.guiContinueCommand( cmd.x, cmd.y );

	}

};
