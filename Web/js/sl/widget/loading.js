define(['$','app','./../view'],function (require,exports,module) {
    var $=require('$'),
        sl=require('./../base'),
        view=require('./../view'),
        app=require('app');

    var records=[];

    var Loading=view.extend({
        events: {
            'tap .js_reload': function () {
                this.reload();
            }
        },
        options: {
            keys: null,
            check: null
        },

        pageIndex: 1,
        pageSize: 10,
        params: {},

        KEY_PAGE: 'page',
        KEY_PAGESIZE: 'pageSize',

        DATAKEY_TOTAL: 'total',
        DATAKEY_PAGENUM: '',

        check: function (res) {
            var flag=!!(res&&res.success);
            return flag;
        },

        hasData: function (res) {
            return res.data&&res.data.length;
        },

        initialize: function () {
            var that=this;

            that.options.check&&(that.check=that.options.check);
            that.options.hasData&&(that.hasData=that.options.hasData);
            that.options.dataKeys&&(that.dataKeys=that.options.dataKeys);
        },

        showMsg: function (msg) {
            if(this.pageIndex==1) {
                this.$loading.find('.js_msg').show().html(msg);
                this.$loading.show().find('.js_loading').hide();
            } else {
                this.$refreshing.find('.js_msg').show().html(msg);
                this.$refreshing.show().find('.js_loading').hide();
            }
        },

        showError: function () {
            var that=this;

            if(that.isError) {
                if(this.pageIndex==1) {
                    that.showMsg('<div class="data-reload js_reload">加载失败，请点击重试<i class="i-refresh"></i></div>');
                } else {
                    that.showMsg('<div class="data-reload js_reload">加载失败，请点击重试<i class="i-refresh"></i></div>');
                }
            }
        },

        template: '<div class="dataloading"><div class="msg js_msg"></div><p class="loading js_loading"></p></div>',
        refresh: '<div class="refreshing"><p class="msg js_msg"></p><p class="loading js_loading"></p></div>',

        showLoading: function () {
            var that=this;

            if(that.pageIndex==1) {
                var position=that.$el.css('position'),
                    isLayout=$.inArray(position,['absolute','relative','fix'])!= -1;

                if(!that.$loading) {
                    that.$loading=$(that.template);
                }

                that.$loading.css({
                    top: that.el.tagName=='body'?'':isLayout?0:that.$el.position().top
                })
                .appendTo(that.$el)
                .show();

                that.$refreshing&&that.$refreshing.hide();

            } else {
                var $refreshing=(that.$refreshing||(that.$refreshing=$(that.refresh))).appendTo(that.$el);
                $refreshing.show();
                that.$loading&&that.$loading.hide();
            }
        },

        hideLoading: function () {
            this.$refreshing.hide();
            this.$loading.hide();
        },

        reload: function () {
            var that=this;

            if(that.isLoading) return;
            that.isLoading=true;

            that.pageIndex=1;
            that.params[that.KEY_PAGE]=1;

            that._load();
        },

        load: function (options) {
            var that=this;

            if(that.isLoading) return;
            that.isLoading=true;

            options=$.extend({
                url: '',
                headers: (navigator.platform!="Win32"&&navigator.platform!="Win64")&&localStorage.authCookies?{
                    Cookie: localStorage.authCookies
                }:null,
                type: 'GET',
                data: {},
                pageIndex: that.pageIndex,
                pageSize: that.pageSize,
                timeout: 15,
                success: sl.noop,
                refresh: sl.noop,
                error: sl.noop

            },options);

            that.loadingOptions=options;

            that.params=options.data;
            that.pageIndex=options.pageIndex;
            that.pageSize=options.pageSize;

            that.params[that.KEY_PAGESIZE]=that.pageSize;

            that._load();
        },

        _load: function () {
            var that=this;

            for(var i=records.length-1;i>=0;i--) {
                records[i].disableAutoRefreshing();
            }

            that.params[that.KEY_PAGE]=that.pageIndex;

            that.abort();

            that.showLoading();


            that._xhr=$.ajax({
                url: app.url(that.loadingOptions.url),
                headers: that.loadingOptions.headers,
                data: that.params,
                type: that.loadingOptions.type,
                dataType: that.loadingOptions.dataType||'json',
                error: function (xhr) {
                    that._xhr=null;
                    that.isError=true;
                    that.showError();
                    that.loadingOptions.error.call(that,{ msg: '网络错误' },xhr);
                    that.isLoading=false;
                },
                success: function (res,status,xhr) {
                    that._xhr=null;
                    if(that.loadingOpt.check===false||that.check(res)) {

                        if(that.loadingOpt.checkData===false||that.hasData(res)) {
                            that.loadingOptions.success.call(that,res,status,xhr);

                            that.loading=false;
                            that.checkAutoRefreshing(res);

                        } else {
                            that._dataNotFound(res);
                        }
                    } else {
                        that.isError=true;
                        that.showError();
                        that.loadingOptions.error.call(that,res);
                    }
                    that.isLoading=false;
                },
                complete: function () {
                }
            });
        },

        _refresh: function () {
            this._load();
        },

        _dataNotFound: function (e,res) {
            var that=this;

            that.showMsg('暂无数据');

            if(that.pageIndex==1) {
            } else {
                setTimeout(function () {
                    that.$refreshing.animate({ height: 0 },300,'ease-out',function () {
                        that.$refreshing.hide().css({ height: '' });
                    });
                },3000);
            }
        },

        _scroll: function () {
            var that=this;

            if(!that.loading
                &&that._scrollY<window.scrollY
                &&window.scrollY+window.innerHeight>=document.body.scrollHeight-40) {

                that._refresh();
            }
            that._scrollY=window.scrollY;
        },

        _autoRefreshingEnabled: false,

        checkAutoRefreshing: function (res) {
            var that=this,
                data=that.params;

            if((that.loadingOptions.refresh&&that.DATAKEY_PAGENUM&&res[that.DATAKEY_PAGENUM]&&res[that.DATAKEY_PAGENUM]>data[that.KEY_PAGE])||(that.DATAKEY_TOTAL&&res[that.DATAKEY_TOTAL]&&res[that.DATAKEY_TOTAL]>data[that.KEY_PAGE]*data[that.KEY_PAGESIZE])) {

                that.pageIndex++;
                that.enableAutoRefreshing();

            } else {
                that.disableAutoRefreshing();
            }
        },

        enableAutoRefreshing: function () {
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

        disableAutoRefreshing: function () {
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
        },

        abort: function () {
            if(this._xhr) {
                this.isLoad=false;
                this._xhr.abort();
                this._xhr=null;

                this.hideLoading();
            }
        },

        destory: function () {
            this.abort();
            view.fn.destory();
        }

    });

    sl.zeptolize('Loading',Loading);

    module.exports=Loading;
});
