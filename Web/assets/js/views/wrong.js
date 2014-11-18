define(['$','sl/sl','app','sl/widget/dropdown','sl/widget/loading'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        Dropdown=require('sl/widget/dropdown'),
        Loading=require('sl/widget/loading'),
        app=require('app');

    module.exports=sl.Activity.extend({
        template: 'views/wrong.html',
        events: {
            'tap .js_save': 'save',
            'tap .js_join': function() {
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
        },
        onDestory: function() {
            this.loading&&this.loading.destory();
        },

        save: function() {
            var that=this,
                content=that.$('textarea').val();

            if(!content) {
                sl.tip("请填写你的小秘密");
                return;
            }

            !that.loading&&(that.loading=new Loading(that.$el));
            that.loading.load({
                url: '/json/add',
                type: 'POST',
                checkData: false,
                data: {
                    closeId: that.route.data.id,
                    content: encodeURIComponent(content)
                },
                success: function(res) {
                    this.hideLoading();

                    that.forward('/share/'+res.result);
                },
                error: function(res) {
                    this.hideLoading();
                    sl.tip(res.msg);
                }
            });

        },

        photo: function() {
            this.forward('/photo.html');
        }

    });
});
