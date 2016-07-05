
# YomboServer
Personal server with custom applications





TODO


rooms:
    each module is responsable of adding/removing clients to/from rooms, via yomboserver functions. There is no room object.
    Only broadcasting use needs rooms, but rooms can also be used to tag client properties.


admin:
    start all modules
    restart all modules
    shutdown all modules
    shutdown server

camcap module:
    Test with other cameras in MJPG format, to see if writing to jpg file works