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

        name: 'changePassword',
        iconClass: 'fa fa-user-secret',

        path: config.app.backendUrl+'user/password',

        // action paramenters
        oldpassword: '',
        newpassword1: '',
        newpassword2: '',

        execute: function() {
            return request.put(this.path, {
                data: {
                    oldpassword: this.oldpassword,
                    newpassword1: this.newpassword1,
                    newpassword2: this.newpassword2
                },
                headers: {
                    Accept: "application/json"
                },
                handleAs: 'json'
            });
        }
    });
});
