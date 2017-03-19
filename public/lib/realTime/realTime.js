
// Only for Node

var getNanos = function() {
    
    // Returns deltatime in ns (nanoseconds from previous call)
    // First call returns 0
    
    var time = process.hrtime();

    return function() {

        process.hrtime( time );
	return time[ 1 ];

    };

}();

if ( typeof module !== undefined ) {
    module.exports = getNanos;
}
