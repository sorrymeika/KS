define('extend/matchMedia',['$'],function (require,exports,module) {
	var $=require('$');

	$.matchMedia=(function () {
		var mediaId=0,
            cls='sl-media-detect',
            transitionEnd=$.fx.transitionEnd,
            cssPrefix=$.fx.cssPrefix,
            $style=$('<style></style>').append('.'+cls+'{'+cssPrefix+'transition: width 0.001ms; width: 0; position: absolute; clip: rect(1px, 1px, 1px, 1px);}\n').appendTo('head');

		return function (query) {
			var id=cls+mediaId++,
                $mediaElem,
                listeners=[],
                ret;

			$style.append('@media '+query+' { #'+id+' { width: 1px; } }\n');   //原生matchMedia也需要添加对应的@media才能生效

			// 统一用模拟的，时机更好。
			// if ('matchMedia' in window) {
			//     return window.matchMedia(query);
			// }

			$mediaElem=$('<div class="'+cls+'" id="'+id+'"></div>')
                .appendTo('body')
                .on(transitionEnd,function () {
                	ret.matches=$mediaElem.width()===1;
                	$.each(listeners,function (i,fn) {
                		$.isFunction(fn)&&fn.call(ret,ret);
                	});
                });

			ret={
				matches: $mediaElem.width()===1,
				media: query,
				addListener: function (callback) {
					listeners.push(callback);
					return this;
				},
				removeListener: function (callback) {
					var index=listeners.indexOf(callback);
					~index&&listeners.splice(index,1);
					return this;
				}
			};

			return ret;
		};
	} ());

});