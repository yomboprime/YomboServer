
var YomboServer = require( './YomboServer' );

process.title = "node-Yomboserver";

var yomboServer = new YomboServer.TheServer();

yomboServer.name = "Yomboserver personal server";

yomboServer.run();
