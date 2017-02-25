
// Next number for unique grid record ids
var moduleRecId = 1;
var launchConfigurationRecId = 1;
var logRecId = 1;

var totalNumberOfClients = 0;

var socket;

var btnStopModule;
var btnStartModule;
var btnGetAllLog;
var btnClearLog;

init();

function init() {

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

		createLogUI( logEntry );

	} );

	socket.on( "ysAdminAllTheLog", function( logEntries ) {

		createLogUIAll( logEntries );

	} );

	socket.on( "disconnect", function( msg ) {
		alert( "The connection with the server was closed." );
	} );

	socket.emit( "ysConnectToModule", { moduleName: "admin" } );

}

function initUI() {

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
			records: [],
			total: 0
		} );

		w2ui[ 'modulesDiv' ].hideColumn( 'recid' );

	} );

	btnStopModule = document.getElementById( "buttonStopModule" );
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
			records: [],
			total: 0
		} );

		w2ui[ 'launchConfigurationsDiv' ].hideColumn( 'recid' );

	} );

	btnStartModule = document.getElementById( "buttonStartLaunchConfigurationModule" );
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
			multiSelect: false,
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
			records: [],
			total: 0
		} );

		w2ui[ 'logDiv' ].hideColumn( 'recid' );

	} );

	btnGetAllLog = document.getElementById( "buttongetAllLog" );
	btnGetAllLog.onclick = function() {

		getAllTheLog();

	};

	btnClearLog = document.getElementById( "buttonClearLog" );
	btnClearLog.onclick = function() {

		w2ui.logDiv.records = [];
		w2ui.logDiv.total = 0;
		w2ui.logDiv.refresh();

	};

}

function createModuleUI( module ) {

	var record = {
		recid: moduleRecId++,
		name: module.name,
		instanceName: module.instanceName,
		numberOfClients: module.numberOfClients
	};

	w2ui.modulesDiv.records.push( record );
	w2ui.modulesDiv.total = w2ui.modulesDiv.records.length;
	w2ui.modulesDiv.refresh();

}

function destroyModuleUI( module ) {

	var records = w2ui.modulesDiv.records;
	for ( var i = 0, il = records.length; i < il; i++ ) {
		if ( records[ i ].instanceName === module.instanceName ) {
			records.splice( i, 1 );
			w2ui.modulesDiv.total = records.length;
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
	w2ui.launchConfigurationsDiv.total = w2ui.launchConfigurationsDiv.records.length;
	w2ui.launchConfigurationsDiv.refresh();

}

function createLogUI( logEntry ) {

	logEntry.recid = logRecId++;

	w2ui.logDiv.records.push( logEntry );
	w2ui.logDiv.total = w2ui.logDiv.records.length;
	w2ui.logDiv.refresh();

}

function createLogUIAll( logEntries ) {

	w2ui.logDiv.records = [];

	var n = logEntries.length;
	for ( var i = 0; i < n; i++ ) {
		var logEntry = logEntries[ i ];
		logEntry.recid = logRecId++;
		w2ui.logDiv.records.push( logEntry );

	}

	w2ui.logDiv.total = w2ui.logDiv.records.length;
	w2ui.logDiv.refresh();

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