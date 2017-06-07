var elFinder = {};

define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/window",
    "dijit/registry",
    "../_include/_PageMixin",
    "jquery/jquery.min",
    "jquery-ui/jquery-ui.min",
    "../../config/elfinder_config",
    "elfinder/js/elfinder.full",
    //"elfinder/js/i18n/elfinder.de",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "../../AuthToken",
    "../../locale/Dictionary",
    "dojo/text!./template/BrowsePage.html",
    "dojo/domReady!"
], function (
    require,
    declare,
    lang,
    config,
    win,
    registry,
    _Page,
    jQuery,
    jQueryUi,
    elFinderConfig,
    elFinder,
    //i18n_elfinderDe,
    TabContainer,
    ContentPane,
    AuthToken,
    Dict,
    template
) {
    return declare([_Page], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Media'),

        elfinderInstance: null,

        constructor: function(params) {
            declare.safeMixin(this, params);
            // get package locations
            var packageLocations = {};
            for(var i=0, count=config.packages.length; i<count; i++) {
                var curPackage = config.packages[i];
                packageLocations[curPackage.name] = curPackage.location;
            }
            // add elfinder css
            this.setCss(packageLocations['jquery-ui']+'/themes/smoothness/jquery-ui.min.css', 'all');
            this.setCss(packageLocations['elfinder']+'/css/elfinder.min.css', 'all');
            this.setCss(packageLocations['elfinder']+'/css/theme.css', 'all');
        },

        postCreate: function() {
            this.inherited(arguments);

            // tab navigation
            registry.byId("tabContainer").watch("selectedChildWidget", lang.hitch(this, function(name, oval, nval){
                if (nval.id === "contentTab") {
                    window.location.assign(config.app.pathPrefix+'link?'+this.request.getQueryString());
                }
            }));

            var directory = this.request.getQueryParam("directory");
            var customHeaders = {};
            customHeaders[AuthToken.name] = AuthToken.get();
            lang.mixin(elfinderConfig, {
                lang: config.app.uiLanguage,
                url: config.app.backendUrl+'media/files?directory='+directory,
                rememberLastDir: true,
                resizable: false,
                width: '100%',
                height: win.getBox().h - 40,
                getFileCallback: lang.hitch(this, function(file) {
                    this.onItemClick(file);
                }),
                customHeaders: customHeaders
            });

            setTimeout(function() {
                this.elfinderInstance = $("#elfinder").elfinder(elfinderConfig).elfinder('instance');
            }, 500);
        },

        onItemClick: function(item) {
            var funcNum = this.request.getQueryParam('CKEditorFuncNum');
            var cleanupFuncNum = this.request.getQueryParam('CKEditorCleanUpFuncNum');
            var callback = this.request.getQueryParam('callback');
            var isWindow = window.opener;

            var value = this.getItemUrl(item);
            var ckeditor = isWindow ? window.opener.CKEDITOR : parent.CKEDITOR;
            if (ckeditor && funcNum) {
                ckeditor.tools.callFunction(funcNum, value, function() {
                    // callback executed in the scope of the button that called the file browser
                    // see: http://docs.ckeditor.com/#!/guide/dev_file_browser_api Example 4
                });
                if (!isWindow && cleanupFuncNum) {
                    ckeditor.tools.callFunction(cleanupFuncNum);
                }
            }
            else if (callback) {
                var cb = isWindow ? window.opener[callback] : parent[callback];
                if (typeof cb === 'function') {
                    cb(value);
                }
            }
            if (isWindow) {
                window.close();
            }
        },

        getItemUrl: function(item) {
            item = decodeURIComponent(item.url);
            return config.app.mediaSavePath+item.replace(config.app.mediaBaseUrl, '');
        }
    });
});