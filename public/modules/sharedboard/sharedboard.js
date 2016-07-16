
var sharedboard = function() {

	this.firstCanvas = null;

	this.presentationCanvas = null;

	this.socket = null;
	
	this.currentToolState = {

		selectedTool: sharedboard.toolList[ 0 ],
		strokeStyle: "black",
		fillStyle: "black",
		doFill: false,

		currentCommand: null,
		drawLocalCurrentCommand: false,
		readyToSend: false

	};

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
		guiStartFunction: function( currentToolState, x, y ) {
			currentToolState.currentCommand = {
				name: "eraseboard",
				fillStyle: currentToolState.fillStyle
			};
			currentToolState.readyToSend = true;
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "freeDrawing",
		guiStartFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "line",
		guiStartFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "rectangle",
		guiStartFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "ellipse",
		guiStartFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "floodfill",
		guiStartFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
			// Nothing to do
		}
	},
	{
		name: "text",
		guiStartFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiContinueFunction: function( currentToolState, x, y ) {
			// Nothing to do
		},
		guiEndFunction: function( currentToolState, x, y ) {
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

	this.currentToolState.selectedTool.guiStartFunction( this.currentToolstate, x, y );

	this.checkReadyToSend();

};

sharedboard.prototype.guiContinueCommand = function( x, y ) {

	this.currentToolState.selectedTool.guiContinueFunction( this.currentToolstate, x, y );

	this.checkReadyToSend();


};

sharedboard.prototype.guiEndCommand = function( x, y ) {

	this.currentToolState.selectedTool.guiEndFunction( this.currentToolstate, x, y );

	this.checkReadyToSend();

};

sharedboard.prototype.checkReadyToSend = function() {

	if ( this.currentToolState.readyToSend ) {

		this.socket.emit( "yssbPaintCommand", [ this.currentToolState.currentCommand ] );
		this.currentToolState.currentCommand = null;
		this.currentToolState.readyToSend = false;

	}
	else if ( this.currentToolState.drawLocalCurrentCommand ) {

		this.blit();

		this.executeCommandArray( this.presentationCanvas, [ this.currentToolState.currentCommand ] );

		this.currentToolState.drawLocalCurrentCommand = false;
	}

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

	this.presentationCanvas.width = size;
	this.presentationCanvas.height = size;

	this.firstCanvas.width = size;
	this.firstCanvas.height = size;

	this.socket.emit( "yssbGetLatestData", {} );

};

sharedboard.prototype.blit = function() {

	var ctx2d = this.presentationCanvas.getContext( "2d" );
	ctx2d.drawImage( this.firstCanvas, 0, 0 );


//	ctx2d.fillStyle = "white";
//	ctx2d.clearRect( 50, 50, 100, 100 );

};