define( [
    "dojo/_base/declare",
    "dijit/form/CheckBox",
    "../../../../locale/Dictionary",
    "../../../_include/_HelpMixin",
    "./_AttributeWidgetMixin"
],
function(
    declare,
    CheckBox,
    Dict,
    _HelpMixin,
    _AttributeWidgetMixin
) {
    return declare([CheckBox, _HelpMixin, _AttributeWidgetMixin], {

        inputType: null, // control description as string as used in Factory.getControlClass()
        entity: {},

        constructor: function(args) {
            declare.safeMixin(this, args);

            this.label = Dict.translate(this.name);
            this.checked = this.value == 1; // value may be string or number
        },

        _getValueAttr: function() {
            return this.get("checked") ? "1" : "0";
        }
    });
});