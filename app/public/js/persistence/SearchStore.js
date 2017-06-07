define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/_base/array",
  	"dojo/json",
    "dstore/Rest",
    "../model/meta/Model",
    "../persistence/Entity"
], function (
    declare,
    config,
    array,
    JSON,
    Rest,
    Model,
    Entity
) {
    var Store = declare([Rest], {

        idProperty: 'oid',
        Model: Entity,

        parse: function(response) {
            var data = JSON.parse(response);
            var result = array.filter(data.list, function(item){
                return Model.isKnownType(item._type);
            });
            return result;
        }
    });

    /**
     * Get the store for a given search term
     * @param searchterm The searchterm
     * @return Store instance
     */
    Store.getStore = function(searchterm) {
        return new Store({
            target: config.app.backendUrl+"?action=search&query="+searchterm
        });
    };

    return Store;
});