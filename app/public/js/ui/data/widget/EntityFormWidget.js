define( [
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/_base/array",
    "dojo/promise/all",
    "dojo/on",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/query",
    "dijit/registry",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/DropDownButton",
    "dijit/Menu",
    "dijit/MenuItem",
    "dijit/Fieldset",
    "../../_include/FormLayout",
    "../../_include/_NotificationMixin",
    "../../_include/widget/Button",
    "../../../action/CheckPermissions",
    "../../../action/Lock",
    "../../../action/Unlock",
    "../../../model/meta/Model",
    "../../../persistence/BackendError",
    "../../../persistence/Store",
    "../../../persistence/RelationStore",
    "../../../action/Delete",
    "../../../locale/Dictionary",
    "../input/Factory",
    "../input/widget/TextBox",
    "./EntityRelationWidget",
    "./PermissionDlgWidget",
    "dojo/text!./template/EntityFormWidget.html"
],
function(
    require,
    declare,
    lang,
    config,
    array,
    all,
    on,
    topic,
    domClass,
    domConstruct,
    query,
    registry,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    DropDownButton,
    Menu,
    MenuItem,
    Fieldset,
    FormLayout,
    _Notification,
    Button,
    CheckPermissions,
    Lock,
    Unlock,
    Model,
    BackendError,
    Store,
    RelationStore,
    Delete,
    Dict,
    ControlFactory,
    TextBox,
    EntityRelationWidget,
    PermissionDlg,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, _Notification], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,

        baseRoute: "entity",
        entity: {}, // entity to edit
        sourceOid: null, // object id of the source object of a relation
                         // (ignored if isNew == false)
        relation: null, // the relation in which the object should be created
                        // related to sourceOid (ignored if isNew == false)
        page: null,

        type: null,
        typeClass: null,
        formId: "",
        fieldContainerId: "",
        headline: "",
        isNew: false,
        isModified: false,
        isLocked: false,
        isLockOwner: true,
        permissions: {},

        language: config.app.defaultLanguage,
        isTranslation: false,
        original: null, // untranslated entity

        attributeWidgets: [],
        relationWidgets: [],
        layoutWidgets: [],

        constructor: function(args) {
            declare.safeMixin(this, args);

            var oid = this.entity.get('oid');

            this.type = Model.getTypeNameFromOid(oid);
            this.typeClass = Model.getType(this.type);
            this.formId = "entityForm_"+oid;
            this.fieldContainerId = "fieldContainer_"+oid;
            this.headline = this.getHeadline();
            this.isNew = Model.isDummyOid(oid);
            this.isTranslation = this.language !== config.app.defaultLanguage;

            this.languageName = config.app.languages[this.language];
        },

        _setHeadlineAttr: function (val) {
            this.headlineNode.innerHTML = val;
        },

        postCreate: function() {
            this.inherited(arguments);

            var oid = this.entity.get('oid');
            var cleanOid = Model.removeDummyOid(oid);

            var deferredList = [];
            // load input widgets referenced in attributes' input type
            deferredList.push(ControlFactory.loadControlClasses(this.type));
            // check instance permissions
            var requiredPermissions = [
                cleanOid+'??create',
                cleanOid+'??update',
                cleanOid+'??delete',
                '??setPermissions'
            ];
            var attributes = this.getAttributes();
            for (var i=0, count=attributes.length; i<count; i++) {
                var attribute = attributes[i];
                requiredPermissions.push(cleanOid+'.'+attribute.name+'??read');
                requiredPermissions.push(cleanOid+'.'+attribute.name+'??update');
            }
            // check relation permissions
            var relations = this.getRelations();
            for (var i=0, count=relations.length; i<count; i++) {
                var relation = relations[i];
                requiredPermissions.push(Model.getFullyQualifiedTypeName(relation.type)+'??read');
            }
            deferredList.push(new CheckPermissions({
                operations: requiredPermissions
            }).execute());

            all(deferredList).then(lang.hitch(this, function(results) {
                var controls = results[0];
                this.permissions = results[1].result ? results[1].result : {};

                // add attribute widgets
                this.attributeWidgets = [];
                var attributeGroups = this.getAttributeGroups();
                for (var group in attributeGroups) {
                    // group
                    var groupNode = domConstruct.create('fieldset', {
                        'class': 'attribute_group group_'+group.toLowerCase()
                    }, this.fieldsNode);
                    var layoutWidget = new FormLayout({}, groupNode);
                    this.layoutWidgets.push(layoutWidget);
                    // attributes
                    var attributes = attributeGroups[group];
                    for (var i=0, count=attributes.length; i<count; i++) {
                        var attribute = attributes[i];
                        // only show attributes with read permission
                        if (this.permissions[cleanOid+'.'+attribute.name+'??read'] === true) {
                            // disabled if not editable
                            var disabled = this.typeClass ? !this.typeClass.isEditable(attribute, this.entity) : false;
                            // disabled if not translatable
                            if (!disabled && this.isTranslation && array.indexOf(attribute.tags, 'TRANSLATABLE') === -1) {
                                disabled = true;
                            }
                            var controlClass = controls[attribute.inputType] || TextBox;
                            var attributeWidget = new controlClass({
                                name: attribute.name,
                                'class': attribute.tags ? attribute.tags.join(' ').toLowerCase() : '',
                                value: this.entity[attribute.name],
                                disabled: disabled,
                                helpText: Dict.translate(attribute.description),
                                inputType: attribute.inputType,
                                entity: this.entity
                            });
                            var canCreate = this.permissions[cleanOid+'??create'] === true;
                            var canUpdate = this.permissions[cleanOid+'??update'] === true &&
                                    this.permissions[cleanOid+'.'+attribute.name+'??update'] === true;
                            if ((this.isNew && canCreate || !this.isNew && canUpdate)) {
                                this.own(attributeWidget.on('change', lang.hitch(this, function(widget) {
                                    var widgetValue = widget.get("value");
                                    var entityValue = this.entity.get(widget.name);
                                    if (this.normalizeForComparison(widgetValue) !== this.normalizeForComparison(entityValue)) {
                                        this.setModified(true);
                                    }
                                }, attributeWidget)));
                            }
                            else {
                                // disable widget, if no update permission
                                attributeWidget.set('disabled', true);
                            }
                            layoutWidget.addChild(attributeWidget);
                            this.attributeWidgets.push(attributeWidget);
                        }
                    }
                }

                // add relation widgets
                if (!this.isNew) {
                    var relations = this.getRelations();
                    for (var i=0, count=relations.length; i<count; i++) {
                        var relation = relations[i];
                        // only show relations with read permission
                        if (this.permissions[Model.getFullyQualifiedTypeName(relation.type)+'??read'] === true) {
                            var relationWidget = new EntityRelationWidget({
                                route: this.baseRoute,
                                entity: this.entity,
                                relation: relation,
                                page: this.page
                            });
                            this.relationWidgets.push(relationWidget);
                            this.relationsNode.appendChild(relationWidget.domNode);
                        }
                    }
                }

                // set button states
                this.setBtnState("save", false); // no modifications yet
                this.setBtnState("delete", this.canDelete());
                if (this.permissions['??setPermissions'] !== true && this.permissionsBtn) {
                    domClass.add(this.permissionsBtn.domNode, "hidden");
                }

                // handle locking
                if (!this.isNew) {
                    // assume the object is locked
                    this.setLockState(true, false);
                    this.acquireLock();
                }
                else {
                    query(this.lockNode).style("display", "none");
                }

                if (!this.isNew) {
                    this.buildLanguageMenu();
                }

                // notify listeners
                topic.publish("entity-form-widget-created", this);
            }), lang.hitch(this, function(error) {
                // error
                this.showBackendError(error);
            }));

            this.own(
                topic.subscribe("store-error", lang.hitch(this, function(error) {
                    this.showBackendError(error, this.isModified);
                })),
                on(dojo.body(), "keydown", lang.hitch(this, function (e) {
                    if (e.keyCode === 83 && (e.ctrlKey || e.metaKey)) {
                        e.stopPropagation();
                        if (this.isModified) {
                            this.showNotification({
                                type: "process",
                                message: Dict.translate("Saving data")
                            });
                            this._save(e, true);
                        }
                        return false;
                    };
                }))
            );
        },

        startup: function() {
            this.inherited(arguments);
            for (var i=0, c=this.layoutWidgets.length; i<c; i++) {
                this.layoutWidgets[i].startup(); // starts up attribute widgets
            }
            for (var i=0, c=this.relationWidgets.length; i<c; i++) {
                this.relationWidgets[i].startup();
            }
        },

        /**
         * Get the type's attributes to display in the widget
         * @returns Array
         */
        getAttributes: function() {
            var typeClass = Model.getType(this.type);
            return typeClass.getAttributes({exclude: ['DATATYPE_IGNORE']});
        },

        /**
         * Get the type's attributes grouped together by GROUP_ tags.
         * Attributes withoout GROUP_ tag are listed in a group named 'default'.
         * @returns Associative array with the group names as keys and
         * an array of the group's attributes as value
         */
        getAttributeGroups: function() {
            var attributes = this.getAttributes();
            var groups = {
                'default': []
            };
            for(var i=0, c=attributes.length; i<c; i++) {
              var attribute = attributes[i];
              var groupTags = array.filter(attribute.tags, function(tag) {
                  return tag.match(/^GROUP_/);
              });
              groupName = 'default';
              if (groupTags.length > 0) {
                  var groupName = groupTags[0].replace(/^GROUP_/, '');
                  if (!groups[groupName]) {
                      groups[groupName] = [];
                  }
              }
              groups[groupName].push(attribute);
            }
            return groups;
        },

        /**
         * Get the type's relations to display in the widget
         * @returns Array
         */
        getRelations: function() {
            var typeClass = Model.getType(this.type);
            return typeClass.getRelations('all', this.entity);
        },

        getHeadline: function() {
          return Dict.translate(Model.getSimpleTypeName(this.type))+" <em>"+this.typeClass.getDisplayValue(this.entity)+"</em>";
        },

        buildLanguageMenu: function() {
            if (!this.languageMenuPopupNode) {
                return;
            }
            var languageCount = 0;
            var menu = registry.byId(this.languageMenuPopupNode.get("id"));
            var form = this;
            for (var langKey in config.app.languages) {
                var menuItem = new MenuItem({
                    label: config.app.languages[langKey],
                    langKey: langKey,
                    onClick: function() {
                        var route = form.page.getRoute("entity");
                        var queryParams = this.langKey !== config.app.defaultLanguage ? {lang: this.langKey} : undefined;
                        var url = route.assemble({
                            type: Model.getSimpleTypeName(form.type),
                            id: Model.getIdFromOid(form.entity.get('oid'))
                        }, queryParams);
                        form.page.pushConfirmed(url);
                    }
                });
                if (langKey === this.language) {
                    menuItem.set("disabled", true);
                }
                menu.addChild(menuItem);
                languageCount++;
            }
            if (languageCount <= 1) {
                // destroy menu
                domConstruct.destroy(this.languageMenuNode);
            }
            else {
                // show menu
                query(this.languageMenuNode).style("display", "inline");
            }
        },

        setBtnState: function(btnName, isEnabled) {
            var btn = this[btnName+"Btn"];
            if (btn) {
                btn.set("disabled", !isEnabled);
            }
        },

        setCtrlState: function(isEnabled) {
            for (var i=0, c=this.attributeWidgets.length; i<c; i++) {
                var widget = this.attributeWidgets[i];
                widget.set("readonly", !isEnabled);
            }
        },

        setLockState: function(isLocked, isLockOwner) {
            this.isLocked = isLocked;
            this.isLockOwner = isLockOwner;
            if (this.isLocked) {
                domClass.remove(this.lockNode, "fa fa-unlock");
                domClass.add(this.lockNode, "fa fa-lock");
            }
            else {
                domClass.remove(this.lockNode, "fa fa-lock");
                domClass.add(this.lockNode, "fa fa-unlock");
            }
            // set controls, if locked by another user
            if (isLocked && !isLockOwner) {
                this.setCtrlState(false);
                this.setBtnState("save", false);
                this.setBtnState("delete", false);
            }
            else {
                this.setCtrlState(true);
                // not locked by others
                // only reset delete button, because there's no modification yet
                this.setBtnState("delete", this.canDelete());
            }
        },

        setModified: function(modified) {
            this.isModified = modified;

            var state = modified === true ? "dirty" : "clean";
            this.entity.setState(state);
            this.setBtnState("save", modified);
        },

        isRelatedObject: function() {
            return (this.sourceOid && this.relation);
        },

        acquireLock: function() {
            new Lock({
                entity: this.entity,
                lockType: "optimistic"
            }).execute().then(
                lang.hitch(this, function(response) {
                    // success
                    // not locked by other user
                    this.setLockState(false, true);
                    if (response.type === "pessimistic") {
                        // pessimistic lock owned by user
                        this.setLockState(true, true);
                    }
                }),
                lang.hitch(this, function(error) {
                    // check for existing lock
                    var error = BackendError.parseResponse(error);
                    if (error.code === "OBJECT_IS_LOCKED") {
                        this.setLockState(true, false);
                        this.showNotification({
                            type: "ok",
                            fadeOut: true,
                            message: error.message
                        });
                    }
                    else {
                        this.showBackendError(error);
                    }
                })
            );
        },

        canDelete: function() {
            return !this.isNew && this.permissions[Model.removeDummyOid(this.entity.get('oid'))+'??delete'] === true;
        },

        normalizeForComparison: function(value) {
            if (value && value.toJSON) {
                value = value.toJSON();
            }
            return value === undefined ? null : value;
        },

        /**
         * Update the entity and display with the data returned from the server
         * @param data The entity data
         */
        updateEntity: function(data) {
            var typeClass = Model.getType(this.type);
            var attributes = typeClass.getAttributes();
            for (var i=0, count=attributes.length; i<count; i++) {
                var attributeName = attributes[i].name;
                // notify listeners
                this.entity.set(attributeName, data[attributeName]);
            }
            // reset attribute widgets
            for (var i=0, c=this.attributeWidgets.length; i<c; i++) {
                this.attributeWidgets[i].setDirty(false);
            }
        },

        _save: function(e, keepNotification) {
            // prevent the page from navigating after submit
            e.preventDefault();

            if (this.isModified) {
                // merge form data into entity
                var data = {};
                for (var i=0, c=this.attributeWidgets.length; i<c; i++) {
                    var widget = this.attributeWidgets[i];
                    data[widget.get("name")] = widget.get("value");
                }
                data = lang.mixin(lang.clone(this.entity), data);

                this.saveBtn.setProcessing();
                if (!keepNotification) {
                    this.hideNotification();
                }

                var store = null;
                if (this.isRelatedObject()) {
                    store = RelationStore.getStore(this.sourceOid, this.relation);
                }
                else {
                    store = Store.getStore(this.type, this.language);
                }

                var storeMethod = this.isNew ? "add" : "put";
                store[storeMethod](data, {overwrite: !this.isNew}).then(lang.hitch(this, function(result) {
                    // callback completes
                    this.saveBtn.reset();
                    if (result.errorMessage) {
                        // error
                        this.showBackendError(result, true);
                    }
                    else {
                        // success

                        // update entity
                        this.updateEntity(result);
                        this.entity.set('oid', result.get('oid'));

                        var message = this.isNew ? Dict.translate("<em>%0%</em> was successfully created", [this.typeClass.getDisplayValue(this.entity)]) :
                                Dict.translate("<em>%0%</em> was successfully updated", [this.typeClass.getDisplayValue(this.entity)]);
                        this.showNotification({
                            type: "ok",
                            message: message,
                            fadeOut: true,
                            onHide: lang.hitch(this, function() {
                                this.setBtnState("save", false);
                                if (this.isNew) {
                                    this.isNew = false;

//                                    if (this.isRelatedObject()) {
//                                        // close own tab
//                                        topic.publish("tab-closed", {
//                                            oid: Model.createDummyOid(this.type)
//                                        });
//                                        this.destroyRecursive();
//                                    }
//                                    else {
                                        // update current tab
                                        topic.publish("tab-closed", {
                                            oid: Model.createDummyOid(this.type),
                                            nextOid: this.entity.get('oid')
                                        });
//                                    }
                                }
                            })
                        });
                        this.set("headline", this.getHeadline());
                        this.setModified(false);
                        this.acquireLock();
                    }
                }), lang.hitch(this, function(error) {
                    // error
                    this.saveBtn.reset();

                    // check for concurrent update
                    var error = BackendError.parseResponse(error);
                    if (error.code === "CONCURRENT_UPDATE" || error.code === "OBJECT_IS_LOCKED") {
                        this.showNotification({
                            type: "error",
                            message: error.message+' <a href="'+location.href+'" class="alert-error"><i class="fa fa-refresh"></i></a>'
                        });
                        this.setLockState(true, false);
                    }
                    else if (error.code === "ATTRIBUTE_VALUE_INVALID") {
                        var message = '';
                        var attributes = error.data.invalidAttributeValues;
                        for (var i=0, count=attributes.length; i<count; i++) {
                            message += attributes[i].message+"<br>";
                        }
                        this.showNotification({
                            type: "error",
                            message: message
                        });
                    }
                    else {
                        this.showBackendError(error, true);
                    }
                }));
            }
        },

        _delete: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            if (this.isNew) {
                return;
            }

            new Delete({
                entity: this.entity,
                init: lang.hitch(this, function() {
                    this.hideNotification();
                })
            }).execute().then(lang.hitch(this, function(response) {
                // success
                // notify tab panel to close tab
                topic.publish("tab-closed", {
                    oid: this.entity.get('oid')
                });
                this.destroyRecursive();
            }), lang.hitch(this, function(error) {
                // error
                this.showBackendError(error, true);
            }));
        },

        _toggleLock: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            if (!this.isLockOwner) {
                return;
            }

            var displayValue = this.typeClass.getDisplayValue(this.entity);
            this.showNotification({
                type: "process",
                message: this.isLocked ? Dict.translate("Unlocking <em>%0%</em>", [displayValue]) :
                        Dict.translate("Locking <em>%0%</em>", [displayValue])
            });
            var action = this.isLocked ? Unlock : Lock;
            new action({
                entity: this.entity,
                lockType: "pessimistic"
            }).execute().then(
                lang.hitch(this, function(response) {
                    // success
                    this.showNotification({
                        type: "ok",
                        message: this.isLocked ? Dict.translate("<em>%0%</em> was successfully unlocked", [displayValue]) :
                                Dict.translate("<em>%0%</em> was successfully locked", [displayValue]),
                        fadeOut: true
                    });
                    this.setLockState(!this.isLocked, true);
                    // update optimistic lock
                    this.acquireLock();
                }),
                lang.hitch(this, function(error) {
                    // check for existing lock
                    var error = BackendError.parseResponse(error);
                    if (error.code === "OBJECT_IS_LOCKED") {
                        this.setLockState(true, false);
                    }
                    this.showBackendError(error);
                })
            );
        },

        _permissions: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            var displayValue = this.typeClass.getDisplayValue(this.entity);
            new PermissionDlg({
                oid: this.entity.get('oid'),
                message: Dict.translate("Permissions for <em>%0%</em>", [displayValue])
            }).show();
        }
    });
});