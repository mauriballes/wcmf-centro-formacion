define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/aspect",
    "dojo/_base/window",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/query",
    "dojo/on",
    "dojo/topic",
    "dojo/when",
    "dojo/Deferred",
    "dojomat/_AppAware",
    "dojomat/_StateAware",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "./widget/ConfirmDlgWidget",
    "../../locale/Dictionary",
    "../../User"
], function (
    declare,
    lang,
    config,
    aspect,
    win,
    domAttr,
    domStyle,
    domConstruct,
    query,
    on,
    topic,
    when,
    Deferred,
    _AppAware,
    _StateAware,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    ConfirmDlg,
    Dict,
    User
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _AppAware, _StateAware], {

        request: null,
        router: null,
        session: null,
        inConfirmLeave: false,
        contentOnly: false,

        // Deferred instances to be waited when leaving the page
        deferredList: [],

        // attributes to be overridden by subclasses
        title: '',

        constructor: function(params) {
            this.request = params.request;
            this.router = params.router;
            this.session = params.session;
            this.contentOnly = this.request.getQueryParam("contentOnly") === "1";

            // setup navigation routes even if an error occurs
            aspect.around(this, "startup", function(original) {
                return function() {
                    try {
                        original.call(this);
                    }
                    catch (e) {
                        console.error(e.message);
                        if (this.showNotification) {
                            this.showNotification({
                                type: "error",
                                message: e
                            });
                        }
                    }
                    finally {
                        this.setTitle(this.title);
                        this.createNotificationNode();
                        this.setupRoutes();
                        this.removeRestricted();
                    }
                };
            });
        },

        postCreate: function() {
            this.inherited(arguments);
            this.own(
                // listen to navigate topic
                topic.subscribe("navigate", lang.hitch(this, function(routeName, pathParams, queryParams, windowParams) {
                    var route = this.router.getRoute(routeName);
                    if (!route) { return; }

                    var url = route.assemble(pathParams, queryParams);
                    if (windowParams) {
                        window.open(url, windowParams.name, windowParams.specs);
                    }
                    else {
                        this.pushConfirmed(url);
                    }
                })),
                // listen to reload (callback is called with the current request and returns a
                // boolean, if indicating that the refresh should be executet or not
                topic.subscribe("refresh", lang.hitch(this, function(callback) {
                    if (callback(this.request)) {
                        location.reload();
                    }
                }))
            );

            // hide navigation and footer if requested
            if (this.contentOnly) {
                query(".main-menu").style("display", "none");
                query("#footer").style("display", "none");
            }
        },

        setTitle: function(title) {
            if (title !== config.app.title) {
                this.inherited(arguments, [config.app.title+' - '+title]);
            }
        },

        createNotificationNode: function() {
            domConstruct.place('<div id="notification"></div>', this.domNode);
        },

        /**
         * Set up routing for links with class push.
         * The route name is defined in the link's data-wcmf-route attribute,
         * optional path parameters in data-wcmf-pathparams (e.g. "type:'Page', id:12")
         */
        setupRoutes: function() {
            query('.push', win.body()).forEach(lang.hitch(this, function(node) {
                var routeName = domAttr.get(node, 'data-wcmf-route');
                var route = this.router.getRoute(routeName);
                if (!route) { return; }

                var pathParams, pathParamsStr = domAttr.get(node, 'data-wcmf-pathparams');
                if (pathParamsStr) {
                  pathParams = eval("({ "+pathParamsStr+" })");
                }
                var url = route.assemble(pathParams);
                query('a', node).attr('href', url);

                var queryStr = domAttr.get(node, 'data-wcmf-queryparams');
                if (queryStr) {
                    url += queryStr;
                }

                this.own(on(node, 'click', lang.hitch(this, function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.pushConfirmed(url);
                })));
            }));
        },

        getRoute: function(path) {
            return this.router.getRoute(path);
        },

        /**
         * Push with asking for confimation
         * @param url The url to navigate to
         */
        pushConfirmed: function (url) {
            var deferred = new Deferred();
            if (!this.inConfirmLeave) {
                this.inConfirmLeave = true;
                when(this.confirmLeave(url), lang.hitch(this, function(result) {
                    this.inConfirmLeave = false;
                    if (result === true) {
                        this.pushState(url);
                        deferred.resolve();
                    }
                }));
            }
            return deferred;
        },

        /**
         * Method to be called before the page is left.
         * Subclasses may override this in order to do some validation and veto
         * page leave. The default implementation returns true.
         * @param url The url to navigate to
         * @return Boolean or Promise that resolves to Boolean
         */
        confirmLeave: function(url) {
            // check registered Deferred instances
            var runningDeferredList = [];
            for (var i=0, count=this.deferredList.length; i<count; i++) {
                var curDeferred = this.deferredList[i];
                if (curDeferred && !curDeferred.isFulfilled()) {
                    runningDeferredList.push(curDeferred);
                }
            }
            // let user confirm page leave, if at least one process is still running
            if (runningDeferredList.length > 0) {
                var deferred = new Deferred();
                new ConfirmDlg({
                    title: Dict.translate("Confirm Leave Page"),
                    message: Dict.translate("There are running processes. Leaving the page will abort these processes. Do you want to proceed?"),
                    okCallback: lang.hitch(this, function(dlg) {
                        for (var i=0, count=runningDeferredList.length; i<count; i++) {
                            var curDeferred = runningDeferredList[i];
                            if (!curDeferred.isFulfilled()) {
                                curDeferred.cancel();
                            }
                        }
                        deferred.resolve(true);
                    }),
                    cancelCallback: lang.hitch(this, function(dlg) {
                        deferred.resolve(false);
                    })
                }).show();
                return deferred.promise;
            }
            else {
                return true;
            }
        },

        /**
         * Register a Deferred instance to be waited for, when leaving the page.
         * @param deferred
         */
        waitFor: function(deferred) {
            // cleanup list
            var deferredList = [];
            for (var i=0, count=this.deferredList.length; i<count; i++) {
                var curDeferred = this.deferredList[i];
                if (curDeferred && !curDeferred.isFulfilled()) {
                    deferredList.push(curDeferred);
                }
            }
            this.deferredList = deferredList;
            this.deferredList.push(deferred);
        },

        /**
         * Remove elements that are restricted to certain roles.
         * The role names are defined in the elements data-wcmf-restrict-roles
         */
        removeRestricted: function() {
            query('[data-wcmf-restrict-roles]', win.body()).forEach(lang.hitch(this, function(node) {
                var roles = domAttr.get(node, 'data-wcmf-restrict-roles').split(",");
                for (var i=0, count=roles.length; i<count; i++) {
                    if (!User.hasRole(roles[i])) {
                        domStyle.set(node, "display", "none");
                    }
                }
            }));
        }
    });
});