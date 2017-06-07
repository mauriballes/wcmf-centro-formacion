define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/query",
    "dojo/dom-construct",
    "dijit/registry",
    "routed/Request",
    "dojomat/Application",
    "dojomat/populateRouter",
    "./routing-map",
    "./Startup",
    "./AuthToken",
    "dojo/domReady!"
], function (
    require,
    declare,
    lang,
    config,
    query,
    domConstruct,
    registry,
    Request,
    Application,
    populateRouter,
    routingMap,
    Startup,
    AuthToken
) {
    return declare([Application], {

        constructor: function () {
            populateRouter(this, routingMap);
            Startup.run().then(lang.hitch(this, function(result) {

                // get initially requested route
                var baseUrl = config.app.backendUrl;
                var request = new Request(window.location.href);
                var route = request.getPathname().replace(baseUrl, '');

                // redirect to login, if another route is requested and no
                // authentication cookie is found
                if (AuthToken.get() === undefined && route !== "") {
                    window.location.assign(baseUrl+'?route='+route);
                }
                else {
                    this.run();
                }
            }), lang.hitch(this, function(error) {
                // error
            }));
        },

        setPageNode: function () {
            var tag = 'div',
                attributes = { id: this.pageNodeId },
                refNode = query('#wrap')[0],
                position = 'first';

            if (registry.byId(this.pageNodeId)) {
                registry.byId(this.pageNodeId).destroyRecursive();
            }

            domConstruct.create(tag, attributes, refNode, position);
        },

        handleState: function () {
            this.inherited(arguments);
        },

        makeNotFoundPage: function () {
            var request = new Request(window.location.href),
                makePage = function (Page) {
                    this.clearCss();
                    this.prepareDomNode();

                    var page = new Page({
                        request: request,
                        router: this.router
                    }, this.domNode);

                    this.notification.clear();
                    page.startup();
                }
            ;
            require(['./ui/error/NotFoundPage'], lang.hitch(this, makePage));
        },

        makeErrorPage: function (error) {
            var request = new Request(window.location.href),
                makePage = function (Page) {
                    this.clearCss();
                    this.prepareDomNode();

                    var page = new Page({
                        request: request,
                        router: this.router,
                        error: error
                    }, this.domNode);

                    this.notification.clear();
                    page.startup();
                }
            ;
            require(['./ui/error/ErrorPage'], lang.hitch(this, makePage));
        },

        makePage: function (request, widget, layers, stylesheets) {
            this.inherited(arguments);
        },

        setCss: function (css, media) {
            var css = css || '', media = media || 'all';

            domConstruct.create(
                'link',
                { media: media, href: css, rel: 'stylesheet' },
                query('head')[0],
                'last'
            );
        }
    });
});