
// For browser and Node


if ( typeof module !== undefined ) {
    module.exports = {
        isNumeric: isNumeric
    };
}



function isNumeric( n ) {

    return ! isNaN( parseFloat( n ) ) && isFinite( n );

}

