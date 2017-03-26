
// Coordinates for Mallorca
var minLon = 2.2796592;
var maxLon = 3.506008;
var minLat = 39.2536645;
var maxLat = 39.9793632;




var initialCenterLon = ( minLon + maxLon ) / 2;
var initialCenterLat = ( minLat + maxLat ) / 2;
var initialZoom = 12;

var map = null;
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

    /*
    socket.on( "ysConnectedToModule", function( msg ) {
        if ( msg.instanceName === "maps" ) {
        }
    } );
    */

    socket.on( "mapsTagList", function( msg ) {
        
        ui.receivedMapsTagList( msg );
        
    } );
    
    
    socket.on( "mapsBookmarks", function( msg ) {
        
        placeBookmarksInMap( msg, ui.getNodesCallback );

    } );

    socket.emit( "ysConnectToModule", { moduleName: "maps" } );    
    
    //************ poner boton en tab de tags, deshabilitarlo al pulsarlo, y ocultarlo al recibir datos

}

function getMapsTagList() {

    socket.emit( "mapsGetTagList", {} );

}

function createMap() {
    
    var map = L.map( "mapCanvas", {

        fullscreenControl: true,
        fullscreenControlOptions: {
            position: 'topleft'
        }

    } ).setView( [ initialCenterLat, initialCenterLon ], initialZoom );

    // Create the map
    L.tileLayer( "/tiles/{z}/{x}/{y}.png?", {

        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 17

    } ).addTo( map );

    /*
    L.marker( [ initialCenterLat, initialCenterLon ] ).addTo( map )
        .bindPopup('Hola mundoo!!!')
        .openPopup();
    */
    var circle = L.circle( [ initialCenterLat, initialCenterLon ], {
        color: 'green',
        fillColor: '#00a001',
        fillOpacity: 0.4,
        radius: 500
    } ).addTo( map );


    // Routing
    /*
    var control = L.Routing.control( {
        router: L.Routing.osrmv1( {
            serviceUrl: "http://servidor_osrm/path",
            timeout: 30000,
            profile: "driving",
            useHints: true
        } ),

    } );
    */

    return map;
}

function getNodes( tag, values ) {

    var sentValuesArray = null;
    if ( values ) {
        sentValuesArray = [];
        var n = values.length;
        for ( var i = 0; i < n; i++ ) {
            sentValuesArray.push( values[ i ].value );
        }
    }

    socket.emit( "mapsGetNodes", {
        tag: tag,
        values: sentValuesArray
    } );

}

function placeBookmarksInMap( msg, callback ) {

    if ( ! msg ) {
        return;
    }

    // msg.layerName
    var bookmarks = msg.bookmarks;
    var n = bookmarks.length;
    for ( var i = 0; i < n; i++ ) {
        var bm = bookmarks[ i ];
        L.marker( [ bm.lat, bm.lon ] ).addTo( map );
        //.bindPopup('Hola mundoo!!!')
        //.openPopup();
    }
    
    callback();

}

function getWays( tag, values ) {

    var sentValuesArray = null;
    if ( values ) {
        sentValuesArray = [];
        var n = values.length;
        for ( var i = 0; i < n; i++ ) {
            sentValuesArray.push( values[ i ].value );
        }
    }

    socket.emit( "mapsGetWays", {
        tag: tag,
        values: sentValuesArray
    } );

}

function placePolylinesInMap( tag, values, callback ) {
    
    window.setTimeout( callback, 1200 );
    
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
            //console.log( "click en sidebar: " + event.target);
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
                        
                        if ( selectedItemContextMenu.mapsTagValues && selectedItemContextMenu.mapsTagValues.length > 0 ) {
                            if ( selectedItemContextMenu.mapsTotalValuesCount >= 15 ) {
                                w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsTotalValuesCount +
                                           ' bookmarks on the map. Are you sure?', function ( answer ) {
                                    if ( answer === 'Yes' ) {
                                        setToolbarState( 'REFRESH', 'Placing bookmarks...' );
                                        getNodes( selectedItemContextMenu.mapsTag, null );
                                    }
                                } );
                            }
                            else {
                                setToolbarState( 'REFRESH', 'Placing bookmarks...' );
                                getNodes( selectedItemContextMenu.mapsTag, null );
                            }
                        }
                        
                    }
                    else if ( id.indexOf( "layoutTagViewer_node_Ways" ) === 0 ) {
                        
                        // Place ways in the map

                        if ( selectedItemContextMenu.mapsTagValues && selectedItemContextMenu.mapsTagValues.length > 0 ) {
                            if ( selectedItemContextMenu.mapsTotalValuesCount >= 15 ) {
                                w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsTotalValuesCount +
                                           ' polylines on the map. Are you sure?', function ( answer ) {
                                    if ( answer === 'Yes' ) {
                                        setToolbarState( 'REFRESH', 'Placing polylines...' );
                                        getWays( selectedItemContextMenu.mapsTag, null );
                                    }
                                } );
                            }
                            else {
                                setToolbarState( 'REFRESH', 'Placing polylines...' );
                                getWays( selectedItemContextMenu.mapsTag, null );
                            }
                        }
                    }
                }
            }
            else if ( id.indexOf( "layoutTagViewer_nodeValue_Nodes" ) === 0 ) {
                
                // Node value context menu: Place nodes values in the map
                
                if ( selectedItemContextMenu.mapsValue.count >= 15 ) {
                    w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsValue.count +
                               ' bookmarks on the map. Are you sure?', function ( answer ) {
                        if ( answer === 'Yes' ) {
                            setToolbarState( 'REFRESH', 'Placing bookmarks...' );
                            getNodes( selectedItemContextMenu.mapsTag, [ selectedItemContextMenu.mapsValue ] );
                        }
                    } );
                }
                else {
                    setToolbarState( 'REFRESH', 'Placing bookmarks...' );
                    getNodes( selectedItemContextMenu.mapsTag, [ selectedItemContextMenu.mapsValue ] );
                }
            }
            else if ( id.indexOf( "layoutTagViewer_nodeValue_Ways" ) === 0 ) {
                
                // Way value context menu: Place ways values in the map

                if ( selectedItemContextMenu.mapsValue.count >= 15 ) {
                    w2confirm( 'You are about to add ' + selectedItemContextMenu.mapsValue.count +
                               ' polylines on the map. Are you sure?', function ( answer ) {
                        if ( answer === 'Yes' ) {
                            setToolbarState( 'REFRESH', 'Placing polylines...' );
                            getWays( selectedItemContextMenu.mapsTag, [ selectedItemContextMenu.mapsValue ] );
                        }
                    } );
                }
                else {
                    setToolbarState( 'REFRESH', 'Placing polylines...' );
                    getWays( selectedItemContextMenu.mapsTag, [ selectedItemContextMenu.mapsValue ] );
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
