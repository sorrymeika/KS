define(['$','sl/sl','ui/tabs','app','sl/widget/loading','util/md5'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        app=require('app'),
        md5=require('util/md5'),
        Loading=require('sl/widget/loading');

    module.exports=sl.Activity.extend({
        template: 'views/login.html',
        events: {
            'tap .js_back': 'backToFrom',
            'tap .js_login': 'login'
        },

        onCreate: function() {
            var that=this;

        },
        onDestory: function() {
            this.loading&&this.loading.destory();
        },

        login: function() {
            var that=this,
                r=this.route.query['r'],
                account=that.$('.js_account').val(),
                password=that.$('.js_password').val();

            if(!account) {
                sl.tip('请填写用户名');
                return;
            }
            if(!password) {
                sl.tip('请填写密码');
                return;
            }

            !that.loading&&(that.loading=new Loading(that.$el));
            that.loading.load({
                url: '/json/user/login',
                type: 'POST',
                checkData: false,
                data: {
                    account: account,
                    password: md5.md5(password).toUpperCase(),
                    role: 0
                },
                success: function(res) {
                    this.hideLoading();

                    res.userinfo.Auth=res.auth;

                    localStorage.setItem("USERINFO",JSON.stringify(res.userinfo));
                    that.redirect(r||'');
                },
                error: function(res) {
                    this.hideLoading();
                    sl.tip(res.msg);
                }
            });
        },

        backToFrom: function() {
            this.back();
        }
    });
});
