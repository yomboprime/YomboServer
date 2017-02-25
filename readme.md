
# YomboServer
Personal server with custom applications



## Message list

### General Yomboserver Messages

Client --> YomboServer

 - `"ysConnectToModule"`

YomboServer --> Client

- `"ysConnectedToModule"`
- `"ysDisconnectedFromModule"`

### `admin` Module

Module --> Client:

 - `"ysAdminAllData"`
 - `"ysAdminModuleStarted"`
 - `"ysAdminModuleStopped"`
 - `"ysAdminClientConnected"`
 - `"ysAdminClientDisconnected"`
 - `"ysAdminClientConnectedToModule"`
 - `"ysAdminClientDisconnectedFromModule"`
 - `"ysAdminLog"`
 - `"ysAdminAllTheLog"`

Client --> module

 - `"ysAdminStartModule"`
 - `"ysAdminStopModule"`
 - `"ysAdminGetAllTheLog"`


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

modules dependencies:
    Each shared client library can be served in its own module. Modules that need them can specify in its config the
    modules that are needed (dependencies). Module dependencies are automatically started before module start.
    They are not automatically unloaded.

admin:
    start all modules
    restart all modules
    shutdown all modules
    shutdown server
    log

camcap module:
    make failure modes recovery

webrtc module:

 V - probar app de ejemplo
 V - mirar si el server se puede integrar en modulo yomboserver
   - probar a no usar el bundle, usando mi socket.io
 V - probar casos de uso


## IDEAS

Multi videochat with shared drawing board, ... think more ideas:

 - drawing board is a canvas. It has tools. The tool actions is what is sent through network.

 - Tools:
    V - Free drawing
    V - Line
    V - Rectangle
    V - Ellipse (not implemented in Firefox)
    - Flood fill
    V - Text

    - Image (select rectangle and then pop-up to select file)
    - First select rectangle, or click to cover all the board. 3d file (front/side/up/back/otherside/bottom/up to 4 of them) (.stl, .obj, .dae). Put a check to override material with color.

 - save board image to file / copy image.

V - the board is resolution independent, all positions/sizes are relative to [0,1]

V - client canvas is resizable

V - the client stores all actions from the last "board erase", applies them if client canvas is resized

 - multi-user undo of N steps: must use the client cache previously mentioned

