define(['$','sl/sl','app','sl/widget/loading','sl/widget/dialog'],function (require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        Loading=require('sl/widget/loading'),
        Dialog=require('sl/widget/dialog');

    module.exports=sl.Activity.extend({
        template: 'views/sorry.html',
        events: {},
        onCreate: function () {
            var that=this;
        },
        onStart: function () {
        },
        onResume: function () {
        },
        onShow: function () {
            var that=this;
        },

        onDestory: function () {
        },

        select: function (e) {
        }
    });
});
