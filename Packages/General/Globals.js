var g = global;

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

// methods: serialization
// ==========

// json
/*function FromJSON(json) { return JSON.parse(json); }
function ToJSON(obj) { return JSON.stringify(obj); }*/
g.FromJSON = JSON.parse;
g.ToJSON = JSON.stringify;