define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/request",
    "./ActionBase"
], function (
    declare,
    config,
    request,
    ActionBase
) {
    return declare([ActionBase], {

        name: 'lock',
        iconClass: 'fa fa-unlock',

        path: config.app.backendUrl+'lock',

        // action parameters
        entity: null, /* Entity */
        lockType: "optimistic", // "optimistic|pessimistic"

        execute: function() {
            return request.del(this.path+'/'+this.lockType+'/'+this.entity.get('oid'), {
                headers: {
                    Accept: "application/json"
                },
                handleAs: 'json'
            });
        }
    });
});
