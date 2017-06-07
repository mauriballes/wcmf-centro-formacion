define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "./PopupDlgWidget",
    "./GridWidget",
    "../../../persistence/Store",
    "../../../model/meta/Model"
], function (
    declare,
    config,
    PopupDlg,
    GridWidget,
    Store,
    Model
) {
    /**
     * Modal link dialog. Usage:
     * @code
     * new ObjectSelectDlg({
     *      type: "Author",
     *      title: "Choose Objects",
     *      message: "Select objects, you want to link to '"+Model.getTypeFromOid(entity.get('oid')).getDisplayValue(entity)+"'",
     *      okCallback: function() {
     *          // will be called when OK button is clicked
     *          var deferred = new Deferred();
     *          // do something
     *          return deferred;
     *      },
     *      cancelCallback: function() {
     *          // will be called when Cancel button is clicked
     *          ....
     *      }
     * }).show();
     * @endcode
     */
    return declare([PopupDlg], {

        type: "",
        grid: null,
        style: "width: 500px",

        /**
         * @Override
         */
        getContentWidget: function() {
            this.grid = new GridWidget({
                type: this.type,
                store: Store.getStore(this.type, config.app.defaultLanguage),
                columns: Model.getType(this.type).getAttributes({exclude: ['DATATYPE_IGNORE']}).map(function(attribute) {
                    return attribute.name;
                }),
                actions: [],
                canEdit: false,
                height: 198
            });
            return this.grid;
        },

        getSelectedOids: function () {
            return this.grid.getSelectedOids();
        }
    });
});