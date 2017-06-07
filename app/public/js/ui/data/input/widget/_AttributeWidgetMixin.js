define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "../../../../model/meta/Model"
], function (
    declare,
    lang,
    on,
    Model
) {
    /**
     * Attribute widget mixin. Manages the dirty flag.
     */
    return declare([], {
        _isDirty: false,

        postCreate: function() {
            this.inherited(arguments);

            this.own(
                on(this, "change", lang.hitch(this, function() {
                    this.setDirty(true);
                }))
            );
        },

        setDirty: function(isDirty) {
            this._isDirty = isDirty;
        },

        isDirty: function() {
            return this._isDirty;
        },

        getAttributeDefinition: function() {
            if (this.entity) {
                var typeClass = Model.getTypeFromOid(this.entity.oid);
                return typeClass.getAttribute(this.name);
            }
            return null;
        }
    });
});