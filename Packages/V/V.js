exports.V = new function() {
    var s = this;

	s.AsArray = function(args) { return s.Slice(args, 0); };
	//s.ToArray = function(args) { return s.Slice(args, 0); };
	s.Slice = function(args, start, end) { return Array.prototype.slice.call(args, start != null ? start : 0, end); };
};