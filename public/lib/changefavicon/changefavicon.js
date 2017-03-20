
// from http://stackoverflow.com/questions/260857/changing-website-favicon-dynamically
function changeFavicon( src ) {

    var link = document.createElement( 'link' );
    var oldLink = document.getElementById( 'dynamic-favicon' );
    link.id = 'dynamic-favicon';
    link.rel = 'shortcut icon';
    link.href = src;
    if ( oldLink ) {
        document.head.removeChild( oldLink );
    }

    document.head.appendChild( link );

}
