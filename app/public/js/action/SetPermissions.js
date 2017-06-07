define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/request",
    "./ActionBase",
    "dojo/json"
], function (
    declare,
    config,
    request,
    ActionBase,
    JSON
) {
    return declare([ActionBase], {

        name: 'getPermissions',
        iconClass: 'fa fa-shield',

        path: config.app.backendUrl+'permissions',

        // action parameters
        operation: '',
        permissions: {},

        execute: function() {
            var data = {
                operation: this.operation,
                permissions: this.permissions
            }
            return request.put(this.path, {
                data: JSON.stringify(data),
                headers: {
                    Accept: "application/json",
                    'Content-Type': 'application/json'
                },
                handleAs: 'json'
            });
        }
    });
});
