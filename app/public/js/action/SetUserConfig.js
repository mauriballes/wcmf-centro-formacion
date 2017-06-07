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

        name: 'setUserConfig',
        iconClass: 'fa fa-wrench',

        path: config.app.backendUrl+'user/config',

        // action paramenters
        key: '',
        value: '',

        execute: function() {
            return request.post(this.path+'/'+this.key, {
                data: {
                    value: this.value
                },
                headers: {
                    Accept: "application/json"
                },
                handleAs: 'json'
            });
        }
    });
});
