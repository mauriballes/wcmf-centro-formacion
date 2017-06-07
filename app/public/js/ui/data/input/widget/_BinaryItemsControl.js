define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/query",
    "dojo/dom-construct",
    "dojo/topic",
    "dojo/when",
    "dojo/on",
    "dijit/registry",
    "dijit/layout/ContentPane",
    "dijit/form/_FormValueWidget",
    "../Factory",
    "../../../_include/_HelpMixin",
    "./_AttributeWidgetMixin",
    "../../../../locale/Dictionary",
  	"dojo/text!./template/_BinaryItemsControl.html"
],
function(
    declare,
    lang,
    array,
    query,
    domConstruct,
    topic,
    when,
    on,
    registry,
    ContentPane,
    _FormValueWidget,
    ControlFactory,
    _HelpMixin,
    _AttributeWidgetMixin,
    Dict,
    template
) {
    return declare([ContentPane, _FormValueWidget, _HelpMixin, _AttributeWidgetMixin], {

        templateString: template,
        intermediateChanges: true,

        inputType: null, // control description as string as used in Factory.getControlClass()
        entity: null,

        multiValued: true,

        spinnerNode: null,

        constructor: function(args) {
            // convert store from DstoreAdapter
            if (args.store && args.store.store) {
                args.store = args.store.store;
            }
            declare.safeMixin(this, args);

            this.label = Dict.translate(this.name);
            // get store from input type, if not set yet
            if (!this.store) {
                this.store = ControlFactory.getListStore(this.inputType);
            }
            // multivalued controls are only useful for a string attribute
            var attribute = this.getAttributeDefinition();
            if (this.multiValued && attribute.type.toLowerCase() !== 'string') {
                throw new Error("Multivalued controls can only be used with a string attribute. "+
                        "Attribute '"+attribute.name+"' is of type "+attribute.type+".");
            }
        },

        postCreate: function() {
            this.inherited(arguments);
            this.spinnerNode = domConstruct.create("p", {
                innerHTML: '<i class="fa fa-spinner fa-spin"></i>'
            }, this.domNode, "first");
            this.showSpinner();

            when(this.store.fetch(), lang.hitch(this, function(list) {
                this.hideSpinner();
                for (var i=0, c=list.length; i<c; i++) {
                    var item = list[i];
                    var itemValue = this.multiValued ? ""+item.value : item.value;
                    var itemLabel = item.displayText;
                    var itemWidget = this.buildItemWidget(itemValue, itemLabel);
                    this.own(
                        on(itemWidget, "change", function(isSelected) {
                            var control = registry.getEnclosingWidget(this.domNode.parentNode);
                            control.updateValue(this.value, isSelected);
                        }
                    ));
                }
                this.updateDisplay(this.value);
            }));

            this.own(
                topic.subscribe("entity-datachange", lang.hitch(this, function(data) {
                    if ((this.entity && this.entity.get('oid') === data.entity.get('oid')) &&
                            data.name === this.name) {
                        this.set("value", data.newValue);
                    }
                })),
                on(this, "attrmodified-value", lang.hitch(this, function(e) {
                    var value = e.detail.newValue;
                    this.updateDisplay(value);
                }))
            );
        },

        /**
         * Build a checkbox/radio button item with the given value and label
         * @param value
         * @param label
         * @return Widget
         */
        buildItemWidget: function(value, label) {
            throw new Error("Method buildItemWidget() must be implemented by subclass");
        },

        showSpinner: function() {
            query(this.spinnerNode).style("display", "block");
        },

        hideSpinner: function() {
            query(this.spinnerNode).style("display", "none");
        },

        updateValue: function(value, isSelected) {
            if (this.multiValued) {
                var values = this.getValueArray(this.get("value"));
                if (isSelected) {
                    // add value
                    if (values.indexOf(value) === -1) {
                        values.push(value);
                    }
                }
                else {
                    // remove value
                    values = array.filter(values, function(item) {
                        return (item !== value); // value may be string or number
                    });
                }
                this.set("value", values.join(","));
            }
            else {
                if (isSelected) {
                    this.set("value", value);
                }
            }
        },

        updateDisplay: function(value) {
            // update item widgets
            var values = this.getValueArray(value);
            var itemWidgets = registry.findWidgets(this.domNode);
            for (var i=0, count=itemWidgets.length; i<count; i++) {
                var widget = itemWidgets[i];
                // we don't use the public get method for the value, because it
                // will return false instead of the text value, if the widget is
                // not checked
                var isChecked = values.indexOf(widget._get("value")) !== -1;
                widget._onChangeActive = false;
                widget.set("checked", isChecked);
                widget._onChangeActive = true;
            }
        },

        _setDisabledAttr: function(value) {
            this.inherited(arguments);
            var itemWidgets = registry.findWidgets(this.domNode);
            for (var i=0, count=itemWidgets.length; i<count; i++) {
                var widget = itemWidgets[i];
                widget.set("disabled", value);
            }
        },

        focus: function() {
            // focus first widget, because otherwise focus loss
            // is not reported to grid editor
            var itemWidgets = registry.findWidgets(this.domNode);
            for (var i=0, count=itemWidgets.length; i<count; i++) {
                var widget = itemWidgets[i];
                if (widget.focus) {
                    widget.focus();
                    break;
                }
            }
        },

        getValueArray: function(value) {
            value = this.multiValued ? ""+value : value;
            return (typeof value === "string" || value instanceof String) ?
                value.split(",") : (value instanceof Array ? value : [value]);
        }
    });
});
