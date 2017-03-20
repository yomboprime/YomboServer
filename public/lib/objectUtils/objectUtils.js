
// For browser and Node


if ( typeof module !== undefined ) {
    module.exports = {
        getObjectSerializedAsString: getObjectSerializedAsString,
        copyObject: copyObject,
        iterateProperties: iterateProperties,
        extendObject: extendObject,
        isObject: isObject,
        isArray: isArray
    };
}


function getObjectSerializedAsString( objectJSON, beautified ) {

    if ( beautified ) {

        return JSON.stringify( objectJSON, null, 4 );

    }
    else {

        return JSON.stringify( objectJSON );

    }

}

function copyObject( objectToCopy ) {

    if ( isObject( objectToCopy ) ) {
        return extendObject( { }, objectToCopy );
    }
    else if ( isArray( objectToCopy ) ) {
        return extendObject( [], objectToCopy );
    }
    else {
        return objectToCopy;
    }

}

function iterateProperties( object, callback ) {
    
    for ( var key in object ) {

        if ( object.hasOwnProperty( key ) ) {
        
            callback( object[ key ] );

        }
        
    }
}

function extendObject( original, context ) {

    // Extends original with context properties. Returns original.

    for ( var key in context ) {

        if ( context.hasOwnProperty( key ) ) {

            if ( isObject( context[ key ] ) ) {

                original[ key ] = extendObject( original[ key ] || { }, context[ key ] );

            }
            else if ( isArray( context[ key ] )  ) {

                original[ key ] = extendObject( original[ key ] || [ ], context[ key ] );

            }
            else {

                original[ key ] = context[ key ];

            }
        }
    }

    return original;

}

function isObject( object ) {
    return Object.prototype.toString.call( object ) === '[object Object]';
}

function isArray( object ) {
    return Object.prototype.toString.call( object ) === '[object Array]';
}
