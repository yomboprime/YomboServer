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

    this.clientEvents.push( "mapsGetTagList" );

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
            if ( tagsObject ) {
                client.socket.emit( "mapsTagList", tagsObject );
            }
        } );
        
    } );

    return true;

};

maps.maps.prototype.clientDisconnection = function( client ) {

    //this.yomboServer.removeClientFromRoom( client, this.theRoom );

};


maps.maps.prototype.getTags = function( callback ) {

    setTimeout( function() {

        callback( {
            nodesTags: {
                na: [
                    {
                        count: 1,
                        value: "value_na"
                    }
                ],
                nb: [
                    {
                        count: 1,
                        value: "value_nb"
                    }
                ],
                nc: [
                    {
                        count: 1,
                        value: "value_nc"
                    }
                ]
            },
            waysTags: {
                wa: [
                    {
                        count: 1,
                        value: "value_wa"
                    }
                ],
                wb: [
                    {
                        count: 1,
                        value: "value_wb"
                    }
                ],
                wc: [
                    {
                        count: 1,
                        value: "value_wc"
                    }
                ]
            },
            relationsTags: null
        } );
    
    }, 5000 );
        
};
    
maps.maps.prototype.getTags_kk = function( callback ) {
    
    if ( ! this.config.pbfServiceEnabled ) {
        return null;
    }

    var nodesTags = {};
    var waysTags = {};
    //var relationsTags = {};
    
    var scopeModule = this;

    console.log( 'starting parse...' );

    osmread.parse( {

        filePath: scopeModule.config.pbfPath,

        endDocument: function(){

            console.log( 'document end\n' );

            callback( {
                nodesTags: nodesTags,
                waysTags: waysTags,
                relationsTags: null //relationsTags
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
            
            var tagObject = tagObjects[ tag ];

            if ( tagObject === undefined ) {
                tagObjects[ tag ] = [
                    {
                        count: 1,
                        value: value
                    }
                ];
            }
            else {
                var found = false;
                var values = tagObject;
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
