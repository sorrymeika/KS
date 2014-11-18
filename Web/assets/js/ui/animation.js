define('ui/animations',['zepto'],function (require,exports,module) {
    var animation={
        slide: {
            duration: 300,
            from: "-webkit-transform:translate(100%,0);",
            to: "-webkit-transform:translate(0,0);-webkit-transition: -webkit-transform 300ms ease 0ms;",
            active: "-webkit-transform:none;",
            pause: "-webkit-transform:translate(-100%,0);-webkit-transition: -webkit-transform 300ms ease 0ms;",
            finish: "-webkit-transform:translate(100%,0);-webkit-transition: -webkit-transform 300ms ease 0ms;",
            resume: "-webkit-transform:translate(0,0);-webkit-transition: -webkit-transform 300ms ease 0ms;"
        },
        halfLeft2Right: {
            duration: 300,
            start: "-webkit-transform:translate(0,0);",
            active: "-webkit-transform:translate(5%,0);",
            pause: {},
            finish: {},
            resume: {}
        }
    };

    module.exports=animations;
});
