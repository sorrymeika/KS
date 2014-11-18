define('sl/plugins/template',['$'],function(require,exports,module) {
    var $=require('$');

    var templatesRecords={},
        buildTemplate=function(url,callback) {
            var that=this,
                dfd=$.Deferred(),
                record=templatesRecords[url];

            if(typeof record!=='undefined') {
                callback&&callback(record);
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
                            return buildTemplate.call(that,r2).done(function(rec) {
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
                    });

                    record.main=template;
                    record.template=record.templates.length?record.templates[0]:null;
                    templatesRecords[url]=record;
                    if(includes.length) {
                        var incDfd=(includes.shift())();
                        while(includes.length) {
                            incDfd=incDfd.then(includes.shift());
                        }
                        incDfd.then(function() {
                            callback&&callback(record);
                            dfd.resolveWith(that,[record]);
                        });
                    } else {
                        callback&&callback(record);
                        dfd.resolveWith(that,[record]);
                    }
                });

            return dfd.promise();
        };


    module.exports=function(Class) {
        Class.plugin({
            options: {
                templateEnabled: true
            },
            initWithTemplate: function() {
                var that=this;
                return buildTemplate(that.template,function(record) {
                    that.$el.html(record.main);
                    that.templates=record;
                });
            },
            template: 'views/home.html',
            _getTemplate: function(name,tmpl) {
                var that=this;

                tmpl=tmpl||this.templates;

                if(!name) return tmpl.template;
                else if(typeof name=='number') return tmpl.templates[name];

                var templates=tmpl._templates;

                if(typeof templates[name]!=='undefined') {
                    return tmpl.templates[templates[name]];
                }

                for(var i=0,n=tmpl.includes.length,res;i<n;i++) {
                    res=that._getTemplate(name,tmpl.includes[i]);
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

                template=that._getTemplate(name);

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
            }
        });
    };
});