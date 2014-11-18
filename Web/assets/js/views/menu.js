define(['$','sl/sl','app','sl/widget/loading'],function (require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        app=require('app'),
        Loading=require('sl/widget/loading');

    module.exports=sl.Activity.extend({
        template: 'views/menu.html',
        events: {
            'tap': function (e) {
                if($(e.target).hasClass('view')) {
                    this.back();
                }
            },
            'tap .js_signout': function () {
                localStorage.removeItem("USERINFO");
                this.back('/');
            }
        },
        className: 'transparent',
        animationName: 'menu',
        onCreate: function () {
            var that=this;
        },
        onStart: function () {
        },
        onResume: function () {
        },
        onDestory: function () {
        }
    });
});
