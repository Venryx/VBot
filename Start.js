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

var localUser = {username: "local"};

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

	// listeners
	socket.on("HandleMessage", function(message) {
		HandleMessage(message, localUser);
	});
	socket.on("OnSetCurrentPlayer", function(playerName) {
		client.whisper(playerName, "Your turn " + playerName + "!");
	});

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
	//HandleMessage("!race", "local");
	HandleMessage("!tower", localUser);
}

var currentGameType = null;

function HandleMessage(message, user) {
	Log("HandleMessage) " + message);
	var messageLower = message.toLowerCase();
	var username = user.username.replace(/\\/g, "");
	var isAdmin = username == "local" || username == "venryx" || username == "Venryx";

	// messages aliases
	if (message.startsWith("!m "))
		message = message.replace("!m ", "!move ");

	// general
	if (messageLower.startsWith("[as:") && isAdmin) {
		var chatAsUsername = message.substring(message.indexOf(":") + 1, message.indexOf("]"));
		var realMessage = message.substr(message.indexOf("]") + 1);
		HandleMessage(realMessage, {username:chatAsUsername});
	}

	// race
	else if (messageLower == "!race") {
		UnityBridge.CallMethod("VO.main.race.MakeVisible");
		UnityBridge.CallMethod("VO.main.race.StartNewMatch");
		currentGameType = "race";
	}
	else if (messageLower.startsWith("!play") && currentGameType == "race") {
		var args = message.split(' ').slice(1);
		var emoji = args[0] || "😒";
		UnityBridge.CallMethod("VO.main.race.liveMatch.AddPlayer", username, Encode(emoji));
	}
	else if (messageLower.startsWith("!move ")) {
		var args = message.split(' ').slice(1);
		if (args[0].endsWith("-"))
			args[0] = "-" + args[0];

		var argsValid = args.length >= 1 && args.length <= 2 && IsNumberStr(args[0]) && (args[1] == null || IsNumberStr(args[1]));
		if (!argsValid) {
			client.whisper(username, "Invalid command. Format should be \"!move angle strength\", e.g: \"!move 0 1000\" [%]");
			//client.whisper(username, "Invalid command. Format should be \"!move angle\" or \"!move strength angle\", e.g: \"!move 0 1000\" [%]");
			return;
		}

		var angle = parseFloat(args[0]);
		var strength = args.length >= 2 ? parseFloat(args[1]) : 50;
		UnityBridge.CallMethod("PlayerJump", username, angle, strength);
	}

	// tower
	else if (messageLower == "!tower" && isAdmin) {
		UnityBridge.CallMethod("VO.main.tower.MakeVisible");
		UnityBridge.CallMethod("VO.main.tower.StartNewMatch");
		currentGameType = "tower";
	}
	else if (messageLower.startsWith("!play") && currentGameType == "tower") {
		UnityBridge.CallMethod("VO.main.tower.liveMatch.AddPlayer", username);
	}
	else if (messageLower.startsWith("!quit") && currentGameType == "tower") {
		UnityBridge.CallMethod("VO.main.tower.liveMatch.Quit", username);
	}
	else if (messageLower.startsWith("!setplayer")) {
		if (!(username == "venryx" || username == "Venryx")) return;
		var args = message.split(' ').slice(1);
		var player = args[0];
		UnityBridge.CallMethod("VO.main.tower.liveMatch.SetCurrentPlayer_ByName", player);
	}
	else if (messageLower.startsWith("!skip")) {
		if (!(username == "venryx" || username == "Venryx")) return;
		UnityBridge.CallMethod("VO.main.tower.liveMatch.SkipCurrentPlayer");
	}
	else if (messageLower.startsWith("!break")) {
		var args = message.split(' ').slice(1);
		if (args.length != 1) return;
		if (!IsIntStr(args[0])) return;
		var blockNumber = parseInt(args[0]);
		UnityBridge.CallMethod("VO.main.tower.liveMatch.Break", username, blockNumber);
	}
	else if (messageLower.startsWith("!shrink")) {
		var args = message.split(' ').slice(1);
		if (args.length != 2) return;
		var blockNumber = parseInt(args[0]);
		var shrinkToPercent_input = parseFloat(args[1]);
		var shrinkToPercent = shrinkToPercent_input < 1 ? shrinkToPercent_input : shrinkToPercent_input / 100;
		UnityBridge.CallMethod("VO.main.tower.liveMatch.Shrink", username, blockNumber, shrinkToPercent);
	}
}