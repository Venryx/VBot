var g = global;
var window = g;

g.Log = console.log;

// type checking
// ==========

g.IsPrimitive = function(obj) { return IsBool(obj) || IsNumber(obj) || IsString(obj); }
g.IsBool = function(obj) { return typeof obj == "boolean"; } //|| obj instanceof Boolean
g.ToBool = function(boolStr) { return boolStr == "true" ? true : false; }
g.IsNumber = function(obj) { return typeof obj == "number"|| obj instanceof Number; }
g.ToInt = function(stringOrFloatVal) { return parseInt(stringOrFloatVal); }
g.ToDouble = function(stringOrIntVal) { return parseFloat(stringOrIntVal); }
g.IsString = function(obj) { return typeof obj == "string"; } //|| obj instanceof String
g.ToString = function(val) { return "" + val; }

g.IsInt = function(obj) { return typeof obj == "number" && parseFloat(obj) == parseInt(obj); }
g.IsDouble = function(obj) { return typeof obj == "number" && parseFloat(obj) != parseInt(obj); }

//g.IsNumberStr = function(str) { return parseFloat(str) != NaN && str == "0" || parseInt(str) != 0; };
g.IsNumberStr = function(str) { return parseFloat(str).toString() == str; };
//g.IsFloatStr = function(str) { return parseFloat(str).toString() == str; };
g.IsIntStr = function(str) { return parseInt(str).toString() == str; };

// methods: serialization
// ==========

// json
/*function FromJSON(json) { return JSON.parse(json); }
function ToJSON(obj) { return JSON.stringify(obj); }*/
g.FromJSON = JSON.parse;
g.ToJSON = JSON.stringify;

// timers
// ==========

g.WaitXThenRun = function(waitTime, func) { setTimeout(func, waitTime); };

// interval is in seconds (can be decimal)
g.Timer = function(interval, func, /*o:*/ maxCallCount) {
	maxCallCount = maxCallCount != null ? maxCallCount : -1;

	var s = this;
	s.timerID = -1;
	s.callCount = 0;
	s.Start = function() {
		s.timerID = setInterval(function() {
			func();
			s.callCount++;
			if (maxCallCount != -1 && s.callCount >= maxCallCount)
				s.Stop();
		}, interval * 1000);
	};
	s.Stop = function() {
		clearInterval(s.timerID);
		s.timerID = -1;
	};
}
Timer.SetAsBaseClassFor = function TimerMS(interval_decimal, func, /*o:*/ maxCallCount) {
	var s = this.CallBaseConstructor(interval_decimal / 1000, func, maxCallCount);
};