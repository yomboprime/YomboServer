
var sharedboard = function() {

	this.firstCanvas = null;

	this.presentationCanvas = null;

	this.socket = null;
	
	this.currentToolState = {

		selectedTool: sharedboard.toolList[ 2 ],
		strokeStyle: "black",
		fillStyle: "black",
		fillNoStroke: false,

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
			ctx2d.fillStyle = cmd.fillStyle;
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
			if ( cmd.fillNoStroke ) {
				ctx2d.fillStyle = cmd.fillStyle;
			}
			else {
				ctx2d.strokeStyle = cmd.strokeStyle;
			}

			ctx2d.beginPath();
			var point = points[ 0 ];
			ctx2d.moveTo( point.x * width, point.y * height );
			for ( var i = 1; i < numPoints; i++ ) {
				point = points[ i ];
				ctx2d.lineTo( point.x * width, point.y * height );
			}
			if ( cmd.fillNoStroke ) {
				ctx2d.fill();
			}
			else {
				ctx2d.stroke();
			}
		}
	}
];

sharedboard.commandHash = {};
for ( var i = 0, il = sharedboard.commandList.length; i < il; i++ ) {
	var cmd = sharedboard.commandList[ i ];
	sharedboard.commandHash[ cmd.name ] = cmd;
}

sharedboard.toolList = [
	{
		name: "eraseboard",
		guiStartFunction: function( sharedBoard, x, y ) {
			var command = {
				name: "eraseboard",
				fillStyle: currentToolState.fillStyle
			};
			sharedBoard.sendCommandArray( [ command ] );
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "freeDrawing",
		guiStartFunction: function( sharedBoard, x, y ) {
			sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y );
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
			var currentCommand = sharedBoard.currentToolState.currentCommand;
			currentCommand.points.push( { x: x, y: y } );
			if ( currentCommand.points.length >= 10 ) {
				sharedBoard.sendCommandArray( [ currentCommand ] );
				sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y );
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
			sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y );
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
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
			currentCommand.strokeStyle = "red";
			sharedBoard.sendCommandArray( [ currentCommand ] );
			sharedBoard.currentToolState.currentCommand = null;
		}
	},
	{
		name: "rectangle",
		guiStartFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "ellipse",
		guiStartFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "floodfill",
		guiStartFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "text",
		guiStartFunction: function( sharedBoard, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( sharedBoard, x, y ) {
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

	if ( ! this.guiStateDown ) {
		return;
	}

	this.currentToolState.selectedTool.guiContinueFunction( this, x, y );

};

sharedboard.prototype.guiEndCommand = function( x, y ) {

	this.currentToolState.selectedTool.guiEndFunction( this, x, y );

	this.guiStateDown = false;

};

sharedboard.prototype.drawLocal = function() {

	this.blit();

	this.executeCommandArray( this.presentationCanvas, [ this.currentToolState.currentCommand ] );

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

sharedboard.prototype.createPolylineCommand = function( x, y ) {

	var ts = this.currentToolState;

	return {
		name: "polyline",
		strokeStyle: ts.strokeStyle,
		fillStyle: ts.fillStyle,
		fillNoStroke: ts.fillNoStroke,
		points: [ { x: x, y: y } ]
	};

};
