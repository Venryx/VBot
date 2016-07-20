var streamKey = require("../@Private/StreamKey").streamKey;

var tmi = require("tmi.js");

var channel = "venryx";
var options = {
	options: {
		debug: true
	},
	connection: {
		cluster: "aws",
		reconnect: true
	},
	identity: {
		username: "venryxbot",
		password: streamKey
	},
	channels: [channel]
};
var client = new tmi.client(options);
client.connect();

/*client.on("connected", function(address, port) {
	//console.log("Address:" + address + " Port:" + port);
	client.action("venryx", "VenryxBot started.");
});*/
client.on("chat", function(channel, user, message, self) {
	if (user["display-name"] == options.identity.username)
		return;
	if (message == "!saymyname")
		client.action(channel, "Hello " + user["display-name"] + ".")
});