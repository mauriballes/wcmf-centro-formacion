define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/aspect",
    "dojo/when",
    "dojo/topic",
    "dojo/store/JsonRest",
    "dojo/store/util/QueryResults",
    "../AuthToken"
], function (
    declare,
    config,
    aspect,
    when,
    topic,
    JsonRest,
    QueryResults,
    AuthToken
) {
    var TreeStore = declare([JsonRest], {

        idProperty: 'oid',
        headers: {
            Accept: "application/json"
        },

        constructor: function(options) {
            declare.safeMixin(this, options);

            // add auth token header if available
            var authTokenValue = AuthToken.get();
            if (authTokenValue !== undefined) {
                this.headers[AuthToken.name] = authTokenValue;
            }

            aspect.after(this, 'query', function(QueryResults) {
                when(QueryResults, function() {}, function(error) {
                    if (error.dojoType && error.dojoType === 'cancel') {
                        return; // ignore cancellations
                    }
                    topic.publish("store-error", error);
                });
                return QueryResults;
            });
        },

      	get: function(id, options) {
            throw new Error("Operation 'get' is not supported.");
        },

      	put: function(object, options) {
            throw new Error("Operation 'put' is not supported.");
        },

      	add: function(object, options) {
            throw new Error("Operation 'add' is not supported.");
        },

      	remove: function(id, options) {
            throw new Error("Operation 'remove' is not supported.");
        },

        query: function(query, options) {
            if (query.oid === 'init') {
                return [{
                    oid: 'root',
                    displayText: 'ROOT'
                }]
            }
            else {
                return this.inherited(arguments).then(function(results) {
                    return QueryResults(results["list"]);
                });
            }
        },

        getChildren: function(object) {
            return this.query(object);
        }
    });

    /**
     * Registry for shared instances
     */
    TreeStore.storeInstances = {};

    /**
     * Get the tree store with the given root types
     * @param rootTypes The root types configuration value
     * @return Store instance
     */
    TreeStore.getStore = function(rootTypes) {
        if (!TreeStore.storeInstances[rootTypes]) {
            var store = new TreeStore({
                target: config.app.backendUrl+"?action=browseTree&rootTypes=linkableTypes"
            });
            TreeStore.storeInstances[rootTypes] = store;
        }
        return TreeStore.storeInstances[rootTypes];
    };

    return TreeStore;
});