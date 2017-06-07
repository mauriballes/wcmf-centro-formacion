define( [
    "dojo/_base/declare",
    "./_FilterWidgetMixin",
    "../../input/widget/TextBox"
],
function(
    declare,
    _FilterWidgetMixin,
    TextBox
) {
    return declare([_FilterWidgetMixin], {

        control: null,
        field: null, // field to filter
        filterCtr: null, // filter constructor (see https://github.com/SitePen/dstore/blob/master/docs/Collection.md#filtering)

        constructor: function(args) {
            declare.safeMixin(this, args);
            this.control = new TextBox(args);
        },

        getControl: function() {
            return this.control;
        },

        getFilter: function() {
            var value = this.control.get('value');
            if (value !== undefined && value !== null && value !== '') {
                return (new this.filterCtr()).match(this.field, new RegExp('.*'+value+'.*', 'i'));
            }
            return null;
        }
    });
});