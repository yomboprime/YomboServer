
// Coordinates for Mallorca
var minLon = 2.2796592;
var maxLon = 3.506008;
var minLat = 39.2536645;
var maxLat = 39.9793632;




var initialCenterLon = ( minLon + maxLon ) / 2;
var initialCenterLat = ( minLat + maxLat ) / 2;
var initialZoom = 12;

var map = null;
var mapLayerControl = null;
var selectRouteState = "idle";

// Router for general route
var routingControlPrimary = null;
// Router for foot walking
var routingControlFoot = null;
// Router for secondary car route
var routingControlCar = null;

var flagDontProcessFootRoute = false;
var flagDontProcessCarRoute = false;
var flagOnlyFoot = false;

// Tells if starting with car or walking
var startByCar = true;

var maxFootDistance = 0;

var originLatLon = null;
var destinationLatLon = null;
var originSet = false;
var destinationSet = false;

var initialMarker = null;

var ui = null;
var socket = null;


init();

function init() {

    map = createMap();

    ui = createUI();

    socket = io();

    socket.on( "disconnect", function( msg ) {
        alert( "The connection with the server was closed." );
    } );

    socket.on( "ysConnectedToModule", function( msg ) {
        if ( msg.moduleInstanceName === "YomboMaps" ) {
            createRouters( msg.data );
        }
    } );

    socket.on( "mapsTagList", function( msg ) {
        
        ui.receivedMapsTagList( msg );
        
    } );
    
    
    socket.on( "mapsMarkers", function( msg ) {
        
        placeBookmarksInMap( msg, ui.getNodesCallback );

    } );
    
    socket.on( "mapsPolylines", function( msg ) {
        
        placePolylinesInMap( msg, ui.getNodesCallback );

    } );

    socket.emit( "ysConnectToModule", { moduleName: "maps" } );    
    
    //************ poner boton en tab de tags, deshabilitarlo al pulsarlo, y ocultarlo al recibir datos

}

function getMapsTagList() {

    socket.emit( "mapsGetTagList", {} );

}

function createMap() {

    // Create the map
        
    var map = L.map( "mapCanvas", {

        fullscreenControl: true,
        fullscreenControlOptions: {
            position: 'topleft'
        }

    } ).setView( [ initialCenterLat, initialCenterLon ], initialZoom );

    // Tiles

    L.tileLayer( "/tiles/{z}/{x}/{y}.png?", {

        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 17

    } ).addTo( map );

    // Interaction

    map.on( 'click', function( event ) {

        var latLon = event.latlng;
        
        console.log( "LAT, LON = " + latLon.lat + ", " + latLon.lng );

        if ( selectRouteState === 'origin' ) {
            setRouteOrigin( latLon );
        }
        else if ( selectRouteState === 'destination' ) {
            setRouteDestination( latLon );
        }
        
    } );

    var circle = L.circle( [ initialCenterLat, initialCenterLon ], {
        color: 'green',
        fillColor: '#00a001',
        fillOpacity: 0.4,
        radius: 500,
        stroke: false
    } ).addTo( map );

    return map;
}

function createRouters( config ) {
    
    maxFootDistance = config.maxFootDistance;
    
    // Routing for the total route by car

    routingControlPrimary = L.Routing.control( {


        router: L.Routing.osrmv1( {
            serviceUrl: "http://127.0.0.1:" + config.footProfilePort + "/route/v1",
            timeout: 30000,
            profile: "ignored",
            useHints: true
        } ),
        waypoints: [],
        //autoRoute: false,
        routeWhileDragging: true,
        fitSelectedRoutes: false,
        lineOptions: {
            addWaypoints: false,
            clickable: false
        }

    } );

    routingControlPrimary.on('routeselected', function( e ) {

        processPrimaryRoute( e.route );

    } );

    routingControlPrimary.addTo( map );
    
    // Router for the walking part
    
    routingControlFoot = L.Routing.control( {


        router: L.Routing.osrmv1( {
            serviceUrl: "http://127.0.0.1:" + config.footProfilePort + "/route/v1",
            timeout: 30000,
            profile: "ignored",
            useHints: true
        } ),
        waypoints: [],
        routeWhileDragging: false,
        fitSelectedRoutes: false,
        lineOptions: {
            addWaypoints: false,
            clickable: false,
            styles: [
                {
                    color: 'black',
                    opacity: 0.15,
                    weight: 9
                },
                {
                    color: 'white',
                    opacity: 0.8,
                    weight: 6
                },
                {
                    color: 'green',
                    opacity: 1,
                    weight: 2
                }
            ]
        }

    } );

    routingControlFoot.on('routeselected', function( e ) {

        processFootRoute( e.route );

    } );

    routingControlFoot.addTo( map );

    
    routingControlCar = L.Routing.control( {


        router: L.Routing.osrmv1( {
            serviceUrl: "http://127.0.0.1:" + config.carProfilePort + "/route/v1",
            timeout: 30000,
            profile: "ignored",
            useHints: true
        } ),
        waypoints: [],
        routeWhileDragging: false,
        fitSelectedRoutes: false,
        lineOptions: {
            addWaypoints: false,
            clickable: false
        }

    } );

    routingControlCar.on('routeselected', function( e ) {

        processCarRoute( e.route );

    } );

    routingControlCar.addTo( map );

}

function addMapLayer( name, layer ) {
    
    var layerGroup = L.layerGroup( layer );
    
    if ( ! mapLayerControl ) {
        
        mapLayerControl = L.control.layers( null, null );
            
        mapLayerControl.addTo(map);

    }

    mapLayerControl.addOverlay( layerGroup, name );
    
    layerGroup.addTo( map );

}

function getNodes( tag, value ) {

    socket.emit( "mapsGetNodes", {
        tag: tag,
        value: value
    } );

}

function getWays( tag, value ) {

    socket.emit( "mapsGetWays", {
        tag: tag,
        value: value
    } );

}

function placeBookmarksInMap( msg, callback ) {

    if ( ! msg ) {
        return;
    }

    var markers = msg.markers;
    var n = markers.length;
    var mapMarkers = [];
    for ( var i = 0; i < n; i++ ) {
        var m = markers[ i ];
        mapMarkers.push( L.marker( [ m.lat, m.lon ] ) );
        //.bindPopup('Hola mundoo!!!')
        //.openPopup();
    }
    
    addMapLayer( msg.layerName, mapMarkers );
    
    callback();

}

function placePolylinesInMap( msg, callback ) {
    
    //window.setTimeout( callback, 1200 );

    var ways = msg.ways;
    var nw = ways.length;
    var mapPolylines = [];
    for ( var i = 0; i < nw; i++ ) {
        var w = ways[ i ];
        
        for ( var j = 0; j < w.points.length; j++ ) {
            if ( !w.points[j] || ! w.points[j][0] || ! w.points[j][1] ) {
                console.log( "ERROR en " + i + ", " + j );
            }
        }
        
        mapPolylines.push( L.polyline( w.points, { color: 'red', weight: 2 } ) );
    }
    
    addMapLayer( msg.layerName, mapPolylines );
    
    callback();
}

function setInitialMarker( latLon ) {
    if ( ! initialMarker ) {
        initialMarker = L.marker( latLon );
        initialMarker.addTo( map );
    }
    else {
        initialMarker.setLatLng( latLon );
    }
}

function hideInitialMarker( latLon ) {
    initialMarker.remove();
}

function setRouteOrigin( latLon, recalculateRoute ) {

    originLatLon = latLon;
    originSet = true;
    
    if ( ! routingControlPrimary ) {
        return;
    }

    if ( ! destinationSet ) {
        setInitialMarker( originLatLon );
    }

    if ( recalculateRoute !== undefined && recalculateRoute !== true ) {
        return;
    }
    
    if ( originSet && destinationSet ) {
        hideInitialMarker();
        routingControlPrimary.setWaypoints( [ originLatLon, destinationLatLon ] );
    }
}

function setRouteDestination( latLon, recalculateRoute ) {

    destinationLatLon = latLon;
    destinationSet = true;

    if ( ! routingControlPrimary ) {
        return;
    }

    if ( ! originSet ) {
        setInitialMarker( destinationLatLon );
    }

    if ( recalculateRoute !== undefined && recalculateRoute !== true ) {
        return;
    }
    
    if ( originSet && destinationSet ) {
        hideInitialMarker();
        routingControlPrimary.setWaypoints( [ originLatLon, destinationLatLon ] );
    }

}

function setRouteOriginAndDestination( orig, dest ) {

    originLatLon = orig;
    destinationLatLon = dest;
    originSet = true;
    destinationSet = true;

    hideInitialMarker();
    routingControlPrimary.setWaypoints( [ originLatLon, destinationLatLon ] );

}

function createLatLonArrayFromWaypoints( waypoints ) {
    var a = [];
    var n = waypoints.length;
    for ( var i = 0; i < n; i++ ) {
        a.push( createLatLonFromWaypoint( waypoints[ i ] ) );
    }
    
    return a;
}

function createLatLonFromWaypoint( waypoint ) {
    
    return L.latLng( waypoint.latLng.lat, waypoint.latLng.lng );

}

function interpolateCoords( factor, latLon1, latLon2 ) {
    return L.latLng(
                ( latLon2.lat - latLon1.lat ) * factor + latLon1.lat,
                ( latLon2.lng - latLon1.lng ) * factor + latLon1.lng
            );
}

function processPrimaryRoute( route ) {
    
    var inputWaypoints = route.inputWaypoints;
    
    if ( inputWaypoints.length !== 2 ) {
        return;
    }
    
    if ( route.summary.totalDistance < maxFootDistance ) {

        // Can make all the travel by walking
        
        routingControlPrimary.setWaypoints( [] );
        flagDontProcessFootRoute = true;
        flagOnlyFoot = true;
        routingControlFoot.setWaypoints( createLatLonArrayFromWaypoints( inputWaypoints ) );
        routingControlCar.setWaypoints( [] );

        return;
        
    }
    
    flagOnlyFoot = false;
    
    var coordinates = route.coordinates;

    if ( coordinates.length <= 2 ) {
        return;
    }
    
    var distance = 0;
    
    var nodeCount = coordinates.length - 1;
    var index = 0;
    var indexDirection = 1;

    if ( startByCar ) {
        index = coordinates.length - 1;
        indexDirection = -1;
    }

    var previousLatLon = L.latLng( coordinates[ index ] );
    var transferPoint = null;
    for ( ; nodeCount > 0; index += indexDirection ) {
        
        var newLatLon = L.latLng( coordinates[ index ] );
           
        //var newDistance = distance + previousLatLon.distanceTo( newLatLon ); 
        var d = map.distance( previousLatLon, newLatLon );
        distance += d;
        
        if ( d > 0.001 && distance > maxFootDistance ) {
            
            transferPoint = interpolateCoords( 1 - ( distance - maxFootDistance ) / d, previousLatLon, newLatLon );
        
            break;
            
        }

        previousLatLon = newLatLon;

    }

    routingControlPrimary.setWaypoints( [] );

    if ( transferPoint ) {
        flagDontProcessFootRoute = true;
        flagDontProcessCarRoute = true;
        if ( startByCar ) {
            routingControlFoot.setWaypoints( [ transferPoint, createLatLonFromWaypoint( inputWaypoints[ inputWaypoints.length - 1 ] ) ] );
            routingControlCar.setWaypoints( [ createLatLonFromWaypoint( inputWaypoints[ 0 ] ), transferPoint ] );
        }
        else {
            routingControlCar.setWaypoints( [ transferPoint, createLatLonFromWaypoint( inputWaypoints[ inputWaypoints.length - 1 ] ) ] );
            routingControlFoot.setWaypoints( [ createLatLonFromWaypoint( inputWaypoints[ 0 ] ), transferPoint ] );
        }
    }
    else {
        flagDontProcessFootRoute = true;
        flagOnlyFoot = true;
        routingControlFoot.setWaypoints( createLatLonArrayFromWaypoints( inputWaypoints ) );
        routingControlCar.setWaypoints( [] );
    }

}

function processFootRoute( route ) {
    
    var firstWaypoint = route.inputWaypoints[ 0 ];
    var lastWaypoint = route.inputWaypoints[ route.inputWaypoints.length - 1 ];
    
    if ( flagDontProcessFootRoute ) {
        
        flagDontProcessFootRoute = false;
        
        if ( startByCar ) {
            setRouteDestination( createLatLonFromWaypoint( lastWaypoint ), false );
        }
        else {
            setRouteOrigin( createLatLonFromWaypoint( firstWaypoint ), false );
        }
        
        return;
    }

    routingControlFoot.setWaypoints( [] );
    routingControlCar.setWaypoints( [] );

    if ( flagOnlyFoot ) {
        setRouteOriginAndDestination( createLatLonFromWaypoint( firstWaypoint ), createLatLonFromWaypoint( lastWaypoint ) );
    }
    else {
        if ( startByCar ) {
            setRouteOriginAndDestination( originLatLon, createLatLonFromWaypoint( lastWaypoint ) );
        }
        else {
            setRouteOriginAndDestination( createLatLonFromWaypoint( firstWaypoint ), destinationLatLon );
        }
    }

}

function processCarRoute( route ) {

    var firstWaypoint = route.inputWaypoints[ 0 ];
    var lastWaypoint = route.inputWaypoints[ route.inputWaypoints.length - 1 ];

    if ( flagDontProcessCarRoute ) {
        
        flagDontProcessCarRoute = false;
        
        if ( startByCar ) {
            setRouteOrigin( createLatLonFromWaypoint( firstWaypoint ), false );
        }
        else {
            setRouteDestination( createLatLonFromWaypoint( lastWaypoint ), false );
        }

        return;
    }

    routingControlFoot.setWaypoints( [] );
    routingControlCar.setWaypoints( [] );
    
    if ( flagOnlyFoot ) {
        setRouteOriginAndDestination( createLatLonFromWaypoint( firstWaypoint ), createLatLonFromWaypoint( lastWaypoint ) );
    }
    else {
        if ( startByCar ) {
            setRouteOriginAndDestination( createLatLonFromWaypoint( firstWaypoint ), destinationLatLon );
        }
        else {
            setRouteOriginAndDestination( originLatLon, createLatLonFromWaypoint( lastWaypoint ) );
        }
    }
}

function createUI() {
    
    function setToolbarState( state, message ) {
        
        var toolbar = w2ui.layoutTagViewer.panels[0].toolbar;
        var icon = toolbar.items[ 0 ];
        var btn = toolbar.items[ 1 ];

        switch ( state ) {
            case 'OK':
                icon.html = '<img src="/public/assets/icons/generic/ok/ok.png" height="32" width="32">';
                break;
            case 'REFRESH':
                icon.html = '<img src="/public/assets/icons/generic/refresh/refresh.gif" height="32" width="32">';
                break;
            case 'INFO':
                icon.html = '<img src="/public/assets/icons/generic/info/info.png" height="16" width="16">';
                break;
        }
        
        btn.text = message;
        toolbar.refresh();
    }
    
    function showNodesCallback() {
        setToolbarState( 'OK', 'Bookmarks were placed on map.' );
    }

    var sideBarRouteConfig = {
        name  : 'sideBarRouteConfig',
        img   : null,
        keyboard: false,
        nodes : [ 
            { id: 'btnSelectOrigin', text: 'Select origin', img: 'icon-page' },
            { id: 'btnSelectDestination', text: 'Select destination', img: 'icon-page' }
        ],
        onClick: function (event) {
            
            if ( event.target === 'btnSelectOrigin' ) {
                selectRouteState = 'origin';
            }
            else if ( event.target === 'btnSelectDestination' ) {
                selectRouteState = 'destination';
            }
        }

    };

    // Unique id for tag Sidebar elements
    var nodeId = 0;
    
    var menuSideBarTagViewerNodeTag = [
        { id: 1, text: 'Expand tag' },
        { id: 2, text: 'Locate tagged nodes in the map' }
    ];

    var menuSideBarTagViewerWayTag = [
        { id: 1, text: 'Expand tag' },
        { id: 2, text: 'Locate tagged ways in the map' }
    ];

    var menuSideBarTagViewerNodeValues = [
        { id: 2, text: 'Locate these places in the map' }
    ];
    
    var menuSideBarTagViewerWayValues = [
        { id: 2, text: 'Locate these ways in the map' }
    ];
    
    // Selected element on contextMenu
    var selectedItemContextMenu = null;

    var sideBarTagViewerConfig = {
        name  : 'sideBarTagViewer',
        img   : null,
        keyboard: false,
        nodes : [],
        onMenuClick: function (event) {
            
            var id = event.target;
            var menuIndex = event.menuIndex;
            if ( id.indexOf( "layoutTagViewer_node_" ) === 0 ) {
                
                // Tag context menu

                if ( menuIndex === 0 ) {
                    
                    // Expand tag (Nodes or Ways)

                    if ( ! selectedItemContextMenu.nodes || selectedItemContextMenu.nodes.length === 0 ) {
                
                        setToolbarState( 'REFRESH', 'Retrieving values...' );

                        window.setTimeout( function() {

                            var tag = selectedItemContextMenu.mapsTag;
                            var type = selectedItemContextMenu.mapsType;
                            var values = selectedItemContextMenu.mapsTagValues;
                            var valuesNodes = [];
                            for ( var j = 0; j < values.length; j++ ) {
                                valuesNodes.push( { id: 'layoutTagViewer_nodeValue_' + type + nodeId++, text: "" + values[ j ].value + " (" + values[ j ].count + ")", img: 'icon-page', nodes: [], mapsTag: tag, mapsValue: values[ j ] } );
                            }
                            selectedItemContextMenu.nodes = valuesNodes;
                            selectedItemContextMenu.expanded = true;
                            w2ui.sideBarTagViewer.refresh();
                            w2ui.sideBarTagViewer.scrollIntoView( selectedItemContextMenu.id );

                            setToolbarState( 'OK', 'Values retrieved.' );

                        }, 50 );
                    }
                }
                else if ( menuIndex=== 1 ) {
                    
                    if ( id.indexOf( "layoutTagViewer_node_Nodes" ) === 0 ) {
                        
                        // Place nodes in the map
                        
                        if ( selectedItemContextMenu.mapsLayerName ) {
                            w2alert( "You already loaded the markers on that tag" );
                            return;
                        }
                        
                        selectedItemContextMenu.mapsLayerName = selectedItemContextMenu.mapsTag;
                        
                        if ( selectedItemContextMenu.mapsTagValues && selectedItemContextMenu.mapsTagValues.length > 0 ) {
                            if ( selectedItemContextMenu.mapsTotalValuesCount >= 15 ) {
                                w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsTotalValuesCount +
                                           ' markers on the map. Are you sure?', function ( answer ) {
                                    if ( answer === 'Yes' ) {
                                        setToolbarState( 'REFRESH', 'Placing markers...' );
                                        getNodes( selectedItemContextMenu.mapsTag );
                                    }
                                } );
                            }
                            else {
                                setToolbarState( 'REFRESH', 'Placing markers...' );
                                getNodes( selectedItemContextMenu.mapsTag );
                            }
                        }
                        
                    }
                    else if ( id.indexOf( "layoutTagViewer_node_Ways" ) === 0 ) {
                        
                        // Place ways in the map
                        
                        if ( selectedItemContextMenu.mapsLayerName ) {
                            w2alert( "You already loaded the ways on that tag" );
                            return;
                        }

                        selectedItemContextMenu.mapsLayerName = selectedItemContextMenu.mapsTag;

                        if ( selectedItemContextMenu.mapsTagValues && selectedItemContextMenu.mapsTagValues.length > 0 ) {
                            if ( selectedItemContextMenu.mapsTotalValuesCount >= 15 ) {
                                w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsTotalValuesCount +
                                           ' polylines on the map. Are you sure?', function ( answer ) {
                                    if ( answer === 'Yes' ) {
                                        setToolbarState( 'REFRESH', 'Placing polylines...' );
                                        getWays( selectedItemContextMenu.mapsTag );
                                    }
                                } );
                            }
                            else {
                                setToolbarState( 'REFRESH', 'Placing polylines...' );
                                getWays( selectedItemContextMenu.mapsTag );
                            }
                        }
                    }
                }
            }
            else if ( id.indexOf( "layoutTagViewer_nodeValue_Nodes" ) === 0 ) {
                
                // Node value context menu: Place nodes values in the map
                
                if ( selectedItemContextMenu.mapsValue.count >= 15 ) {
                    w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsValue.count +
                               ' markers on the map. Are you sure?', function ( answer ) {
                        if ( answer === 'Yes' ) {
                            setToolbarState( 'REFRESH', 'Placing markers...' );
                            getNodes( selectedItemContextMenu.mapsTag, selectedItemContextMenu.mapsValue.value );
                        }
                    } );
                }
                else {
                    setToolbarState( 'REFRESH', 'Placing markers...' );
                    getNodes( selectedItemContextMenu.mapsTag, selectedItemContextMenu.mapsValue.value );
                }
            }
            else if ( id.indexOf( "layoutTagViewer_nodeValue_Ways" ) === 0 ) {
                
                // Way value context menu: Place ways values in the map

                if ( selectedItemContextMenu.mapsValue.count >= 15 ) {
                    w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsValue.count +
                               ' polylines on the map. Are you sure?', function ( answer ) {
                        if ( answer === 'Yes' ) {
                            setToolbarState( 'REFRESH', 'Placing polylines...' );
                            getWays( selectedItemContextMenu.mapsTag, selectedItemContextMenu.mapsValue.value );
                        }
                    } );
                }
                else {
                    setToolbarState( 'REFRESH', 'Placing polylines...' );
                    getWays( selectedItemContextMenu.mapsTag, selectedItemContextMenu.mapsValue.value );
                }

            }

        },
        
        onContextMenu: function( event ) {
            var id = event.object.id;
            if ( id.indexOf( "layoutTagViewer_node_Nodes" ) === 0 ) {
                w2ui.sideBarTagViewer.menu = menuSideBarTagViewerNodeTag;
                selectedItemContextMenu = event.object;
            }
            else if ( id.indexOf( "layoutTagViewer_node_Ways" ) === 0 ) {
                w2ui.sideBarTagViewer.menu = menuSideBarTagViewerWayTag;
                selectedItemContextMenu = event.object;
            }
            else if ( id.indexOf( "layoutTagViewer_nodeValue_Nodes" ) === 0 ) {
                w2ui.sideBarTagViewer.menu = menuSideBarTagViewerNodeValues;
                selectedItemContextMenu = event.object;
            }
            else if ( id.indexOf( "layoutTagViewer_nodeValue_Ways" ) === 0 ) {
                w2ui.sideBarTagViewer.menu = menuSideBarTagViewerWayValues;
                selectedItemContextMenu = event.object;
            }
            else {
                w2ui.sideBarTagViewer.menu = [];
                selectedItemContextMenu = null;
            }
        }

    };

    var mainLayout = null;
    var sideBarRoute = null;
    var sideBarTagViewer = null;
    var layoutTagViewer = null;

    $(function () {

        sideBarTagViewer = $().w2sidebar( sideBarTagViewerConfig );

        layoutTagViewer = $().w2layout( {
            name: 'layoutTagViewer',
            padding: 0,
            panels: [
                { type: 'main', size: 250, minSize: 20, resizable: true,
                    toolbar: {
                        name : 'toolBarBtnMapsGetTagList',
                        items: [
                            { type: 'html',  id: 'iconMapsGetTagList',  html: '<img src="/public/assets/icons/generic/info/info.png" height="16" width="16">' },
                            { type: 'button',  id: 'btnMapsGetTagList',  text: 'Get tag list',
                                onClick: function( event ) {
                                    var toolbar = w2ui.layoutTagViewer.panels[0].toolbar;
                                    var btn = toolbar.items[ 1 ];
                                    setToolbarState( 'REFRESH', 'Obtaining tag list...' );
                                    toolbar.disable( btn.id );
                                    getMapsTagList();
                                }
                            }
                        ]
                    },
                }
            ]
        } );

        w2ui.layoutTagViewer.content( 'main', sideBarTagViewer );

        mainLayout = $( '#mainPanel1' ).w2layout( {
            name: 'mainLayout',
            padding: 0,
            panels: [
                { type: 'left', size: 250, minSize: 20, resizable: true,
                    tabs: {
                        active: 'tab1',
                        tabs: [
                            { id: 'tab1', caption: 'Routes' },
                            { id: 'tab2', caption: 'Layer info' }
                        ],
                        onClick: function ( id, data ) {
                            var tabs = mainLayout.panels[ 0 ].tabs.tabs;
                            if ( id === tabs[ 0 ].id ) {
                                w2ui.mainLayout.content( 'left', sideBarRoute );
                            }
                            else if ( id === tabs[ 1 ].id ) {
                                w2ui.mainLayout.content( 'left', layoutTagViewer );
                            }
                        }
                    }
                },
                { type: 'main', content: mapCanvas }
            ]
        } );

        sideBarRoute = $().w2sidebar( sideBarRouteConfig );

        w2ui.mainLayout.content( 'left', sideBarRoute );

    } );
    
    function receivedMapsTagList( tagsList ) {

        // Process tags
        function addTags( uiNodes, tagsObject, type ) {

            function compareValuesFunc( a, b ) {
                var va = a.value;
                var vb = b.value;
                return va === vb ? 0: ( va < vb ? -1 : 1 );
            }

            var tagsNodes = [];

            var nTags = tagsObject.length;
            for ( var i = 0; i < nTags; i++ ) {
                var tag = tagsObject[ i ].tag;
                var values = tagsObject[ i ].values;
                values.sort( compareValuesFunc );
                var totalValuesCount = 0;
                for ( var j = 0; j < values.length; j++ ) {
                    totalValuesCount += values[ j ].count;
                }
                tagsNodes.push( { id: 'layoutTagViewer_node_' + type + nodeId++, text: tag + " (" + totalValuesCount + ")", img: 'icon-folder', mapsType: type, mapsTag: tag, mapsTagValues: values, mapsTotalValuesCount: totalValuesCount } );
            }

            var typeNode = { id: 'layoutTagViewer_nodeType_' + nodeId++, text: type, img: 'icon-folder', nodes: tagsNodes };

            uiNodes.push( typeNode );

        }

        $( function() {
            
            var uiNodes = [];
            
            // Sort alphabetically
            
            function compareTagsFunc( a, b ) {
                var ta = a.tag;
                var tb = b.tag;
                return ta === tb ? 0: ( ta < tb ? -1 : 1 );
            }

            var toolbar = w2ui.layoutTagViewer.panels[0].toolbar;
            var btn = toolbar.items[ 1 ];

            if ( tagsList ) {

                // Hide toolbar icon
                setToolbarState( 'OK', 'Tags received.' );
            
                tagsList.nodesTags.sort( compareTagsFunc );
                tagsList.waysTags.sort( compareTagsFunc );

                addTags( uiNodes, tagsList.nodesTags, "Nodes" );
                addTags( uiNodes, tagsList.waysTags, "Ways" );

                sideBarTagViewerConfig.nodes = uiNodes;

                sideBarTagViewer.destroy();

                sideBarTagViewer = $().w2sidebar( sideBarTagViewerConfig );

                w2ui.layoutTagViewer.content( 'main', sideBarTagViewer );
                
            }
            else {
                // Error, the list was not obtained
                setToolbarState( 'ERROR', 'Error: tags not received.' );
                toolbar.enable( btn.id );
            }

        } );

    }

    var ui = {
        receivedMapsTagList: receivedMapsTagList,
        getNodesCallback: showNodesCallback
    };

    return ui;

}
