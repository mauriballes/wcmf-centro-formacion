define([
    "dojo/_base/declare",
    "./ActionBase",
    "../ui/data/widget/PermissionDlgWidget",
    "../locale/Dictionary",
    "../model/meta/Model"
], function (
    declare,
    ActionBase,
    PermissionDlg,
    Dict,
    Model
) {
    return declare([ActionBase], {

        name: 'permissions',
        iconClass: 'fa fa-shield',

        // action parameters
        entity: null,

        execute: function() {
            var oid = this.entity.get('oid');
            var typeClass = Model.getType(Model.getTypeNameFromOid(oid));
            var displayValue = typeClass.getDisplayValue(this.entity);
            new PermissionDlg({
                oid: this.entity.get('oid'),
                message: Dict.translate("Permissions for <em>%0%</em>", [displayValue])
            }).show();
        }
    });
});
