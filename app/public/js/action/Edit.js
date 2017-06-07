define([
    "dojo/_base/declare",
    "./ActionBase",
    "../model/meta/Model"
], function (
    declare,
    ActionBase,
    Model
) {
    return declare([ActionBase], {

        name: 'edit',
        iconClass: 'fa fa-pencil',

        route: '',
        page: null,

        // action parameters
        entity: null,

        execute: function() {
            return this.page.pushConfirmed(this.getUrl());
        },

        getUrl: function() {
            var oid = this.entity.get('oid');
            var route = this.page.getRoute(this.route);
            var type = Model.getSimpleTypeName(Model.getTypeNameFromOid(oid));
            var id = Model.getIdFromOid(oid);
            var pathParams = { type:type, id:id };
            return route.assemble(pathParams);
        }
    });
});
