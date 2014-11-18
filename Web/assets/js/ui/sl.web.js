define('ui/sl.web',['zepto','ui/sl.app','ui/loading'],function (require,exports,module) {
    var $=require('zepto'),
		sl=require('ui/sl.app'),
		Loading=require('ui/loading');

    sl.Application=sl.Application.extend({
        viewPath: 'webviews/',
        _loadActivity: function (route) {
            sl.loading();

            this.superClass._loadActivity.call(this,route).done(function () {
                sl.loading('hide');
            });
        },
        startURL: location.hash.replace('#','')||location.pathname+location.search||'/',
        startPath: location.pathname+location.search
    });

    var records={};

    sl.Activity=sl.Activity.extend({
        template: null,
        init: function () {
            var that=this;

            if(that.template) {
                return that.superClass.init.call(that);
            } else if(!that.el.innerHTML.replace(/\s+/g,'')) {

                that._initDfd=$.Deferred();
                that.loadHtml();

                return that._initDfd;
            }
        },
        loadHtml: function (url) {
            var that=this;

            url=url||that.route.url;

            if(records[url]) that.$el.html(records[url]);

            that.$el.loading('show');

            $.get(url+(/\?/.test(url)?"&":"?")+"request=ajax",function (res) {
                records[url]=res;
                that.$el.loading('hide').html(res);

                console.log("loadHtmlEnd");

                that._initDfd.resolve();
            });
        }
    });

    module.exports=sl;
});
