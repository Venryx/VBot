// generate auth-key here (for bot's Twitch account): http://twitchapps.com/tmi
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
		username: "vbot5",
		password: streamKey
	},
	channels: [channel]
};
var client = new tmi.client(options);
client.connect();

var io = require("socket.io")(1337);
var unityBridgeSocket;
io.on("connection", function(socket) {
	unityBridgeSocket = socket;
    Log("Unity 3D Connected");
	//Log("Handshake address) " + (typeof socket.request.connection.remoteAddress));
	//if (socket.handshake.address.address != "127.0.0.1") {
	if (socket.request.connection.remoteAddress != "::ffff:127.0.0.1" || socket.handshake.address != "::ffff:127.0.0.1") {
		Log("Disconnecting web-socket, since remote-address or handshake-address is not localhost (127.0.0.1).");
		io.sockets.connected[socket.id].disconnect();
	}

	RunStartCommands();
});

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
		//Log("CallMethod) " + methodName);

		var args = V.AsArray(arguments).slice(1);
		//io.sockets.emit("CallMethod", {methodName: methodName, props: V.ToArray(arguments).slice(1)});
		if (unityBridgeSocket != null)
			io.sockets.emit("CallMethod", {methodName: methodName, argsJSON: ToJSON(args)});
	};
};

//function IsNumberStr(str) { return isFinite(str); }
var IsNumberStr = isFinite;

client.on("whisper", function(from, user, message, self) {
    if (self) return;

	HandleMessage(message, user);
});

// receive messages from restream chat
// =========

var request = require("request")

var lastMessageID = "";
var refreshRestreamMessages = function() {
	var requestTime = new Date().getTime();
	request({
	    url: "http://localhost:8080/messages.json" + (lastMessageID == "" ? "" : "?id=" + lastMessageID),
	    json: true
	}, function(error, response, messages) {
		var timeToGetData = new Date().getTime() - requestTime;
		var nextWaitTime = Math.max(0, 100 - timeToGetData);
	    if (error || response.statusCode != 200) {
			setTimeout(refreshRestreamMessages, nextWaitTime);
			return;
		}

		//Log(messages.length + ";" + messages[0].Id);

		for (message of messages) {
			if (message.Text == null)
				continue;
			// maybe make-so: this grabs user data from cache, from Twitch user-list
			HandleMessage(message.Text, {username: message.FromUserName});
			lastMessageID = message.Id;
		}

		setTimeout(refreshRestreamMessages, nextWaitTime);
	});
};
refreshRestreamMessages();

// handles messages
// ==========

function RunStartCommands() {
	HandleMessage("!race", "local");
}

function HandleMessage(message, user) {
	Log("HandleMessage) " + message);

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
		if (parts[0].endsWith("-"))
			parts[0] = "-" + parts[0];

		var argsValid = parts.length >= 1 && parts.length <= 2 && IsNumberStr(parts[0]) && (parts[1] == null || IsNumberStr(parts[1]));
		if (!argsValid) {
			client.whisper(user.username, "Invalid command. Format should be \"!move angle strength\", e.g: \"!move 0 1000\" [%]");
			//client.whisper(user.username, "Invalid command. Format should be \"!move angle\" or \"!move strength angle\", e.g: \"!move 0 1000\" [%]");
			return;
		}

		var angle = parseFloat(parts[0]);
		var strength = parts.length >= 2 ? parseFloat(parts[1]) : 50;
		UnityBridge.CallMethod("PlayerJump", user.username, angle, strength);
	}
}