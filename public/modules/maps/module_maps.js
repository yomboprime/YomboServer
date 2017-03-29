var fs = require( 'fs' );
var osmread = require( 'osm-read' );

var maps = {

    VERSION_STRING: "r1"

};

// ***** Exports *****

if ( typeof module !== 'undefined' ) {

    module.exports = {
        maps: maps
    };

}
//optimizar con un array o hash con todos los id de nodos requeridos, y si esta despues buscarlo en los ways
// ***** Libraries *****


// ***** Module class *****

maps.maps = function() {

    this.allowedClients = [];

};

maps.maps.prototype = {

    constructor: maps.maps

};

maps.maps.prototype.start = function( onStart ) {

    this.yomboServer.mapDirectory( "/public/lib/leaflet" );

    this.yomboServer.mapFile( "/public/modules/maps/testMap.html" );
    this.yomboServer.mapFile( "/public/modules/maps/main_testMap.js" );
    
    this.yomboServer.mapFile( "/public/static/testBug.html" );

    this.yomboServer.mapDirectory( "/tiles/", this.config.tilesPath );

    this.clientEvents.push( "mapsGetTagList", "mapsGetNodes", "mapsGetWays" );

    if ( onStart ) {

        onStart();

    }

};

maps.maps.prototype.stop = function( onStop ) {

    if ( onStop ) {

        onStop();

    }

};

maps.maps.prototype.clientConnection = function( client, msg ) {

/*
    if ( ! msg.token || ! msg.token in this.config.privateConfig.tokens ) {
        return false;
    }
*/
    client.map = {
        token: msg.token
    };
/*
    // Add client id to allowed clients
    if ( this.allowedClients.indexOf( client. < 0 ) ) {
        this.allowedClients.push( )
    }
*/
    var scopeModule = this;

    client.socket.on( "mapsGetTagList", function( msg ) {
        
        scopeModule.getTags( function( tagsObject ) {
            client.socket.emit( "mapsTagList", tagsObject );
        } );
        
    } );
    
    client.socket.on( "mapsGetNodes", function( msg ) {
        
        scopeModule.getNodes( msg, function( markers ) {
            client.socket.emit( "mapsMarkers", markers );
        } );

    } );
    
    client.socket.on( "mapsGetWays", function( msg ) {
        
        scopeModule.getWays( msg, function( polyLines ) {
            client.socket.emit( "mapsPolylines", polyLines );
        } );

    } );

    return {
        footProfilePort: this.config.osrmServerFootProfilePort,
        carProfilePort: this.config.osrmServerCarProfilePort,
        maxFootDistance: this.config.osrmServiceMaxFootDistance
    };

};

maps.maps.prototype.clientDisconnection = function( client ) {

    //this.yomboServer.removeClientFromRoom( client, this.theRoom );

};


maps.maps.prototype.getTagsTest = function( callback ) {

    setTimeout( function() {

        callback( {
            nodesTags: [
                {
                    tag: "na",
                    values: [
                        {
                            count: 1,
                            value: "value_na"
                        }
                    ]
                },
                {
                    tag: "nb",
                    values: [
                        {
                            count: 1,
                            value: "value_nb"
                        }
                    ]
                },
                {
                    tag: "nc",
                    values: [
                        {
                            count: 1,
                            value: "value_nc"
                        }
                    ]
                }
            ],
            waysTags: [
                {
                    tag: "wa",
                    values: [
                        {
                            count: 1,
                            value: "value_wa"
                        }
                    ]
                },
                {
                    tag: "wb",
                    values: [
                        {
                            count: 1,
                            value: "value_wb"
                        }
                    ]
                },
                {
                    tag: "wc",
                    values: [
                        {
                            count: 1,
                            value: "value_wc"
                        }
                    ]
                }
            ]

        } );

    }, 2000 );
        
};
    
maps.maps.prototype.getTags = function( callback ) {

    function processTags( tags, tagObjects ) {

        if ( ! tags ) {
            return;
        }

        for ( var tag in tags ) {
            if ( tags.hasOwnProperty( tag ) ) {

                var value = tags[ tag ];

                if ( tag === "constructor" ) {
                    continue;
                }

                var tagObject = undefined;
                for ( var i = 0; i < tagObjects.length; i++ ) {
                    if ( tagObjects[ i ].tag === tag ) {
                        tagObject = tagObjects[ i ];
                        break;
                    }
                }

                if ( tagObject === undefined ) {
                    tagObjects.push( {
                        tag: tag,
                        values: [
                            {
                                count: 1,
                                value: value
                            }
                        ]
                    } );
                }
                else {
                    var found = false;
                    var values = tagObject.values;
                    var n = values.length;

                    for ( var i = 0; i < n; i++ ) {
                        if ( values[ i ].value === value ) {
                            values[ i ].count++;
                            found = true;
                            break;
                        }
                    }
                    if ( ! found ) {
                        values.push( {
                            count: 1,
                            value: value
                        } );
                    }
                }
            }
        }
    }

    if ( ! this.config.pbfServiceEnabled ) {
        return null;
    }

    var nodesTags = [];
    var waysTags = [];
    //var relationsTags = [];
    
    var scopeModule = this;

    console.log( 'starting parse...' );

    osmread.parse( {

        filePath: scopeModule.config.pbfPath,

        endDocument: function(){

            console.log( 'document end\n' );

            callback( {
                nodesTags: nodesTags,
                waysTags: waysTags,
                relationsTags: null
            } );

        },

        bounds: function(bounds){
            // Nothing to do here
        },

        node: function(node){
            processTags( node.tags, nodesTags );
        },

        way: function(way){
            processTags( way.tags, waysTags );
        },

        relation: function(relation){
            //processTags( relation.tags, relationsTags );
        },

        error: function(msg){
            console.log('************ pbf parse error: ' + msg);
            callback( null );
        }

    } );

};

maps.maps.prototype.getNodes = function( msg, callback ) {

    var tag = msg.tag;
    var requestedValue = msg.value;

    function processNode( node ) {
        
        var tags = node.tags;

        if ( ! tags ) {
            return;
        }
        
        if ( ! tags.hasOwnProperty( tag ) ) {
            return;
        }

        var value = tags[ tag ];
        if ( requestedValue === undefined || requestedValue === value ) {
            markers.push( {
                lat: node.lat,
                lon: node.lon
            } );
        }
    }

    if ( ! this.config.pbfServiceEnabled ) {
        return null;
    }

    var markers = [];

    var scopeModule = this;

    console.log( 'starting nodes parsing...' );

    osmread.parse( {

        filePath: scopeModule.config.pbfPath,

        endDocument: function(){

            console.log( 'document end\n' );

            callback( {
                layerName: "Nodes tagged " + tag + ( requestedValue !== undefined ? " = " + requestedValue : "" ),
                markers: markers
            } );

        },

        bounds: function(bounds){
            // Nothing to do here
        },

        node: processNode,

        way: function(way){
            // Nothing to do here
        },

        relation: function(relation){
            // Nothing to do here
        },

        error: function(msg){
            console.log('************ pbf parse error: ' + msg);
            callback( null );
        }

    } );

};

maps.maps.prototype.getWays = function( msg, callback ) {


    var tag = msg.tag;
    var requestedValue = msg.value;

    function processWay( way ) {
        
        var tags = way.tags;

        if ( ! tags ) {
            return;
        }
        
        if ( ! tags.hasOwnProperty( tag ) ) {
            return;
        }
        
        var value = tags[ tag ];
        if ( requestedValue === undefined || requestedValue === value ) {
            var points = [];
            for ( var i = 0; i < way.nodeRefs.length; i++ ) {
                points[ i ] = null;
            }
            ways.push( {
                nodeRefs: way.nodeRefs,
                points: points
            } );
        }
    }


    function processNode( node ) {
        
        var id = node.id;
        
        // Quick find if node id is of our interest
        if ( allNodesList.indexOf( id ) < 0 ) {
            return;
        }
        
        var nw = ways.length;
        for ( var i = 0; i < nw; i++ ) {
            var w = ways[ i ];
            var index = 0;
            while ( index >= 0 ) {
                index = w.nodeRefs.indexOf( id, index );
                if ( index >= 0 ) {
                    w.points[ index ] = [ node.lat, node.lon ];
                    index++;
                }
            }
        }
    }

    if ( ! this.config.pbfServiceEnabled ) {
        return null;
    }

    var ways = [];
    
    var allNodesList = null;

    var scopeModule = this;

    console.log( 'starting nodes parsing...' );

    // First process the ways...

    osmread.parse( {

        filePath: scopeModule.config.pbfPath,

        endDocument: function(){

            console.log( 'document end\n' );

            // ... and then process the nodes that belong to the selected ways:
            parseNodes();

        },

        bounds: function(bounds){
            // Nothing to do here
        },

        node: function(way){
            // Nothing to do here
        },
        
        way: processWay,

        relation: function(relation){
            // Nothing to do here
        },

        error: function(msg){
            console.log('************ pbf parse error: ' + msg);
            callback( null );
        }

    } );

    function parseNodes() {

        // Store nodes from all ways in a single list to detect more rapidly
        // if a given node id is to be added.
        allNodesList = [];
        var nw = ways.length;
        for ( var i = 0; i < nw; i++ ) {
            var w = ways[ i ];
            var refs = w.nodeRefs;
            var np = refs.length;
            for ( var j = 0; j < np; j++ ) {
                var r = refs[ j ];
                if ( allNodesList.indexOf( r ) < 0 ) {
                    allNodesList.push( r );
                }
            }
        }

        osmread.parse( {

            filePath: scopeModule.config.pbfPath,

            endDocument: function(){

                console.log( 'document end\n' );
                
                var nw = ways.length;
                for ( var i = 0; i < nw; i++ ) {
                    var w = ways[ i ];
                    w.nodeRefs = undefined;
                    
                    // Remove unreferenced nodes
                    var points = w.points;
                    var np = points.length;
                    for ( var j = np - 1; j >= 0; j-- ) {
                        if ( ! points[ j ] ) {
                            points.splice( j, 1 );
                        }
                    }
                }

                callback( {
                    layerName: "Ways tagged " + tag + ( requestedValue !== undefined ? " = " + requestedValue : "" ),
                    ways: ways
                } );

            },

            bounds: function(bounds){
                // Nothing to do here
            },

            node: processNode,

            way: function(way){
                // Nothing to do here
            },

            relation: function(relation){
                // Nothing to do here
            },

            error: function(msg){
                console.log('************ pbf parse error: ' + msg);
                callback( null );
            }

        } );
    }

};
