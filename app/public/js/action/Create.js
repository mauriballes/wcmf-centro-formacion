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

        name: 'create',
        iconClass: 'fa fa-star',

        route: '',
        page: null,

        // action parameters
        type: null,

        execute: function() {
            return this.page.pushConfirmed(this.getUrl());
        },

        getUrl: function() {
            var route = this.page.getRoute(this.route);
            var oid = Model.createDummyOid(this.type);
            var pathParams = { type:this.type, id:Model.getIdFromOid(oid) };
            return route.assemble(pathParams);
        }
    });
});
