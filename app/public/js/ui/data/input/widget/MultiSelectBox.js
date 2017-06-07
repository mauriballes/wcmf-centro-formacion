define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/html",
    "dijit/registry",
    "dojox/form/CheckedMultiSelect",
    "../Factory",
    "dstore/legacy/DstoreAdapter",
    "../../../_include/_HelpMixin",
    "./_AttributeWidgetMixin",
    "../../../../locale/Dictionary",
    "dojo/text!./template/MultiSelect.html"
],
function(
    declare,
    lang,
    on,
    topic,
    domGeom,
    domStyle,
    html,
    registry,
    CheckedMultiSelect,
    ControlFactory,
    DstoreAdapter,
    _HelpMixin,
    _AttributeWidgetMixin,
    Dict,
    template
) {
    return declare([CheckedMultiSelect, _HelpMixin, _AttributeWidgetMixin], {

        templateString: template,
        intermediateChanges: true,
        inputType: null, // control description as string as used in Factory.getControlClass()
        entity: null,

        spinnerNode: null,

        labelAttr: "displayText",
        searchAttr: "displayText",
        dropDown: true,
        multiple: true,

        emptyText: Dict.translate("None selected"),

        constructor: function(args) {
            // TODO remove store adapter if not required by select any more
            if (!args.store) {
              // get store from input type, if not set yet
                args.store = new DstoreAdapter(ControlFactory.getListStore(args.inputType));
            }
            else if (!args.store.query) {
                args.store = DstoreAdapter(args.store);
            }
            // TODO remove this, after control is migrated to dstore api
            args.store.getLabel = function(object) {
                return object.label;
            };

            declare.safeMixin(this, args);
            this.label = Dict.translate(this.name);
        },

        postCreate: function() {
            this.inherited(arguments);

            this.own(
                topic.subscribe("entity-datachange", lang.hitch(this, function(data) {
                    if ((this.entity && this.entity.get('oid') === data.entity.get('oid')) &&
                            data.name === this.name) {
                        this.set("value", data.newValue);
                    }
                })),
                on(this.textbox, "click", lang.hitch(this, function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.dropDownButton.toggleDropDown();
                }))
            );

            this.setText(this.value);
        },

        startup: function(){
            this.inherited(arguments);
            this.own(
                on(this.dropDownMenu, "open", lang.hitch(this, function() {
                    var pos = domGeom.position(this.domNode);
                    domStyle.set(this.dropDownMenu.domNode.parentNode, {
                        left: pos.x + "px",
                        top: pos.y + pos.h + "px"
                    });
                }))
            );
        },

        onChange: function(newValue) {
            this.inherited(arguments);
            this.setText(newValue);
        },

        _setDisabledAttr: function(value) {
            this.inherited(arguments);
            if (value) {
                this.close();
            }
        },

        close: function() {
            this.dropDownButton.closeDropDown();
        },

        destroy: function() {
            this.close();
            this.inherited(arguments);
        },

        setText: function(values) {
            var numValues = values.length;
            var text = (numValues === 0) ? this.emptyText :
                  ((numValues <= 3) ? values.join(", ") : Dict.translate("%0% selected", [numValues]));
            html.set(this.textbox, text+' <b class="caret"></b>');
        }
    });
});