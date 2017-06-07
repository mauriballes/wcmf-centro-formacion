define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/dom",
    "dojo/dom-geometry",
    "dojo/topic",
    "dojo/window",
    "dijit/registry",
    "../_include/_PageMixin",
    "../_include/_NotificationMixin",
    "dijit/tree/ObjectStoreModel",
    "dijit/Tree",
    "dijit/layout/TabContainer",
    "dijit/layout/ContentPane",
    "../../persistence/TreeStore",
    "../../locale/Dictionary",
    "dojo/text!./template/BrowsePage.html",
    "dojo/domReady!"
], function (
    require,
    declare,
    lang,
    config,
    dom,
    domGeom,
    topic,
    win,
    registry,
    _Page,
    _Notification,
    ObjectStoreModel,
    Tree,
    TabContainer,
    ContentPane,
    TreeStore,
    Dict,
    template
) {
    return declare([_Page, _Notification], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Content'),

        postCreate: function() {
            this.inherited(arguments);

            // tab navigation
            registry.byId("tabContainer").watch("selectedChildWidget", lang.hitch(this, function(name, oval, nval){
                if (nval.id === "mediaTab") {
                    window.location.assign(config.app.pathPrefix+'media?'+this.request.getQueryString());
                }
            }));

            var store = TreeStore.getStore();
            var model = new ObjectStoreModel({
                store: store,
                labelAttr: "displayText",
                query: {oid: 'init'}
            });

            var tree = new Tree({
                model: model,
                showRoot: false,
                onClick: lang.hitch(this, function(item) {
                    this.onItemClick(item);
                })
            });
            topic.subscribe("store-error", lang.hitch(this, function(error) {
                this.showBackendError(error);
            }));
            tree.placeAt(dom.byId('resourcetree'));
            tree.startup();
            domGeom.setContentSize(tree.domNode, { h: win.getBox().h-40 });
        },

        onItemClick: function(item) {
            if (item.isFolder) {
                return;
            }
            var funcNum = this.request.getQueryParam('CKEditorFuncNum');
            var cleanupFuncNum = this.request.getQueryParam('CKEditorCleanUpFuncNum');
            var callback = this.request.getQueryParam('callback');
            var isWindow = window.opener;

            var value = 'link://'+this.getItemUrl(item);
            var ckeditor = isWindow ? window.opener.CKEDITOR : parent.CKEDITOR;
            if (ckeditor && funcNum) {
                ckeditor.tools.callFunction(funcNum, value, function() {
                    // callback executed in the scope of the button that called the file browser
                    // see: http://docs.ckeditor.com/#!/guide/dev_file_browser_api Example 4
                    //
                    // set the protocol to 'other'
                    // see: http://ckeditor.com/forums/CKEditor-3.x/Tutorial-how-modify-Links-Plugin-link-cms-pages
                    var dialog = this.getDialog();
                    if (dialog.getName() === 'link') {
                        dialog.setValueOf('info', 'protocol', '');
                    }
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
            return item.oid;
        }
    });
});