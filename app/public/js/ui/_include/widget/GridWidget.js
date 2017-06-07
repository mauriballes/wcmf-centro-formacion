define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/aspect",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/TooltipDialog",
    "dijit/popup",
    "dgrid/OnDemandGrid",
    "dgrid/Selection",
    "dgrid/Keyboard",
    "dgrid/extensions/DnD",
    "dgrid/extensions/ColumnHider",
    "dgrid/extensions/ColumnResizer",
    "dgrid/extensions/DijitRegistry",
    "dgrid/Editor",
    "dgrid/Selector",
    "dgrid/Tree",
    "dojo/dom",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/dom-geometry",
    "dojo/query",
    "dojo/window",
    "dojo/topic",
    "dojo/on",
    "dojo/when",
    "../../../model/meta/Model",
    "../../../locale/Dictionary",
    "../../data/input/Factory",
    "../../data/display/Renderer",
    "../../data/filter/widget/TextBox",
    "../../data/filter/widget/SelectBox",
    "../../../User",
    "dojo/text!./template/GridWidget.html"
], function (
    declare,
    lang,
    array,
    aspect,
    _WidgetBase,
    _TemplatedMixin,
    TooltipDialog,
    popup,
    OnDemandGrid,
    Selection,
    Keyboard,
    DnD,
    ColumnHider,
    ColumnResizer,
    DijitRegistry,
    Editor,
    Selector,
    Tree,
    dom,
    domAttr,
    domConstruct,
    domGeom,
    query,
    win,
    topic,
    on,
    when,
    Model,
    Dict,
    ControlFactory,
    Renderer,
    FilterTextBox,
    FilterSelectBox,
    User,
    template
) {
    return declare([_WidgetBase, _TemplatedMixin], {

        type: null,
        store: null,
        columns: [], // array of attribute names or columns objects
        actions: [],
        enabledFeatures: [], // array of strings matching items in optionalFeatures
        canEdit: true,
        initialFilter: {},
        rowEnhancer: null,

        actionsByName: {},
        templateString: lang.replace(template, Dict.tplTranslate),
        grid: null,
        filters: [],

        defaultFeatures: {
            'Selection': Selection,
            'Keyboard': Keyboard,
            'ColumnHider': ColumnHider,
            'ColumnResizer': ColumnResizer,
            'DijitRegistry': DijitRegistry
        },
        optionalFeatures: {
            'Selector': Selector,
            'DnD': DnD,
            'Tree': Tree
        },

        dndInProgress: false,

        constructor: function (params) {
            if (params && params.actions) {
                params.actionsByName = {};
                for (var i=0,count=params.actions.length; i<count; i++) {
                    var action = params.actions[i];
                    params.actionsByName[action.name] = action;
                }
            }
            declare.safeMixin(this, params);
        },

        postCreate: function () {
            this.inherited(arguments);

            ControlFactory.loadControlClasses(this.type).then(lang.hitch(this, function(controls) {

                this.grid = this.buildGrid(controls);
                this.grid.startup();
                this.own(
                    on(window, "resize", lang.hitch(this, this.onResize)),
                    on(this.grid, "click", lang.hitch(this, function(e) {
                        // close summary tooltip
                        if (this.summaryDialog) {
                            popup.close(this.summaryDialog);
                        }
                        // process grid clicks
                        var links = query(e.target).closest("a");
                        if (links.length > 0) {
                          var actionName = domAttr.get(links[0], "data-action");
                          var action = this.actionsByName[actionName];
                          if (action) {
                              // cell action
                              e.preventDefault();
                              // execute the action
                              var columnNode = e.target.parentNode;
                              var row = this.grid.row(columnNode);
                              action.entity = row.data;
                              action.execute();
                              // refresh the action cell, if the grid is still present
                              if (this.grid.collection) {
                                var cell = this.grid.cell(columnNode);
                                this.grid.refreshCell(cell);
                              }
                          }
                        }
                    })),
                    on(this.grid, "mouseover", lang.hitch(this, function(e) {
                        var row = this.grid.row(e.target.parentNode);
                        if (row) {
                            var column = this.grid.column(e.target);
                            var typeClass = Model.getType(this.type);
                            if (column && column.field === typeClass.displayValues[0]) {
                                if (typeof typeClass.getSummary === 'function') {
                                    when(typeClass.getSummary(row.data), lang.hitch(this, function(text) {
                                        if (text) {
                                            this.summaryDialog = new TooltipDialog({
                                                content: text,
                                                onMouseLeave: lang.hitch(this, function() {
                                                    popup.close(this.summaryDialog);
                                                })
                                            });
                                            popup.open({
                                                popup: this.summaryDialog,
                                                around: e.target.parentNode
                                            });
                                        }
                                    }));
                                }
                            }
                        }
                    })),
                    on(this.grid, "mouseout", lang.hitch(this, function(e) {
                        if (this.summaryDialog) {
                            popup.close(this.summaryDialog);
                        }
                    })),
                    topic.subscribe("store-datachange", lang.hitch(this, function(data) {
                        if (this.dndInProgress) {
                            topic.publish('ui/_include/widget/GridWidget/dnd-end', null);
                            this.dndInProgress = false;
                        }
                    })),
                    topic.subscribe("/dnd/drop", lang.hitch(this, function(source, nodes, copy, target) {
                        this.dndInProgress = true;
                        topic.publish('ui/_include/widget/GridWidget/dnd-start', null);
                    })),
                    topic.subscribe("entity-filterchange", lang.hitch(this, function(data) {
                        this.filter(this.getFilter());
                    }))
                );
                this.onResize();
            }));
        },

        buildGrid: function (controls) {
            var simpleType = Model.getSimpleTypeName(this.type);

          // select features
            var features = [];
            var featureNames = [];
            for (var idx in this.defaultFeatures) {
                featureNames.push(idx);
                features.push(this.defaultFeatures[idx]);
            }
            for (var idx in this.enabledFeatures) {
                var featureName = this.enabledFeatures[idx];
                if (this.optionalFeatures[featureName]) {
                    featureNames.push(featureName);
                    features.push(this.optionalFeatures[featureName]);
                }
            }

            // get display columns from user config
            var typeClass = Model.getType(this.type);
            var gridConfig = User.getConfig('grid') || {};
            var displayColumns = gridConfig[this.type] ?
                gridConfig[this.type]['columns'] : typeClass.displayValues;
            if (this.store.setExtraParam instanceof Function) {
                this.store.setExtraParam('values', displayColumns.join(','));
            }

            // create columns
            var columns = [];
            this.filters = [];
            if (array.indexOf(featureNames, 'Selector') !== -1) {
                columns.push({
                    label: " ",
                    selector: "checkbox",
                    field: "selector",
                    unhidable: true,
                    sortable: true,
                    resizable: false
                });
            }
            var renderOptions = {};
            for (var i=0, count=this.columns.length; i<count; i++) {
                var columnDef = this.columns[i];
                if (typeof(columnDef) === "string") {
                    // attribute column
                    var curValue = columnDef;
                    var curAttributeDef = typeClass.getAttribute(curValue);
                    if (curAttributeDef !== null) {
                        var controlArgs = {
                            name: curAttributeDef.name,
                            helpText: Dict.translate(curAttributeDef.description),
                            inputType: curAttributeDef.inputType,
                            entity: null, // will be set in dgrid-editor-show event
                            isInlineEditor: true
                        };
                        var columnDef = {
                            label: Dict.translate(curValue),
                            field: curValue,
                            editor: controls[this.getEditorControl(curAttributeDef.inputType)],
                            editorArgs: controlArgs,
                            editOn: "dblclick",
                            canEdit: this.canEdit ? lang.partial(lang.hitch(this, function(attr, obj, value) {
                                // only allow to edit editable objects of grid's own type
                                var sameType = this.isSameType(obj);
                                return sameType && typeClass.isEditable(attr, obj);
                            }), curAttributeDef) : function(obj, value) {
                                return false;
                            },
                            autoSave: true,
                            sortable: true,
                            hidden: displayColumns.indexOf(curValue) === -1,
                            renderCell: lang.hitch(curAttributeDef, function(object, data, td, options) {
                                when(Renderer.render(data, this, renderOptions), function(value) {
                                    td.innerHTML = value;
                                });
                            }),
                            filter: this.getFilterControl(curAttributeDef.inputType),
                            filterArgs: lang.clone(controlArgs)
                        };
                        if (array.indexOf(featureNames, 'Tree') !== -1) {
                            columnDef.renderExpando = true;
                        }
                    }
                }

                // add column filter
                if (columnDef.filter) {
                    var filterArgs = lang.mixin(columnDef.filterArgs, {
                        field: simpleType+'.'+columnDef.field,
                        filterCtr: this.store.Filter
                    });
                    var filter = new (columnDef.filter)(filterArgs);
                    this.own(
                        on(filter, "click", function(e) {
                            e.stopPropagation();
                        })
                    );
                    this.filters.push(filter);

                    columnDef['renderHeaderCell'] = lang.hitch(this, lang.partial(function(columnDef, filter, node) {
                        if ('label' in columnDef || columnDef.field) {
                            var text = 'label' in columnDef ? columnDef.label : columnDef.field;
                            domConstruct.place('<div>'+text+'</div>', node, 'first');
                        }
                        var filterNode = domConstruct.place('<div class="header-filter hidden"></div>', node);
                        domConstruct.place(filter.domNode, filterNode);
                        return filterNode;
                    }, columnDef, filter));
                }

                columns.push(columnDef);
            }

            // add actions column
            if (this.actions.length > 0 || this.filters.length > 0) {
                var columnDef = {
                    label: " ",
                    field: "actions-"+this.actions.length,
                    unhidable: true,
                    sortable: false,
                    resizable: false,
                    formatter: lang.hitch(this, function(data, entity) {
                        var html = '<div>';
                        for (var name in this.actionsByName) {
                            var action = this.actionsByName[name];
                            action.entity = entity;
                            var url = action.getUrl() || '#';
                            html += '<a class="btn-mini" href="'+url+'" data-action="'+name+'"><i class="'+action.getIconClass()+'"></i></a>';
                        }
                        html += '</div>';
                        return html;
                    })
                };

                if (this.filters.length > 0) {
                    columnDef['renderHeaderCell'] = lang.hitch(this, function(node) {
                        var html = '<a class="btn-mini"><i class="fa fa-filter"></i></a>';
                        var filterBtn = domConstruct.place(html, node, 'first');
                        this.own(
                            on(filterBtn, "click", lang.hitch(this, function(e) {
                                query(".header-filter", this.domNode).toggleClass("hidden");
                                this.grid.resize();
                                e.stopPropagation();
                            }))
                        );
                        return filterBtn;
                    });
                }

                columns.push(columnDef);
            }

            // create widget
            var grid = new (declare([OnDemandGrid, Editor].concat(features)))({
                getBeforePut: true,
                columns: columns,
                collection: this.store.filter(this.initialFilter),
                selectionMode: "extended",
                dndParams: {
                    checkAcceptance: lang.hitch(this, function(source, nodes) {
                        var row = this.grid.row(nodes[0]);
                        if (!row) {
                            return false;
                        }
                        return this.isSameType(row.data);
                    })
                },
                loadingMessage: Dict.translate("Loading"),
                noDataMessage: Dict.translate("No data"),
                minRowsPerPage: 30,
                maxRowsPerPage: 30,
                bufferRows: 0,
                pagingDelay: 0,
                farOffRemoval: Infinity,
                pagingMethod: 'throttleDelayed'
            }, this.gridNode);

            if (typeof this.rowEnhancer === 'function') {
                aspect.after(grid, 'renderRow', lang.hitch(this, function(row, args) {
                    return this.rowEnhancer(row, args[0]);
                }));
            }

            grid.on("dgrid-editor-show", function(evt) {
                // set the entity property on the input control
                evt.editor.entity = evt.cell.row.data;
            });

            grid.on("dgrid-error", function(evt) {
                topic.publish('ui/_include/widget/GridWidget/error', evt.error);
            });

            grid.on("dgrid-refresh-complete", lang.hitch(this, function(evt) {
                topic.publish('ui/_include/widget/GridWidget/refresh-complete', evt.grid);
                grid.resize();
            }));

            grid.on("dgrid-columnstatechange", lang.hitch(this, function(evt) {
                // get display columns
                var displayColumns = columns.filter(function(column) {
                    return typeClass.getAttribute(column.field) && !grid.isColumnHidden(column.id);
                }).map(function(column) {
                    return column.field;
                });
                // store display values
                var gridConfig = User.getConfig('grid') || {};
                if (!gridConfig[this.type]) {
                    gridConfig[this.type] = {};
                }
                gridConfig[this.type]['columns'] = displayColumns;
                User.setConfig('grid', gridConfig);
                // update grid content
                if (this.store.setExtraParam instanceof Function) {
                    this.store.setExtraParam('values', displayColumns.join(','));
                }
                this.refresh();
            }));

            return grid;
        },

        /**
         * Get the editor control name for an input type
         * @param inputType
         * @returns String
         */
        getEditorControl: function(inputType) {
            if (inputType) {
                var baseType = inputType.match(/^[^:]+/)[0];
                switch(baseType) {
                    case 'ckeditor':
                        return 'textarea';
                }
                return inputType;
            }
            return null;
        },

        /**
         * Get the filter control for an input type
         * @param inputType
         * @returns String
         */
        getFilterControl: function(inputType) {
            if (inputType) {
                var baseType = inputType.match(/^[^:]+/)[0];
                switch(baseType) {
                    case 'radio':
                    case 'select':
                        return FilterSelectBox;
                    case 'date':
                        return FilterTextBox;
                }
            }
            return FilterTextBox;
        },

        /**
         * Get the current grid filter
         * @returns Filter
         */
        getFilter: function() {
            var mainFilter;
            for (var i=0, count=this.filters.length; i<count; i++) {
                var filterCtrl = this.filters[i];
                var filter = filterCtrl.getFilter();
                if (filter) {
                    if (mainFilter) {
                        mainFilter = this.store.Filter().and(mainFilter, filter);
                    }
                    else {
                        mainFilter = filter;
                    }
                }
            }
            return mainFilter;
        },

        isSameType: function(entity) {
            var oid = entity.get('oid');
            var typeName = Model.getFullyQualifiedTypeName(Model.getTypeNameFromOid(oid));
            return this.store.typeName === typeName;
        },

        getSelectedOids: function() {
            var oids = [];
            for (var id in this.grid.selection) {
                if (this.grid.selection[id]) {
                    var row = this.grid.row(id);
                    oids.push(row.data.get('oid'));
                }
            }
            return oids;
        },

        refresh: function() {
            this.grid.refresh({
                keepScrollPosition: true
            });
        },

        filter: function(filter) {
            if (this.grid) {
                this.grid.set('collection', this.store.filter(filter));
            }
        },

        onResize: function() {
            if (window.innerWidth > 640) {
                // TODO: remove magic number
                var vs = win.getBox();

                // calculate height of dynamic elements
                var navbarHeight = 0;
                var toolbarHeight = 0;
                var footerHeight = 0;

                var navbar = query(".navbar");
                if (navbar.length > 0) {
                  navbarHeight = domGeom.getMarginBox(navbar[0]).h;
                }
                var toolbar = query('[data-dojo-attach-point$=\"toolbarNode\"]');
                if (toolbar.length > 0) {
                  toolbarHeight = domGeom.getMarginBox(toolbar[0]).h;
                }
                var footer = dom.byId("footer");
                if (footer) {
                  footerHeight = domGeom.getMarginBox(footer).h;
                }
                var h = this.height ? this.height : vs.h-navbarHeight-toolbarHeight-footerHeight-210;
                if (h >= 0) {
                    domAttr.set(this.grid.domNode, "style", {height: h+"px"});
                }
            }
        }
    });
});