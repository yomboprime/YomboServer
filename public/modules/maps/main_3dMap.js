
// Pont d'Inca Nou
//var centralLatitude = 39.602904;
//var centralLongitude = 2.695771;

// Plaça Major
var centralLatitude = 39.5713839221126;
var centralLongitude = 2.651739120483399;

var terrainSideLength = 1200 * 3;

var buildingLevelHeight = 3;




var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.5, 5000 );
var controls = new THREE.OrbitControls( camera );
var clock = new THREE.Clock();
var scene = new THREE.Scene();

camera.position.x = 0;
camera.position.y = 50;
camera.position.z = 200;

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor( 0x297CD8 );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
//renderer.shadowMap.enabled = true;

var ambientLight = new THREE.AmbientLight( 0x707070 );
scene.add( ambientLight );

var light = new THREE.DirectionalLight( 0xffffff, 1 );
light.position.set( - 100, 180, 50 );
/*
 light.castShadow = true;
 var d = 14;
 light.shadow.camera.left = -d;
 light.shadow.camera.right = d;
 light.shadow.camera.top = d;
 light.shadow.camera.bottom = -d;

 light.shadow.camera.near = 2;
 light.shadow.camera.far = 50;

 light.shadow.mapSize.x = 1024;
 light.shadow.mapSize.y = 1024;
 */
scene.add( light );

var boxGround = new THREE.Mesh( new THREE.BoxGeometry( terrainSideLength, 10, terrainSideLength ), new THREE.MeshLambertMaterial( { color: 0xA0A0D0 } ) );
boxGround.position.y = - 5;
scene.add( boxGround );

//var testBox = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), new THREE.MeshLambertMaterial( { color: 0xFFFFFF } ) );
//testBox.position.set( 30, 5, -10)
//scene.add( testBox );

var pbfFilePath = "/public/modules/maps/mallorca.pbf";

var ways = [];
var allNodesRefs = [];
var waysNodes = [];

var differentTags = [];

parse1();

function parse1() {
    console.log( "Started first parsing." );
    
    var mercator = latLon2Mercator( centralLatitude, centralLongitude );
    var latLon = mercator2LatLon( mercator.x - 0.5 * terrainSideLength / EARTH_EQUATOR_LENGTH, mercator.y + 0.5 * terrainSideLength / EARTH_EQUATOR_LENGTH );
    var lat0 = latLon.lat;
    var lon0 = latLon.lon;
    mercator2LatLon( mercator.x + 0.5 * terrainSideLength / EARTH_EQUATOR_LENGTH, mercator.y - 0.5 * terrainSideLength / EARTH_EQUATOR_LENGTH, latLon );
    var lat1 = latLon.lat;
    var lon1 = latLon.lon;

    pbfParser.parse( {
        filePath: pbfFilePath,
        endDocument: function() {
            console.log( "Total nodes: " + allNodesRefs.length );
            console.log( "Num ways parsed: " + ways.length );
            console.log( "******************** Different tags: " );
            for ( var i = 0; i <  differentTags.length; i++ ) {
                 console.log( differentTags[ i ] );
            }
            console.log( "********************" );
            allNodesRefs = [];
            parse2();
        },
        node: function( node ) {
            if ( node.lat >= lat0 && node.lat <= lat1 && node.lon >= lon0 && node.lon <= lon1 ) {
                allNodesRefs.push( node.id );
            }
        },
        way: function( way ){
            // Search for building:levels tag
            var tags = way.tags;
            var hasBuilding = false;
            for ( var tag in tags ) {
                if ( tags.hasOwnProperty(  tag ) ) {

                    if ( tag[ 0 ] === 'b' && tag.indexOf( 'building' ) >= 0 ) {

                        var nodeRefs = way.nodeRefs;
                        var n = nodeRefs.length;
                        var index = -1;
                        for ( var i = 0; i < n; i++ ) {
                            var nodeRef = nodeRefs[ i ];
                            index = allNodesRefs.indexOf( nodeRef );
                            if ( index >= 0 ) {
                                break;
                            }
                        }
                        
                        if ( index >= 0 ) {
                            hasBuilding = true;
                            ways.push( {
                                //numLevels: Number.parseInt( tags[ tag ] ),
                                nodeRefs: nodeRefs,
                                nodes: []
                            } );
                            for ( var i = 0; i < n; i++ ) {
                                waysNodes.push( nodeRefs[ i ] );
                            }
                        }
                        break;
                    }
                }
            }

            if ( hasBuilding ) {
                
                for ( var tag in tags ) {
                    if ( tags.hasOwnProperty(  tag ) ) {
                
                        if ( differentTags.indexOf( tag ) < 0 ) {
                            differentTags.push( tag );
                        }
                    }
                }

            }

        },
        relation: function( relation ){
            // Nothing to do here
        },
        error: function(msg){
            console.error( 'Error: ' + msg );
            throw msg;
        }
    } );
}
    
// Now parse again to find the nodes that belong to the ways
function parse2() {
    console.log( "Started second parsing." );
    var numWays = ways.length;
    var numParsedNodes = 0;

    pbfParser.parse( {
        filePath: pbfFilePath,
        endDocument: function() {
            allNodesRefs = null;
            console.log( "Num of ways nodes: " + numParsedNodes );
            createGeometry();
        },
        node: function( node ) {
            var id = node.id;
            if ( waysNodes.indexOf( node.id ) >= 0 ) {
                for ( var i = 0; i < numWays; i++ ) {
                    var way = ways[ i ];
                    var index = way.nodeRefs.indexOf( id );
                    if ( index >= 0 ) {
                        way.nodes[ index ] = node;
                        numParsedNodes++;
                    }
                }
            }
        },
        way: function( way ){
            // Nothing to do here
        },
        relation: function( relation ){
            // Nothing to do here
        },
        error: function(msg){
            console.error( 'Error: ' + msg );
            throw msg;
        }
    } );
}

// Finally construct the geometry with the collected data
function createGeometry() {
    
    console.log( "Started creating geometry." );
    
    //buildingLevelHeight
    // way.numLevels
    // way.nodes.lat, lon

    var mercator = latLon2Mercator( centralLatitude, centralLongitude );
    var x0 = mercator.x;
    var y0 = mercator.y;

    var geometry = new THREE.Geometry();

    var nw = ways.length;
    for ( var iw = 0; iw < nw; iw++ ) {
        var way = ways[ iw ];
        var nodes = way.nodes;

        var previous = null;
        var initial = null;
        var n = nodes.length;
        for ( var i = 0; i < n; i++ ){
            
            var node = nodes[ i ];
            mercator = latLon2Mercator( node.lat, node.lon, mercator );
            var x = ( mercator.x - x0 ) * EARTH_EQUATOR_LENGTH;
            var z = ( mercator.y - y0 ) * EARTH_EQUATOR_LENGTH;

            var next = new THREE.Vector3( x, 1, z );
            
            if ( previous ) {
                geometry.vertices.push( previous );
                geometry.vertices.push( next );
            }
            else {
                initial = next;
            }
            
            previous = next;

        }
        
        // Close the line
        geometry.vertices.push( previous );
        geometry.vertices.push( initial );
    }

    var material = new THREE.LineBasicMaterial( {
            color: 0x000000
    } );

    var line = new THREE.LineSegments( geometry, material );
    scene.add( line );

    document.body.appendChild( renderer.domElement );
    
    animate();

}


/*
stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
document.body.appendChild( stats.domElement );
*/

window.addEventListener( 'resize', function() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}, false );

function animate() {

    requestAnimationFrame( animate );

    render();
    //stats.update();

}

function render() {

    var deltaTime = clock.getDelta();
    
    controls.update( deltaTime );

    renderer.render( scene, camera );

}
