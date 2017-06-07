define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/promise/all",
    "dojo/topic",
    "dojo/ready",
    "dojo/Deferred",
    "../_include/_PageMixin",
    "../_include/_NotificationMixin",
    "../_include/widget/NavigationWidget",
    "../_include/widget/ConfirmDlgWidget",
    "./widget/EntityTabWidget",
    "../../persistence/Store",
    "../../persistence/Entity",
    "../../model/meta/Model",
    "../../locale/Dictionary",
    "dojo/text!./template/EntityPage.html"
], function (
    require,
    declare,
    lang,
    config,
    all,
    topic,
    ready,
    Deferred,
    _Page,
    _Notification,
    NavigationWidget,
    ConfirmDlg,
    EntityTabWidget,
    Store,
    Entity,
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
        typeClass: null,
        oid: null, // object id of the object to edit
        isNew: false, // boolean weather the object exists or not

        sourceOid: null, // object id of the source object of a relation
                         // (ignored if isNew == false)
        relation: null, // the relation in which the object should be created
                        // related to sourceOid (ignored if isNew == false)
        entity: null, // entity to edit

        language: config.app.defaultLanguage,
        isTranslation: false,
        original: null, // untranslated entity

        constructor: function(params) {
            // allow to override type parameter by request
            var requestType = this.request.getPathParam("type");
            if (requestType) {
                this.type = this.request.getPathParam("type");
            }
            this.typeClass = Model.getType(this.type);

            var idParam = this.request.getPathParam("id");
            this.oid = Model.getOid(this.type, idParam);
            this.isNew = Model.isDummyOid(this.oid);
            this.entity = new Entity({
                oid: this.oid
            });

            this.sourceOid = this.request.getQueryParam("oid");
            this.relation = this.request.getQueryParam("relation");

            this.language = this.request.getQueryParam("lang") || config.app.defaultLanguage;
            this.isTranslation = this.language !== config.app.defaultLanguage;
        },

        postCreate: function() {
            this.inherited(arguments);

            if (!this.isNew) {
                this.setTitle(this.title+" - "+this.oid);

                // create widget when entity is loaded
                var loadPromises = [];
                var store = Store.getStore(this.type, this.language);
                var entityId = store.getIdentity(this.entity);
                // make sure we have the latest version by invalidating the cache
                loadPromises.push(store.getUncached(entityId));
                if (this.isTranslation) {
                  // provide original entity for reference
                  var storeOrig = Store.getStore(this.type, config.app.defaultLanguage);
                  loadPromises.push(storeOrig.getUncached(entityId));
                }
                all(loadPromises).then(lang.hitch(this, function(loadResults) {
                    // allow to watch for changes of the object data
                    this.entity = loadResults[0];
                    this.original = this.isTranslation ? loadResults[1] : {};
                    this.buildForm();
                    this.setTitle(this.title+" - "+this.typeClass.getDisplayValue(this.entity));
                }), lang.hitch(this, function(error) {
                    // error
                    this.showBackendError(error);
                }));
            }
            else {
                // initialize entity instance
                this.entity.setDefaults();
                this.entity.setState("new");
                this.buildForm();
                this.setTitle(this.title+" - "+Dict.translate("New <em>%0%</em>",
                        [Dict.translate(this.type)]));
            }

            this.own(
                topic.subscribe("entity-datachange", lang.hitch(this, function(data) {
                    this.setTitle(this.title+" - "+this.typeClass.getDisplayValue(data.entity));
                }))
            );
        },

        confirmLeave: function(url) {
            if (this.entity && this.entity.getState() === 'dirty') {
                var deferred = new Deferred();
                new ConfirmDlg({
                    title: Dict.translate("Confirm Leave Page"),
                    message: Dict.translate("<em>%0%</em> has unsaved changes. Leaving the page will discard these. Do you want to proceed?",
                        [this.typeClass.getDisplayValue(this.entity)]),
                    okCallback: lang.hitch(this, function(dlg) {
                        this.entity.setState('clean');
                        deferred.resolve(true);
                    }),
                    cancelCallback: lang.hitch(this, function(dlg) {
                        deferred.resolve(false);
                    })
                }).show();
                return deferred.promise;
            }
            return this.inherited(arguments);
        },

        buildForm: function() {
            require([this.typeClass.detailView || './widget/EntityFormWidget'], lang.hitch(this, function(View) {
                if (typeof View === 'function') {
                    // create the tab panel
                    var panel = new View({
                        entity: this.entity,
                        original: this.original,
                        sourceOid: this.isNew ? this.sourceOid : undefined,
                        relation: this.isNew ? this.relation : undefined,
                        language: this.language,
                        page: this
                    });
                    panel.own(
                        topic.subscribe("entity-form-widget-created", lang.hitch(this, function(panel) {
                            // create the tab container
                            var tabs = new EntityTabWidget({
                                route: this.baseRoute,
                                types: this.types,
                                page: this,
                                selectedTab: {
                                    oid: this.oid
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
                        message: Dict.translate("Detail view class for type <em>%0%</em> not found.", [this.type])
                    });
                }
            }));
        }
    });
});