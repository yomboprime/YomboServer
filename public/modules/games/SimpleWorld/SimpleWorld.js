
var getNanos = require( "../../../lib/realTime/realTime" );

if ( typeof module !== 'undefined' ) {

    module.exports = {
        init: init,
        shutdown: shutdown,
        onClientConnection: onClientConnection,
        onClientDisconnection: onClientDisconnection,
        onClientInput: onClientInput
    };

}

function init( gamesModule ) {

    var yomboServer = gamesModule.yomboServer;

    yomboServer.logInfo( "Hello world game!", "SimpleWorld.initGame", gamesModule.name, gamesModule.instanceName );

    yomboServer.registerApplication( gamesModule.config.gameName, gamesModule.config.gameDescription, gamesModule.yomboServer.gethostURL( "public/modules/games/SimpleWorld/SimpleWorld.html?gameModuleName=" + gamesModule.instanceName ) );

    yomboServer.mapDirectory( "/public/lib/three" );
    yomboServer.mapDirectory( "/public/lib/openui5" );

    var activeEntities = [];
    gamesModule.activeEntities = activeEntities;
    var activeEntitiesInstanceData = [];
    gamesModule.activeEntitiesInstanceData = activeEntitiesInstanceData;

    gamesModule.createNewEntityClass( "environment", environmentCreateNewInstanceServer, environmentCreateNewInstanceClient, environmentUpdateEntityClient );
    gamesModule.createNewEntityClass( "player", playerCreateNewInstanceServer, playerCreateNewInstanceClient, playerUpdateEntityClient );

    gamesModule.createNewEntityInstance( "environment", { }, { } );

    var THREE = require( "three" );
    var axis = new THREE.Vector3( 0, 1, 0 );
    var q1 = new THREE.Quaternion();
    var q2 = new THREE.Quaternion();
    var v1 = new THREE.Vector3();

    //var time = process.hrtime();
    var deltaTime = getNanos() / 1000000000;

    // Game loop
    setInterval( function() {

        deltaTime = getNanos() / 1000000000;

        // Physics
        var n = activeEntities.length;
        for ( var i = 0; i < n; i ++ ) {
            var e = activeEntities[ i ];
            var kc = e.keyboardController;
            var pos = e.instanceData.pos;
            var quat = e.instanceData.quat;
            q1.set( quat.x, quat.y, quat.z, quat.w );

            if ( kc.x !== 0 ) {
                q2.setFromAxisAngle( axis, - kc.x * 0.12 * deltaTime );
                q1.multiply( q2 );
                quat.x = q1.x;
                quat.y = q1.y;
                quat.z = q1.z;
                quat.w = q1.w;
            }

            if ( kc.y !== 0 ) {
                v1.set( 0, 0, kc.y * 0.2 * deltaTime );
                v1.applyQuaternion( q1 );
                pos.x += v1.x;
                pos.y += v1.y;
                pos.z += v1.z;
            }
        }

        // Send data to clients
        gamesModule.emitEntitiesInstanceDataArray( activeEntitiesInstanceData );

    }, 1000 / 45 );

}

function shutdown( gamesModule ) {

    gamesModule.yomboServer.logInfo( "Adios world game! ", "SimpleWorld.initGame", gamesModule.name, gamesModule.instanceName );

    gamesModule.yomboServer.unregisterApplication( gamesModule.yomboServer.gethostURL( "public/modules/games/SimpleWorld/SimpleWorld.html?gameModuleName=" + gamesModule.instanceName ) );

}

function onClientConnection( gamesModule, client ) {

    var pos = { x: 0, y: 0, z: 0 };
    var quat = { x: 0, y: 0, z: 0, w: 1 };

    gamesModule.initPlayer( client, "player",
        {
            // Nothing to put here yet
        },
        {
            pos: pos,
            quat: quat,
            playerId: client.gm.playerId
        } );

}

function onClientDisconnection( gamesModule, client ) {

    if ( client.entity ) {
        gamesModule.destroyEntityInstance( client.entity );
        var index = gamesModule.activeEntities.indexOf( client.entity );
        if ( index >= 0 ) {
            gamesModule.activeEntities.splice( index );
        }
        var index2 = gamesModule.activeEntitiesInstanceData.indexOf( client.entity.instanceData );
        if ( index2 >= 0 ) {
            gamesModule.activeEntitiesInstanceData.splice( index2 );
        }
    }

}

function onClientInput( gamesModule, client, inputData ) {

    var kc = client.entity.keyboardController;

    kc.x = inputData.x;
    kc.y = inputData.y;

}

function environmentCreateNewInstanceServer( instanceDataServer, instanceDataClient ) {

    return {
        instanceData: { }
    };

}

function environmentCreateNewInstanceClient( instanceDataClient ) {

    var environmentEntity = { };

    var camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.2, 2000 );
    environmentEntity.camera = camera;

    var scene = new THREE.Scene();
    environmentEntity.scene = scene;

    camera.position.x = 0;
    camera.position.y = 1.75;
    camera.position.z = 0;

    var renderer = new THREE.WebGLRenderer();
    environmentEntity.renderer = renderer;
    renderer.setClearColor( 0xbfd1e5 );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    //renderer.shadowMap.enabled = true;

    var ambientLight = new THREE.AmbientLight( 0x707070 );
    scene.add( ambientLight );

    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( - 10, 18, 5 );
    /*
     light.castShadow = true;
     var d = 14;
     light.shadow.camera.left = -d;
     light.shadow.camera.right = d;
     light.shadow.camera.top = d;
     light.shadow.camera.bottom = -d;
     
     light.shadow.camera.near = 2;
     light.shadow.camera.far = 50;
     
     light.shadow.mapSize.x = 1024;
     light.shadow.mapSize.y = 1024;
     */
    scene.add( light );

    var boxGround = new THREE.Mesh( new THREE.BoxGeometry( 20, 2, 20 ), new THREE.MeshBasicMaterial( { color: 0xA0A0D0 } ) );
    boxGround.position.y = - 1;
    scene.add( boxGround );

    document.body.appendChild( renderer.domElement );

    /*
     stats = new Stats();
     stats.domElement.style.position = 'absolute';
     stats.domElement.style.top = '0px';
     document.body.appendChild( stats.domElement );
     */

    window.addEventListener( 'resize', function() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }, false );

    function animate() {

        requestAnimationFrame( animate );

        render();
        //stats.update();

    }

    function render() {

        //controls.update( deltaTime );

        renderer.render( scene, camera );

    }

    animate();

    return environmentEntity;

}

function environmentUpdateEntityClient( entity, instanceDataClient ) {

}

function playerCreateNewInstanceServer( gamesModule, instanceDataServer, instanceDataClient ) {

    var serverEntity = {
        keyboardController: { x: 0, y: 0 },
        instanceData: {
            pos: instanceDataClient.pos,
            quat: instanceDataClient.quat
        }
    };

    gamesModule.activeEntities.push( serverEntity );
    gamesModule.activeEntitiesInstanceData.push( serverEntity.instanceData );

    return serverEntity;

}

function playerCreateNewInstanceClient( instanceDataClient ) {

    var entity = new THREE.Object3D();

    var sentinelPath = "/public/modules/games/SimpleWorld/assets/sentinel/";
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( sentinelPath );
    mtlLoader.load( "sentinel.mtl", function( materials ) {

        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        objLoader.setPath( sentinelPath );
        objLoader.load( "sentinel.obj", function( object ) {

            object.traverse( function( child ) {
                if ( child instanceof THREE.Mesh ) {
                    //child.material =
                }
            } );

            entity.add( object );

        } );

    } );

    entity.position.copy( instanceDataClient.pos );
    entity.quaternion.copy( instanceDataClient.quat );

    var environmentEntity = entities[ 0 ];

    environmentEntity.scene.add( entity );

    if ( instanceDataClient.playerId === thePlayerId ) {

        // This entity instance is the player's one

        if ( environmentEntity.camera.parent ) {
            environmentEntity.camera.parent.remove( environmentEntity.camera );
        }
        entity.add( environmentEntity.camera );

        var keyboardController = {
            x: 0,
            y: 0
        };
        entity.userData.keydownEventListener = function( event ) {

            var emit = false;

            switch ( event.keyCode ) {
                // Left
                case 37:
                    keyboardController.x = - 1;
                    emit = true;
                    break;

                    // Right
                case 39:
                    keyboardController.x = 1;
                    emit = true;
                    break;

                    // Up
                case 38:
                    keyboardController.y = - 1;
                    emit = true;
                    break;

                    // Down
                case 40:
                    keyboardController.y = 1;
                    emit = true;
                    break;

            }

            if ( emit ) {
                socket.emit( "gmInput", keyboardController );
            }

        };

        entity.userData.keyupEventListener = function( event ) {

            var emit = false;

            switch ( event.keyCode ) {
                // Left
                case 37:
                    keyboardController.x = 0;
                    emit = true;
                    break;

                    // Right
                case 39:
                    keyboardController.x = 0;
                    emit = true;
                    break;

                    // Up
                case 38:
                    keyboardController.y = 0;
                    emit = true;
                    break;

                    // Down
                case 40:
                    keyboardController.y = 0;
                    emit = true;
                    break;

            }

            if ( emit ) {
                socket.emit( "gmInput", keyboardController );
            }

        };

        window.addEventListener( 'keydown', entity.userData.keydownEventListener, false );
        window.addEventListener( 'keyup', entity.userData.keyupEventListener, false );

    }

    return entity;

}

function playerUpdateEntityClient( entity, instanceDataClient ) {

    entity.position.copy( instanceDataClient.pos );
    entity.quaternion.copy( instanceDataClient.quat );

    if ( instanceDataClient.destroyed ) {

        entities[ 0 ].remove( entity );
        entities[ entity.entityId ] = null;

        if ( instanceDataClient.playerId === thePlayerId ) {
            window.removeEventListener( 'keydown', entity.userData.keydownEventListener );
            window.removeEventListener( 'keyup', entity.userData.keyupEventListener );
        }
    }
}
