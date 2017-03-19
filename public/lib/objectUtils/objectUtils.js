
// For browser and Node


if ( typeof module !== undefined ) {
    module.exports = {
        getObjectSerializedAsString: getObjectSerializedAsString,
        copyObject: copyObject,
        extendObject: extendObject
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

    var key = null;

    return extendObject( { }, objectToCopy, key );

}

function extendObject( original, context, key ) {

    // Extends original with context properties. Returns original.

    for ( key in context ) {

        if ( context.hasOwnProperty( key ) ) {

            if ( Object.prototype.toString.call( context[ key ] ) === '[object Object]' ) {

                original[ key ] = extendObject( original[ key ] || { }, context[ key ] );

            }
            else if ( Object.prototype.toString.call( context[ key ] ) === '[object Array]' ) {

                original[ key ] = extendObject( original[ key ] || [ ], context[ key ] );

            }
            else {

                original[ key ] = context[ key ];

            }
        }
    }

    return original;

}
