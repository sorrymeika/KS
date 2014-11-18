define('ui/sl.app',['$','app','tmpl','ui/sl'],function(require,exports,module) {
    var $=require('$'),
		sl=require('ui/sl'),
		tmpl=require('tmpl'),
		app=require('app');

    var slice=Array.prototype.slice;

    sl.Application=sl.Application.extend({
        viewPath: 'views/',
        startURL: location.hash.replace('#',''),
        startPath: ''
    });

    var templatesRecords={};

    var getTemplate=function(url) {
        var that=this,
            dfd=$.Deferred(),
            record=templatesRecords[url];

        if(typeof record!=='undefined') {
            dfd.resolveWith(that,[record]);
        } else
            $.get(url,function(template) {
                var templates=[],
                    includes=[];

                record={
                    _templates: {},
                    templates: templates,
                    includes: []
                };

                template=template.replace(/<include src=("|')(.+?)\1[^>]*?>/img,function(r0,r1,r2) {
                    var replacement='<include_'+r2+'>';
                    includes.push(function() {
                        return getTemplate.call(that,r2).done(function(rec) {
                            record.main=record.main.replace(replacement,rec.main);
                            record.includes.push(rec);
                        });
                    });
                    return replacement;
                });

                template=template.replace(/<script([^>]+)>([\S\s]+?)<\/script>/mgi,function(r0,r1,r2) {
                    var m=r1.match(/\bid=("|')(.+?)\1/i);
                    if(m) {
                        record._templates[m[2]]=templates.length;
                    }
                    templates.push(r2);
                    return '';
                });

                templates.push(template);

                $.each(templates,function(i,str) {
                    templates[i]=str.replace(/\{\%include\s+(\w+)\%\}/mgi,function(r0,r1) {
                        return templates[record._templates[r1]];
                    });
                })

                record.main=template;
                record.template=record.templates.length?record.templates[0]:null;
                templatesRecords[url]=record;
                if(includes.length) {
                    var incDfd=(includes.shift())();
                    while(includes.length) {
                        incDfd=incDfd.then(includes.shift());
                    }
                    incDfd.then(function() {
                        dfd.resolveWith(that,[record]);
                    });
                } else
                    dfd.resolveWith(that,[record]);
            });
        return dfd.promise();
    };

    sl.Activity=sl.Activity.extend({
        init: function() {
            var that=this;

            return getTemplate.call(that,that.template).done(function(record) {
                that.$el.html(record.main);
                that.templates=record;
            });
        },
        template: 'views/home.html',
        getTemplate: function(name,tmpl) {
            var that=this;

            tmpl=tmpl||this.templates;

            if(!name) return tmpl.template;
            else if(typeof name=='number') return tmpl.templates[name];

            var templates=tmpl._templates;

            if(typeof templates[name]!=='undefined') {
                return tmpl.templates[templates[name]];
            }

            for(var i=0,n=tmpl.includes.length,res;i<n;i++) {
                res=that.getTemplate(name,tmpl.includes[i]);
                if(res) return res;
            }
            return null;
        },
        tmpl: function(/*name[,url][,data]*/) {
            var that=this,
                args=slice.apply(arguments),
                i=0,
                name=args[i++],
                url=args[i++],
                data=args.pop();

            template=that.getTemplate(name);

            if(typeof url==='string') {
                var dfd=$.Deferred();
                $.ajax({
                    url: url,
                    data: data,
                    dataType: 'json',
                    type: 'post',
                    success: function(res) {
                        dfd.resolveWith(that,[tmpl(template,res)]);
                    },
                    error: function() {
                        dfd.reject();
                    }
                });
                return dfd.promise();

            } else {
                return tmpl(template,data);
            }
        },
        reload: function(options) {
            var that=this;

            that.trigger('Reload');

            options&&$.extend(that.loadingOpt,options);
            that.loadingOpt.data.page=1;

            that._load();
        },
        load: function(options) {
            var that=this;
            that.loadingOpt=options=$.extend({
                url: '',
                data: null,
                success: null,
                refresh: null
            },options);

            that._load();
        },
        _load: function() {
            var that=this,
                options=that.loadingOpt,
                loading=true,
                data=$.extend({
                    page: 1,
                    pageSize: 10
                },options.data),
                container=that.$(options.container);

            if(that._loadingXhr) that._loadingXhr.abort();

            that._loading();

            that._loadingXhr=app.post(options.url,data,function(res) {
                that._loadingXhr=null;

                if(res&&res.success) {
                    if(res.data) {
                        res._params=data;

                        options.success&&options.success(res);

                        that._loading('hide');

                        if(res.total&&res.total>data.page*data.pageSize) {
                            var refreshing=$('<div class="refreshing"></div>').appendTo(container),
                            scrollOff=function() {
                                $(window).off('scroll',f);
                            },
                            _scrollY=window.scrollY,
                            f=function() {
                                if(!loading&&_scrollY<window.scrollY&&window.scrollY+window.innerHeight>=document.body.scrollHeight-40) {
                                    if(that._loadingXhr) that._loadingXhr.abort();

                                    refreshing.html('正在载入...');
                                    loading=true;
                                    that._loadingXhr=app.post(options.url,data,function(res) {
                                        that._loadingXhr=null;
                                        if(res&&res.success) {
                                            if(res.data) {

                                                options.refresh&&options.refresh(res);

                                                if(res.total&&res.total>data.page*data.pageSize) {
                                                    data.page++;

                                                } else {
                                                    refreshing.hide();
                                                    that.unbind('Destory',scrollOff);
                                                    that.unbind('Pause',scrollOff);
                                                    that.unbind('Resume',scrollOn);
                                                    $(window).off('scroll',f);
                                                }

                                            } else {
                                                refreshing.html('暂无数据');
                                                setTimeout(function() {
                                                    refreshing.animate({ height: 0 },300,'ease-out');
                                                },3000);
                                            }
                                        } else {
                                            refreshing.html(res&&res.msg||'网络错误，点击重试').one('tap',f);
                                        }

                                        loading=false;
                                    });
                                }
                                _scrollY=window.scrollY;
                            },
                            scrollOn=function() {
                                $(window).on('scroll',f);
                            };

                            that.bind('Destory',scrollOff);
                            that.bind('Pause',scrollOff);
                            that.bind('Resume',scrollOn);
                            that.one('Reload',function() {
                                that.unbind('Destory',scrollOff);
                                that.unbind('Pause',scrollOff);
                                that.unbind('Resume',scrollOn);
                                scrollOff();
                                refreshing.remove();
                            });
                            scrollOn();
                            data.page++;
                        }
                    } else {
                        that._loading('暂无数据');
                    }
                } else {
                    that._loading(res&&res.msg||'网络错误');
                }

                loading=false;
            });
        }
    });

    sl.checkUpdate=function() {
        var dfd=$.Deferred();

        $.ajax({
            url: app.url("/api/CPService/CheckVersion/?ct=json&apptype="+(app.isAndroid?0:1)),
            dataType: 'json',
            success: function(res) {
                if(res.ReturnCode=="00000") {
                    dfd.resolve(res.DownLoadUrl,res.Version,res.UpdateMsg);
                } else
                    dfd.reject(res.ReturnCode+"错误");
            },
            error: function() {
                dfd.reject("网络错误");
            }
        });

        return dfd;
    };

    module.exports=sl;
});
