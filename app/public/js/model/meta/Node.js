define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/when",
    "./Model",
    "../../locale/Dictionary",
    "../../ui/data/display/Renderer"
], function(
    declare,
    lang,
    array,
    when,
    Model,
    Dict,
    Renderer
) {
    var Node = declare(null, {

        /**
         * Attributes defined in subclasses
         */
        typeName: '',
        description: '',
        isSortable: false,
        displayValues: [],
        pkNames: [],
        relationOrder: [],
        attributes: [],
        relations: [],

        /**
         * Methods optionally implemented in subclasses
         */
        getSummary: null, // function(data) {}
        getEntityRelations: null, // function(data) {}

        allRelations: null,
        parentRelations: null,
        childRelations: null,

        /**
         * Get all relation definitions
         * @param type Relation type, 'all', 'parent' or 'child'
         * @param entity Entity to get the value for (optional)
         * @return Array
         */
        getRelations: function(type, entity) {
            var varname = type+'Relations';
            if (!this[varname] || entity) {
                var relations = (entity && typeof this.getEntityRelations === 'function') ?
                    this.getEntityRelations(entity) : this.relations;
                var rel = [];
                for(var i=0, count=relations.length; i<count; i++) {
                    var relation = relations[i];
                    if (type === 'all' || relation.relationType === type) {
                        rel.push(relation);
                    }
                }
                var sortingArr = this.relationOrder;
                rel.sort(lang.hitch(this, function(a, b) {
                    return sortingArr.indexOf(a.name) - sortingArr.indexOf(b.name);
                }));
                this[varname] = rel;
            }
            return this[varname];
        },

        /**
         * Get a relation definition for a given role name
         * @param roleName The name of the role
         * @return Object
         */
        getRelation: function(roleName) {
            for (var i=0, count=this.relations.length; i<count; i++) {
                if (this.relations[i].name === roleName) {
                    return this.relations[i];
                }
            }
            return null;
        },

        /**
         * Check if the given role name belongs to a many to many relation
         * @param roleName The name of the role
         * @return Boolean
         */
        isManyToManyRelation: function(roleName) {
            var relation = this.getRelation(roleName);
            var otherRelation = Model.getType(relation.type).getRelation(relation.thisEndName);
            return this.isMany(relation.maxMultiplicity) &&
                    this.isMany(otherRelation.maxMultiplicity);
        },

        /**
         * Check if the multiplicity belongs to a many end
         * @param multiplicity
         * @return Boolean
         */
        isMany: function(multiplicity) {
            return multiplicity > 1 || multiplicity === "unbounded";
        },

        /**
         * Get the Node for a given role name
         * @param roleName The name of the role
         * @return Node
         */
        getTypeForRole: function(roleName) {
            var relation = this.getRelation(roleName);
            if (relation !== null) {
                return Model.getType(relation.type);
            }
            return null;
        },

        /**
         * Get the attribute definitions
         * @param filter Optional filter with properties:
         *        - include: Array of tags to include
         *        - exclude: Array of tags to exclude
         * @return Array
         */
        getAttributes: function(filter) {
            var result = [];
            var include = filter ? filter.include : undefined;
            var exclude = filter ? filter.exclude : undefined;
            for (var i=0, count=this.attributes.length; i<count; i++) {
                var attribute = this.attributes[i];
                var tags = attribute.tags;
                var includeOk = !include || (tags && tags.filter(function(n) {
                    return include.indexOf(n) !== -1;
                }).length === include.length);
                var excludeOk = !exclude || (!tags || tags.filter(function(n) {
                    return exclude.indexOf(n) !== -1;
                }).length === 0);
                if (includeOk && excludeOk) {
                    result.push(attribute);
                }
            }
            return result;
        },

        /**
         * Get the attribute definition for a given name
         * @param name The name of the attribute
         * @return Object
         */
        getAttribute: function(name) {
            for (var i=0, count=this.attributes.length; i<count; i++) {
                var attribute = this.attributes[i];
                if (attribute.name === name) {
                    return attribute;
                }
            }
            return null;
        },

        /**
         * Get the display value for the given entity.
         * @param entity Entity to get the value for
         * @return String
         */
        getDisplayValue: function(entity) {
            var result = '';
            var oid = entity.get('oid');
            var type = Model.getTypeFromOid(oid);
            if (type) {
                if (Model.isDummyOid(oid)) {
                    result = Dict.translate("New <em>%0%</em>",
                        [Dict.translate(Model.getSimpleTypeName(type.typeName))]);
                }
                else {
                    var values = [];
                    var renderOptions = { truncate: 20 };
                    for (var i=0; i<type.displayValues.length; i++) {
                        var curValue = type.displayValues[i];
                        var curAttribute = type.getAttribute(curValue);
                        when(Renderer.render(entity[curValue], curAttribute, renderOptions), function(value) {
                            var length = value ? value.toString().length : 0;
                            if (value && length > 0) {
                                values.push(value);
                            }
                        });
                    }
                    result = values.join(" - ");
                }
            }
            else {
                result = oid || "unknown";
            }
            return result;
        },

        /**
         * Check if the given attribute is editable in the given entity.
         * The default implementation returns the isEditable property of the attribute.
         * @param entity The entity
         * @return Boolean
         */
        isEditable: function(attribute, entity) {
            return attribute.isEditable;
        }
    });

    return Node;
});
