var streamKey = require("../@Private/StreamKey").streamKey;

var tmi = require("tmi.js");
require("./Packages/General/ClassExtensions.js");
require("./Packages/General/Globals.js");
var V = require("./Packages/V/V.js").V;

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

var io = require('socket.io')(1337);
/*io.on('connection', function(socket) {
    console.log('Unity 3D Connected');
});*/

/*client.on("connected", function(address, port) {
	//console.log("Address:" + address + " Port:" + port);
	client.action("venryx", "VenryxBot started.");
});*/
client.on("chat", function(channel, user, message, self) {
	if (self)
		return;
	if (message == "!saymyname")
		client.action(channel, "Hello " + user["display-name"] + ".")
});

/*function Encode(obj) { return unescape(encodeURIComponent(obj)); }
function Decode(obj) { return decodeURIComponent(escape(obj)); }*/
function Encode(obj) { return encodeURIComponent(obj); }
function Decode(obj) { return decodeURIComponent(obj); }

var UnityBridge = new function() {
	var s = this;
	s.CallMethod = function(methodName, args___) {
		var args = V.AsArray(arguments).slice(1);
		//io.sockets.emit("CallMethod", {methodName: methodName, props: V.ToArray(arguments).slice(1)});
		io.sockets.emit("CallMethod", {methodName: methodName, argsJSON: ToJSON(args)});
	};
};

//function IsNumberStr(str) { return isFinite(str); }
var IsNumberStr = isFinite;

client.on("whisper", function(from, user, message, self) {
    if (self) return;

	// messages aliases
	if (message.startsWith("!m "))
		message = message.replace("!m ", "!move ");

	if (message == "!race")
		UnityBridge.CallMethod("StartNewRace");
	else if (message.startsWith("!play")) {
		var parts = message.split(' ').slice(1);
		var emoji = parts[0] || "😒";
		UnityBridge.CallMethod("AddPlayer", user.username, Encode(emoji));
	}
	else if (message.startsWith("!move ")) {
		var parts = message.split(' ').slice(1);
		var argsValid = parts.length >= 2 && parts.length <= 3 && IsNumberStr(parts[0]) && IsNumberStr(parts[1]) && (parts[2] == null || IsNumberStr(parts[2]));
		if (!argsValid) {
			client.whisper(user.username, "Invalid command. Format should be \"!move x y strength\", e.g: \"!move 50 70 1000\" [%]");
			return;
		}

		var x = parseFloat(parts[0]);
		var z = parseFloat(parts[1]);
		var strength = parts.length >= 3 ? parseFloat(parts[2]) : 1000;
		UnityBridge.CallMethod("PlayerJump", user.username, x, z, strength);
	}
});