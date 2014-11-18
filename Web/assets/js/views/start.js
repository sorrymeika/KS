define(['$','sl/sl','app','sl/widget/loading'],function (require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        app=require('app'),
        Loading=require('sl/widget/loading');

    module.exports=sl.Activity.extend({
        template: 'views/start.html',
        events: {},
        onCreate: function () {
            var that=this;

            that.$list=that.$('.js_list');

            that.loading=new Loading(that.$el);
        },
        onStart: function () {
        },
        onResume: function () {
        },
        onDestory: function () {
        },
        next: function () {
        }
    });;
});