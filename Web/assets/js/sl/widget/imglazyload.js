define(['$','extend/scrollStop','extend/ortchange'],function (require,exports,module) {
    var $=require('$'),
        tmpl=require('./../tmpl'),
        sl=require('./../base'),
        view=require('./../view'),
        splice=Array.prototype.splice;

    require('extend/scrollStop');
    require('extend/ortchange');

    var imageLazyLoad=view.extend({
        options: {
            threshold: 0,
            container: window,
            urlName: 'data-url',
            eventName: 'scrollStop',
            innerScroll: false,
            isVertical: true
        },

        initialize: function () {
            var that=this,
                opts=that.options,
                $viewPort=$(opts.container),
                isVertical=opts.isVertical,
                isWindow=$.isWindow($viewPort.get(0)),
                OFFSET={
                    win: [isVertical?'scrollY':'scrollX',isVertical?'innerHeight':'innerWidth'],
                    img: [isVertical?'top':'left',isVertical?'height':'width']
                },
                isImg=that.$el.is('img');

            !isWindow&&(OFFSET['win']=OFFSET['img']);   //若container不是window，则OFFSET中取值同img

            that.isImg=isImg;
            that.isWindow=isWindow;
            that.OFFSET=OFFSET;
            that.$viewPort=$viewPort;
            that.pedding=[];

            that.add(that.$el);

            $(document).ready(function () {    //页面加载时条件检测
                that.detect();
            });

            !opts.innerScroll&&that.listenTo($(window),opts.eventName+' ortchange',function () {    //不是内滚时，在window上绑定事件
                that.detect();
            });
        },

        add: function (el) {
            this.pedding=Array.prototype.slice.call($(this.pedding).add(el),0).reverse();    //更新pedding值，用于在页面追加图片
            this.detect();
        },

        _load: function (div) {     //加载图片，并派生事件
            var that=this,
                $div=$(div),
                attrObj={},
                $img=$div,
                opts=that.options;

            if(!this.isImg) {
                $.each($div.get(0).attributes,function () {   //若不是img作为容器，则将属性名中含有data-的均增加到图片上
                    ~this.name.indexOf('data-')&&(attrObj[this.name]=this.value);
                });
                $img=$('<img />').attr(attrObj);
            }
            $div.trigger('startload');
            $img.on('load',function () {
                !that.isImg&&$div.replaceWith($img);     //若不是img，则将原来的容器替换，若是img，则直接将src替换
                $div.trigger('loadcomplete');
                $img.off('load');
            }).on('error',function () {     //图片加载失败处理
                var errorEvent=$.Event('error');       //派生错误处理的事件
                $div.trigger(errorEvent);
                errorEvent.defaultPrevented||pedding.push(div);
                $img.off('error').remove();
            }).attr('src',$div.attr(opts.urlName));

        },

        isInViewport: function (offset) {      //图片出现在可视区的条件
            var opts=this.options,
                viewOffset=this.isWindow?window:this.$viewPort.offset(),
                OFFSET=this.OFFSET,
                viewTop=viewOffset[OFFSET.win[0]],
                viewHeight=viewOffset[OFFSET.win[1]];
            return viewTop>=offset[OFFSET.img[0]]-opts.threshold-viewHeight&&viewTop<=offset[OFFSET.img[0]]+offset[OFFSET.img[1]];
        },

        detect: function () {
            var that=this,i,$image,offset,div,pedding=that.pedding;
            for(i=pedding.length;i--;) {
                $image=$(div=pedding[i]);
                offset=$image.offset();
                that.isInViewport(offset)&&(splice.call(pedding,i,1),that._load(div));
            }
        }
    });

    return imageLazyLoad;
});
