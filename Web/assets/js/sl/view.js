define(function (require,exports,module) {

    var $=require('$'),
        sl=require('./base'),
        Event=require('./event'),
        tmpl=require('./tmpl'),
        slice=Array.prototype.slice,
        record=(function () {
            var data={},
                id=0,
                ikey='_gid';    // internal key.

            return function (obj,key,val) {
                var dkey=obj[ikey]||(obj[ikey]= ++id),
                    store=data[dkey]||(data[dkey]={});

                val!==undefined&&(store[key]=val);
                val===null&&delete store[key];

                return store[key];
            };
        })(),
        zeptolize=function (name,Class) {
            var key=name.substring(0,1).toLowerCase()+name.substring(1),
            old=$.fn[key];

            $.fn[key]=function (opts) {
                var args=slice.call(arguments,1),
                method=typeof opts==='string'&&opts,
                ret,
                obj;

                $.each(this,function (i,el) {

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

            $.fn[key].noConflict=function () {
                $.fn[key]=old;
                return this;
            };
        };

    var View=sl.Class.extend(function () {
        var that=this,
            options,
            args=slice.call(arguments),
            selector=args.shift();

        if(typeof selector!=='undefined'&&!$.isPlainObject(selector)) {

            that.$el=$(selector);
            options=args.shift();

        } else if(!that.$el) {
            that.$el=$(that.el);
            options=selector;
        }

        if(options&&options.override) {
            var overrideFn;
            $.each(options.override,function (key,fn) {
                overrideFn=that[key];
                (typeof overrideFn!='undefined')&&(that.sealed[key]=overrideFn,fn.sealed=overrideFn);
                that[key]=fn;
            });
            delete options.override;
        }

        that.options=$.extend({},that.options,options);
        that._bindDelegateAttrs=[];
        that._bindAttrs=[];
        that._bindListenTo=[];

        that.el=that.$el[0];

        that.listen(that.events);
        that.listen(that.options.events);

        that.initialize.apply(that,args);
        that.options.initialize&&that.options.initialize.apply(that,args);

        that.on('Destory',that.onDestory);

    },{
        $el: null,
        template: '',
        sealed: {},
        options: {},
        events: null,
        _bind: function (el,name,f) {
            this._bindDelegateAttrs.push([el,name,f]);
            this.$el.delegate(el,name,$.proxy(f,this));

            return this;
        },
        _listenEvents: function (events) {
            var that=this;

            events&&$.each(events,function (evt,f) {
                that.listen(evt,f);
            });
        },
        listen: function (evt,f) {
            var that=this;

            if(!f) {
                that._listenEvents(evt);
            }
            else {
                var arr=evt.split(' '),
                    events=arr.shift();

                events=events.replace(/,/g,' ');

                f=$.isFunction(f)?f:that[f];

                if(arr.length>0&&arr[0]!=='') {
                    that._bind(arr.join(' '),events,f);
                } else {
                    that.bind(events,f);
                }
            }

            return that;
        },

        listenTo: function (target,name,f) {
            target=target.on?target:$(target);
            target.on(name,$.proxy(f,target));

            this._bindListenTo.push([target,name,f]);
            return this;
        },

        on: Event.on,
        one: Event.one,
        off: Event.off,
        trigger: Event.trigger,

        $: function (selector) {
            if(typeof selector==="string"&&selector[0]=='#') {
                selector='[id="'+selector.substr(1)+'"]';
            }
            return $(selector,this.$el);
        },

        bind: function (name,f) {
            this._bindAttrs.push([name,f]);
            this.$el.bind(name,$.proxy(f,this));
            return this;
        },
        unbind: function (name,f) {
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

        initialize: function () {
        },

        onDestory: function () { },

        destory: function () {
            var $el=this.$el,
                that=this,
                target;

            $.each(this._bindDelegateAttrs,function (i,attrs) {
                $.fn.undelegate.apply($el,attrs);
            });

            $.each(this._bindListenTo,function (i,attrs) {
                target=attrs.shift();
                target.off.apply(target,attrs);
            });

            that.one('Destory',function () {
                $.each(that._bindAttrs,function (i,attrs) {
                    $.fn.unbind.apply($el,attrs);
                });
                that.$el.remove();
            });

            that.trigger('Destory');
        }
    });

    View.extend=function (childClass,prop) {
        var that=this;

        childClass=sl.Class.extend.call(that,childClass,prop);

        childClass.events=$.extend({},childClass.superClass.events,childClass.prototype.events);

        childClass.extend=arguments.callee;
        childClass.plugin=function (plugin) {
            that.plugin.call(childClass,plugin);
        };

        return childClass;
    };

    View.plugin=function (plugin) {
        var that=this,
            prototype=this.prototype;

        if(plugin.events) {
            $.extend(prototype.events,plugin.events);
            delete plugin.events;
        }

        if(plugin.override) {
            var overrideFn;
            $.each(plugin.override,function (key,fn) {
                overrideFn=prototype[key];
                (typeof overrideFn!='undefined')&&(prototype.sealed[key]=overrideFn,fn.sealed=overrideFn);
                prototype[key]=fn;
            });
            delete plugin.override;
        }

        $.each(plugin,function (key,fn) {
            var proto=prototype[key];

            if(typeof proto==='undefined') {
                prototype[key]=fn;

            } else if($.isFunction(proto)&&$.isFunction(fn)) {
                prototype[key]=function () {
                    proto.apply(this,arguments);
                    return fn.apply(this,arguments);
                };

            } else if($.isPlainObject(proto)&&$.isPlainObject(fn)) {
                prototype[key]=$.extend({},fn,prototype[key]);

            } else
                prototype[key]=fn;

        });
    };

    sl.View=View;
    sl.zeptolize=zeptolize;

    module.exports=View;
});