define( [
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dijit/form/CheckBox",
    "./_BinaryItemsControl"
],
function(
    declare,
    domConstruct,
    CheckBox,
    _BinaryItemsControl
) {
    return declare([_BinaryItemsControl], {

        multiValued: true,

        buildItemWidget: function(value, label) {
            // create checkbox
            var widget = new CheckBox({
                name: this.name,
                value: value,
                checked: (this.value === value), // value may be string or number
                disabled: this.disabled
            });
            widget.startup();
            this.addChild(widget);

            // create label
            domConstruct.create("span", {
                innerHTML: label,
                "class": "checkBoxLabel"
            }, widget.domNode, "after");

            return widget;
        }
    });
});