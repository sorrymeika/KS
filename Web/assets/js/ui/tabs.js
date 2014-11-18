define('ui/tabs',['$','ui/sl'],function (require,exports,module) {
    var $=require('zepto'),
        sl=require('ui/sl');

    var Tabs=sl.View.extend({
        events: {
            'tap .tabs-nav>ul>li:not(.curr)': function (e) {
                this.to($(e.currentTarget).index());
            },
            'touchstart .tabs-nav>ul': '_start',
            'touchmove': '_move',
            'touchend': '_end'
        },
        options: {
            data: [],
            onChange: null
        },
        slideIndex: 0,
        index: -1,
        init: function () {
            var that=this,
                data=that.options.data;

            if(that.options.render) that.render=$.proxy(that.options.render,that);
            that.options.onChange&&that.bind('Change',that.options.onChange);

            that.data=data;
            that.$el.addClass('tabs');

            var $tabsNav=$('<div class="tabs-nav"><ul></ul></div>').appendTo(that.$el),
                $content=$('<div class="tabs-content"></div>').appendTo(that.$el),
                minHeight=window.innerHeight-$content.offset().top;

            that.$nav=$tabsNav.find('ul');
            that.nav=that.$nav[0];
            that.$content=$content.css({ minHeight: minHeight });

            if(that.data.length>4) {
                that.$nav.css({ width: 25*that.data.length+'%' });
            }

            $.each(that.data,function (i,item) {
                that.render(item);
            });
            that.$navItems=that.$nav.children();
            that.$panels=$content.children().css({
                minHeight: minHeight
            });

            that.itemWidth=that.$navItems.eq(0).width();
            that.minSlideIndex=0;
            that.maxSlideIndex=that.$navItems.length-4;
            that.minX= -1*that.itemWidth*(that.maxSlideIndex);
            that.maxX=that.minSlideIndex*that.itemWidth;
            that._getXY();

            $(window).on('ortchange',function () {
            });
            that.to(0);
        },
        render: function (dataItem) {
            this.$nav.append('<li>'+dataItem.title+'</li>');
            this.$content.append('<div class="tabs-panel">'+(dataItem.content||'')+'</div>');
        },
        to: function (index) {
            var that=this;

            if(that.index!=index) {
                var $panel=that.$panels.eq(index);
                if(that.index== -1) {
                    var panel=$panel.addClass('curr').css({
                        '-webkit-transition-duration': '0ms',
                        position: 'relative'
                    })[0];

                    panel.clientHeight;
                    panel.style['-webkit-transition-duration']='';

                } else {
                    that.$navItems.eq(that.index).removeClass('curr');
                    that.$panels.eq(that.index)
                        .css({
                            '-webkit-transform': 'translate(0,0)',
                            position: ''
                        })
                        .removeClass('curr').css({
                            '-webkit-transform': 'translate('+(that.index<index?'-':'')+'100%,0)'
                        })
                        .one($.fx.transitionEnd,function () {
                            this.style.height=0;
                        });

                    $panel.css({
                        height: '',
                        '-webkit-transform': 'translate('+(that.index<index?'':'-')+'100%,0)'
                    })[0].clientHeight;

                    $panel.css({
                        '-webkit-transform': '',
                        position: 'relative'
                    })
                    .addClass('curr');
                }
                that.$navItems.eq(index).addClass('curr');
                that.index=index;
                that.trigger('Change',$panel,that.options.data[index],index);
            }
        },
        _pos: function (x,y) {
            var that=this,
                nav=that.nav;

            nav.style["-webkit-transform"]='translate('+x+'px,'+y+'px)';

            that.x=x;
            that.y=y;
        },
        _transitionTime: function (time) {
            time+='ms';
            this.nav.style['-webkit-transition-duration']=time;
        },
        _transitionEnd: function () {
            var that=this;
            that._transitionTime(0);
        },
        _getXY: function () {
            var that=this,
                matix=getComputedStyle(that.nav,null)["-webkit-transform"].replace(/[^0-9\-.,]/g,'').split(',');

            that.x=parseInt(matix[4]);
            that.y=parseInt(matix[5]);
        },
        _isStart: false,
        _start: function (e) {
            if(this.data.length<=4) {
                return;
            }

            var that=this,
                point=e.touches[0];

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

            e.preventDefault();

            var that=this,
                point=e.touches[0],
                changeX=that.pointX-point.pageX,
                x=that.startX-changeX;

            x=x>0?0:x<that.minX?that.minX:x;

            that._pos(x,that.startY);
        },

        _end: function (e) {
            if(this.data.length<=4) return;

            var that=this,
                point=e.changedTouches[0],
                changeX=that.pointX-point.pageX,
                x;
            that._isStart=false;

            e.preventDefault();

            if(changeX==0) {
            } else {
                if(changeX>20) {
                    that.slideIndex<that.maxSlideIndex&&(that.slideIndex++);
                } else if(changeX< -20) {
                    that.slideIndex>that.minSlideIndex&&(that.slideIndex--);
                }

                that._transitionTime(200);

                x=that.itemWidth*(that.slideIndex)* -1;

                that.$nav.one($.fx.transitionEnd,function () {
                    that._transitionEnd();
                });
                that._pos(x,that.startY);
            }
        }
    });

    sl.zeptolize('Tabs',Tabs);

    module.exports=Tabs;
});
