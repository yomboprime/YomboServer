
// For browser and Node

if ( typeof module !== 'undefined' ) {
    module.exports = {
        isNumeric: isNumeric,
        latLon2Mercator: latLon2Mercator,
        mercator2LatLon: mercator2LatLon,
        EARTH_EQUATOR_LENGTH: EARTH_EQUATOR_LENGTH
    };
}

var EARTH_EQUATOR_LENGTH = 40075016.686;

function isNumeric( n ) {

    return ! isNaN( parseFloat( n ) ) && isFinite( n );

}


function latLon2Mercator( lat, lon, mercator ) {
    
    var latRad = lat * Math.PI / 180;
    var x = ( lon + 180 ) / 360;
    var y = ( 1 - Math.log( Math.tan( latRad ) + 1 / Math.cos( latRad ) ) / Math.PI ) / 2;

    if ( ! mercator ) {
        mercator = {
            x: x,
            y: y
        };
    }
    else {
        mercator.x = x;
        mercator.y = y;
    }
    
    return mercator;    
    
}

function mercator2LatLon( x, y, latLon ) {
    
    var lon = x * 360 - 180;
    var n = Math.PI * ( 1 - 2 * y );
    var lat = ( 180 / Math.PI * Math.atan( 0.5 * ( Math.exp( n ) - Math.exp( - n ) ) ) );
    
    if ( ! latLon ) {
        latLon = {
            lat: lat,
            lon: lon
        };
    }
    else {
        latLon.lat = lat;
        latLon.lon = lon;
    }
    
    return latLon;    
    
}
