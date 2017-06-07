define( [
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/_base/array",
    "dojo/json",
    "dojo/Deferred",
    "dojo/when",
    "../../../model/meta/Model",
    "../../../persistence/ListStore"
],
function(
    require,
    declare,
    lang,
    config,
    array,
    JSON,
    Deferred,
    when,
    Model,
    ListStore
) {
    var Factory = declare(null, {
    });

    /**
     * Load the control classes for a given entity type.
     * @param type The entity type name
     * @returns Deferred which returns a map with attribute names as
     * keys and control classes as values
     */
    Factory.loadControlClasses = function(type) {
        var deferred = new Deferred();

        var inputTypeMap = {};
        var typeClass = Model.getType(type);
        var attributes = typeClass.getAttributes({include: ['DATATYPE_ATTRIBUTE']});

        // collect all control classes
        for (var i=0, count=attributes.length; i<count; i++) {
            var inputType = attributes[i].inputType;
            var controlClass = Factory.getControlClass(inputType);
            inputTypeMap[inputType] = controlClass;
        }

        var controls = [];
        for (var key in inputTypeMap) {
            var controlClass = inputTypeMap[key];
            if (array.indexOf(controls, inputTypeMap[key]) === -1) {
                controls.push(controlClass);
            }
        }

        require(controls, function() {
            // store loaded classes in inputTyp -> control map
            var result = {};
            for (var key in inputTypeMap) {
                var control = arguments[array.indexOf(controls, inputTypeMap[key])];
                if (!(typeof control === 'function')) {
                    deferred.reject({ message: "Control for input type '"+key+"' not found."});
                }
                result[key] = control;
            }

            deferred.resolve(result);
        }, function(error) {
            deferred.reject(error);
        });
        return deferred;
    };

    Factory.getControlClass = function(inputType) {
        if (inputType) {
            var inputTypes = config.app.inputTypes;

            // get best matching control
            var bestMatch = '';
            for (var controlDef in inputTypes) {
                if (inputType.indexOf(controlDef) === 0 && controlDef.length > bestMatch.length) {
                    bestMatch = controlDef;
                }
            }
            // get the control
            if (bestMatch.length > 0) {
                var controlClass = inputTypes[bestMatch];
                return controlClass;
            }
        }
        // default
        return require.toAbsMid("./widget/TextBox");
    };

    /**
     * Called by list controls to retrive the value store
     * @param inputType The input type (contains the list definition in options)
     * @returns Store
     */
    Factory.getListStore = function(inputType) {
        var options = Factory.getOptions(inputType);
        if (!options['list']) {
            throw new Error("Input type '"+inputType+"' does not contain a list definition");
        }
        return ListStore.getStore(options['list'], config.app.defaultLanguage);
    };

    /**
     * Translate the given value according to the list definition that
     * might be contained in the input type
     * @param inputType The input type (contains the list definition after '#' char)
     * @param value The value
     * @returns Deferred
     */
    Factory.translateValue = function(inputType, value) {
        var deferred = new Deferred();
        when(Factory.getItem(inputType, value), function(item) {
            var value = item && item.hasOwnProperty('displayText') ? item.displayText :
                    item === undefined ? null : item;
            deferred.resolve(value);
        });
        return deferred;
    },

    /**
     * Get the list item for the given value according to the list definition that
     * might be contained in the input type
     * @param inputType The input type (contains the list definition after '#' char)
     * @param value The value
     * @returns Deferred
     */
    Factory.getItem = function(inputType, value) {
        var translateKey = inputType+'.'+value;
        if (!Factory._translatePromises.hasOwnProperty(translateKey)) {
            Factory._translatePromises[translateKey] = new Deferred();
        }
        var deferred = Factory._translatePromises[translateKey];
        var options = Factory.getOptions(inputType);
        if (options['list'] && value !== null) {
            // check list cache
            var listKey = inputType;
            if (Factory._listCache.hasOwnProperty(listKey)) {
                // if a cache value exists, it might be a promise for the load result
                // or an already resolved list
                when(Factory._listCache[listKey], lang.partial(function(listKey, result) {
                    // cache result and return requested value
                    Factory._listCache[listKey] = result;
                    result.forEach(function(object) {
                        var translateKey = listKey+'.'+object.value;
                        if (Factory._translatePromises.hasOwnProperty(translateKey)) {
                            Factory._translatePromises[translateKey].resolve(object);
                        }
                    });
                }, listKey));
            }
            else {
                // NOTE loading all items once and caching the result
                // is faster than resolving the value on each request
                // store promise in cache and resolve later
                var store = ListStore.getStore(options['list'], config.app.defaultLanguage);
                Factory._listCache[listKey] = store.fetch();
                return Factory.getItem(inputType, value);
            }
        }
        else {
            deferred.resolve(value, null);
        }
        return deferred;
    };

    /**
     * Get the options from the given input type
     * @param inputType The input type
     * @returns Object
     */
    Factory.getOptions = function(inputType) {
        if (inputType) {
            var optionsStr = inputType.match(/:(\{.+\})/);
            var options = optionsStr ? JSON.parse(optionsStr[1]) : {};
            return options;
        }
        return {};
    };

    /**
     * Add an empty item to a list definition
     * @param inputType The input type
     * @param emptyItem
     * @returns String
     */
    Factory.addEmptyItem = function(inputType, emptyItem) {
        if (inputType) {
            var controlStr = inputType.match(/(.+?):/);
            if (controlStr) {
                var options = Factory.getOptions(inputType);
                options['list']['emptyItem'] = emptyItem;
                return controlStr[1]+':'+JSON.stringify(options);
            }
        }
        return inputType;
    };

    /**
     * Registry for translated values
     */
    Factory._listCache = {};
    Factory._translatePromises = {};

    return Factory;
});