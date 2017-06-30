var connect = require('connect');
var serveStatic = require('serve-static');

connect().use(serveStatic("docs")).listen(8189, function(){
    console.log('Server running on http://localhost:8189/ ...');
});
