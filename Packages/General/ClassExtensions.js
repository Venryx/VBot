// Object: base
// ==================

// the below lets you do stuff like this: Array.prototype._AddFunction(function AddX(value) { this.push(value); }); []._AddX("newItem");
Object.defineProperty(Object.prototype, "_AddItem", { // note; these functions should by default add non-enumerable properties/items
	//configurable: true,
	enumerable: false,
	value: function(name, value) {
		if (this[name])
			delete this[name];
		if (!this[name]) // workaround for some properties not being deleted
			Object.defineProperty(this, name, {
				enumerable: false,
				value: value
			});
	}
});
Object.prototype._AddItem("_AddFunction", function(name, func) {
	//this._AddItem(func.name || func.toString().match(/^function\s*([^\s(]+)/)[1], func);
	this._AddItem(name, func);
});

// the below lets you do stuff like this: Array.prototype._AddGetterSetter("AddX", null, function(value) { this.push(value); }); [].AddX = "newItem";
Object.prototype._AddFunction("_AddGetterSetter", function(name, getter, setter) {
	//var name = (getter || setter).name || (getter || setter).toString().match(/^function\s*([^\s(]+)/)[1];
	if (this[name])
		delete this[name];
	if (!this[name]) // workaround for some properties not being deleted
		if (getter && setter)
			Object.defineProperty(this, name, {enumerable: false, get: getter, set: setter});
		else if (getter)
			Object.defineProperty(this, name, {enumerable: false, get: getter});
		else
			Object.defineProperty(this, name, {enumerable: false, set: setter});
});

// the below lets you do stuff like this: Array.prototype._AddFunction_Inline = function AddX(value) { this.push(value); }; [].AddX = "newItem";
Object.prototype._AddGetterSetter("_AddFunction_Inline", null, function(func) { this._AddFunction(func.name, func); }); // maybe make-so: these use func.GetName()
Object.prototype._AddGetterSetter("_AddGetter_Inline", null, function(func) { this._AddGetterSetter(func.name, func, null); });
Object.prototype._AddGetterSetter("_AddSetter_Inline", null, function(func) { this._AddGetterSetter(func.name, null, func); });

// Function (early)
// ==========

//Function.prototype._AddFunction_Inline = function GetName() { return this.name || this.name_fake || this.toString().match(/^function\s*([^\s(]+)/)[1]; };
Function.prototype._AddFunction_Inline = function GetName() { return this.name_fake || this.name || this.toString().match(/^function\s*([^\s(]+)/)[1]; };
Function.prototype._AddFunction_Inline = function SetName(name) { this.name_fake = name; return this; };
// probably make-so: SetName_Temp function exists
//Function.prototype._AddFunction_Inline = function Call_Silent(self) { this.apply(self, V.Slice(arguments, 1)); return this; }
//Function.prototype._AddFunction_Inline = function Call_Silent() { this.apply(this, arguments); return this; }

// Object: C# polyfills/emulators
// ==================

/*Object.prototype._AddGetterSetter("AddMethod", null, function(func) { // for steamlined prototype-method-adding, that doesn't overwrite the method if it already exists (maybe just for use in this project)
	if (this.prototype[func.GetName()] == null)
		this._AddFunction(func.GetName(), func);
});*/
Object.prototype._AddSetter_Inline = function AddMethod(func) { // for steamlined prototype-method-adding, that doesn't overwrite the method if it already exists (maybe just for use in this project)
	if (this[func.GetName()] == null)
		this._AddFunction(func.GetName(), func);
};
// maybe temp; shorthand version (i.e.: p.method = function MethodName() {};)
/*Object.prototype._AddSetter_Inline = function method(func) //Method, add, Add,
{
	if (this[func.GetName()] == null)
		this._AddFunction(func.GetName(), func);
};*/

Object.prototype._AddFunction_Inline = function SetBaseClass(baseClassFunc) {
	this.prototype.__proto__ = baseClassFunc.prototype; // makes "(new ThisClass()) instanceof BaseClass" be true
	//self.constructor = List; // makes "(new List()).constructor == List" be true

	var name = this.GetName();
	if (name != "")
		// this only runs on class constructor functions, so if function has name (i.e. name sucked in for self-knowledge purposes), create a variable by that name for global access
		window[name] = this;
};
Object.prototype._AddSetter_Inline = function SetAsBaseClassFor(derivedClassFunc) {
	derivedClassFunc.SetBaseClass(this);
	//window[derivedClassFunc.GetName()] = derivedClassFunc;
};
Object.prototype._AddFunction_Inline = function CallBaseConstructor(constructorArgs___) {
	//return this.prototype.__proto__.apply(this, V.AsArray(arguments));
	//this.__proto__.__proto__.constructor.apply(this, V.AsArray(arguments));
	arguments.callee.caller.prototype.__proto__.constructor.apply(this, V.AsArray(arguments));
	return this;
};

Object.prototype._AddFunction_Inline = function GetVDFTypeInfo() { return VDFTypeInfo.Get(this.GetTypeName()); };

//Object.prototype._AddFunction_Inline = function GetType() { return this.constructor; };
Object.prototype._AddFunction_Inline = function GetTypeName(/*o:*/ vdfTypeName) { //, simplifyForVScriptSystem)
	vdfTypeName = vdfTypeName != null ? vdfTypeName : true;

	/*var result = this.constructor.name;
	if (allowProcessing) 	{
		if (result == "String")
			result = "string";
		else if (result == "Boolean")
			result = "bool";
		else if (result == "Number")
			result = this.toString().contains(".") ? "double" : "int";
	}
	return result;*/


	/*var result = vdfTypeName ? VDF.GetTypeNameOfObject(this) : this.constructor.name;
	//if (simplifyForVScriptSystem)
	//	result = SimplifyTypeName(result);
	return result;*/
	if (vdfTypeName) {
		/*if (this instanceof Multi)
			return "Multi(" + this.itemType + ")";*/
		return VDF.GetTypeNameOfObject(this);
	}
	return this.constructor.name;
};
Object.prototype._AddFunction_Inline = function GetType(/*o:*/ simplifyForVScriptSystem) {
	var result = window.GetType(this.GetTypeName());
	if (simplifyForVScriptSystem)
		result = SimplifyType(result);
	return result;
};
function SimplifyType(type) {
	if (type.name.startsWith("List("))
		return GetType("IList");
	if (type.name.startsWith("Dictionary("))
		return GetType("IDictionary");
	return type;
}

// String
// ==========

String.prototype._AddFunction_Inline = function splitByAny() {
	if (arguments[0] instanceof Array)
		arguments = arguments[0];

	var splitStr = "/";
	for (var i = 0; i < arguments.length; i++)
		splitStr += (splitStr.length > 1 ? "|" : "") + arguments[i];
	splitStr += "/";

	return this.split(splitStr);
};
