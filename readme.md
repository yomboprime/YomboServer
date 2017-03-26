
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

 - `"yssbPaintCommand"`

Client --> Module:

 - `"yssbPaintCommand"`
 - `"yssbGetLatestData"`


### games module

Module --> Client:

 - `"gmNewEntityClass"`
 - `"gmNewEntity"`
 - `"gmNewEntities"`
 - `"gmData"`

Client --> Module:

 - `"gmInput"`

### maps module

Module --> Client:

 - `"mapsTagList"`
 - `"mapsBookmarks"`
- `"mapsPolylines"`

Client --> Module:

 - `"mapsGetTagList"`
 - `"mapsGetNodes"`
 - `"mapsGetWays"`

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
    V - log

camcap module:
    V - make failure modes recovery

webrtc module:

 V - probar app de ejemplo
 V - mirar si el server se puede integrar en modulo yomboserver
   - probar a no usar el bundle, usando mi socket.io
 V - probar casos de uso

   - Aplicacion multicliente: los emisores de video se han de registrar. los receptores de video primero reciben lista de transmisores registrados y luego se conectan a rtc.
Si se registra un emisor y ya hay clientes en esa room, el servidor envia un mensaje a los clientes, que automaticamente les hace reiniciar (recargar la pagina)


## TODO


    todo obtener tokens de todos los modulos de un fichero json obtenido de la ruta privada configurada en la config normal
    esa ruta es "../../private/yomboserver", a la que se agrega "/privateConfig.json"
    las private config pueden ir por launch y por instancia, y se agregan como privateConfig en la config de cada modulo







## IDEAS

------------

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

------------

Teleconference one-to-one, desktop/mobile/wathever


------------

N cameras (emitters) to M clients (receivers), desktop/mobile/wathever

 - emitters must register in the server

 - new clients get list of registered emitters

 - when a new emitter is registered, all clients from that room are automatically reset (page reload) via server message.



