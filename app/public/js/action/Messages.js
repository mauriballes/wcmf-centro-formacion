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

        name: 'messages',
        iconClass: 'fa fa-book',

        path: config.app.backendUrl+'messages',

        // action parameters
        language: '',

        execute: function() {
            return request.get(this.path+'/'+this.language, {
                headers: {
                    Accept: "application/json"
                },
                handleAs: 'json'
            });
        }
    });
});
