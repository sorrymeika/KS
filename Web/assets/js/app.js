define('app',['$','util'],function(require,exports,module) {

    var $=require('$'),
        util=require('util'),
        isiPhone=/iPhone/.test(navigator.userAgent),
        isAndroid=/Android/.test(navigator.userAgent),
        slice=Array.prototype.slice,
        blankFn=function() { };

    window.hybirdFunctions={};
    window.complete=function() {
        if(isiPhone&&queue.length!=0) {
            queue.shift();
            if(queue.length!=0) location.href=queue.shift();
        }
    };

    window.app_trigger=function() {
        $.fn.trigger.apply($(window),arguments);
    };

    var queue=[],funcguid=0,
        hybird=function(method,params,hybirdCallback) {

            var data={
                method: method
            },
            result,
            hybirdReturn;

            hybirdCallback=typeof params==="function"?params:hybirdCallback;
            params=typeof params==="function"?null:params;

            data.params=params;

            if(typeof hybirdCallback=="function") {
                hybirdReturn="hybirdCallback"+(++funcguid);

                data.callback=hybirdReturn;
                hybirdFunctions[hybirdReturn]=function() {
                    hybirdCallback.apply(null,arguments);
                    delete hybirdFunctions[hybirdReturn];
                };
            }

            if(navigator.platform=="Win32"||navigator.platform=="Win64") {
                switch(data.method) {
                    case 'onload':
                        hybirdFunctions[hybirdReturn]();
                        break;

                    case "selectimage":
                        hybirdFunctions[hybirdReturn]({
                            path: "",
                            src: ""
                        });
                        return;
                }
                return;
            }

            if(isiPhone) {
                var url='execslhybirdjsa:a?'+encodeURIComponent(JSON.stringify(data));
                queue.push(url);
                if(queue.length==1) {
                    location.href=url;
                }
            } else if(isAndroid) {
                prompt(JSON.stringify(data));
            }
            return result;
        };

    var isDebug=false;

    return {
        isAndroid: isAndroid,
        versionName: isAndroid?'1.0':"1.0",
        exec: hybird,
        exitLauncher: function(f) {
            hybird('exitLauncher',function() {
                f&&f();
            });
        },
        tip: function(msg) {
            hybird('tip',msg+"");
        },
        selectImage: function(f) {
            hybird('selectImage',f);
        },
        queryThumbnailList: function(f) {
            hybird('queryThumbnailList',f);
        },
        pickColor: function(f) {
            hybird('pickColor',f);
        },
        share: function() {
            hybird('share');
        },
        isDevelopment: navigator.platform=="Win32"||navigator.platform=="Win64",
        url: function(url) {
            return /^http\:\/\//.test(url)?url:navigator.platform=="Win32"||navigator.platform=="Win64"?url:(url);
        },
        post: function() {
            var args=slice.call(arguments),
                i=0,
                cache=args[i++],
                url=typeof cache!=='string'?args[i++]:cache,
                data=i>=args.length?null:args[i++],
                files=null,
                callback;

            if(typeof data=='function') {
                callback=data;
                data=null;
            } else {
                files=i>=args.length?null:args[i++];
                if(typeof files=='function') {
                    callback=files;
                    files=null;
                } else
                    callback=args[i];
            }

            var postData={
                url: this.url(url)
            }

            if(data) postData.data=data;
            if(files) postData.files=files;

            return hybird('post',postData,function(res) {
                if(cache===true) {
                    if(!res) {
                        var str=localStorage[url+"_"+(postData.data&&postData.data.page?postData.data.page:1)];
                        res=str?util.parse(str):null;
                    } else {
                        localStorage[url+"_"+(postData.data&&postData.data.page?postData.data.page:1)]=JSON.stringify(res);
                    }
                }
                callback(res);
            });
        },
        exit: function() {
            hybird('exit');
        },
        update: function(downloadUrl,versionName,f) {
            hybird('updateApp',{
                downloadUrl: downloadUrl,
                versionName: versionName
            },f);
        }
    };

});
