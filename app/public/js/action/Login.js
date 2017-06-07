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

        name: 'login',
        iconClass: 'fa fa-sign-in',

        path: config.app.backendUrl+'session',

        // action parameters
        user: '',
        password: '',

        execute: function() {
            return request.post(this.path, {
                data: {
                  user: this.user,
                  password: this.password
                },
                headers: {
                    Accept: "application/json"
                },
                handleAs: 'json'
            });
        }
    });
});
