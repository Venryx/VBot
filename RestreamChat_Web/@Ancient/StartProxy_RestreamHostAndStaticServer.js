var http = require("http");

http.createServer(onRequest).listen(5010);

function GetNumberOfXInStr(str, x) { return str.split(x).length - 1; }

function onRequest(client_req, client_res) {
	//console.log("Got request: " + client_req.url);

	// example url that grabs content from restream-host:
	// * http://localhost:5010/messages.json (grabbing url: http://localhost:8080/messages.json)
	// example urls that grabs content from static-server:
	// * http://localhost:5010/?obs=1&nobg=1&limit=300 (grabbing url: http://localhost:5009/?obs=1&nobg=1&limit=300)
	// * http://localhost:5010/js/chat.js (grabbing url: http://localhost:5009/js/chat.js)
	
	var baseURL = client_req.url.substr(0, client_req.url.lastIndexOf("/") + 1);
	var extraURL = client_req.url.substr(client_req.url.lastIndexOf("/") + 1);
	var restreamHostPort = 8080, staticServerPort = 5009;
	var sourcePort = GetNumberOfXInStr("?") == 1 ? restreamHostPort : staticServerPort;

	var options = {
		hostname: "localhost",
		port: sourcePort,
		path: client_req.url,
		//method: "GET"
		method: client_req.method
	};

	var proxy = http.request(options, function (res) {
		client_res.writeHead(200, {'Content-Type': res.headers['content-type']});
	  
		res.pipe(client_res, {
		  end: true
		});
	});

	client_req.pipe(proxy, {
		end: true
	});
}