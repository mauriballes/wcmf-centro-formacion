define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "./ActionBase",
    "../persistence/RelationStore"
], function (
    declare,
    lang,
    Deferred,
    ActionBase,
    RelationStore
) {
    return declare([ActionBase], {

        name: 'unlink',
        iconClass: 'fa fa-unlink',

        // action parameters
        source: null, /* Entity */
        entity: null, /* Entity */
        relation: null,

        execute: function() {
            var store = RelationStore.getStore(this.source.get('oid'), this.relation.name);
            var deferred = new Deferred();
            store.remove(store.getIdentity(this.entity)).then(lang.hitch(this, function(results) {
                // callback completes
                deferred.resolve(this.entity);
            }), lang.hitch(this, function(error) {
                // error
                deferred.reject(error);
            }));
            return deferred;
        }
    });
});
