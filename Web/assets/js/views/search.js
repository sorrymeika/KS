define(['$','sl/sl','app'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        app=require('app'),
        util=require('util');

    module.exports=sl.Activity.extend({
        template: 'views/search.html',
        events: {
            'tap': function(e) {
                if($(e.target).hasClass('view')) {
                    this.back();
                }
            },
            'tap .js_search': function() {
                this.setResult("searchChange",this.$('input').val());
                this.back('/');
            }
        },
        className: 'transparent1',
        animationName: 'search',
        onCreate: function() {
            var that=this;

        },
        onStart: function() {
        },
        onResume: function() {
        },
        onShow: function() {
            this.$('input').focus();
        },
        onDestory: function() {
        }
    });;
});