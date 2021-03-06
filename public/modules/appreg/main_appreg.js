
var socket;

var dialog;

sap.ui.getCore().attachInit( function() {
    init();
} );

function init() {

    changeFavicon( "/favicon.png" );

    socket = io();

    socket.on( "ysAppReg", function( msg ) {

        initUI( msg );

    } );

    socket.on( "disconnect", function( msg ) {
        alert( "The connection with the server was closed." );
    } );

    socket.emit( "ysConnectToModule", { moduleName: "appreg" } );

}

function initUI( applications ) {

    if ( dialog ) {
        dialog.close();
    }

    dialog = new sap.ui.commons.Dialog();

    dialog.setModal( true );

    dialog.setTitle( "YomboServer applications" );

    dialog.setWidth( "800px" );
    dialog.setHeight( "550px" );
    dialog.addStyleClass( "unselectable" );
//    dialog.setKeepInWindow( true );

    var appsItems = [];
    for ( var i = 0; i < applications.length; i ++ ) {
        var app = applications[ i ];
        var item = new sap.m.DisplayListItem( {
            label: app.name,
            value: app.description,
            type: sap.m.ListType.Active,
            press: function( url ) {
                return function( oControlEvent ) {
                    window.open( url );
                };
            }( app.url )
        } );

        appsItems.push( item );
    }

    var appsList = new sap.m.List( {
        //headerText: "Please select an application to open it.",
        items: appsItems
    } );

    appsList.setFooterText( "Please select an application to open it." );

    dialog.addContent( appsList );

    dialog.open();

}
