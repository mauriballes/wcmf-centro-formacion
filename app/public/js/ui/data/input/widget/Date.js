define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/topic",
    "dijit/form/DateTextBox",
    "dojo/date/locale",
    "../../../_include/_HelpMixin",
    "./_AttributeWidgetMixin",
    "../../../../locale/Dictionary"
],
function(
    declare,
    lang,
    config,
    topic,
    DateTextBox,
    locale,
    _HelpMixin,
    _AttributeWidgetMixin,
    Dict
) {
    return declare([DateTextBox, _HelpMixin, _AttributeWidgetMixin], {

        intermediateChanges: true,
        hasDownArrow: false,
        inputType: null, // control description as string as used in Factory.getControlClass()
        entity: null,

        dateFormat: {selector: 'date', datePattern: 'yyyy-MM-dd', locale: config.app.uiLanguage},

        constructor: function(args) {
            declare.safeMixin(this, args);

            this.label = Dict.translate(this.name);
            this.value = this.convertToDate(this.value);
        },

        postCreate: function() {
            this.inherited(arguments);

            this.own(
                topic.subscribe("entity-datachange", lang.hitch(this, function(data) {
                    if ((this.entity && this.entity.get('oid') === data.entity.get('oid')) &&
                            data.name === this.name) {
                        this.set("value", this.convertToDate(data.newValue));
                    }
                }))
            );
        },

        _getValueAttr: function() {
            var value = this.inherited(arguments);
            if (value) {
                var dateFormat = this.dateFormat;
                value.toJSON = function() {
                    return locale.format(this, dateFormat);
                };
            }
            return value;
        },

        convertToDate: function(value) {
            return (typeof value === "string" || value instanceof String) ?
                  locale.parse(value, this.dateFormat) : value;
        }
    });
});