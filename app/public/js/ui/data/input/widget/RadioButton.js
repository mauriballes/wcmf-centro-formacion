define( [
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dijit/form/RadioButton",
    "./_BinaryItemsControl"
],
function(
    declare,
    domConstruct,
    RadioButton,
    _BinaryItemsControl
) {
    return declare([_BinaryItemsControl], {

        multiValued: false,

        buildItemWidget: function(value, label) {
            // create radio button
            var widget = new RadioButton({
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