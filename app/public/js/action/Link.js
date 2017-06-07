define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/Deferred",
    "dojo/promise/all",
    "./ActionBase",
    "../ui/_include/widget/ObjectSelectDlgWidget",
    "../persistence/Entity",
    "../persistence/Store",
    "../persistence/RelationStore",
    "../model/meta/Model",
    "../locale/Dictionary"
], function (
    declare,
    lang,
    config,
    Deferred,
    all,
    ActionBase,
    ObjectSelectDlg,
    Entity,
    Store,
    RelationStore,
    Model,
    Dict
) {
    return declare([ActionBase], {

        name: 'link',
        iconClass: 'fa fa-link',

        // action parameters
        source: null, /* Entity */
        relation: null,

        execute: function() {
            var relationType = this.relation.type;
            var relationName = this.relation.name;
            var oid = this.source.get('oid');
            var displayValue = Model.getTypeFromOid(oid).getDisplayValue(this.source);

            var deferred = new Deferred();
            new ObjectSelectDlg({
                type: relationType,
                title: Dict.translate("Choose Objects"),
                message: Dict.translate("Select <em>%0%</em> objects, you want to link to <em>%1%</em>",
                    [Dict.translate(relationType), displayValue]),
                okCallback: lang.hitch(this, function(dlg) {
                    var entityStore = Store.getStore(relationType, config.app.defaultLanguage);
                    var relStore = RelationStore.getStore(oid, relationName);

                    var oids = dlg.getSelectedOids();
                    var loadPromises = [];
                    for (var i=0, count=oids.length; i<count; i++) {
                        var entityId = entityStore.getIdentity(new Entity({ oid:oids[i] }));
                        loadPromises.push(entityStore.get(entityId));
                    }
                    var deferredList = [];
                    all(loadPromises).then(lang.hitch(this, function(loadResults) {
                        for (var i=0, count=loadResults.length; i<count; i++) {
                            var entity = loadResults[i];
                            deferredList.push(relStore.put(entity, {overwrite: true}));
                        }
                        all(deferredList).then(lang.hitch(this, function(results) {
                            // callback completes
                            deferred.resolve(results);
                        }), lang.hitch(this, function(error) {
                            // error
                            deferred.reject(error);
                        }));
                    }));
                    return all(loadPromises);
                })
            }).show();
            return deferred;
        }
    });
});
