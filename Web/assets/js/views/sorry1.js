define(['$','sl/sl','app','sl/widget/loading','sl/widget/dialog'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        Loading=require('sl/widget/loading'),
        Dialog=require('sl/widget/dialog');

    module.exports=sl.Activity.extend({
        template: 'views/sorry1.html',
        events: {
            'tap .js_go': function() {
                location.href="index.html";
            }
        },
        onCreate: function() {
            var that=this;
        },
        onStart: function() {
        },
        onResume: function() {
        },
        onShow: function() {
            var that=this;
        },

        onDestory: function() {
        },

        select: function(e) {
        }
    });
});
