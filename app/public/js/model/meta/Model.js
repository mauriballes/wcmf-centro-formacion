define([
    "../../config/types",
    "exports"
], function(
    types,
    exports
) {
    // use exports object to resolve circular dependencies
    // http://dojotoolkit.org/documentation/tutorials/1.9/modules_advanced/

    /**
     * Register a type
     * @param type A Node subclass
     */
    exports.registerType = function(type) {
        // register fully qualified type name
        var fqTypeName = type.typeName;
        exports.types[fqTypeName] = type;
        // also register simple type name
        var simpleTypeName = exports.calculateSimpleTypeName(fqTypeName);
        if (exports.simpleToFqNames[simpleTypeName] === undefined) {
            exports.types[simpleTypeName] = type;
            exports.simpleToFqNames[simpleTypeName] = fqTypeName;
        }
        else {
            // if the simple type name already exists, we remove
            // it in order to prevent collisions with the new type
            delete(exports.types[simpleTypeName]);
            delete(exports.simpleToFqNames[simpleTypeName]);
        }
    };

    /**
     * Calculate the simple type name for a given type name
     * @param typeName Simple or fully qualified type name
     * @return String
     */
    exports.calculateSimpleTypeName = function(typeName) {
        var pos = typeName.lastIndexOf('.');
        if (pos !== -1) {
            return typeName.substring(pos+1);
        }
        return typeName;
    };

    /**
     * Check if a type is known
     * @param typeName Simple or fully qualified type name
     * @return Boolean
     */
    exports.isKnownType = function(typeName) {
        return exports.types[typeName] !== undefined;
    };

    /**
     * Get the fully qualified type name for a given type name
     * @param typeName Simple or fully qualified type name
     * @return String
     */
    exports.getFullyQualifiedTypeName = function(typeName) {
        if (exports.simpleToFqNames[typeName] !== undefined) {
            return exports.simpleToFqNames[typeName];
        }
        if (exports.isKnownType(typeName)) {
            return typeName;
        }
        return null;
    };

    /**
     * Get the simple type name for a given type name
     * @param typeName Simple or fully qualified type name
     * @return String
     */
    exports.getSimpleTypeName = function(typeName) {
        var simpleTypeName = exports.calculateSimpleTypeName(typeName);
        // if there is a entry for the type name but not for the simple type name,
        // the type is ambiquous and we return the type name
        return (exports.types[typeName] !== undefined && exports.simpleToFqNames[simpleTypeName] === undefined) ?
            typeName : simpleTypeName;
    };

    /**
     * Get the type parameter from an object id. Object ids have
     * the format type:id1:id2..
     * @param oid The object id
     * @return String
     */
    exports.getTypeNameFromOid = function(oid) {
        if (oid) {
            var pos = oid.indexOf(':');
            if (pos !== -1) {
                return oid.substring(0, pos);
            }
        }
        return oid;
    };

    /**
     * Get the id parameter from an object id. Object ids have
     * the format type:id1:id2.. Returns type name, if no id is contained
     * @param oid The object id
     * @return String
     */
    exports.getIdFromOid = function(oid) {
        if (oid) {
            var pos = oid.indexOf(':');
            if (pos !== -1) {
                return oid.substring(pos+1);
            }
        }
        return oid;
    };

    /**
     * Assemble an (fully qualified) object id from the given parameters.
     * @param type The object's type
     * @param id The object's id
     * @return String
     */
    exports.getOid = function(type, id) {
        return exports.getFullyQualifiedTypeName(type)+":"+id;
    };

    /**
     * Get a dummy object id for a given type
     * @param type The type
     * @return String
     */
    exports.createDummyOid = function(type) {
        var oid = type+":~";
        return oid;
    };

    /**
     * Get if the given oid is a dummy id
     * @param oid The object id
     * @return Boolean
     */
    exports.isDummyOid = function(oid) {
        return oid.match(/:~$/) !== null;
    };

    /**
     * Strip the id from a dummy oid (returns type), return oid else
     * @param oid The object id
     * @return String
     */
    exports.removeDummyOid = function(oid) {
        return oid.replace(/:~$/, '');
    };

    /**
     * Get a type from it's name
     * @param typeName The name of the type
     * @return Node instance
     */
    exports.getType = function(typeName) {
        return exports.types[typeName];
    };

    /**
     * Get a type from an object id
     * @param oid The object id
     * @return Node instance
     */
    exports.getTypeFromOid = function(oid) {
        var typeName = exports.getTypeNameFromOid(oid);
        return exports.types[typeName];
    };

    /**
     * Get all types that are defined in the meta model
     * @return An array of Node instances
     */
    exports.getAllTypes = function() {
        var types = [];
        for (var typeName in exports.types) {
            types.push(exports.types[typeName]);
        }
        return types;
    };

    // register types
    exports.types = {};
    exports.simpleToFqNames = {};
    for (var i=0, count=types.length; i<count; i++) {
        exports.registerType(types[i]);
    }
});
