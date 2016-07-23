var g = global;
var window = g;

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

// Array
// ==========

Array.prototype._AddFunction_Inline = function Contains(str) { return this.indexOf(str) != -1; };
Array.prototype._AddFunction_Inline = function Indexes()
{
	var result = {};
	for (var i = 0; i < this.length; i++)
		result[i] = null; //this[i]; //null;
	return result;
};
Array.prototype._AddFunction_Inline = function Strings() // not recommended, because it doesn't allow for duplicates
{
	var result = {};
	for (var key in this)
		if (this.hasOwnProperty(key))
			result[this[key]] = null;
	return result;
};

Array.prototype._AddFunction_Inline = function Add(item) { return this.push(item); };
Array.prototype._AddFunction_Inline = function CAdd(item) { this.push(item); return this; }; // CAdd = ChainAdd
Array.prototype._AddFunction_Inline = function TAdd(item) { this.push(item); return item; }; // TAdd = TransparentAdd
Array.prototype._AddFunction_Inline = function AddRange(array)
{
	for (var i in array)
		this.push(array[i]);
};
Array.prototype._AddFunction_Inline = function Remove(item)
{
	/*for (var i = 0; i < this.length; i++)
		if (this[i] === item)
			return this.splice(i, 1);*/
	var itemIndex = this.indexOf(item);
	this.splice(itemIndex, 1);
};
Array.prototype._AddFunction_Inline = function RemoveAt(index) { return this.splice(index, 1); };
Array.prototype._AddFunction_Inline = function Insert(index, obj) { this.splice(index, 0, obj); }

Object.prototype._AddFunction_Inline = function AsRef() { return new NodeReference_ByPath(this); }

// Linq replacements
// ----------

Array.prototype._AddFunction_Inline = function Any(matchFunc)
{
    for (var i in this.Indexes())
        if (matchFunc.call(this[i], this[i]))
            return true;
    return false;
};
Array.prototype._AddFunction_Inline = function All(matchFunc)
{
    for (var i in this.Indexes())
        if (!matchFunc.call(this[i], this[i]))
            return false;
    return true;
};
Array.prototype._AddFunction_Inline = function Where(matchFunc)
{
	var result = [];
	for (var i in this)
		if (matchFunc.call(this[i], this[i])) // call, having the item be "this", as well as the first argument
			result.push(this[i]);
	return result;
};
Array.prototype._AddFunction_Inline = function Select(selectFunc)
{
	var result = [];
	//for (var i in this)
	for (var i in this) // need this for VDF List's, which also use this function (since they derive from the Array class)
		result.Add(selectFunc.call(this[i], this[i]));
	return result;
};
//Array.prototype._AddFunction_Inline = function Count(matchFunc) { return this.Where(matchFunc).length; };
//Array.prototype._AddFunction_Inline = function Count(matchFunc) { return this.Where(matchFunc).length; }; // needed for items to be added properly to custom classes that extend Array
Array.prototype._AddGetter_Inline = function Count() { return this.length; }; // needed for items to be added properly to custom classes that extend Array
Array.prototype._AddFunction_Inline = function VCount(matchFunc) { return this.Where(matchFunc).length; };
/*Array.prototype._AddFunction_Inline = function Clear()
{
	while (this.length > 0)
		this.pop();
};*/
Array.prototype._AddFunction_Inline = function First(matchFunc) { return this.Where(matchFunc || function() { return true; })[0]; };
//Array.prototype._AddFunction_Inline = function FirstWithPropValue(propName, propValue) { return this.Where(function() { return this[propName] == propValue; })[0]; };
Array.prototype._AddFunction_Inline = function FirstWith(propName, propValue) { return this.Where(function() { return this[propName] == propValue; })[0]; };
Array.prototype._AddFunction_Inline = function Last() { return this[this.length - 1]; };
Array.prototype._AddFunction_Inline = function XFromLast(x) { return this[(this.length - 1) - x]; };

// since JS doesn't have basic 'foreach' system
Array.prototype._AddFunction_Inline = function ForEach(func) {
	for (var i in this)
		func.call(this[i], this[i], i); // call, having the item be "this", as well as the first argument
};

Array.prototype._AddFunction_Inline = function Move(item, newIndex)
{
	var oldIndex = this.indexOf(item);
	this.RemoveAt(oldIndex);
	if (oldIndex < newIndex) // new-index is understood to be the position-in-list to move the item to, as seen before the item started being moved--so compensate for remove-from-old-position list modification
		newIndex--;
	this.Insert(newIndex, item);
};

Array.prototype._AddFunction_Inline = function ToList(itemType) { return List.apply(null, [itemType || "object"].concat(this)); }
Array.prototype._AddFunction_Inline = function ToDictionary(keyFunc, valFunc)
{
	var result = new Dictionary();
	for (var i in this)
		result.Add(keyFunc(this[i]), valFunc(this[i]));
	return result;
}
Array.prototype._AddFunction_Inline = function Skip(count)
{
	var result = [];
	for (var i = count; i < this.length; i++)
		result.push(this[i]);
	return result;
};
Array.prototype._AddFunction_Inline = function Take(count)
{
	var result = [];
	for (var i = 0; i < count && i < this.length; i++)
		result.push(this[i]);
	return result;
};
Array.prototype._AddFunction_Inline = function FindIndex(matchFunc)
{
	for (var i in this)
		if (matchFunc.call(this[i], this[i])) // call, having the item be "this", as well as the first argument
			return i;
	return -1;
};
Array.prototype._AddFunction_Inline = function OrderBy(valFunc)
{
	var temp = this.ToList();
	temp.sort(function(a, b) { return valFunc(a) - valFunc(b); });
	return temp;
};
Array.prototype._AddFunction_Inline = function Distinct()
{
	var result = [];
	for (var i in this)
		if (!result.Contains(this[i]))
			result.push(this[i]);
	return result;
};
//Array.prototype._AddFunction_Inline = function JoinUsing(separator) { return this.join(separator);};
