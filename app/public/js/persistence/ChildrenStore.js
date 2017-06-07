define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/promise/all",
    "dstore/Store",
    "dstore/QueryResults",
    "./RelationStore",
    "../model/meta/Model"
], function (
    declare,
    lang,
    all,
    Store,
    QueryResults,
    RelationStore,
    Model
) {
    var ChildrenStore = declare([Store], {
        entity: null,
        rootTypeName: '',

        constructor: function(entity, rootTypeName) {
            this.entity = entity;
            this.rootTypeName = rootTypeName;
        },

        fetch: function() {
            var deferredList = [];
            var oid = this.entity.get('oid');
            var type = Model.getTypeFromOid(oid);
            var simpleRootType = Model.getSimpleTypeName(this.rootTypeName);
            var relations = type.getRelations('child');
            for (var i=0, count=relations.length; i<count; i++) {
                var relation = relations[i];
                var relationName = relation.name;
                // only follow child relations that are no many to many relations
                // to the root type in order to prevent recursion which leads
                // to problems in a treegrid, where each node is only allowed once
                if (!(type.isManyToManyRelation(relationName) && relationName === simpleRootType)) {
                    var store = RelationStore.getStore(oid, relationName);
                    deferredList.push(store.fetch());
                }
            }
            return new QueryResults(all(deferredList).then(lang.hitch(this, function(data) {
                // concat data
                var result = [];
                for (var i=0, count=deferredList.length; i<count; i++) {
                    result = result.concat(data[i]);
                }
                // set display values
                var type = Model.getType(this.rootTypeName);
                var displayValues = type.displayValues;
                for (var i=0, count=result.length; i<count; i++) {
                    var child = result[i];
                    var childType = Model.getTypeFromOid(child.get('oid'));
                    for (var j=0, countJ=displayValues.length; j<countJ; j++) {
                        // set display value on first parent attribute's name
                        child.set(displayValues[j], j === 0 ? childType.getDisplayValue(child) : '');
                        // modify id to avoid conflicts with parent rows
                        child.set('_storeId', childType+'-'+child.get('_storeId'));
                    }
                }
                return result;
            })));
        },

        fetchRange: function(kwArgs) {
            // TODO pagination
            return this.fetch();
        }
    });

    return ChildrenStore;
});