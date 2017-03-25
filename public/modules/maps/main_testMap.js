
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

function createUI() {

    var sideBarRouteConfig = {
        name  : 'sideBarRouteConfig',
        img   : null,
        nodes : [ 
            { id: 'btnSelectOrigin', text: 'Select origin', img: 'icon-page' },
            { id: 'btnSelectDestination', text: 'Select destination', img: 'icon-page' }
        ],
        onClick: function (event) {
            //console.log( "click en sidebar: " + event.target);
        }

    };

    var sideBarTagViewerConfig = {
        name  : 'sideBarTagViewer',
        img   : null,
        nodes : [],
        onClick: function (event) {
            //console.log( "click en sidebar: " + event.target);
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
                                    var icon = toolbar.items[ 0 ];
                                    var btn = toolbar.items[ 1 ];
                                    icon.html = '<img src="/public/assets/icons/generic/refresh/refresh.gif" height="32" width="32">';
                                    btn.text = 'Obtaining tag list...';
                                    toolbar.refresh();
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

        // Hide toolbar icon
        var toolbar = w2ui.layoutTagViewer.panels[0].toolbar;
        var icon = toolbar.items[ 0 ];
        var btn = toolbar.items[ 1 ];
        icon.html = '<img src="/public/assets/icons/generic/ok/ok.png" height="32" width="32">';
        btn.text = 'Tags received.';
        toolbar.refresh();

        var nodeId = 0;

        // Process tags
        function addTags( uiNodes, tagsObject, type ) {

            var tagsNodes = [];

            for ( var tag in tagsObject ) {
                if ( tagsObject.hasOwnProperty( tag ) ) {
                    var valuesNodes = [];
                    var values = tagsObject[ tag ];
                    for ( var i = 0; i < values.length; i++ ) {
                        valuesNodes.push( { id: 'layoutTagViewer_nodeValue_' + nodeId++, text: "" + values[ i ].value + " (" + values[ i ].count + ")", img: 'icon-page', nodes: [] } );
                    }
                    tagsNodes.push( { id: 'layoutTagViewer_node_' + nodeId++, text: tag, img: 'icon-folder', nodes: valuesNodes } );
                }
            }

            var typeNode = { id: 'layoutTagViewer_nodeType_' + nodeId++, text: type, img: 'icon-folder', nodes: tagsNodes };

            uiNodes.push( typeNode );

        }

        $( function() {
            
            var uiNodes = [];
            
            addTags( uiNodes, tagsList.nodesTags, "Nodes" );
            addTags( uiNodes, tagsList.waysTags, "Ways" );
            
            sideBarTagViewerConfig.nodes = uiNodes;

            sideBarTagViewer.destroy();

            sideBarTagViewer = $().w2sidebar( sideBarTagViewerConfig );
            
            w2ui.layoutTagViewer.content( 'main', sideBarTagViewer );

            //sideBarTagViewer.refresh();
        
            //sideBarTagViewer.expandAll();
        } );

    }

    var ui = {
        receivedMapsTagList: receivedMapsTagList
    };

    return ui;

}
