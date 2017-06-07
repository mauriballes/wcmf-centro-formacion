define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/ready",
    "dojo/topic",
    "../_include/_PageMixin",
    "../_include/_NotificationMixin",
    "../_include/widget/NavigationWidget",
    "./widget/EntityTabWidget",
    "../../model/meta/Model",
    "../../locale/Dictionary",
    "dojo/text!./template/EntityListPage.html"
], function (
    require,
    declare,
    lang,
    config,
    ready,
    topic,
    _Page,
    _Notification,
    NavigationWidget,
    EntityTabWidget,
    Model,
    Dict,
    template
) {
    return declare([_Page, _Notification], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Content'),

        baseRoute: "entity",
        types: config.app.rootTypes,
        type: null,
        hasTree: false,

        constructor: function(params) {
            // allow to override type parameter by request
            var requestType = this.request.getPathParam("type");
            if (requestType) {
                this.type = requestType;
            }
        },

        postCreate: function() {
            this.inherited(arguments);
            this.setTitle(this.title+" - "+Dict.translate(this.type));

            // create widget
            this.buildForm();
        },

        buildForm: function() {
            var typeClass = Model.getType(this.type);
            require([typeClass.listView || './widget/EntityListWidget'], lang.hitch(this, function(View) {
                if (typeof View === 'function') {
                    // create the tab panel
                    var panel = new View({
                        type: this.type,
                        hasTree: this.hasTree,
                        page: this,
                        route: this.baseRoute
                    });
                    panel.own(
                        topic.subscribe("entity-list-widget-created", lang.hitch(this, function(panel) {
                            // create the tab container
                            var tabs = new EntityTabWidget({
                                route: this.baseRoute,
                                types: this.types,
                                page: this,
                                selectedTab: {
                                    oid: this.type
                                },
                                selectedPanel: panel
                            }, this.tabNode);
                            ready(function() {
                                tabs.startup();
                            });
                        }))
                    );
                }
                else {
                    // error
                    this.showNotification({
                        type: "error",
                        message: Dict.translate("List view class for type <em>%0%</em> not found.", [this.type])
                    });
                }
            }));
        }
    });
});