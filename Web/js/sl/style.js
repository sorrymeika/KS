define(['$','util','extend/matchMedia','extend/ortchange'],function(require,exports,module) {
    var $=require('$'),
        util=require('util');

    require('extend/matchMedia'),require('extend/ortchange');

    $(function() {
        $.mediaQuery={
            heightchange: 'screen and (height: '+window.innerHeight+'px)'
        };
        var style=null,
            addHeightStyle=function() {
                if(style!=null) {
                    style.parentNode.removeChild(style);
                    style=null;
                }
                style=util.addStyle('.screen_height{height:'+window.innerHeight+'px}.portrait_height{height:'+Math.max(window.innerHeight,window.innerWidth)+'px}.viewport,.minheight,.view,.main { min-height:'+window.innerHeight+'px; }.screen{overflow:hidden;width:'+window.innerWidth+'px;height:'+window.innerHeight+'px;}.minheight-30 { min-height:'+(window.innerHeight-30)+'px }.minheight-20 { min-height:'+(window.innerHeight-20)+'px }.minheight-5 { min-height:'+(window.innerHeight-5)+'px }.minheight-100{ min-height:'+(window.innerHeight-100)+'px}.minheight-70{ min-height:'+(window.innerHeight-70)+'px}');
            };

        $.matchMedia($.mediaQuery.heightchange).addListener(function() {
            addHeightStyle();
            $(window).trigger('heightchange');
        });
        addHeightStyle();
    });

    var styles={},
        el=document.createElement('div'),
        has3d=$.fx.cssPrefix.replace(/-/g,'')+'Perspective' in el.style;

    el=null;

    module.exports={
        has3d: has3d,
        anim: {
            addBottomStyle: function(bottom) {
                if(styles['bottom'+bottom]===true) return;
                styles['bottom'+bottom]=true;

                util.addStyle('.viewport .anim-bottom'+bottom+'-in { background-color:transparent; z-index: 2; -webkit-transition-duration: 0; -webkit-transform: translate(0,100%) translateZ(0); }.anim-bottom'+bottom+'-in.timer, .anim-in-timer { -webkit-transition: -webkit-transform 300ms ease 0ms; }.anim-bottom'+bottom+'-in.run { -webkit-transform: translate(0,0) translateZ(0); }.anim-bottom'+bottom+'-in.finish { -webkit-transform: translate(0,'+bottom+'px) translateZ(0); }.anim-bottom'+bottom+'-in.active { -webkit-transform: none; }.anim-bottom'+bottom+'-out {overflow:hidden;z-index: 0; -webkit-transition-duration: 0; -webkit-transform: translate(0,0) translateZ(0); }.anim-bottom'+bottom+'-out.run { -webkit-transform: translate(0,'+bottom+'px) translateZ(0); }.anim-bottom'+bottom+'-out.timer { -webkit-transition: -webkit-transform 300ms ease 0ms; }.anim-bottom'+bottom+'-out.stop { height: 0px; overflow: hidden; }.anim-bottom'+bottom+'-out.under { height: 0px; overflow: hidden; }');

                var style=null,
                    f=function() {
                        if(style!=null) {
                            style.parentNode.removeChild(style);
                            style=null;
                        }
                        style=util.addStyle('.anim-bottom'+bottom+'-in{overflow:hidden;-webkit-transform: translate(0,'+(window.innerHeight-bottom)+'px) translateZ(0);}.anim-bottom'+bottom+'-in .fixtop,.anim-bottom'+bottom+'-out .fixtop{margin-top:'+(window.innerHeight-bottom)+'px;}.anim-bottom'+bottom+'-in .fixHeight,.anim-bottom'+bottom+'-out .fixHeight{overflow:hidden;height:'+bottom+'px}');
                    };

                $(window).on('heightchange',function() {
                    f();
                });
                f();
            }
        }
    };
});
