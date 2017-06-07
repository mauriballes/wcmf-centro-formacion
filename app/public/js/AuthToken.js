define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/cookie"
], function (
    declare,
    config,
    cookie
) {
    var AuthToken = declare(null, {

        name: "X-Auth-Token",

        /**
         * Get the token value
         * @returns String|undefined
         */
        get: function() {
            var token = cookie(config.app.cookiePrefix+"-token");
            return token && token.length ? token : undefined;
        }
    });

    return new AuthToken();
});