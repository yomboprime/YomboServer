
// Next number for unique grid record ids
var moduleRecId = 1;
var launchConfigurationRecId = 1;
var logRecId = 1;

var totalNumberOfClients = 0;

var socket;

var modulesDiv;
var launchConfigurationsDiv;
var divLog;

var btnStopModule;
var btnStartModule;
var btnGetAllLog;
var btnClearLog;

var checkLogUpdate;
var checkScrollLock;

init();

function init() {

	changeFavicon( "/public/assets/favicons/favicon_blue.png" );

	initUI();

    socket = io();

    socket.on( "ysAdminAllData", function( msg ) {

		var modules = msg.modules;
		for ( var i = 0, il = modules.length; i < il; i++ ) {

			var module = modules[ i ];

			createModuleUI( module );

		}

		var launchConfigurations = msg.launchConfigurations;
		for ( var i = 0, il = launchConfigurations.length; i < il; i++ ) {
			createLaunchConfigurationUI( launchConfigurations[ i ] );
		}

		totalNumberOfClients = msg.totalNumberOfClients;

	} );

	socket.on( "ysAdminModuleStarted", function( module ) {

		createModuleUI( module );

	} );

	socket.on( "ysAdminModuleStopped", function( module ) {

		destroyModuleUI( module );

	} );

	socket.on( "ysAdminClientConnected", function( msg ) {

		totalNumberOfClients++;

	} );

	socket.on( "ysAdminClientDisconnected", function( msg ) {

		totalNumberOfClients--;

	} );

	socket.on( "ysAdminClientConnectedToModule", function( msg ) {

		setClientCountModule( msg.instanceName, msg.numberOfClients );

	} );

	socket.on( "ysAdminClientDisconnectedFromModule", function( msg ) {

		setClientCountModule( msg.instanceName, msg.numberOfClients );

	} );
	
	socket.on( "ysAdminLog", function( logEntry ) {

		if ( checkLogUpdate.checked ) {
			createLogUI( logEntry );
		}

	} );

	socket.on( "ysAdminAllTheLog", function( logEntries ) {

		createLogUIAll( logEntries );

	} );

	socket.on( "disconnect", function( msg ) {
		alert( "The connection with the server was closed." );
	} );

	socket.emit( "ysConnectToModule", { moduleName: "admin" } );

}

function onWindowResize() {

	var windowHeight = window.innerHeight;

	var logHeight = windowHeight -
			modulesDiv.offsetHeight -
			launchConfigurationsDiv.offsetHeight -
			btnStopModule.offsetHeight -
			btnStartModule.offsetHeight -
			btnGetAllLog.offsetHeight -
			6 * 10;

	logDiv.style.height = logHeight + "px";

}

function initUI() {

	modulesDiv = document.getElementById( "modulesDiv" );
	launchConfigurationsDiv = document.getElementById( "launchConfigurationsDiv" );
	logDiv = document.getElementById( "logDiv" );

	btnStopModule = document.getElementById( "buttonStopModule" );
	btnStartModule = document.getElementById( "buttonStartLaunchConfigurationModule" );
	btnGetAllLog = document.getElementById( "buttongetAllLog" );
	btnClearLog = document.getElementById( "buttonClearLog" );

	checkLogUpdate = document.getElementById( "checkLogUpdate" );
	checkLogUpdate.checked = true;
	checkScrollLock = document.getElementById( "checkScrollLock" );

	window.addEventListener( "resize", onWindowResize, false );

	// Active modules array

	$(function () {
		$( '#modulesDiv' ).w2grid( {
			name: 'modulesDiv',
			header: "Active modules",
			multiSelect: false,
			show: {
				header: true
			},
			columns: [
				{ field: 'recid', caption: 'Record id', size: '20px', sortable: true },
				{ field: 'name', caption: 'Module name', size: '120px', sortable: true },
				{ field: 'instanceName', caption: 'Instance name', size: '140px', sortable: true },
				{ field: 'numberOfClients', caption: 'Number of clients', size: '120px', sortable: true }
			],
			records: []
		} );

		w2ui[ 'modulesDiv' ].hideColumn( 'recid' );

	} );

	btnStopModule.onclick = function() {

		var selectionRecId = w2ui.modulesDiv.getSelection()[ 0 ];

		var records = w2ui.modulesDiv.records;

		for ( var i = 0, il = records.length; i < il; i++ ) {
			if ( records[ i ].recid === selectionRecId ) {
				stopModule( records[ i ].instanceName );
				break;
			}
		}

	};

	// Launch configurations

	$(function () {
		$( '#launchConfigurationsDiv' ).w2grid( {
			name: 'launchConfigurationsDiv',
			header: "Launch configurations",
			multiSelect: false,
			show: {
				header: true
			},
			columns: [
				{ field: 'recid', caption: 'Record id', size: '20px', sortable: true },
				{ field: 'name', caption: 'Module name', size: '120px', sortable: true },
				{ field: 'instanceName', caption: 'Instance name', size: '140px', sortable: true }
			],
			records: []
		} );

		w2ui[ 'launchConfigurationsDiv' ].hideColumn( 'recid' );

	} );

	btnStartModule.onclick = function() {

		var selectionRecId = w2ui.launchConfigurationsDiv.getSelection()[ 0 ];

		var records = w2ui.launchConfigurationsDiv.records;

		for ( var i = 0, il = records.length; i < il; i++ ) {
			if ( records[ i ].recid === selectionRecId ) {
				startModule( records[ i ].name, records[ i ].instanceName );
				break;
			}
		}

	};

	// Log

	$(function () {
		$( '#logDiv' ).w2grid( {
			name: 'logDiv',
			header: "Server log",
			multiSelect: true,
			show: {
				header: true
			},
			columns: [
				{ field: 'recid', caption: 'Record id', size: '20px', sortable: true },
				{ field: 'timestamp', caption: 'Time', size: '140px', sortable: true },
				{ field: 'type', caption: 'Type', size: '80px', sortable: true },
				{ field: 'category', caption: 'Category', size: '150px', sortable: true },
				{ field: 'moduleName', caption: 'Module name', size: '120px', sortable: true },
				{ field: 'instanceName', caption: 'Instance name', size: '120px', sortable: true },
				{ field: 'message', caption: 'Message', size: '500px', sortable: false }
			],
			records: []
		} );

		w2ui[ 'logDiv' ].hideColumn( 'recid' );

	} );

	btnGetAllLog.onclick = function() {

		getAllTheLog();

	};

	btnClearLog.onclick = function() {

		w2ui.logDiv.records = [];
		w2ui.logDiv.refresh();

	};

	// First resize
	onWindowResize();

}

function createModuleUI( module ) {

	var record = {
		recid: moduleRecId++,
		name: module.name,
		instanceName: module.instanceName,
		numberOfClients: module.numberOfClients
	};

	w2ui.modulesDiv.records.push( record );
	w2ui.modulesDiv.refresh();

}

function destroyModuleUI( module ) {

	var records = w2ui.modulesDiv.records;
	for ( var i = 0, il = records.length; i < il; i++ ) {
		if ( records[ i ].instanceName === module.instanceName ) {
			records.splice( i, 1 );
			w2ui.modulesDiv.refresh();
			break;
		}
	}

}

function createLaunchConfigurationUI( launchConfiguration ) {

	var record = {
		recid: launchConfigurationRecId++,
		name: launchConfiguration.name,
		instanceName: launchConfiguration.instanceName
	};

	w2ui.launchConfigurationsDiv.records.push( record );
	w2ui.launchConfigurationsDiv.refresh();

}

function createLogUI( logEntry ) {

	logEntry.recid = logRecId++;

	w2ui.logDiv.records.push( logEntry );
	w2ui.logDiv.refresh();

	if ( ! checkScrollLock.checked ) {
		w2ui.logDiv.scrollIntoView( w2ui.logDiv.records.length - 1 );
	}

}

function createLogUIAll( logEntries ) {

	w2ui.logDiv.records = [];

	var n = logEntries.length;
	for ( var i = 0; i < n; i++ ) {
		var logEntry = logEntries[ i ];
		logEntry.recid = logRecId++;
		w2ui.logDiv.records.push( logEntry );

	}

	w2ui.logDiv.refresh();

	w2ui.logDiv.scrollIntoView( w2ui.logDiv.records.length - 1 );

}

function setClientCountModule( instanceName, value ) {

	var records = w2ui.modulesDiv.records;
	for ( var i = 0, il = records.length; i < il; i++ ) {
		if ( records[ i ].instanceName === instanceName ) {
			records[ i ].numberOfClients = value;
			w2ui.modulesDiv.refresh();
			break;
		}
	}

}

function startModule( name, instanceName ) {

	socket.emit( "ysAdminStartModule", {
		name: name,
		instanceName: instanceName
	} );

}

function stopModule( instanceName ) {

	socket.emit( "ysAdminStopModule", {
		instanceName: instanceName
	} );

}

function getAllTheLog() {

	socket.emit( "ysAdminGetAllTheLog", {} );

}