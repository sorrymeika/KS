define(['$','sl/sl','app'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        app=require('app');

    module.exports=sl.Activity.extend({
        template: 'views/buyer.html',
        events: {
            'tap .js_save': 'save',
            'tap .js_back': 'back'
        },
        onCreate: function() {
            var that=this,
                buyerInfo=sl.common.buyerInfo;

            if(buyerInfo) {
                this.$('[name="name"]').val(buyerInfo.name);
                this.$('[name="mobile"]').val(buyerInfo.mobile);
                this.$('[name="address"]').val(buyerInfo.address);
            }
        },
        onStart: function() {
        },
        onResume: function() {
        },
        onShow: function() {
            if(!localStorage.getItem('USERINFO')) {
                this.back('/login.html');
            }
        },
        onDestory: function() {
        },

        save: function() {
            var buyerInfo={
                name: this.$('[name="name"]').val(),
                mobile: this.$('[name="mobile"]').val(),
                address: this.$('[name="address"]').val()
            };

            if(!buyerInfo.name) {
                sl.tip('请输入姓名');
                return;
            }

            if(!buyerInfo.name) {
                sl.tip('请输入手机');
                return;
            } else if(!/1\d{10}/.test(buyerInfo.mobile)) {
                sl.tip('请输入正确的手机');
                return;
            }

            if(!buyerInfo.address) {
                sl.tip('请输入地址');
                return;
            }

            sl.common.buyerInfo=buyerInfo;
            this.setResult('buyerChange',buyerInfo);
            this.back();
        }

    });
});
