define('ui/slider',['$','ui/sl'],function (require,exports,module) {
    var $=require('$'),
        sl=require('ui/sl');

    var Slider=sl.View.extend({
        events: {
            'touchstart': '_start',
            'touchmove': '_move',
            'touchend': '_end'
        },
        options: {
            index: -1,
            loop: true,
            width: 50,
            onChange: null,
            data: [],
            render: null,
            imagelazyload: false,
            arrow: false
        },
        loop: true,
        data: [],
        index: 0,
        render: function (dataItem) {
            this.$slider.append('<li>'+dataItem.TypeName+'</li>');
        },
        init: function () {
            var that=this;

            that.loop=that.options.loop;

            if(typeof that.options.width=='string')
                that.options.width=parseInt(that.options.width.replace('%',''));

            if(that.options.render) that.render=$.proxy(that.options.render,that);

            var $slider=that.$('ul');

            if(!$slider.length) {
                that.$slider=$slider=$('<ul></ul>').appendTo(that.$el);
                that.data=that.options.data;

                $.each(that.data,function (i,item) {
                    that.render(item);
                });
                that.$items=$slider.children();

            } else {
                that.$slider=$slider;
                that.data=that.$items=$slider.children();
            }

            that.length=that.$items.length;

            that.index=that.options.index== -1?that.length%2==0?that.length/2-1:Math.floor(that.length/2):that.options.index;
            that.currData=that.data[that.index];

            if(that.length<2) {
                console.log('传入data的length必须大于2');
                that.destory();
                return;
            }
            else if(that.length<4) that.loop=false;

            var length;
            if(that.loop) {
                length=that.length+2;
                that.$items.eq(0).before(that.$items.eq(that.length-1).clone());
                that.$items.eq(that.length-1).after(that.$items.eq(0).clone());
            } else {
                length=that.length;
            }

            $slider.css({ width: length*that.options.width+'%' });
            $slider.children().css({ width: 100/length+'%' });

            that.itemWidth=that.$items.width();
            $slider.css({ 'margin-left': (100-that.options.width*3)/2-(that.loop?that.options.width:0)+'%' });

            that.minX= -1*that.itemWidth*(that.length-2);
            that.slider=that.$slider[0];

            that.slider.style['-webkit-transform']='translate('+that.itemWidth*(that.index-1)* -1+'px,0px)';
            that.slider.style['-webkit-transition']="-webkit-transform 0ms ease 0ms";

            that._getXY();

            if(that.options.imagelazyload) {
                that.bind("Change",function () {
                    that._loadImage();
                });
                that._loadImage();
            }

            if(that.options.arrow) {
                that._prev=$('<span class="slider-pre js_pre"></span>').appendTo(that.$el);
                that._next=$('<span class="slider-next js_next"></span>').appendTo(that.$el);

                that.listen('tap .js_pre',function (e) {
                    that.slideTo(that.index-1);
                })
                .listen('tap .js_next',function (e) {
                    that.slideTo(that.index+1);
                });
            }

            $(window).on('ortchange',function () {
                that.itemWidth=that.$items.width();
                that._pos(that.itemWidth*(that.index-1)* -1,that.y);
            });
        },

        _loadImage: function () {
            var that=this;

            var item=that.$items.eq(that.index);
            if(!item.prop('_detected')) {

                if(that.loop) {
                    if(that.index==0) {
                        item=item.add(that.$slider.children(':last-child'));
                    } else if(that.index==that.length-1) {
                        item=item.add(that.$slider.children(':first-child'));
                    }
                }

                item.find('img[lazyload]').each(function () {
                    this.src=this.getAttribute('lazyload');
                    this.removeAttribute('lazyload');
                });

                item.prop('_detected',true);
            }
        },

        _getXY: function () {
            var that=this,
                matix=getComputedStyle(that.$slider[0],null)["-webkit-transform"].replace(/[^0-9\-.,]/g,'').split(',');

            that.x=parseInt(matix[4]);
            that.y=parseInt(matix[5]);
        },

        _transitionTime: function (time) {
            time+='ms';
            this.slider.style['-webkit-transition-duration']=time;
        },
        _start: function (e) {
            var that=this,
                point=e.touches[0];

            if(/js_pre|js_next/.test(e.target.className)) {
                return;
            }

            if(that.isTransition) return;

            that._stopChange();

            that._isStart=true;
            that._transitionTime(0);

            that._getXY();

            that.startX=that.x;
            that.startY=that.y;
            that.pointX=point.pageX;
            that.pointY=point.pageY;
        },
        _move: function (e) {
            if(!this._isStart) return;

            var that=this,
                point=e.touches[0],
                changeX=that.pointX-point.pageX,
                changeY=that.pointY-point.pageY,
                x=that.startX-changeX;

            that.moveX=point.pageX;

            if(changeY<20||changeX>changeY)
                e.preventDefault();

            if(!that.loop) {
                x=x>that.itemWidth?that.itemWidth:x<that.minX?that.minX:x;
            }

            that._stopChange();

            that._pos(x,that.startY);
        },
        _pos: function (x,y) {
            var that=this,
                slider=that.slider;

            that.x=x||0;
            that.y=y||0;

            slider.style["-webkit-transform"]='translate('+that.x+'px,'+that.y+'px)';
        },
        _transitionEnd: function () {
            var that=this;
            that._transitionTime(0);
        },
        _change: function (currData) {
            var that=this;

            that._changeTimer=setTimeout(function () {
                that._changeTimer=false;
                that.currData=currData;
                that.options.onChange&&that.options.onChange.call(that,currData,that.index);
            },400);

            that.trigger('Change',currData,that.index);
        },
        _stopChange: function () {
            var that=this;
            if(that._changeTimer) {
                that._changeTimer=false;
                clearTimeout(that._changeTimer);
            }
        },
        _end: function (e) {
            var that=this,
                point=e.changedTouches[0],
                changeX=that.pointX-point.pageX,
                x;

            if(!that._isStart) return;
            that._isStart=false;

            if(!that.loop&&(that.startX-changeX>that.itemWidth||that.startX-changeX<that.minX)) {
            } else {

                var index=that.index;
                if(changeX>20) {
                    index++;
                } else if(changeX< -20) {
                    index--;
                } else if(that.loop) {
                }

                that.slideTo(index);
            }
        },
        guid: 0,
        slideTo: function (to) {
            var that=this,
                data=that.data[to];


            if(that.isTransition) return;
            that.isTransition=true;

            that._transitionTime(200);

            x=that.itemWidth*(to-1)* -1;

            if(to>=that.length) to=0;
            else if(to<0) to=that.length-1;

            that.$slider.one($.fx.transitionEnd,function () {
                that.isTransition=false;
                that._transitionEnd();

                if(to==that.length-1||to==0) {
                    that._pos(that.itemWidth*(to-1)* -1,that.startY);
                }
            });
            that._pos(x,that.startY);

            if(that.index!=to) {
                that.index=to;
                that._change(data);
            }
        },
        getData: function () {
            return this.currData;
        }
    });

    module.exports=Slider;
});
