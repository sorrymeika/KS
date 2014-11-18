define(['$','util','./../view'],function (require,exports,module) {
    var $=require('$'),
        _=require('util'),
        view=require('./../view'),
        tmpl=require('./../tmpl');

    var Slider=view.extend({
        events: {
            'touchstart': '_start',
            'touchmove': '_move',
            'touchend': '_end'
        },
        options: {
            index: -1,
            width: '100%',
            onChange: null,
            data: [],
            dots: false,
            imagelazyload: false,
            arrow: false
        },
        loop: false,
        index: 0,
        appendItem: function () {
            var item=$(this.renderItem(''));
            this.$slider.append(item);
            this.length++;
            this._adjustWidth();

            return item;
        },
        prependItem: function () {
            var item=$(this.renderItem(''));
            this.$slider.prepend(item);
            this.length++;
            this._adjustWidth();

            return item;
        },
        render: function (dataItem) {
            return this.renderItem(this.itemTemplate(dataItem));
        },
        renderItem: tmpl('<li class="js_slide_item">{%html $data%}</li>'),
        itemTemplate: '${TypeName}',
        navTemplate: tmpl('<ol class="js_slide_navs">{%each(i,item) items%}<li class="slide_nav_item${current}"></li>{%/each%}</ol>'),
        template: tmpl('<div class="slider"><ul class="js_slider">{%html items%}</ul>{%html navs%}</div>'),
        initialize: function () {
            $.extend(this,_.pick(this.options,['data','width','loop','render','template','itemTemplate','navTemplate']));

            var that=this,
                data=that.data,
                items=[],
                item,
                $slider,
                index=that.options.index;

            typeof that.itemTemplate==='string'&&(that.itemTemplate=tmpl(that.itemTemplate));
            typeof that.width=='string'&&(that.width=parseInt(that.width.replace('%','')));

            !$.isArray(data)&&(data=[data]);

            that.length=data.length;

            for(var i=0,n=data.length;i<n;i++) {
                items.push(that.render(data[i]));
            }

            that.$root=$(that.template({
                items: items.join('')
            })).appendTo(that.$el);

            $slider=that.$slider=that.$('.js_slider');
            that.$items=$slider.children();
            that.slider=$slider[0];
            that.slider.style['-webkit-transition']="-webkit-transform 0ms ease 0ms";

            that.index=index== -1?that.length%2==0?that.length/2-1:Math.floor(that.length/2):index;
            if(that.length<2) that.loop=false;
            else if(that.width<100) that.loop=false;

            var length;
            if(that.loop) {
                $slider.prepend(that.$items.eq(that.length-1).clone());
                $slider.append(that.$items.eq(0).clone());
            } else {
                length=that.length;
            }

            that._adjustWidth();

            that._refreshXY();

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

        _adjustWidth: function () {

            var that=this,
                slider=that.$slider,
                children=slider.children(),
                length=children.length;

            slider.css({ 'margin-left': (100-that.width)/2-(that.loop?that.width:0)+'%' });
            children.css({ width: 100/length+'%' });
            slider.css({ width: length*that.width+'%' });

            that.itemWidth=that.$items.width();
            that.minX= -1*that.itemWidth*(that.length-1);
            that.slider.style['-webkit-transform']='translate('+that.itemWidth*that.index* -1+'px,0px)';

        },

        _refreshXY: function () {
            var that=this,
                matix=getComputedStyle(that.slider,null)["-webkit-transform"].replace(/[^0-9\-.,]/g,'').split(',');

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

            that._refreshXY();

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
                x=x>0?0:x<that.minX?that.minX:x;
            }

            that._stopChange();

            that._pos(x,that.startY);
        },
        _pos: function (x,y) {
            var that=this,
                slider=that.slider;

            that.x=x||0;
            that.y=y||0;

            slider.style["-webkit-transform"]='translate('+that.x+'px,'+that.y+'px) translateZ(0)';
        },
        _transitionEnd: function () {
            var that=this;
            that._transitionTime(0);
        },
        _delayChange: function () {
            var that=this;

            that.timer=setTimeout(function () {
                that.timer=false;
                that.options.onChange&&that.options.onChange.call(that,that.index);
                that.trigger('Change',that.index);
            },400);
        },
        _stopChange: function () {
            var that=this;
            if(that.timer) {
                clearTimeout(that.timer);
                that.timer=false;
            }
        },
        _end: function (e) {
            var that=this,
                point=e.changedTouches[0],
                changeX=that.pointX-point.pageX,
                x;

            if(!that._isStart) return;
            that._isStart=false;

            if(!that.loop&&(that.startX-changeX>0||that.startX-changeX<that.minX)) {
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
        slideTo: function (to) {
            var that=this;

            if(that.isTransition) return;
            that.isTransition=true;

            that._transitionTime(200);

            x=that.itemWidth*to* -1;

            if(to>=that.length) to=0;
            else if(to<0) to=that.length-1;

            var timer=setTimeout(function () {
                timer=false;
                that.isTransition=false;
            },300);

            that.$slider.one($.fx.transitionEnd,function () {
                timer&&clearTimeout(timer);
                that.isTransition=false;
                that._transitionEnd();

                if(to==that.length-1||to==0) {
                    that._pos(that.itemWidth*to* -1,that.startY);
                }
            });

            that._pos(x,that.startY);

            if(that.index!=to) {
                that.index=to;
                that._delayChange();
            }
        }
    });

    module.exports=Slider;
});
