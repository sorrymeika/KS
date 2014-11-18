define(['$','util','app','./tmpl','./view','./style','./plugins/template'],function (require,exports,module) {

    var $=require('$'),
        util=require('util'),
        app=require('app'),
        sl=require('./base'),
        tmpl=require('./tmpl'),
        view=require('./view'),
        style=require('./style'),
        plugin=require('./plugins/template');

    var noop=sl.noop,
        indexOf=function (array,key,compareItem) {
            if(typeof compareItem==='undefined') {
                compareItem=key;
                key=null;
            };
            var result= -1,
                value;
            $.each(array,function (i,item) {
                value=key!==null?item[key]:item;

                if(compareItem===value) {
                    result=i;
                    return false;
                }
            });
            return result;
        },
        lastIndexOf=function (array,key,compareItem) {
            if(typeof compareItem==='undefined') {
                compareItem=key;
                key=null;
            };
            var result= -1,
                value;

            for(var i=array.length-1;i>=0;i--) {
                var item=array[i];
                value=key!==null?item[key]:item;

                if(compareItem===value) {
                    result=i;
                    break;
                }
            }

            return result;
        },
        getUrlPath=function (url) {
            var index=url.indexOf('?');
            if(index!= -1) {
                url=url.substr(0,index);
            }
            return url.toLowerCase();
        },
        slice=Array.prototype.slice,
        simplelize=function (Class,defaultFunc) {

            return function () {
                var one=Class._static,
                args=slice.apply(arguments);

                if(!one) one=Class._static=new Class();

                if(!args.length) return one;

                var actionName=args.shift()+'',
                action;

                $.each(one,function (name,val) {
                    if(name==actionName) {
                        action=val;
                        return false;
                    }
                });

                if($.isFunction(action)) {
                    action.apply(one,args);
                } else {
                    defaultFunc&&defaultFunc.call(one,actionName);
                }
                return this;
            }
        };

    var Application=view.extend({
        events: {
            'tap,click a:not(.js-link-default)': function (e) {
                var that=this,
                    target=$(e.currentTarget);

                if(!/http\:|javascript\:|mailto\:/.test(target.attr('href'))) {
                    e.preventDefault();
                    if(e.type=='tap') {
                        var href=target.attr('href');
                        if(!/^#/.test(href)) href='#'+href;
                        that.to(href);
                    }

                } else {
                    target.addClass('js-link-default');
                }

                return false;
            },
            'tap [data-href]': function (e) {
                var that=this,
                    target=$(e.currentTarget);

                if(!/http\:|javascript\:|mailto\:/.test(target.attr('data-href'))) {
                    that.to(target.attr('data-href'));
                }
            },
            'tap [data-back]': function (e) {
                this._currentActivity.back($(e.currentTarget).attr('data-back'));
            },
            'tap [data-forward]': function (e) {
                this._currentActivity.forward($(e.currentTarget).attr('data-forward'));
            },
            'touchstart [hl]': function (e) {
                var firstTouch=e.touches[0];
                this._hf_startX=firstTouch.pageX;
                this._hf_startY=firstTouch.pageY;
                this._elHl=$(e.currentTarget).addClass('active');
            },
            'touchmove header,footer': function (e) {
                e.preventDefault();
            },
            'touchmove': function (e) {
                this._elHl&&(Math.abs(e.touches[0].pageX-this._hf_startX)>10||Math.abs(e.touches[0].pageY-this._hf_startY)>10)&&(this._elHl.removeClass('active'),this._elHl=null);
            },
            'touchend,touchcancel': function (e) {
                this._elHl&&this._elHl.removeClass('active');
                this._elHl=null;
            }
        },

        el: '<div class="viewport"></div>',

        routes: [],
        mapRoute: function (options) {
            var routes=this.routes;
            $.each(options,function (k,opt) {
                var parts=[],
                    routeOpt={};

                var reg='^(?:\/{0,1})'+k.replace(/(\/|^|\?){([^\/\?]+)}/g,function (r0,r1,r2) {
                    var ra=r2.split(':');

                    if(ra.length>1) {
                        parts.push(ra.shift());
                        r2=ra.join(':');
                    }

                    return r1.replace('?','\\?*')+'('+r2+')';
                })+'$';

                routeOpt={
                    reg: new RegExp(reg),
                    parts: parts
                };
                if(typeof opt==='string') {
                    routeOpt.view=opt;
                } else {
                    routeOpt.view=opt.view;
                }
                routes.push(routeOpt);
            });
        },
        matchRoute: function (url) {
            var result=null,
                queries={},
                hash=url.replace(/^#/,'');

            url=hash;

            var index=url.indexOf('?');
            var query;
            if(index!= -1) {
                query=url.substr(index+1);

                url=url.substr(0,index);

                query.replace(/(?:^|&)([^=&]+)=([^=&]*)/g,function (r0,r1,r2) {
                    queries[r1]=decodeURIComponent(r2);
                    return '';
                })
            } else {
                query='';
            }

            $.each(this.routes,function (i,route) {
                var m=route.reg?url.match(route.reg):null;

                if(m) {
                    result={
                        url: m[0],
                        hash: hash,
                        view: route.view,
                        data: {},
                        queryString: query,
                        query: queries
                    };
                    $.each(route.parts,function (i,name) {
                        result.data[name]=m[i+1];
                    });
                    return false;
                }
            });

            return result;
        },

        initialize: function () {
            var that=this;

            that.mask=$('<div class="screen" style="position:fixed;top:0px;bottom:0px;right:0px;width:100%;background:rgba(0,0,0,0);z-index:2000;display:none"></div>').on('tap click touchend touchmove touchstart',function (e) {
                e.preventDefault();
            }).appendTo(document.body);
        },

        skip: 0,
        _history: [],
        _historyCursor: -1,
        _currentActivity: null,

        start: function () {
            var that=this;

            that.hash=location.hash.replace(/^#/,'');

            that._getOrCreateActivity(that.hash,function (activity) {
                that._currentActivity=activity;
                that._history.push(activity.hash);
                that._historyCursor++;
                activity.$el.appendTo(that.$el);
                activity.trigger('Resume');
                activity.trigger('Show');
            });

            $(window).on('hashchange',function () {
                that.hash=location.hash.replace(/^#/,'');

                var index=lastIndexOf(that._history,that.hash),
                    isForward=that._skipRecordHistory||index== -1;

                if(that._skipRecordHistory!==true) {
                    if(index== -1) {
                        that._history.push(that.hash);
                        that._historyCursor++;
                    } else {
                        that._history.length=index+1;
                        that._historyCursor=index;
                    }
                } else
                    that._skipRecordHistory=false;


                if(that.skip==0) {
                    that._currentActivity[isForward?'forward':'back'](that.hash);

                } else if(that.skip>0)
                    that.skip--;
                else
                    that.skip=0;
            });

            that.$el.appendTo(document.body);
        },

        to: function (url) {
            url=url.replace(/^#/,'');

            var that=this,
                activity=that._currentActivity,
                index=lastIndexOf(that._history,url);

            if(!activity.compareUrl(url)) {
                activity.prepareExitAnimation();
            }

            if(index== -1) {
                that._history.splice(that._historyCursor+1,0,url);
                that._history.length=that._historyCursor+2;
                that._historyCursor++;
                that._skipRecordHistory=true;
                location.hash=url;

            } else {
                history.go(index-that._historyCursor);
            }
        },

        navigate: function (url) {
            this.skip++;
            this.to(url);
        },

        _activities: {},

        get: function (url) {
            return this._activities[getUrlPath(url)];
        },

        set: function (url,activity) {
            this._activities[getUrlPath(url)]=activity;
        },

        remove: function (url) {
            this._activities[getUrlPath(url)]=undefined;
        },

        siblings: function (url,url1) {
            $.each(this._activities,function (k,activity) {
                if(typeof activity!=='undefined'&&k!=url&&k!=url1) {
                    activity.$el.addClass('stop');
                }
            });
        },

        viewPath: 'views/',

        _getOrCreateActivity: function (url,callback) {
            var that=this,
                route=that.matchRoute(url);

            if(!route) return;

            var activity=that.get(route.url);

            if(activity==null) {
                seajs.use(that.viewPath+route.view,function (ActivityClass) {
                    activity=new ActivityClass({
                        application: that,
                        route: route
                    });
                    that.set(route.url,activity);
                    callback.call(that,activity,route);
                });

            } else {
                callback.call(that,activity,route);
            }
        }
    });

    var Activity=view.extend({
        options: {
            route: null
        },
        useAnimation: !/Android\s2/.test(navigator.userAgent),
        animationName: null,
        application: null,
        el: '<div class="view"></div>',

        _setRoute: function (route) {
            this.route=route;
            this.hash=route.hash;
            this.url=route.url;
        },

        initialize: function () {
            var that=this;

            that.className&&that.$el.addClass(that.className);
            that.className=that.el.className;

            that._setRoute(that.options.route);
            that.application=that.options.application;

            that.bind('Start',that.onStart);
            that.bind('Resume',that.onResume);
            that.bind('Show',that.onShow);
            that.bind('Pause',that.onPause);
            that.bind('Destory',that.onDestory);
            that.bind('QueryChange',that.onQueryChange);

            $.when(that.options.templateEnabled&&that.initWithTemplate())
                .then($.proxy(that.onCreate,that))
                .then(function () {
                    that.trigger('Start');
                });
        },
        onCreate: noop,
        onStart: noop,
        onResume: noop,

        //进入动画结束时触发
        onShow: noop,

        onStop: noop,
        onRestart: noop,

        //离开动画结束时触发
        onPause: noop,

        onQueryChange: noop,

        isPrepareExitAnimation: false,
        prepareExitAnimation: function () {
            if(this.isPrepareExitAnimation) return;
            this.isPrepareExitAnimation=true;

            var that=this,
                innerHeight=window.innerHeight,
                scrollY=window.scrollY,
                top=util.s2i(that.$el.css('top'))||0,
                marginBottom=that.$el.css('marginBottom')||"";

            that.$el.attr({
                'anim-temp-top': top,
                'anim-temp-margin-bottom': marginBottom,
                'anim-temp-scrolltop': scrollY
            }).css({
                top: top-scrollY,
                height: innerHeight+scrollY-top,
                marginBottom: top-scrollY,
                overflow: 'hidden'
            });

            if(that.useAnimation) {
                that.$('header').css({ top: scrollY+'px',position: 'absolute' });
                that.$('footer').css({ position: 'absolute' });
            }
            that.application.mask.show();
            that.application.$el.addClass("screen");
        },

        finishEnterAnimation: function () {
            var that=this,
                top=that.$el.attr('anim-temp-top'),
                scrollTop=parseInt(that.$el.attr('anim-temp-scrolltop'));

            if(top!=null) {
                that.$el.css({ top: top,height: '',marginBottom: that.$el.attr('anim-temp-margin-bottom'),overflow: '' }).removeAttr('anim-temp-top').removeAttr('anim-temp-scrolltop').removeAttr('anim-temp-margin-bottom');
                window[$.isFunction(window.scrollTo)?'scrollTo':'scroll'](0,scrollTop||0);
            }

            if(that.useAnimation) {
                that.$el.addClass('active');
                that.$('header,footer').each(function () {
                    this.style.cssText="";
                });
            }
            that.application.mask.hide();
            that.application.$el.removeClass("screen");
            that.application.el.clientHeight;

            that.isPrepareExitAnimation=false;
            that.trigger('Show');
        },

        compareUrl: function (url) {
            return getUrlPath(url)===this.route.url.toLowerCase();
        },

        //onShow后才可调用
        redirect: function (url) {
            var that=this,
                application=that.application;

            application._getOrCreateActivity(url,function (activity,route) {
                activity.el.className=activity.className+' active';
                application.$el.append(activity.$el);
                application._currentActivity=activity;
                that.$el.remove();
                that.trigger('Pause');
                activity.trigger('Resume');
                activity.trigger('Show');
            });
        },

        _transitionTime: function (time) {
            this.el.style['-webkit-transition-duration']=(time||0)+'ms';
        },

        _animationFrom: function (name,type) {
            this.el.className=this.className+' '+(name?name+'-':'')+type;
        },

        _animationTo: function (name,type) {
            this.$el.addClass((name?name+'-':'')+type);
        },

        _to: function (url,duration,animationName,type,callback) {
            if(!duration) duration=400;

            var that=this,
                application=that.application;

            if(url.toLowerCase()!=location.hash.replace(/^#/,'').toLowerCase()) {
                application.navigate(url);
            }

            application._getOrCreateActivity(url,function (activity,route) {
                animationName=animationName||(type=='open'?activity:that).animationName;

                if(activity.route.hash!=route.hash) {
                    activity._setRoute(route);
                    activity.trigger('QueryChange');
                }

                if(activity.url==that.url) {
                    return;
                }

                that.application.siblings(route.url,that.url);

                that.prepareExitAnimation();

                activity.$el.appendTo(application.$el);

                application._currentActivity=activity;

                activity.trigger('Resume');
                if(that.useAnimation) {
                    activity._animationFrom(animationName,type+'_enter_animation-from');
                    that._animationFrom(animationName,type+'_exit_animation-from');
                    that.el.clientHeight;

                    that._transitionTime(duration);
                    activity._transitionTime(duration);

                    var isTransitionEnd=false;
                    $(activity.$el).add(that.$el).one($.fx.transitionEnd,function () {
                        if(isTransitionEnd) return;
                        isTransitionEnd=true;
                        that._transitionTime(0);
                        activity._transitionTime(0);
                        activity.finishEnterAnimation();
                        callback&&callback(activity);
                    });
                    that._animationTo(animationName,type+'_exit_animation-to');
                    activity._animationTo(animationName,type+'_enter_animation-to');

                } else {
                    activity.finishEnterAnimation();
                    callback&&callback(activity);
                }
            });
        },

        forward: function (url,duration,animationName) {
            var that=this;

            that._to(url,duration,animationName,'open',function () {
                that.trigger('Pause');
            });
        },

        back: function (url,duration,animationName) {
            var that=this;

            if(typeof url=='undefined') {
                that.prepareExitAnimation();
                history.back();

            } else {
                if(typeof duration==='string') {
                    animationName=duration;
                    duration=null;
                }

                that._to(url,duration,animationName,'close',function () {
                    that.destory();
                });
            }
        },

        finish: function () {
            this.destory();
        },

        destory: function () {
            this.application.remove(this.url);
            view.fn.destory.apply(this,arguments);
        }
    });

    plugin(Activity);

    var Tip=function (text) {
        this._tip=$('<div class="tip" style="display:none">'+(text||'')+'</div>').appendTo('body');
    };

    Tip.prototype={
        _hideTimer: null,
        _clearHideTimer: function () {
            var me=this;
            if(me._hideTimer) {
                clearTimeout(me._hideTimer);
                me._hideTimer=null;
            }
        },
        _visible: false,
        show: function (msec) {

            var me=this,
                tip=me._tip;

            me._clearHideTimer();

            if(msec)
                me._hideTimer=setTimeout(function () {
                    me._hideTimer=null;
                    me.hide();
                },msec);

            if(me._visible) {
                return;
            }
            me._visible=true;

            tip.css({
                '-webkit-transform': 'scale(0.2,0.2)',
                display: 'block',
                visibility: 'visible',
                opacity: 0
            }).animate({
                scale: "1,1",
                opacity: 0.9
            },200,'ease-out');

            return me;
        },
        hide: function () {
            var me=this,
                tip=me._tip;

            if(!me._visible) {
                return;
            }
            me._visible=false;

            tip.animate({
                scale: ".2,.2",
                opacity: 0
            },200,'ease-in',function () {
                tip.hide().css({
                    '-webkit-transform': 'scale(1,1)'
                })
            });

            me._clearHideTimer();
            return me;
        },
        text: function (msg) {
            var me=this,
                tip=me._tip;

            tip.html(msg).css({
                '-webkit-transform': 'scale(1,1)',
                '-webkit-transition': ''
            });

            if(tip.css('display')=='none') {
                tip.css({
                    visibility: 'hidden',
                    display: 'block',
                    marginLeft: -1000
                });
            }

            tip.css({
                marginTop: -1*tip.height()/2,
                marginLeft: -1*tip.width()/2
            });
            return me;
        }
    };

    $.extend(sl,{
        Application: Application,
        Activity: Activity,
        indexOf: indexOf,
        lastIndexOf: lastIndexOf,
        tip: simplelize(Tip,function (actionName) {
            this.text(actionName).show(3000);
        }),
        common: {},
        noop: noop,
        simplelize: simplelize
    });

    module.exports=sl;
});
