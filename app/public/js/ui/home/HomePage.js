define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/when",
    "dojo/topic",
    "../_include/_PageMixin",
    "../_include/_NotificationMixin",
    "../_include/widget/NavigationWidget",
    "../_include/widget/GridWidget",
    "../../ui/data/display/Renderer",
    "../../model/meta/Model",
    "../../persistence/HistoryStore",
    "./HistoryEntry",
    "../../action/Edit",
    "../../locale/Dictionary",
    "dojo/text!./template/HomePage.html"
], function (
    require,
    declare,
    lang,
    config,
    when,
    topic,
    _Page,
    _Notification,
    NavigationWidget,
    GridWidget,
    Renderer,
    Model,
    HistoryStore,
    HistoryEntry,
    Edit,
    Dict,
    template
) {
    return declare([_Page, _Notification], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Home'),

        constructor: function(params) {
            // register search result type if not done already
            if (!Model.isKnownType("HistoryEntry")) {
              Model.registerType(new HistoryEntry());
            }
        },

        postCreate: function() {
            this.inherited(arguments);

            // create widget
            this.buildForm();

            this.own(
                topic.subscribe("store-error", lang.hitch(this, function(error) {
                    this.showBackendError(error);
                }))
            );
        },

        buildForm: function() {
            var renderOptions = { truncate: 50 };
            new GridWidget({
                type: "HistoryEntry",
                store: HistoryStore.getStore(),
                height: 400,
                columns: [{
                    label: Dict.translate("_displayValue"),
                    field: "_displayValue",
                    canEdit: false,
                    sortable: true,
                    renderCell: function(object, data, td, options) {
                        var typeClass = Model.getType(object["_type"]);
                        var displayValues = typeClass.displayValues;
                        for (var i=0, count=displayValues.length; i<count; i++) {
                            var displayValue = displayValues[i];
                            when(Renderer.render(object[displayValue],
                                typeClass.getAttribute(displayValue), renderOptions), function(value) {
                                if (value) {
                                    td.innerHTML += value+" ";
                                }
                            });
                        }
                    }
                }, {
                    label: Dict.translate("_type"),
                    field: "_type"
                }, {
                    label: Dict.translate("created"),
                    field: "created"
                }, {
                    label: Dict.translate("creator"),
                    field: "creator"
                }, {
                    label: Dict.translate("modified"),
                    field: "modified"
                }, {
                    label: Dict.translate("last_editor"),
                    field: "last_editor"
                }],
                actions: this.getGridActions(),
                enabledFeatures: []
            }, this.gridNode);
        },

        getGridActions: function() {
            var editAction = new Edit({
                page: this,
                route: "entity"
            });
            return [editAction];
        },

        _navigateContent: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            var type = Model.getSimpleTypeName(config.app.rootTypes[0]);
            var route = this.router.getRoute("entityList");
            var pathParams = { type:type };
            var url = route.assemble(pathParams);
            this.pushState(url);
        },

        _navigateMedia: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            var route = this.router.getRoute("media");
            var url = route.assemble();
            window.open(url, '_blank', 'width=800,height=700');
        }
    });
});