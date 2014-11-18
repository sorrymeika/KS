define(function (require,exports,module) {
	var $=require('$'),
		sl=require('ui/sl');

	$.extend(sl,{
		version: '@version',
		$: $,
		staticCall: (function () {
			var proto=$.fn,
            slice=[].slice,
            instance=$();
			instance.length=1;
			return function (item,fn) {
				instance[0]=item;
				return proto[fn].apply(instance,slice.call(arguments,2));
			};
		})()
	});

	return sl;
});
