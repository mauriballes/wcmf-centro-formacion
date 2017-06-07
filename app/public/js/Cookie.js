define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/cookie",
    "dojo/json"
], function(
    declare,
    config,
    cookie,
    JSON
) {
    var Cookie = declare(null, {

        name: config.app.title.replace(/\s/g, '_'),

        /**
         * Set a value in a cookie
         * @param key The key
         * @param value The value
         * @param name Optional cookie name (default to application title)
         */
        set: function(key, value, name) {
            var cookieName = this._getCookieName(name);
            var data = this.getAll(name);
            data[key] = value;
            cookie(cookieName, JSON.stringify(data), { path: '/' });
        },

        /**
         * Get a value from a cookie
         * @param key The key
         * @param defaultValue The default value, if the key does not exist
         * @param name Optional cookie name (default to application title)
         * @return Object
         */
        get: function(key, defaultValue, name) {
            var data = this.getAll(name);
            if (data[key] === undefined) {
                data[key] = defaultValue;
            }
            return data[key];
        },

        /**
         * Get all values from a cookie
         * @param name Optional cookie name (default to application title)
         * @returns Object
         */
        getAll: function(name) {
            var cookieName = this._getCookieName(name);
            var cookieValue = cookie(cookieName) || '{}';
            return JSON.parse(cookieValue, true);
        },

        /**
         * Delete a cookie
         * @param name Optional cookie name (default to application title)
         */
        destroy: function(name) {
            var cookieName = this._getCookieName(name);
            cookie(cookieName, '', { path: '/' });
        },

        /**
         * Delete all cookies for the current page
         */
        destroyAll: function() {
            var cookies = document.cookie.split(";");
            for (var i=0; i<cookies.length; i++) {
              var cookieName = cookies[i].split("=")[0];
              cookie(cookieName, '', { path: '/' });
            }
        },

        _getCookieName: function(cookieName) {
            return cookieName ? this.name+'.'+cookieName : this.name;
        }
    });

    return new Cookie();
});
