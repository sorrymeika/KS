define(['$','sl/sl','app','util','sl/widget/loading','util/base64'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        util=require('util'),
        app=require('app'),
        Loading=require('sl/widget/loading');

    module.exports=sl.Activity.extend({
        template: 'views/sorry.html',
        events: {
            'tap .js_get': function() {
                this.$('.js_dialog,.js_mask').show().removeClass('hide');
                this.$('.js_dialog').css({ top: Math.max((window.innerHeight-this.$('.js_dialog').height())/2,0),marginTop: 0 });
            },
            'tap .js_close': function() {
                this.$('.js_dialog,.js_mask').addClass('hide').one($.fx.transitionEnd,function() {
                    this.style.display='none';
                });
            },
            'tap .share': function(e) {
                $(e.currentTarget).hide();
            },
            'tap .js_share': function() {
                this.$('.share').show();
            }
        },
        onCreate: function() {
            var that=this,
                data=util.store('prize');

            that.$('.js_text').html(data.PrizeName);
            that.$('.js_img').attr('src',data.Picture);
        },
        onStart: function() {
        },
        onResume: function() {
        },
        onShow: function() {

        },
        onDestory: function() {
            this.loading&&this.loading.destory();
        }

    });
});
