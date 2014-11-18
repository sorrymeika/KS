define('ui/dropdown',['$','ui/sl'],function (require,exports,module) {
    var $=require('$'),
        sl=require('ui/sl');

    var Dropdown=sl.View.extend({
        template: '<div class="dropdown hide"><ul class="dropdown_bd js_dropdown">{%each(i,item) data%}<li>${item.text}</li>{%/each%}</ul></div>',
        events: {
            Destory: function () {
                this.mask.off('tap').remove();
            },
            'tap .js_dropdown>li': function (e) {
                var $target=$(e.currentTarget);

                $target.addClass('curr').siblings('.curr').removeClass('curr');
                this.hide();
                this.index=$target.index();
                this.trigger('Change',this.index);
            }
        },
        index: 0,
        options: {
            onChange: null,
            data: []
        },
        init: function () {
            var that=this;

            that.$bd=that.$('.js_dropdown');
            that.$('.js_dropdown>li').eq(that.index).addClass('curr');

            that.mask=$('<div class="winheight" style="position:fixed;top:0px;bottom:0px;right:0px;width:100%;background:rgba(0,0,0,0);z-index:2000;display:none"></div>').on('tap click touchend touchmove touchstart',function (e) {
                e.preventDefault();
            })
            .appendTo('body');

            that.mask.tap(function () {
                that.hide();
            });

            that.$el.appendTo('body');

            that.$el.on($.fx.transitionEnd,function () {
                if(that.$el.hasClass('hide')) that.$el.hide();
            });

            that.options.onChange&&that.bind('Change',that.options.onChange);
        },
        show: function () {
            var that=this;

            that.$el.show().removeClass('hide');
            that.mask.show();
        },
        hide: function () {
            var that=this;

            that.$el.addClass('hide');
            that.mask.hide();
            that.trigger('Hide');
        },
        render: function () {
        },
        pos: function (x,y) {
            var that=this;

            that.$el.css({
                top: y,
                left: 0//x-that.$el.width()
            });
        }
    });

    sl.zeptolize('Dropdown',sl.View.extend({
        events: {
            'tap': function (e) {
                this.$el.addClass('visible');
                this.show();
            }
        },
        init: function () {
            var that=this;

            that.dropdown=new Dropdown(that.options);
            that.dropdown.bind('Hide',function () {
                that.$el.removeClass('visible');
            })
        },
        show: function () {
            var that=this,
                pos=that.$el.offset();

            that.dropdown.show();
            that.dropdown.pos(pos.left+that.$el.width(),pos.top+that.$el.height());
        }
    }));

    module.exports=Dropdown;
});
