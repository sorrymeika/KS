define('extend/scrollStop',['$','extend/throttle'],function (require,exports,module) {

    var $=require('$'),
        win=window;

    require('extend/throttle');

    function registerScrollStop() {
        $(win).on('scroll',$.debounce(80,function () {
            $(win).trigger('scrollStop');
        },false));
    }

    function backEventOffHandler() {
        $(win).off('scroll');
        registerScrollStop();
    }
    registerScrollStop();

    $(win).on('pageshow',function (e) {
        e.persisted&&$(win).off('touchstart',backEventOffHandler).one('touchstart',backEventOffHandler);
    });

    module.exports=$;
});
