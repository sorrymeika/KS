define('ui/dialog',['$','ui/sl'],function (require,exports,module) {
    var $=require('zepto'),
        sl=require('ui/sl');

    var mask=null,
        template='<div class="dialog"><div class="dialog-title"><h3>${title}</h3></div><div class="dialog-content">{%html content%}</div><div class="dialog-btns"><a class="dialog-btn js_hide">${cancelText}</a><a class="dialog-btn js_ok">${okText}</a></div></div>';

    var Dialog=sl.View.extend({
        events: {
            'tap .js_hide': 'cancel',
            'tap .js_ok': 'ok',
            'touchmove': function (e) {
                e.preventDefault();
            }
        },
        template: template,
        options: {
            title: "提示",
            content: null,
            cancelText: '取消',
            okText: '确定'
        },

        title: function (title) {
            this.$title.html(title);
        },

        init: function () {
            var that=this;

            that.$title=that.$('.dialog-title h3');
        },

        hide: function () {
            this.$el.hide();
            mask.hide();
        },

        show: function () {

            if(!mask) {
                mask=$('<div class="winheight" style="position:fixed;top:0px;bottom:0px;right:0px;width:100%;background: #888;opacity: 0.5;z-index:2000;display:none"></div>').appendTo('body');
            }

            mask.show();

            this.$el.appendTo('body').show()
                .css({
                    top: window.scrollY+(window.innerHeight-this.$el.height())/2
                });
        },

        ok: function () {
            this.options.onOk&&(this.options.onOk.call(this)===false)||this.hide();
        },

        cancel: function () {
            this.options.onCancel&&this.options.onCancel.call(this);
            this.hide();
        }
    });

    var _prompt=null;

    sl.prompt=function (title,callback,type) {
        if(!callback) {
            callback=title;
            title="请输入";
        }

        if(!_prompt) {
            _prompt=new Dialog({
                title: title,
                content: '<input type="text" class="prompt-text" /><input type="password" class="prompt-text" />'
            });
        } else {
            _prompt.title(title);
        }
        _prompt.$('input.prompt-text').val('').hide().filter('[type="'+(type||'text')+'"]').show();

        _prompt.options.onOk=function () {
            return callback.call(this,this.$('input[type="'+(type||'text')+'"].prompt-text').val());
        }

        _prompt.options.onCancel=function () {
            callback.call(this);
        }

        _prompt.show();

        $(window).one('hashchange',function () {
            _prompt.hide();
        });
    };

    var _confirm=null;

    sl.confirm=function (title,text,ok,cancel) {
        var options={};
        if($.isPlainObject(title)) {
            cancel=ok;
            ok=text;
            $.extend(options,title);

        } else if($.isFunction(text)) {
            cancel=ok;
            ok=text;
            options.content=title,
            options.title="确认提示";
        } else {
            options.title=title,
            options.content=text;
        }

        if(!_confirm) {
            _confirm=new Dialog(options);
        } else {
            _confirm.title(options.title);
            _confirm.$('.dialog-content').html(options.content);

            _confirm.$('.js_hide').html(options.cancelText||'取消');
            _confirm.$('.js_ok').html(options.okText||'确定');
        }

        _confirm.options.onOk=function () {
            ok.call(this);
        }

        _confirm.options.onCancel=function () {
            cancel&&cancel.call(this);
        }

        _confirm.show();

        $(window).one('hashchange',function () {
            _confirm.hide();
        });
    };

    module.exports=Dialog;
});
