
// UI elements

// Wait for gui library to load and then init application
sap.ui.getCore().attachInit( function() {

	init();

} );

function init() {

	function goToRoom( roomName ) {
		if ( roomName ) {
			//alert( "Room: " + roomName );
			location.href= "/public/modules/sharedboard/sharedboard.html?room=" + encodeURIComponent( roomName );
		}
		else {
			alert( "Please enter a room name" );
		}
	}

	// Create UI

	// Text size text edit field

	var roomNameTextField = new sap.ui.commons.TextField();
	roomNameTextField.attachChange( function( oControlEvent ) {

		goToRoom( roomNameTextField.getValue() );

	} );
	roomNameTextField.setWidth( "270px" );
	roomNameTextField.setValue( "" );
    var roomNameEdit = new sap.ui.layout.HorizontalLayout( {
        content: [
            new sap.ui.commons.TextView( { text: "Room name: " } ),
            roomNameTextField
        ]
    } );

	var dialogPanelContent = new sap.ui.layout.VerticalLayout( "thePanelContent", {
		content: [
			roomNameEdit
		]
	} );

	var dialog = new sap.ui.commons.Dialog();

	dialog.setWidth( "370px" );
    dialog.setHeight( "170px" );
    dialog.addStyleClass( "unselectable" );
    dialog.setKeepInWindow( true );

    dialog.attachClosed( function() {
		dialog.close();
    } );

	dialog.setTitle( "Enter a room name to join in" );

	dialog.addContent( dialogPanelContent );

	dialog.addButton( new sap.ui.commons.Button( {
        text: "Enter",
        press: function() {
			goToRoom( roomNameTextField.getValue() );
		}
    } ) );

	dialog.setInitialFocus( roomNameTextField );

	//window.addEventListener( "resize", onWindowResize, false );

	// First resize
	//onWindowResize();

	dialog.open();
	
}

function onWindowResize() {

	var w = window.innerWidth;
	var h = window.innerHeight;

	var size = Math.min( w, h );

}
