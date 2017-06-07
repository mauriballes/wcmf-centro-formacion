define( [
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/promise/all",
    "dojo/topic",
    "dojo/Deferred",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "../../_include/_NotificationMixin",
    "../../_include/widget/GridWidget",
    "../../_include/widget/Button",
    "../../../action/CheckPermissions",
    "../../../model/meta/Model",
    "../../../persistence/RelationStore",
    "../../../action/Edit",
    "../../../action/Copy",
    "../../../action/Link",
    "../../../action/Unlink",
    "../../../action/Delete",
    "../../../action/CreateInRelation",
    "../../../action/Permissions",
    "../../../locale/Dictionary",
    "dojo/text!./template/EntityRelationWidget.html"
],
function(
    require,
    declare,
    lang,
    all,
    topic,
    Deferred,
    domClass,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    _NotificationMixin,
    GridWidget,
    Button,
    CheckPermissions,
    Model,
    RelationStore,
    Edit,
    Copy,
    Link,
    Unlink,
    Delete,
    CreateInRelation,
    Permissions,
    Dict,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _NotificationMixin], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,

        route: '',
        entity: {},
        relation: {},
        type: null,
        typeClass: null,
        page: null,
        gridWidget: null,

        constructor: function(args) {
            declare.safeMixin(this, args);

            // labels
            var relationName = this.relation.name +
                    (parseInt(this.relation.maxMultiplicity) !== 1 ? " [Pl.]" : '');
            this.relationName = Dict.translate(relationName);

            this.type = Model.getFullyQualifiedTypeName(this.relation.type);
            this.typeClass = Model.getType(this.type);
            this.multiplicity = this.relation.maxMultiplicity;
        },

        postCreate: function() {
            this.inherited(arguments);

            var deferredList = [];

            // check permissions
            var requiredPermissions = [
                this.type+'??create',
                this.type+'??copy',
                this.type+'??delete',
                '??setPermissions'
            ];
            deferredList.push(new CheckPermissions({
                operations: requiredPermissions
            }).execute());

            all(deferredList).then(lang.hitch(this, function(results) {
                this.permissions = results[0].result ? results[0].result : {};

                var enabledFeatures = [];
                if (this.relation.isSortable) {
                    enabledFeatures.push('DnD');
                }

                this.gridWidget = new GridWidget({
                    type: this.relation.type,
                    store: RelationStore.getStore(this.entity.get('oid'), this.relation.name),
                    columns: Model.getType(this.type).getAttributes({exclude: ['DATATYPE_IGNORE']}).map(function(attribute) {
                        return attribute.name;
                    }),
                    actions: this.getGridActions(),
                    enabledFeatures: enabledFeatures
                }, this.gridNode);
                this.gridWidget.startup();
                domClass.add(this.gridWidget.gridNode, "multiplicity-"+this.relation.maxMultiplicity);
                domClass.add(this.gridWidget.gridNode, "relation-"+this.relation.thisEndName+"-"+this.relation.name);

                this.createBtn.set("disabled", this.relation.aggregationKind === "none" ||
                        this.permissions[this.type+'??create'] !== true);
                this.linkBtn.set("disabled", this.relation.aggregationKind === "composite");
            }));

            this.own(
                topic.subscribe('ui/_include/widget/GridWidget/dnd-start', lang.hitch(this, function(error) {
                    this.showNotification({
                        type: "process",
                        message: Dict.translate("Saving data")
                    });
                })),
                topic.subscribe('ui/_include/widget/GridWidget/dnd-end', lang.hitch(this, function(error) {
                    this.showNotification({
                        type: "ok",
                        message: Dict.translate("Finished"),
                        fadeOut: true
                    });
                }))
            );
        },

        getGridActions: function() {
            var actions = [];

            var editAction = new Edit({
                page: this.page,
                route: this.route
            });
            actions.push(editAction);

            if (this.permissions[this.type+'??copy'] === true) {
                var copyAction = new Copy({
                    targetoid: this.entity.get('oid'),
                    init: lang.hitch(this, function(data) {
                        this.showNotification({
                            type: "process",
                            message: Dict.translate("Copying <em>%0%</em>", [this.typeClass.getDisplayValue(data)])
                        });
                    }),
                    callback: lang.hitch(this, function(response) {
                        // success
                        this.showNotification({
                            type: "ok",
                            message: Dict.translate("<em>%0%</em> was successfully copied", [this.typeClass.getDisplayValue(response)]),
                            fadeOut: true
                        });
                        this.gridWidget.refresh();
                    }),
                    errback: lang.hitch(this, function(error) {
                        // error
                        this.showBackendError(error);
                    })
                });
                actions.push(copyAction);
            }

            if (this.relation.aggregationKind === "composite") {
                if (this.permissions[this.type+'??delete'] === true) {
                    var deleteAction = new Delete({
                        callback: lang.hitch(this, function(response) {
                            // success
                            this.showNotification({
                                type: "ok",
                                message: Dict.translate("<em>%0%</em> was successfully deleted", [this.typeClass.getDisplayValue(response)]),
                                fadeOut: true
                            });
                            this.gridWidget.refresh();
                        }),
                        errback: lang.hitch(this, function(error) {
                            // error
                            this.showBackendError(error);
                        })
                    });
                    actions.push(deleteAction);
                }
            }
            else {
                var unlinkAction = new Unlink({
                    source: this.entity,
                    relation: this.relation,
                    callback: lang.hitch(this, function(response) {
                        // success
                        this.showNotification({
                            type: "ok",
                            message: Dict.translate("<em>%0%</em> was successfully unlinked", [this.typeClass.getDisplayValue(response)]),
                            fadeOut: true
                        });
                        this.gridWidget.refresh();
                    }),
                    errback: lang.hitch(this, function(error) {
                        // error
                        this.showBackendError(error);
                    })
                });
                actions.push(unlinkAction);
            }

            if (this.permissions['??setPermissions'] === true) {
                var permissionsAction = new Permissions();
                actions.push(permissionsAction);
            }

            return actions;
        },

        _create: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            new CreateInRelation({
                page: this.page,
                route: this.route,
                source: this.entity,
                relation: this.relation,
                init: lang.hitch(this, function() {
                    this.hideNotification();
                })
            }).execute();
        },

        _link: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            new Link({
                source: this.entity,
                relation: this.relation,
                init: lang.hitch(this, function() {
                    this.hideNotification();
                })
            }).execute().then(lang.hitch(this, function(response) {
                // success
                this.gridWidget.refresh();
            }), lang.hitch(this, function(error) {
                // error
                this.showBackendError(error);
                this.gridWidget.refresh();
            }));
        }
    });
});