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
        source: null, /* Entity */
        relation: null,

        execute: function() {
            return this.page.pushConfirmed(this.getUrl());
        },

        getUrl: function() {
            var route = this.page.getRoute(this.route);
            var type = this.relation.type;
            var oid = Model.createDummyOid(type);
            var pathParams = { type:type, id:Model.getIdFromOid(oid) };
            var url = route.assemble(pathParams);
            url += "?oid="+this.source.get('oid')+"&relation="+this.relation.name;
            return url;
        }
    });
});
