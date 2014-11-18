define('ui/dotslider',['$','ui/sl','ui/slider'],function (require,exports,module) {
    var $=require('$'),
        sl=require('ui/sl'),
        Slider=require('ui/slider');

    module.exports=Slider.extend({
        options: {
            dots: true
        },
        init: function () {
            var that=this;

            that.superClass.init.call(that);

            var i=1;
            that.$dots=$("<ol>"+new Array(that.length+1).join('<li>a</li>').replace(/a/g,function () {
                return i++;
            })+"</ol>").appendTo(that.$el).children('li');

            that.$dots.eq(that.index).addClass('curr');

            that.bind('Change',function () {
                that.$dots.removeClass('curr').eq(that.index).addClass('curr');
            });
        }
    });
});
