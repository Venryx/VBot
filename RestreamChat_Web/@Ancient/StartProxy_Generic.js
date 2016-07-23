var url = require("url");
var http = require("http");
http.createServer(onRequest).listen(5010);

var Log = console.log;

function onRequest(client_req, client_res) {
	//console.log("Got request: " + client_req.url);
	
	var requestURL = client_req.url.split("#url=")[1];
	console.log("RequestURL) " + requestURL);
	
	/*var options = {
		path: requestURL,
		//method: "GET"
		method: client_req.method
	};*/
	
	/*var options = url.parse(requestURL);
	options.method = client_req.method;
	options.headers = client_req.headers;
	
	options.headers.host = "localhost:8080";
	delete options.headers.origin;
	delete options.headers.referer;*/
	
	var requestURL_decomposed = url.parse(requestURL);
	var options = {};
	options.hostname = requestURL_decomposed.hostname;
	options.port = requestURL_decomposed.port;
	Log("\nPath) " + requestURL_decomposed.path + "\n\n");
	options.path = requestURL_decomposed.path;
	//options.localAddress = "127.0.0.1:8080";
	options.method = client_req.method;
	options.headers = client_req.headers;
	
	delete options.headers.origin;
	delete options.headers.referer;
	
	options.headers = {
		"host": "localhost:5010",
		"connection": "keep-alive",
		"cache-control": "max-age=0",
		"upgrade-insecure-requests": "1",
		"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.21 Safari/537.36",
		"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
		"accept-encoding": "gzip, deflate, sdch",
		"accept-language": "en-US,en;q=0.8"
};
	
	console.log("Options) " + JSON.stringify(options));
	
	var proxy = http.request(options, function(remoteRes) {
		client_res.writeHead(200, {
			'Content-Type': remoteRes.headers['content-type'],
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
		});
	  
		remoteRes.pipe(client_res, {
		  end: true
		});
	});

	client_req.pipe(proxy, {
		end: true
	});
}