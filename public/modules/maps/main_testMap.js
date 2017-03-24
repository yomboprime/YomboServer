
// Coordinates for Mallorca
var minLon = 2.2796592;
var maxLon = 3.506008;
var minLat = 39.2536645;
var maxLat = 39.9793632;




var initialCenterLon = ( minLon + maxLon ) / 2;
var initialCenterLat = ( minLat + maxLat ) / 2;
var initialZoom = 12;

var map = null;
var socket = null;

init()

function init() {

    createMap();

    createUI();

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
        
        
        
    } );
    
    socket.emit( "ysConnectToModule", { moduleName: "maps" } );    
    
    //socket.emit( "mapsGetTagList", {} );
    
    //************ poner boton en tab de tags, deshabilitarlo al pulsarlo, y ocultarlo al recibir datos

}



function createMap() {
    
    map = L.map( "mapCanvas", {

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
            console.log( "click en sidebar: " + event.target);
        }

    };

    var sideBarTagViewerConfig = {
        name  : 'sideBarTagViewer',
        img   : null,
        nodes : [ 
            { id: 'blevel-1-1', text: 'Level 1.1', img: 'icon-page' },
            { id: 'blevel-1-2', text: 'Level 1.2', img: 'icon-page' },
            { id: 'blevel-1-3', text: 'Level 1.3', img: 'icon-page' }
        ],
        onClick: function (event) {
            console.log( "click en sidebar: " + event.target);
        }

    };

    var mainLayout = null;
    var sideBarRoute = null;
    var sideBarTagViewer = null;

    $(function () {

        mainLayout = $( '#mainPanel1' ).w2layout( {
            name: 'mainLayout',
            padding: 0,
            panels: [
                { type: 'left', size: 250, minSize: 20, resizable: true,
                    tabs: {
                        active: 'tab1',
                        tabs: [
                            { id: 'tab1', caption: 'Tab 1' },
                            { id: 'tab2', caption: 'Tab 2' }
                        ],
                        onClick: function ( id, data ) {
                            var tabs = mainLayout.panels[ 0 ].tabs.tabs;
                            if ( id === tabs[ 0 ].id ) {
                                w2ui.mainLayout.content( 'left', sideBarRoute );
                            }
                            else if ( id === tabs[ 1 ].id ) {
                                w2ui.mainLayout.content( 'left', sideBarTagViewer );
                            }
                        }
                    }
                },
                { type: 'main', content: mapCanvas }
            ]
        } );

        sideBarRoute = $().w2sidebar( sideBarRouteConfig );
        sideBarTagViewer = $().w2sidebar( sideBarTagViewerConfig );

        w2ui.mainLayout.content( 'left', sideBarRoute );

    } );

}
