define(['$','sl/sl','app','util','sl/widget/dropdown','sl/widget/loading'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        Loading=require('sl/widget/loading'),
        util=require('util'),
        app=require('app');

    module.exports=sl.Activity.extend({
        template: 'views/play.html',
        events: {
            'tap .js_save': 'save',
            'tap .js_close': function() {
                this.$('.js_dialog,.js_mask').addClass('hide').one($.fx.transitionEnd,function() {
                    this.style.display='none';
                });
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

        start: function() {
            var that=this,
                items=that.$('.play p');

            that.timer&&clearInterval(that.timer);
            that.timer=setInterval(function() {
                items.each(function() {
                    var a=Math.random();
                    if(a<=0.33) {
                        $(this).removeClass().addClass('pic1');
                    } else if(a>0.33&&a<=0.66) {
                        $(this).removeClass().addClass('pic2');
                    } else {
                        $(this).removeClass();
                    }
                });
            },50);

        },

        save: function() {
            var that=this;

            that.start();

            !that.loading&&(that.loading=new Loading(that.$el));
            that.loading.load({
                url: '/json/play',
                type: 'POST',
                checkData: false,
                data: {
                    userid: util.store('userid')
                },
                success: function(res) {
                    this.hideLoading();

                    setTimeout(function() {
                        that.timer&&clearInterval(that.timer);

                        if(res.prize) {
                            util.store('prize',res.prize);
                            that.forward('/prize.html');
                        } else {
                            that.forward('/sorry.html');
                        }

                    },1000);

                },
                error: function(res) {
                    this.hideLoading();
                    sl.tip(res.msg);
                }
            });

        }

    });
});
