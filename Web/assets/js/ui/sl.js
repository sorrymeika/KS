define('ui/sl',['zepto','util','app','ui/style','tmpl'],function(require,exports,module) {
    var $=require('zepto'),
        util=require('util'),
        app=require('app'),
        tmpl=require('tmpl'),
        style=require('ui/style');

    var blankFn=function() { },
        indexOf=function(array,key,compareItem) {
            if(typeof compareItem==='undefined') {
                compareItem=key;
                key=null;
            };
            var result= -1,
                value;
            $.each(array,function(i,item) {
                value=key!==null?item[key]:item;

                if(compareItem===value) {
                    result=i;
                    return false;
                }
            });
            return result;
        },
        lastIndexOf=function(array,key,compareItem) {
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
        slice=Array.prototype.slice,
        record=(function() {
            var data={},
                id=0,
                ikey='_gid';    // internal key.

            return function(obj,key,val) {
                var dkey=obj[ikey]||(obj[ikey]= ++id),
                    store=data[dkey]||(data[dkey]={});

                val!==undefined&&(store[key]=val);
                val===null&&delete store[key];

                return store[key];
            };
        })();

    var Route={
        routes: [],
        config: function(options) {
            var routes=this.routes;
            $.each(options,function(k,opt) {
                var parts=[],
                    routeOpt={};

                var reg='^(?:\/{0,1})'+k.replace(/(\/|^|\?){([^\/\?]+)}/g,function(r0,r1,r2) {
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
        match: function(url) {
            var result=null;

            $.each(this.routes,function(i,route) {
                var m=route.reg?url.match(route.reg):null;

                if(m) {
                    result={
                        url: m[0],
                        view: route.view,
                        data: {}
                    };
                    $.each(route.parts,function(i,name) {
                        result.data[name]=m[i+1];
                    });
                    return false;
                }
            });

            return result;
        }
    };

    exports.Route=Route;

    var Application=function(el) {
        var that=this;

        that.$el=$(el);
        that.el=that.$el[0];

        that.$el.delegate('a:not(.js-link-default)','tap click',function(e) {
            var target=$(e.currentTarget);

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
        });

        window.back=$.proxy(that.back,that);
    };

    var applicationFn=Application.fn=Application.prototype={
        useTransition: !/Android\s2/.test(navigator.userAgent),
        url: null,
        currentActivity: null,
        activities: [],
        history: [],
        _records: [],
        _recordIndex: -1,
        index: -1,
        _bindAttrs: [],
        $: function(selector) {
            if(typeof selector==="string"&&selector[0]=='#') {
                selector='[id="'+selector.substr(1)+'"]';
            }
            return $(selector,this.$el);
        },
        one: function(name,f) {
            this.$el.one(name,$.proxy(f,this));
            return this;
        },
        bind: function(name,f) {
            this._bindAttrs.push([name,f]);
            this.$el.bind(name,$.proxy(f,this));
            return this;
        },
        unbind: function(name,f) {
            var that=this,
                $el=that.$el;

            for(var i=that._bindAttrs.length-1,attrs;i>=0;i--) {
                attrs=that._bindAttrs[i];

                if(attrs[0]==name&&(typeof f==='undefined'||f===attrs[1])) {
                    $el.unbind.apply($el,attrs);
                    that._bindAttrs.splice(i,1);
                }
            }

            return this;
        },
        trigger: function() {
            var args=slice.call(arguments),
                name=args.shift();

            this.$el.triggerHandler(name,args);
            return this;
        },
        _isMatching: false,
        _matches: [],
        viewPath: 'views/',
        startURL: location.hash.replace('#','')||location.pathname+location.search,
        startPath: location.pathname+location.search,
        start: function() {
            var that=this;

            var startURL=this.startURL;

            this.bind('ActivityStart',function(e,activity) {
                that.url=activity.route.url;
                var currentActivity=that.currentActivity,
                    toOptions=that.toOptions,
                    easingIn=toOptions&&that.toOptions.easingIn,
                    easingOut=toOptions&&that.toOptions.easingOut;

                that.currentActivity=activity;
                delete that.toOptions;

                if(currentActivity) {
                    if(currentActivity.status=="destory") {
                        currentActivity.animateFinish();
                    } else {
                        currentActivity.pause();
                        activity.playUnderlayer(currentActivity);
                    }
                    activity.animateIn();
                }
            });

            that.mask=$('<div class="winheight" style="position:fixed;top:0px;bottom:0px;right:0px;width:100%;background:rgba(0,0,0,0);z-index:2000;display:none"></div>').on('tap click touchend touchmove touchstart',function(e) {
                e.preventDefault();
            }).appendTo('body');

            $(window).on('hashchange',function() {
                that.url=location.hash.replace(/^#/,'')||that.startPath||'/';

                if(lastIndexOf(that._records,that.url)== -1) {
                    that._records.push(that.url);
                } else {
                    that._records.length=lastIndexOf(that._records,that.url)+1;
                }

                console.log('_startActivity',that.url,that._records);

                that._startActivity(that.url);

            }).on('scroll',function() {
            });

            if(startURL!==that.startPath) {
                $('.view',that.$el).remove();
            }

            that.$el.addClass('active');

            that.url=startURL||'/';
            that._records.push(that.url);
            that._startActivity(that.url);

            console.log("app start",this._records,that.url);
        },
        _loadActivity: function(route) {
            var that=this,
                dfd=$.Deferred();

            that._isMatching=true;

            seajs.use(that.viewPath+route.view,function(activityClass) {
                var activity=new activityClass({
                    application: that,
                    route: route
                });

                that._add(activity);

                activity
                    .bind("Start",function() {
                        this.bind("Destory",function() {
                            var index=that.indexOf(this),
                                flag=that.length>1&&index!= -1&&index==that.length-1;

                            that._remove(this);
                            if(flag) {
                                that.get().resume();
                            } else {
                                this._destoryEnd();
                            }
                        }).bind("Resume",function() {
                            that._remove(this)._add(this);
                            that.trigger('ActivityStart',this);
                        });
                        that.trigger('ActivityStart',this);
                    })
                    .start();

                that._isMatching=false;
                that._matches.length&&that.to.apply(that,that._matches.shift());

                dfd.resolve();
            });

            return dfd;
        },
        _startActivity: function(url) {
            var that=this,
                index=that.indexOf(url);

            if(index== -1) {
                var route=Route.match(url);
                if(route) {
                    that._loadActivity(route);
                }
            } else {

                var currentActivity,count=0;
                for(var i=index+1,n=that.activities.length-1;i<=n;i++) {
                    activity=that.activities[i];
                    if(i==n) {
                        currentActivity=activity;

                        that.length-=count;
                        that.history.splice(index+1,count);
                        $.each(that.activities.splice(index+1,count),function(j,activity) {
                            activity.finish();
                        });
                    }
                    else {
                        count++;
                    }
                }

                currentActivity&&currentActivity.finish();
            }
        },
        length: 0,
        _dfdController: $.when(),
        getOrCreate: function(url,callback) {
            var that=this;

            that._dfdController=that._dfdController.then(function() {

                var activity=that.get(url);

                if(activity==null) {
                    var dfd=$.Deferred();

                    var route=Route.match(url);

                    seajs.use(that.viewPath+route.view,function(ActivityClass) {
                        var activity=new ActivityClass({
                            application: that,
                            route: route
                        });

                        activity.bind("Start",function() {
                            this.bind("Destory",function() {
                                var index=that.indexOf(this),
                                    flag=that.length>1&&index!= -1&&index==that.length-1;

                                that._remove(this);
                                if(flag) {
                                    that.get().resume();
                                } else {
                                    this._destoryEnd();
                                }
                            }).bind("Resume",function() {
                                that._remove(this)._add(this);
                                that.trigger('ActivityStart',this);
                            });
                            that.trigger('ActivityStart',this);
                        });

                        that._add(activity);

                        callback.call(that,activity);

                        dfd.resolve();
                    });

                    return dfd;

                } else
                    callback.call(that,activity);
            });
        },
        get: function(url) {
            var index=typeof url==='undefined'?this.length-1:typeof url=="number"?url:this.indexOf(url);
            return (index== -1||index>=this.activities.length)?null:this.activities[index];
        },
        indexOf: function(url) {
            return indexOf(typeof url==='string'?this.history:this.activities,url);
        },
        _remove: function(url) {
            var that=this;
            var index=(typeof url=="number")?url:that.indexOf(url);

            if(index!= -1) {
                that.activities.splice(index,1);
                that.history.splice(index,1);
                that.length--;
            }
            return that;
        },
        _add: function(activity) {
            var that=this,
                isInsert=false;

            that.activities.push(activity);
            that.history.push(activity.route.url);

            that.length++;
            return that;
        },
        to: function(url,options) {
            var that=this;

            url=url.replace(/^#/,'')||that.startURL;

            if(this._isMatching) {
                var args=slice.call(arguments);

                if(indexOf(this._matches,0,args[0])== -1)
                    this._matches.push(args);
                return;
            }

            if(this.url==url) return;

            this.toOptions=$.extend({
                easingIn: null,
                easingOut: null
            },options);

            var records=this._records,
                newUrlIndex=lastIndexOf(records,url),
                urlIndex=lastIndexOf(records,this.url);

            this.url=url;

            if(that.useTransition) {
                that.saveScroll();
            }

            if(newUrlIndex== -1) {
                records.splice(urlIndex+1,0,url);
                records.length=urlIndex+2;
                location.hash=url;
            } else {
                history.go(newUrlIndex-urlIndex);
            }
        },
        saveScroll: function() {
            var that=this,
                me=that.currentActivity,
                innerHeight=window.innerHeight,
                scrollY=window.scrollY,
                top=util.s2i(me.$el.css('top'))||0,
                marginBottom=me.$el.css('marginBottom')||"";

            me.$el.attr({ 'amin-temp-top': top,'amin-temp-margin-bottom': marginBottom,'amin-temp-scrolltop': scrollY }).css({ top: top-scrollY,height: innerHeight+scrollY-top,marginBottom: top-scrollY });
            me.$('header').css({ top: scrollY+'px',position: 'absolute' });
            me.$('footer').css({ position: 'absolute' });

            that.$el.css({ height: innerHeight }).attr('amin-temp-scrolltop',scrollY);
            that.el.clientHeight;
        },
        back: function() {
            var that=this,
                records=that._records;

            if(that.length>1) {
                if(that.useTransition) {
                    that.saveScroll();
                }
                var index=lastIndexOf(records,that.url);
                if(index!= -1) records.length=index;

                history.back();
            }
            else {
            }
            return that;
        }
    };

    var isActivityStart=false;

    var Activity=function(options) {
        var me=this;

        if(!me._options)
            me._options=options=$.extend({
                application: null,
                route: null
            },options);

        me.route=options.route;
        me.application=options.application;
        me.useTransition=me.application.useTransition;
        me.$viewport=options.application.$el;

        me.$el=!isActivityStart&&$('.view',me.$viewport).length
            ?$('.view',me.$viewport).addClass(me.className+' '+me.animateInClassName+' run active timer')
            :$('<div class="'+me.className+'"></div>').addClass(me.animateInClassName+(!isActivityStart?' run active timer':'')).appendTo(me.$viewport);

        me.el=me.$el[0];

        if(!me.useTransition) me.el.style['-webkit-transition']='none';

        me.bind('Destory',me.onDestory);
        me.bind('Resume',me.onResume);
        me.bind('Start',me.onStart);
        me.bind('Pause',me.onPause);
        me.bind('Active',me.onActive);

        me.status="init";

        if(me.events) {
            $.each(me.events,function(evt,f) {
                var arr=evt.split(' '),
                    events=arr.shift();

                events=events.replace(/,/g,' ');

                f=$.isFunction(f)?f:me[f];

                if(arr.length>0&&arr[0]!=='') {
                    me._bind(arr.join(' '),events,f);
                } else {
                    me.bind(events,f);
                }
            });
        }
        me.initDfd=me.init();

        isActivityStart=true;
    };

    var activityFn=Activity.fn=Activity.prototype={
        events: {
            'touchstart [hl]': function(e) {
                var firstTouch=e.touches[0];
                this._hf_startX=firstTouch.pageX;
                this._hf_startY=firstTouch.pageY;
                this._elHl=$(e.currentTarget).addClass('active');
            },
            'touchmove header,footer': function(e) {
                e.preventDefault();
            },
            'touchmove': function(e) {
                this._elHl&&(Math.abs(e.touches[0].pageX-this._hf_startX)>10||Math.abs(e.touches[0].pageY-this._hf_startY)>10)&&(this._elHl.removeClass('active'),this._elHl=null);
            },
            'touchend,touchcancel': function(e) {
                this._elHl&&this._elHl.removeClass('active');
                this._elHl=null;
            },
            'tap [data-href]': function(e) {
                this.to($(e.currentTarget).attr('data-href'));
            }
        },
        className: 'view',
        _bindDelegateAttrs: [],
        _bindAttrs: [],
        _bindResults: [],
        _bind: function(el,name,f) {
            this._bindDelegateAttrs.push([el,name,f]);
            this.$el.delegate(el,name,$.proxy(f,this));
        },
        listenToResult: function(name,f) {
            name='result_'+name;
            this._bindResults.push([name,f]);
            this.$viewport.bind(name,$.proxy(f,this));
        },
        setResult: function() {
            var args=slice.call(arguments);
            this.$viewport.trigger('result_'+args.shift(),args);
        },
        one: applicationFn.one,
        bind: applicationFn.bind,
        unbind: applicationFn.unbind,
        trigger: applicationFn.trigger,
        $: applicationFn.$,
        init: blankFn,
        onCreate: blankFn,
        onStart: blankFn,
        onBeforeResume: blankFn,
        onActive: blankFn,
        onResume: blankFn,
        onPause: blankFn,
        onDestory: blankFn,
        _resetHeight: function() {
            this.$viewport.css({ height: '0' });
            this.$el.css({ height: '0' });
            this.el.clientHeight;
            this.$viewport[0].clientHeight;
            this.$viewport.css({ height: '' });
            this.$el.css({ height: '' });
        },
        //处理上一个activity
        playUnderlayer: function(underlayer) {
            underlayer.animateOut();
        },
        _transitionTime: function(time) {
            time+='ms';
            this.el.style['-webkit-transition-duration']=time;
        },
        animateInClassName: 'anim-in',
        animateOutClassName: 'anim-out',
        animateIn: function() {
            var that=this,
                innerHeight=window.innerHeight;

            if(!that.el.parentNode) {
                that.$el.appendTo(that.$viewport);
                that.el.clientHeight;
            }

            if(that.useTransition) {

                that.application.mask.show();
                that.$viewport.addClass("screen");

                that.$el.one($.fx.transitionEnd,function() {
                    that.$viewport.removeClass("screen");
                    var top=that.$el.attr('amin-temp-top'),
                        scrollTop=parseInt(that.$el.attr('amin-temp-scrolltop'));
                    if(top!=null) {
                        that.$el.css({ top: top,height: '',marginBottom: that.$el.attr('amin-temp-margin-bottom') }).removeAttr('amin-temp-top').removeAttr('amin-temp-scrolltop').removeAttr('amin-temp-margin-bottom');
                        that._resetHeight();
                        window[$.isFunction(window.scrollTo)?'scrollTo':'scroll'](0,scrollTop||0);
                        that.$viewport.attr('amin-temp-scrolltop',0);
                    } else {
                        that._resetHeight();
                    }
                    that.$el.removeClass('timer').addClass('active');
                    that.el.clientHeight;
                    that.$('header,footer').each(function() {
                        this.style.cssText="";
                    });

                    that.$el.addClass('timer');
                    that.application.mask.hide();
                });

                if(!that.$el.hasClass(that.animateInClassName)) {
                    that.$el.removeClass('timer').addClass(that.animateInClassName+'-timer');
                    that.el.clientHeight;
                    that.el.className=that.className+" "+that.animateInClassName+" timer run";

                } else {
                    that.el.className=that.className+" "+that.animateInClassName+" timer";
                    that.$el.css({ height: innerHeight });
                    that.$('footer').css({ position: 'absolute' });
                    that.el.clientHeight;

                    that.$el.addClass("run");
                }

            } else {
                that.el.className=that.className+" "+that.animateInClassName+" run active";
                that._resetHeight();

                that.$('footer').css({ position: '' });
            }

        },
        animateOut: function() {
            var that=this;

            if(that.useTransition) {
                if(that.$el.attr('amin-temp-top')==null) {
                    var scrollY=that.$viewport.attr('amin-temp-scrolltop')||window.scrollY,
                        innerHeight=window.innerHeight,
                        top=parseInt(that.$el.css('top'))||0,
                        marginBottom=that.$el.css('margin-bottom')||'';

                    that.$el.attr({ 'amin-temp-top': top,'amin-temp-margin-bottom': marginBottom,'amin-temp-scrolltop': scrollY }).css({ top: top-scrollY,height: innerHeight+(scrollY-top),marginBottom: marginBottom });
                    that.$('header').css({ top: scrollY+'px',position: 'absolute' });
                    that.$('footer').css({ position: 'absolute' });
                }

                that.el.className=that.className+" "+that.animateOutClassName+" timer";
                that.el.clientHeight;
                that.$el.one($.fx.transitionEnd,function() {
                    that.$el.addClass('stop');
                    that.$el.remove();

                }).addClass("run");

            } else {
                that.el.className=that.className+" "+that.animateOutClassName+" stop";
                that.$('footer').css({ position: 'absolute' });
                that.$el.remove();
            }

        },
        animateFinish: function() {
            var that=this,
                scrollY=window.scrollY,
                innerHeight=window.innerHeight;
            if(that.useTransition) {

                var top=parseInt(this.$el.css('top'));

                this.$viewport.css({ height: innerHeight });

                this.$el.one($.fx.transitionEnd,function() {
                    that._destoryEnd();

                }).removeClass('active').addClass("finish");

            } else {
                that._destoryEnd();
            }

        },
        _destoryEnd: function() {
            this.$viewport.css({ height: '' });
            this.$el.remove();
            this.$el=null;
            this.el=null;
            this.application=null;
            this.$viewport=null;
        },
        start: function() {
            var that=this;
            that.status="start";
            that.trigger('Start');

            $.when(that.initDfd)
                .then($.proxy(that.onCreate,that))
                .then(function() {
                    that.trigger('Active');
                });
        },
        pause: function() {
            var that=this;
            that.status="pause";
            that.trigger('Pause');
        },
        destory: function() {
            var $el=this.$el,
                that=this;

            that.status="destory";

            $.each(this._bindDelegateAttrs,function(i,attrs) {
                $el.undelegate.apply($el,attrs);
            });

            $.each(this._bindResults,function(i,attrs) {
                that.$viewport.unbind.apply(that.$viewport,attrs);
            });

            this.one('Destory',function() {
                $.each(that._bindAttrs,function(i,attrs) {
                    $el.unbind.apply($el,attrs);
                });
            });
            this.trigger('Destory');
        },
        resume: function() {
            this.trigger('Resume');
            this.trigger('Active');
        },
        finish: function() {
            this.status="finish";
            this.destory();
        },
        back: function() {
            this.application.back();
        },
        to: function(url,options) {
            this.application.to(url,options);
        },
        _loading: function(msg) {
            if(!this.$loading) this.$loading=$('<div class="dataloading"><div class="msg"></div></div>').appendTo(this.$el);

            var loading=this.$loading;

            if(msg===false||msg==="hide") {
                loading.hide();
            } else if(typeof msg==='undefined') {
                loading.removeClass('loading-error').show();
            } else {
                loading.addClass('loading-error').find('.msg').html(msg);
            }
            return this;
        }
    };

    var View=function(selector,options) {
        var me=this;


        if(me.template&&!options) {
            options=selector;
            me.options=$.extend({},me.options,options);

            selector=tmpl(me.template,me.options);
        } else
            me.options=$.extend({},me.options,options);

        me.$el=$(selector);
        me.el=me.$el[0];

        if(me.events) {
            $.each(me.events,function(evt,f) {
                me.listen(evt,f);
            });
        }
        me.init();
    };

    View.fn=View.prototype={
        template: '',
        options: {},
        events: null,
        _bindDelegateAttrs: [],
        _bindAttrs: [],
        _bindResults: [],
        _bind: function(el,name,f) {
            this._bindDelegateAttrs.push([el,name,f]);
            this.$el.delegate(el,name,$.proxy(f,this));

            return this;
        },
        listen: function(evt,f) {
            var that=this,
                arr=evt.split(' '),
                events=arr.shift();

            events=events.replace(/,/g,' ');

            f=$.isFunction(f)?f:that[f];

            if(arr.length>0&&arr[0]!=='') {
                that._bind(arr.join(' '),events,f);
            } else {
                that.bind(events,f);
            }

            return that;
        },
        listenToResult: function(name,f) {
            name='result_'+name;
            this._bindResults.push([name,f]);
            $(document).bind(name,$.proxy(f,this));
        },
        setResult: function() {
            var args=slice.call(arguments);
            $(document).trigger('result_'+args.shift(),args);
        },
        one: applicationFn.one,
        on: function(selector,evt,handler) {
            if(handler) {
                this._bind(selector,evt,handler);
            } else {
                this.bind(selector,evt);
            }
            return this;
        },
        bind: applicationFn.bind,
        unbind: applicationFn.unbind,
        trigger: applicationFn.trigger,
        $: applicationFn.$,
        init: blankFn,
        destory: function() {
            var $el=this.$el,
                that=this;

            $.each(this._bindDelegateAttrs,function(i,attrs) {
                $el.undelegate.apply($el,attrs);
            });

            $.each(this._bindResults,function(i,attrs) {
                $(document).unbind.apply($(document),attrs);
            });

            this.one('Destory',function() {
                $.each(that._bindAttrs,function(i,attrs) {
                    $el.unbind.apply($el,attrs);
                });
            });
            this.trigger('Destory');
        }
    };

    Application.extend=Activity.extend=View.extend=function(prop) {
        var that=this;

        var childClass=function() {
            that.apply(this,slice.call(arguments));
        };

        childClass.fn=childClass.prototype=$.extend({},that.prototype,prop,{
            superClass: that.prototype
        });

        childClass.fn.options=$.extend({},that.prototype.options,childClass.fn.options);
        childClass.fn.events=$.extend({},that.prototype.events,childClass.fn.events);

        childClass.extend=arguments.callee;

        return childClass;
    };

    var Tip=function(text) {
        this._tip=$('<div class="tip" style="display:none">'+(text||'')+'</div>').appendTo('body');
    };

    Tip.prototype={
        _hideTimer: null,
        _clearHideTimer: function() {
            var me=this;
            if(me._hideTimer) {
                clearTimeout(me._hideTimer);
                me._hideTimer=null;
            }
        },
        _visible: false,
        show: function(msec) {

            var me=this,
                tip=me._tip;

            me._clearHideTimer();

            if(msec)
                me._hideTimer=setTimeout(function() {
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
        hide: function() {
            var me=this,
                tip=me._tip;

            if(!me._visible) {
                return;
            }
            me._visible=false;

            tip.animate({
                scale: ".2,.2",
                opacity: 0
            },200,'ease-in',function() {
                tip.hide().css({
                    '-webkit-transform': 'scale(1,1)'
                })
            });

            me._clearHideTimer();
            return me;
        },
        text: function(msg) {
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

    function simplelize(Class,defaultFunc) {

        return function() {
            var one=Class._static,
                args=slice.apply(arguments);

            if(!one) one=Class._static=new Class();

            if(!args.length) return one;

            var actionName=args.shift()+'',
                action;

            $.each(one,function(name,val) {
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

    function zeptolize(name,Class) {
        var key=name.substring(0,1).toLowerCase()+name.substring(1),
            old=$.fn[key];

        $.fn[key]=function(opts) {
            var args=slice.call(arguments,1),
                method=typeof opts==='string'&&opts,
                ret,
                obj;

            $.each(this,function(i,el) {

                // 从缓存中取，没有则创建一个
                obj=record(el,name)||record(el,name,new Class(el,$.isPlainObject(opts)?opts:undefined));

                // 取实例
                if(method==='this') {
                    ret=obj;
                    return false;    // 断开each循环
                } else if(method) {

                    // 当取的方法不存在时，抛出错误信息
                    if(!$.isFunction(obj[method])) {
                        throw new Error('组件没有此方法：'+method);
                    }

                    ret=obj[method].apply(obj,args);

                    // 断定它是getter性质的方法，所以需要断开each循环，把结果返回
                    if(ret!==undefined&&ret!==obj) {
                        return false;
                    }

                    // ret为obj时为无效值，为了不影响后面的返回
                    ret=undefined;
                }
            });

            return ret!==undefined?ret:this;
        };

        /*
        * NO CONFLICT
        * var gmuPanel = $.fn.panel.noConflict();
        * gmuPanel.call(test, 'fnname');
        */
        $.fn[key].noConflict=function() {
            $.fn[key]=old;
            return this;
        };
    };

    var sl={
        Route: Route,
        View: View,
        Application: Application,
        Activity: Activity,
        anim: style.anim,
        has3d: style.has3d,
        indexOf: indexOf,
        lastIndexOf: lastIndexOf,
        tip: simplelize(Tip,function(actionName) {
            this.text(actionName).show(3000);
        }),
        common: {},
        _loading: null,
        loading: function(msg) {
            if(!this._loading) this._loading=$('<div id="dataloading" class="dataloading"><div class="msg"></div></div>').appendTo('body');

            loading=this._loading;

            if(msg===false||msg==="hide") {
                loading.hide();
            } else if(typeof msg==='undefined') {
                loading.removeClass('loading-error').show();
            } else {
                loading.addClass('loading-error').find('.msg').html(msg);
            }
            return this;
        },
        zeptolize: zeptolize,
        simplelize: simplelize
    };

    module.exports=sl;
});
