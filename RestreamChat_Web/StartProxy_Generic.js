var http = require('http');
var url = require('url');
var request = require('request');

http.createServer(onRequest).listen(5010);

function onRequest(req, res) {
    var queryData = url.parse(req.url, true).query;
    if (queryData.url) {
        request({
            url: queryData.url,
			/*headers: { 
				origin: 'http://localhost:8080'
			}*/
        }).on('error', function(e) {
            res.end(e);
        }).pipe(res);
		res.setHeader("Access-Control-Allow-Origin", "*");
		//res.setHeader("Access-Control-Allow-Origin", "http://localhost:5009");
		//res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
		//res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    else
        res.end("no url found");
}