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

        name: 'getPermissions',
        iconClass: 'fa fa-shield',

        path: config.app.backendUrl+'permissions',

        // action parameters
        operation: '',

        execute: function() {
            return request.get(this.path, {
                query: {
                    "operation": this.operation
                },
                headers: {
                    Accept: "application/json"
                },
                handleAs: 'json'
            });
        }
    });
});
