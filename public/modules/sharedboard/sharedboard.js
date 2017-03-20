
var sharedboard = function() {

    this.firstCanvas = null;

    this.presentationCanvas = null;

    this.socket = null;

    this.instanceName = null;

    this.currentToolState = {

        selectedTool: sharedboard.toolList[ 1 ],
        strokeStyle: "black",
        fillStyle: "transparent",
        lineWidth: 1,

        currentCommand: null

    };

    this.guiStateDown = false;

    this.connectedToModule = false;

};

sharedboard.prototype = {

    constructor: sharedboard

};

sharedboard.colorTemp1 = new THREE.Color();

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
            for ( var i = 1; i < numPoints; i ++ ) {
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
                ctx2d.lineWidth = cmd.lineWidth;
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
                ctx2d.lineWidth = cmd.lineWidth;
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
                for ( var i = 0, il = lines.length; i < il; i ++ ) {
                    ctx2d.fillText( lines[ i ], x, y );
                    y += fontSize;
                }
            }
            if ( cmd.strokeStyle !== "transparent" ) {
                var x = cmd.x * width;
                var y = cmd.y * height;
                ctx2d.strokeStyle = cmd.strokeStyle;
                ctx2d.lineWidth = cmd.lineWidth;
                for ( var i = 0, il = lines.length; i < il; i ++ ) {
                    ctx2d.strokeText( lines[ i ], x, y );
                    y += fontSize;
                }
            }
        }
    },
    {
        name: "floodfill",
        paintFunction: function( ctx2d, width, height, cmd ) {
            var color = cmd.fillStyle;
            if ( color === "transparent" ) {
                return;
            }
            sharedboard.colorTemp1.set( color );
            sharedboard.doFloodFill( ctx2d, width, height,
                Math.floor( cmd.x * width ),
                Math.floor( cmd.y * height ),
                Math.floor( sharedboard.colorTemp1.r * 255 ),
                Math.floor( sharedboard.colorTemp1.g * 255 ),
                Math.floor( sharedboard.colorTemp1.b * 255 )
                );
        }
    },
    {
        name: "file",
        paintFunction: function( ctx2d, width, height, cmd ) {
            if ( cmd.invertBoundary ) {
                ctx2d.globalCompositeOperation = "difference";
                ctx2d.strokeStyle = "white";
                ctx2d.lineWidth = cmd.lineWidth;
                ctx2d.strokeRect( cmd.x * width, cmd.y * height, cmd.width * width, cmd.height * height );
                ctx2d.globalCompositeOperation = "source-over";
            }
        }
    }
];

sharedboard.commandHash = { };
for ( var i = 0, il = sharedboard.commandList.length; i < il; i ++ ) {
    var cmd = sharedboard.commandList[ i ];
    sharedboard.commandHash[ cmd.name ] = cmd;
}

// Supported file types
sharedboard.fileTypes = [
    "img",
    "svg",
    "3d"
];

// Supported file extensions
sharedboard.fileExtensions = {

    png: { type: "img", subtype: "png" },
    jpg: { type: "img", subtype: "jpg" },
    jpeg: { type: "img", subtype: "jpg" },
    gif: { type: "img", subtype: "gif" },

    svg: { type: "svg", subtype: "svg" },

    obj: { type: "3d", subtype: "obj" },
    stl: { type: "3d", subtype: "stl" },
    dae: { type: "3d", subtype: "dae" }

};

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
        w = - w;
    }
    if ( h < 0 ) {
        y0 = y;
        h = - h;
    }
    var cmd = ts.currentCommand;
    cmd.x = x0;
    cmd.y = y0;
    cmd.width = w;
    cmd.height = h;

    sharedBoard.drawLocal( cmd );

};

sharedboard.commonGuiEndFunction = function( sharedBoard, x, y ) {

    sharedBoard.sendCommandArray( [sharedBoard.currentToolState.currentCommand] );
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


sharedboard.fillState = null;

sharedboard.doFloodFill = function( ctx2d, width, height, x, y, red, green, blue ) {

    // Do flood fill in the canvas 2d context.

    var numPixels = width * height;

    var fillState = sharedboard.fillState;
    if ( ! fillState || fillState.length !== numPixels ) {
        sharedboard.fillState = [];
        fillState = sharedboard.fillState;
        for ( var i = 0; i < numPixels; i ++ ) {
            fillState[ i ] = 0;
        }
    }

    var imageData = ctx2d.getImageData( 0, 0, width, height );
    var pixelData = imageData.data;

    // Reset state
    var p = 0;
    for ( var j = 0; j < height; j ++ ) {
        for ( var i = 0; i < width; i ++ ) {
            fillState[ p ] = 0;
            p ++;
        }
    }

    // Plant first seed
    p = 4 * ( y * width + x );
    var originalRed = pixelData[ p ];
    var originalGreen = pixelData[ p + 1 ];
    var originalBlue = pixelData[ p + 2 ];
    fillState[ y * width + x ] = 1;

    function pixelEqualsRGB( x, y ) {

        var p = 4 * ( y * width + x );
        var p2 = ( y * width + x );

        return fillState[ p2 ] === 0 && pixelData[ p ] === originalRed && pixelData[ p + 1 ] === originalGreen && pixelData[ p + 2 ] === originalBlue ? 1 : 0;

    }

    var x0 = x;
    var y0 = y;
    var x1 = x;
    var y1 = y;

    var x0b = x0;
    var x1b = x1;
    var y0b = y0;
    var y1b = y1;

    var q, q2;

    var dx;

    var terminate = false;
    while ( ! terminate ) {

        terminate = true;

        q2 = y0 * width + x0;
        q = q2 * 4;

        dx = x1 - x0 + 1;

        for ( var j = y0; j <= y1; j ++ ) {
            for ( var i = x0; i <= x1; i ++ ) {

                if ( fillState[ q2 ] === 1 ) {

                    pixelData[ q ] = red;
                    pixelData[ q + 1 ] = green;
                    pixelData[ q + 2 ] = blue;
                    fillState[ q2 ] = 2;

                    if ( j > 0 && pixelEqualsRGB( i, j - 1 ) ) {
                        fillState[ ( j - 1 ) * width + i ] = 1;
                        if ( j - 1 < y0b ) {
                            y0b = j - 1;
                        }
                        terminate = false;
                    }
                    if ( j < height - 1 && pixelEqualsRGB( i, j + 1 ) ) {
                        fillState[ ( j + 1 ) * width + i ] = 1;
                        if ( j + 1 > y1b ) {
                            y1b = j + 1;
                        }
                        terminate = false;
                    }
                    if ( i > 0 && pixelEqualsRGB( i - 1, j ) ) {
                        fillState[ j * width + ( i - 1 ) ] = 1;
                        if ( i - 1 < x0b ) {
                            x0b = i - 1;
                        }
                        terminate = false;
                    }
                    if ( i < width - 1 && pixelEqualsRGB( i + 1, j ) ) {
                        fillState[ j * width + ( i + 1 ) ] = 1;
                        if ( i + 1 > x1b ) {
                            x1b = i + 1;
                        }
                        terminate = false;
                    }
                }
                q += 4;
                q2 ++;
            }
            q += ( width - dx ) * 4;
            q2 += width - dx;
        }

        x0 = x0b;
        x1 = x1b;
        y0 = y0b;
        y1 = y1b;
    }

    ctx2d.putImageData( imageData, 0, 0 );
};

sharedboard.toolList = [
    {
        name: "eraseboard",
        guiStartFunction: function( sharedBoard, x, y ) {
            var command = {
                name: "eraseboard",
                fillStyle: sharedBoard.currentToolState.fillStyle
            };
            sharedBoard.sendCommandArray( [command] );
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
                sharedBoard.sendCommandArray( [currentCommand] );
                sharedBoard.currentToolState.currentCommand = sharedBoard.createPolylineCommand( x, y, sharedBoard.currentToolState.lineWidth, sharedBoard.currentToolState.strokeStyle );
            }
            else {
                sharedBoard.drawLocal( currentCommand );
            }
        },
        guiEndFunction: function( sharedBoard, x, y ) {
            var currentCommand = sharedBoard.currentToolState.currentCommand;
            currentCommand.points.push( { x: x, y: y } );
            sharedBoard.sendCommandArray( [currentCommand] );
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
            sharedBoard.sendCommandArray( [currentCommand] );
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
                sharedBoard.sendCommandArray( [currentCommand] );
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
            sharedBoard.sendCommandArray( [currentCommand] );
            sharedBoard.currentToolState.currentCommand = null;
        }
    },
    {
        name: "floodfill",
        guiStartFunction: function( sharedBoard, x, y ) {
            var command = {
                name: "floodfill",
                fillStyle: sharedBoard.currentToolState.fillStyle,
                x: x,
                y: y
            };
            sharedBoard.sendCommandArray( [command] );
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
                lineWidth: ts.lineWidth,
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
                sharedBoard.sendCommandArray( [currentCommand] );
                sharedBoard.currentToolState.currentCommand = null;
            }
        }
    },
    {
        name: "file",
        guiStartFunction: function( sharedBoard, x, y ) {

            var ts = sharedBoard.currentToolState;
            ts.x0 = x;
            ts.y0 = y;
            ts.currentCommand = {
                name: "file",
                strokeStyle: ts.strokeStyle,
                fillStyle: ts.fillStyle,
                lineWidth: ts.lineWidth,
                x: x,
                y: y,
                width: 0,
                height: 0,
                userWidth: 0,
                userHeight: 0,
                originalWidth: 400,
                originalHeight: 250,
                fileName: "Unspecified",
                fileContent: null,
                invertBoundary: true
            };

        },
        guiContinueFunction: function( sharedBoard, x, y, down ) {

            var ts = sharedBoard.currentToolState;
            var cmd = ts.currentCommand;

            if ( ! cmd ) {
                return;
            }

            if ( down ) {
                var x0 = ts.x0;
                var y0 = ts.y0;
                var w = x - x0;
                var h = y - y0;
                if ( w < 0 ) {
                    x0 = x;
                    w = - w;
                }
                if ( h < 0 ) {
                    y0 = y;
                    h = - h;
                }

                cmd.x = x0;
                cmd.y = y0;
                cmd.width = w;
                cmd.height = h;

                cmd.userWidth = w;
                cmd.userHeight = h;

            }

            sharedBoard.constraintFileCommand( cmd );

            sharedBoard.drawLocal( cmd );

        },
        guiEndFunction: function( sharedBoard, x, y ) {

            var cmd = sharedBoard.currentToolState.currentCommand;

            sharedBoard.constraintFileCommand( cmd );

            sharedBoard.sendCommandArray( [cmd] );

            sharedBoard.currentToolState.currentCommand = null;

        }
    }

];

sharedboard.prototype.init = function( firstCanvas, presentationCanvas, socket, instanceName ) {

    this.firstCanvas = firstCanvas;

    this.presentationCanvas = presentationCanvas;

    this.socket = socket;

    this.instanceName = instanceName;

    var scope = this;

    socket.on( "yssbPaintCommand", function( msg ) {

        //console.log( "Arrived paint command." );

        scope.executeCommandArray( scope.firstCanvas, msg );

        scope.blit();

    } );

    socket.on( "yssbError", function( msg ) {

        console.log( "Error: " + msg );

        alert( msg );

    } );

    socket.on( "ysConnectedToModule", function( msg ) {
        scope.connectedToModule = true;
    } );

    socket.on( "ysDisconnectedFromModule", function( msg ) {
        alert( "The connection with the server was closed." );
        scope.connectedToModule = false;
    } );
    /*
     socket.on( "disconnect", function( msg ) {
     alert( "The connection with the server was closed." );
     } );
     */
    scope.connectedToModule = true;

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

    this.executeCommandArray( this.presentationCanvas, [command] );

};

sharedboard.prototype.sendCommandArray = function( commandArray ) {

    if ( ! this.connectedToModule ) {
        this.socket.emit( "ysConnectToModule", { moduleName: "sharedboard", instanceName: this.instanceName } );
    }

    this.socket.emit( "yssbPaintCommand", commandArray );

};

sharedboard.prototype.executeCommandArray = function( canvas, cmdArray ) {

    var ctx2d = canvas.getContext( "2d" );
    var width = canvas.width;
    var height = canvas.height;

    for ( var i = 0, il = cmdArray.length; i < il; i ++ ) {

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

    this.socket.emit( "yssbGetLatestData", { } );

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
        points: [{ x: x, y: y }]
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

sharedboard.prototype.setCurrentLineWidth = function( lineWidth ) {

    this.currentToolState.lineWidth = lineWidth;

    var cmd = this.currentToolState.currentCommand;

    if ( cmd ) {

        cmd.lineWidth = lineWidth;

        sharedBoard.guiContinueCommand( cmd.x, cmd.y );

    }

};

sharedboard.prototype.constraintFileCommand = function( cmd ) {

    if ( cmd.width === 0 ) {
        cmd.width = 1;
        cmd.height = 1;
    }

    if ( cmd.constraintAspect ) {
        var originalAspect = cmd.originalHeight / cmd.originalWidth;
        var presentationAspect = cmd.width < 1 ? 1 : cmd.height / cmd.width;
        if ( presentationAspect >= originalAspect ) {
            cmd.height = cmd.width * originalAspect;
        }
        else {
            cmd.width = cmd.height / originalAspect;
        }
    }

};
