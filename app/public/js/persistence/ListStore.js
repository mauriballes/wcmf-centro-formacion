define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/Deferred",
    "dojo/json",
    "dstore/Rest",
    "dstore/Cache",
    "dojox/encoding/base64"
], function (
    declare,
    lang,
    config,
    Deferred,
    JSON,
    Rest,
    Cache,
    base64
) {
    /**
     * ListStore is used to get the content for list controls from the server.
     * It expects an array of objects with properties 'oid', 'value' and
     * 'displayText' sent by the server.
     */
    var ListStore = declare([Rest, Cache], {

        listDef: '',
        language: '',
        target: '',

        idProperty: 'oid',
        canCacheQuery: true,

        constructor: function(options) {
            declare.safeMixin(this, options);

            this.listDefStr = JSON.stringify(this.listDef);

            // base64 encode listDef
            var b = [];
            for (var i=0, count=this.listDefStr.length; i<count; ++i) {
                b.push(this.listDefStr.charCodeAt(i));
            }

            // set target for xhr requests
            this.target = config.app.pathPrefix+"list/"+this.language+"/"+base64.encode(b)+"/";
        },

        get: function(id) {
            var deferred = new Deferred();
            var filter = {};
            filter[this.idProperty] = 'eq='+id;
            this.filter(filter).forEach(lang.hitch(this, function (object) {
                // we expect only one object
                deferred.resolve(object);
            }));
            return deferred;
        },

        parse: function(response) {
            var data = JSON.parse(response);
            var result = data.list ? data.list : [];
            return result;
        }
    });

    /**
     * Registry for shared instances
     */
    ListStore.storeInstances = {};

    /**
     * Get the store for a given list definition and language
     * @param listDef The list definition object as defined in the input type
     * @param language The language
     * @return Store instance
     */
    ListStore.getStore = function(listDef, language) {
        var listDefStr = JSON.stringify(listDef);

        // register store under the list definition
        if (!ListStore.storeInstances[listDefStr]) {
            ListStore.storeInstances[listDefStr] = {};
        }
        if (!ListStore.storeInstances[listDefStr][language]) {
            var store = new ListStore({
                listDef: listDef,
                language: language
            });
            ListStore.storeInstances[listDefStr][language] = store;
        }
        return ListStore.storeInstances[listDefStr][language];
    };

    return ListStore;
});