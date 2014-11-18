define('ui/loading',['$','ui/sl','app'],function(require,exports,module) {
    var $=require('zepto'),
        sl=require('ui/sl'),
        app=require('app');

    var records=[];

    var Loading=sl.View.extend({
        events: {},
        options: {
            keys: null,
            check: null
        },

        check: function(res) {
            console.log('check');
            var flag=!!(res&&res.success);
            return flag;
        },

        hasData: function(res) {
            return res.data&&res.data.length;
        },

        keys: ['page','pageSize'],

        dataKeys: ['page','pageSize','total',''],

        init: function() {
            var that=this;

            that.options.check&&(that.check=that.options.check);
            that.options.hasData&&(that.hasData=that.options.hasData);
            that.options.keys&&(that.keys=that.options.keys);
            that.options.dataKeys&&(that.dataKeys=that.options.dataKeys);

            that.key_page=that.keys[0];
            that.key_pageSize=that.keys[1];

            that.dataKey_page=that.dataKeys[0];
            that.dataKey_pageSize=that.dataKeys[1];
            that.dataKey_total=that.dataKeys[2];
            that.dataKey_pageNum=that.dataKeys[3];
        },

        reload: function(options) {
            var that=this;

            if(that.loading) return;
            that.loading=true;

            that.isLoad=false;
            that.trigger('Reload');

            options&&$.extend(that.loadingOpt,options);
            that.loadingOpt.data[that.key_page]=1;

            that._load();
        },

        load: function(options) {
            var that=this;

            if(that.loading) return;
            that.loading=true;

            //if(that.isLoad) return;

            that.loadingOpt=options=$.extend({
                url: '',
                headers: (navigator.platform!="Win32"&&navigator.platform!="Win64")&&localStorage.authCookies?{
                    Cookie: localStorage.authCookies
                }:null,
                type: 'GET',
                data: null,
                timeout: 15,
                success: null,
                refresh: null

            },options);

            that._load();
        },

        abort: function() {
            if(this._xhr) {
                this.loading=false;
                this.isLoad=false;
                this._xhr.abort();
                this._xhr=null;
                this.hide();
            }
        },

        msg: function(msg) {
            var that=this,
                page=!that.loadingOpt.data?1:that.loadingOpt.data[that.key_page];

            if(page==1) {
                that._exec(msg);
            } else {
                that.$refreshing.html(msg);
            }
        },

        show: function() {
            this._exec();
        },

        hide: function() {
            this._exec('hide');
        },

        _load: function() {
            var that=this,
                options=that.loadingOpt,
                defaults={};

            for(var i=records.length-1;i>=0;i--) {
                records[i].disableAutoRefreshing();
            }

            defaults[that.key_page]=1;
            defaults[that.key_pageSize]=10;

            var data=$.extend(defaults,options.data);

            that.loadingOpt.data=data;
            that.loadingOpt.hasData&&(that.hasData=that.loadingOpt.hasData);

            that.abort();

            that._exec();

            that._ajax({
                success: function(res,status,xhr) {
                    that.isLoad=true;
                    options.success&&options.success(res,status,xhr);
                    that._exec('hide');
                },
                error: options.error&&options.error||function(res) {
                    that._exec(res&&res.msg||'网络错误');
                }
            });
        },

        _exec: function(msg) {
            var that=this,
                position=that.$el.css('position');

            if(!that.$loading) {
                that.$loading=$('<div class="dataloading"><div class="msg"></div></div>');
                if(that.el.tagName=='BODY')
                    that.$loading.addClass('screen').css({
                        position: 'fixed'
                    });
            }

            var loading=that.$loading.css({
                top: that.el.tagName=='body'?'':$.inArray(position,['absolute','relative','fix'])!= -1?0:that.$el.position().top
            }).appendTo(that.$el);

            if(msg===false||msg==="hide") {
                loading.hide();
            } else if(typeof msg==='undefined') {
                loading.removeClass('loading-error').show();
            } else {
                loading.addClass('loading-error').find('.msg').html(msg);
            }
        },

        _ajax: function(opt) {
            var that=this,
                loadingOpt=that.loadingOpt;

            opt=$.extend({
                url: app.url(loadingOpt.url),
                headers: loadingOpt.headers,
                data: loadingOpt.data,
                type: loadingOpt.type,
                dataType: loadingOpt.dataType||'json'
            },opt);

            that.abort();

            var success=opt.success,
                error=opt.error;

            opt.success=function(res,status,xhr) {
                that._xhr=null;
                if(that.loadingOpt.check===false||that.check(res)) {

                    if(that.loadingOpt.checkData===false||that.hasData(res)) {
                        res._params=loadingOpt.data;
                        success.call(that,res,status,xhr);

                        that.loading=false;
                        that.checkAutoRefreshing(res);

                    } else {
                        that._dataNotFound(res);
                    }
                } else {
                    error.call(that,res);
                }
                that.loading=false;
            };

            opt.error=function(xhr) {
                that._xhr=null;
                error.call(that,xhr);
                that.loading=false;
            };

            that._xhr=$.ajax(opt);
        },

        _refresh: function() {
            if(this.loading) return;
            this.loading=true;

            var that=this,
                loadingOpt=that.loadingOpt,
                refreshing=(that.$refreshing
                    ||(that.$refreshing=$('<div class="refreshing"></div>'))).appendTo(that.$el);

            refreshing.html('正在载入...');

            that._ajax({
                success: function(res) {
                    loadingOpt.refresh.call(that,res);

                    that.$refreshing.remove();
                },
                error: loadingOpt.refreshError&&loadingOpt.refreshError||function(res) {
                    that.$refreshing.one('tap',$.proxy(that._refresh,that)).html(res&&res.msg||'网络错误，点击重试');
                }
            });
        },

        _dataNotFound: function(e,res) {
            var that=this,
                page=!that.loadingOpt.data?1:that.loadingOpt.data[that.key_page];

            if(page==1) {
                that._exec('暂无数据');
            } else {
                var refreshing=that.$refreshing;
                refreshing.html('暂无数据');
                setTimeout(function() {
                    refreshing.animate({ height: 0 },300,'ease-out');
                },3000);
            }
        },

        _scroll: function() {
            var that=this;

            if(!that.loading
                &&that._scrollY<window.scrollY
                &&window.scrollY+window.innerHeight>=document.body.scrollHeight-40) {

                that._refresh();
            }
            that._scrollY=window.scrollY;
        },

        _autoRefreshingEnabled: false,

        checkAutoRefreshing: function(res) {
            var that=this,
                data=that.loadingOpt.data;

            if((that.loadingOpt.refresh&&that.dataKey_pageNum&&res[that.dataKey_pageNum]&&res[that.dataKey_pageNum]>data[that.key_page])||(that.dataKey_total&&res[that.dataKey_total]&&res[that.dataKey_total]>data[that.key_page]*data[that.key_pageSize])) {

                data[that.key_page]++;
                that.enableAutoRefreshing();

            } else {
                that.disableAutoRefreshing();
            }
        },

        enableAutoRefreshing: function() {
            if(this._autoRefreshingEnabled) return;
            this._autoRefreshingEnabled=true;

            records.push(this);

            $(window).on('scroll',$.proxy(this._scroll,this));
            this.bind('Destory',this.disableAutoRefreshing);

            this._scrollY=window.scrollY;

            if(window.innerHeight==document.body.scrollHeight) {
                this._refresh();
            }
        },

        disableAutoRefreshing: function() {
            if(!this._autoRefreshingEnabled) return;
            this._autoRefreshingEnabled=false;

            for(var i=records.length-1;i>=0;i--) {
                if(records[i]==this) {
                    records.splice(i,1);
                    break;
                }
            }

            $(window).off('scroll',this._scroll);

            this.unbind('Destory',this.disableAutoRefreshing);
            this.$refreshing&&this.$refreshing.remove();
        }
    });

    sl.zeptolize('Loading',Loading);

    module.exports=Loading;
});
