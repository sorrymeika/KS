define(['$','sl/sl','app','util','sl/widget/loading'],function(require,exports,module) {
    var $=require('$'),
        sl=require('sl/sl'),
        app=require('app'),
        util=require('util'),
        Loading=require('sl/widget/loading');

    module.exports=sl.Activity.extend({
        template: 'views/start.html',
        events: {
            'tap .js_start': 'start',
            'tap .checkbox': function(e) {
                var $target=$(e.currentTarget);

                $target.addClass('checked').siblings('.checked').removeClass('checked');
            },
            'change .js_province': function(e) {
                var value=e.currentTarget.value,
                    $city=this.$('.js_city'),
                city=$city[0];
                city.options.length=0;

                if(!value) {
                    city.options.add(new Option('',""));
                } else {
                    city.options.add(new Option('正在载入...',""));

                    $.ajax({
                        url: app.url('/json/region?action=city&provid='+value),
                        dataType: 'json',
                        success: function(res) {
                            city.options[0].text=('请选择');
                            $.each(res.data,function(i,item) {
                                city.options.add(new Option(item.name,item.id));
                            });
                        },
                        error: function(res) {
                            city.options[0].text=(res&&res.msg||'网络错误');
                        }
                    });
                }
            },
            'tap .js_ok': 'save'
        },
        onCreate: function() {
            var that=this;

            that.loading=new Loading(that.$el);

            var $province=this.$('.js_province'),
                province=$province[0];
            province.options.length=0;
            province.options.add(new Option('正在载入...',""));

            $.ajax({
                url: app.url('/json/region?action=province'),
                dataType: 'json',
                success: function(res) {
                    province.options[0].text=('请选择');
                    $.each(res.data,function(i,item) {
                        province.options.add(new Option(item.name,item.id));
                    });
                },
                error: function(res) {
                    province.options[0].text=(res&&res.msg||'网络错误');
                }
            });
        },
        onStart: function() {
        },
        onResume: function() {
        },
        onDestory: function() {
        },
        showDialog: function() {
            this.$('.js_dialog,.js_mask').show().removeClass('hide');

        },
        start: function() {
            var that=this,
                data={
                    name: that.$('.js_name').val(),
                    email: that.$('.js_email').val(),
                    mobile: that.$('.js_mobile').val()
                };


            if(!data.name) {
                sl.tip('请填写姓名');
                return;
            }
            if(!data.email) {
                sl.tip('请填写邮箱');
                return;
            }
            if(!data.mobile) {
                sl.tip('请填写手机');
                return;
            }

            !that.loading&&(that.loading=new Loading(that.$el));
            that.loading.load({
                url: '/json/register',
                type: 'POST',
                checkData: false,
                data: data,
                success: function(res) {
                    this.hideLoading();

                    util.store('userid',res.uid);
                    if(res.isUserExists) {
                        that.$('.js_mobile1').val(data.mobile);
                        that.showDialog();

                    } else {
                        that.forward('/play.html');
                    }

                },
                error: function(res) {
                    this.hideLoading();
                    sl.tip(res.msg);
                }
            });

        },
        save: function() {
            var that=this,
                data={
                    userid: util.store('userid'),
                    city: that.$('.js_city')[0].value,
                    address: that.$('.js_address').val(),
                    gender: that.$('[data-name="gender"].checked').data('value'),
                    birthday: that.$('.js_birthday').val()
                };

            if(!data.birthday) {
                sl.tip('请填写您的生日');
                return;
            }
            if(!data.city) {
                sl.tip('请选择省市');
                return;
            }
            if(!data.address) {
                sl.tip('请填写地址');
                return;
            }

            !that.loading&&(that.loading=new Loading(that.$el));
            that.loading.load({
                url: '/json/info',
                type: 'POST',
                checkData: false,
                data: data,
                success: function(res) {
                    this.hideLoading();
                    util.store('userinfo',data);
                    that.forward('/play.html');
                },
                error: function(res) {
                    this.hideLoading();
                    sl.tip(res.msg);
                }
            });

        }
    });
});