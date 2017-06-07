define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/Deferred",
    "./ActionBase",
    "../ui/_include/widget/ConfirmDlgWidget",
    "../persistence/Store",
    "../model/meta/Model",
    "../locale/Dictionary"
], function (
    declare,
    lang,
    config,
    Deferred,
    ActionBase,
    ConfirmDlg,
    Store,
    Model,
    Dict
) {
    return declare([ActionBase], {

        name: 'delete',
        iconClass: 'fa fa-trash-o',

        // action parameters
        entity: null,

        execute: function() {
            var deferred = new Deferred();
            new ConfirmDlg({
                title: Dict.translate("Confirm Object Deletion"),
                message: Dict.translate("Do you really want to delete <em>%0%</em> ?",
                    [Model.getTypeFromOid(this.entity.get('oid')).getDisplayValue(this.entity)]),
                okCallback: lang.hitch(this, function(dlg) {
                    var typeName = Model.getTypeNameFromOid(this.entity.get('oid'));
                    var store = Store.getStore(typeName, config.app.defaultLanguage);
                    var storeDeferred = store.remove(store.getIdentity(this.entity)).then(lang.hitch(this, function(results) {
                        // success
                        deferred.resolve(this.entity);
                    }), lang.hitch(this, function(error) {
                        // error
                        deferred.reject(error);
                    }));
                    return storeDeferred;
                })
            }).show();
            return deferred;
        }
    });
});
