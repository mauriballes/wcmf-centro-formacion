define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/Stateful",
    "../model/meta/Model"
], function(
    declare,
    topic,
    Stateful,
    Model
) {
    /**
     * Entity inherits observer capabilities from Stateful
     * and emits entity-datachange event, if properties change.
     * Entities may exist in different states (clean, dirty, new, deleted).
     * If the state changes a entity-statechange event is emitted.
     */
    var Entity = declare([Stateful], {

        /**
         * Computed property composed from pk values.
         * Used to identify the object in the store,
         * where only skalar values are allowed for ids
         */
        _storeId: null,

        /**
         * Entity state (clean, dirty, new, deleted)
         */
        _state: "clean",

        /**
         * Indicates if the entity has objects in child relations
         * (property maybe used in tree views)
         */
        hasChildren: false,

        constructor: function(args) {
            this._state = "clean";
        },

        /**
         * Gets called automatically after constructors for
         * all classes declared with dojo/_base/declare
         */
        postscript: function(params) {
            this.inherited(arguments);

            // set hasChildren property
            var oid = this.get('oid');
            if (oid) {
                var type = Model.getTypeFromOid(this.get('oid'));
                var relations = type.getRelations('child');
                for (var i=0, count=relations.length; i<count; i++) {
                    var relationProp = this[relations[i].name];
                    if (relationProp) {
                        this.hasChildren = true;
                        break;
                    }
                }
            }

            // watch after initial set
            this.watch(function(name, oldValue, newValue) {
                // also notify, if values are the same
                if (name !== '_state') {
                    topic.publish("entity-datachange", {
                        entity: this,
                        name: name,
                        oldValue: oldValue,
                        newValue: newValue
                    });
                }
                else {
                    topic.publish("entity-statechange", {
                        entity: this,
                        oldValue: oldValue,
                        newValue: newValue
                    });
                }
            });
        },

        /**
         * This method gets called, if this class is defined as Model
         * property in dstore store instances.
         */
        _restore: function(Model, mutateAllowed) {
            return new Model(this);
        },

        refreshStoreId: function() {
            this._storeId = Model.getIdFromOid(this.get('oid'));
        },

        _oidSetter: function(oid) {
            this.oid = oid;
            this.refreshStoreId();
        },

        setState: function(state) {
            if (state !== this._state) {
                this.set("_state", state);
            }
        },

        getState: function() {
            return this.get("_state");
        },

        setDefaults: function() {
            var typeClass = Model.getTypeFromOid(this.get('oid'));
            var attributes = typeClass.getAttributes();
            for (var i=0, count=attributes.length; i<count; i++) {
                var attribute = attributes[i];
                this.set(attribute.name, attribute.defaultValue);
            }
        }
    });

    return Entity;
});
