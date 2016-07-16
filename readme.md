
# YomboServer
Personal server with custom applications



## Message list

### General Yomboserver Messages

Client --> module

 - `"ysConnectToModule"`

### `admin` Module

Module --> Client:

 - `"ysAdminAllData"`
 - `"ysAdminModuleStarted"`
 - `"ysAdminModuleStopped"`
 - `"ysAdminClientConnected"`
 - `"ysAdminClientDisconnected"`
 - `"ysAdminClientConnectedToModule"`
 - `"ysAdminClientDisconnectedFromModule"`

Client --> module

 - `"ysAdminStartModule"`
 - `"ysAdminStopModule"`


### camcap Module

Module --> Client:

 - `"ysCamcapFrame"`


### rtcsignal Module

Module --> Client:

 - ?

Client --> Module:

 - `"easyrtcAuth"`
 - `"roomJoin"`
 - `"roomCreate"`


### sharedboard Module

Module --> Client:

 - `"yssbPaintCommand"

Client --> Module:

 - `"yssbPaintCommand"
 - `"yssbGetLatestData"


-------------------------------------------------------


##TODO

rooms:
    each module is responsable of adding/removing clients to/from rooms, via yomboserver functions. There is no room object.
    Only broadcasting use needs rooms, but rooms can also be used to tag client properties.

admin:
    start all modules
    restart all modules
    shutdown all modules
    shutdown server

camcap module:
    make failure modes recovery


webrtc module:

 V - probar app de ejemplo
 V - mirar si el server se puede integrar en modulo yomboserver
   - probar a no usar el bundle, usando mi socket.io
 V - probar casos de uso

 - el admin puede marcar un podcast como privado (por defecto es así) y los clientes no transmisores no pueden verlo.


## IDEAS

Multi videochat with shared drawing board, ... think more ideas:

 - drawing board is a canvas. It has tools. The tool actions is what is sent through network.

 - Tools:
    - Free drawing (polyline)
    - Line
    - Rectangle
    - Ellipse
    - Flood fill
    - Text

 - save board image to file / copy image

 - the board is resolution independent, all positions/sizes are relative to [0,1]

 - client canvas is resizable

 - se necesitan dos canvas en el cliente, uno de trabajo y otro de visualizacion.
    En el de visualizacion se pintan las herramientas mientras se usan, por ejemplo un rectangulo (mano alzada no)

 - the client stores all actions from the last "board erase", applies them if client canvas is resized

ctx.fillStyle = "rgb(200,0,0)";