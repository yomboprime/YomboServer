
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


##TODO


 - quitar subdirectorio js de public y subir su contenido a public

 - el admin puede marcar un podcast como privado (por defecto es así) y los clientes no transmisores no pueden verlo.


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

probar app de ejemplo
mirar si el server se puede integrar en modulo yomboserver
probar a no usar el bundle, usando mi socket.io
probar casos de uso



## IDEAS

Multi videochat with shared drawing board, text chat... think more ideas:
 - start game bot (guess words by a drawing)
 - drawing board is a canvas. It has tools. The tool actions is what is sent through network.
 - Tools:
    - Free drawing (polyline)
    - Line
    - Rectangle
 - save board image to file / copy image