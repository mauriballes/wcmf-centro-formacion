define( [
    "require",
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/when",
    "dojo/dom-construct",
    "dojo/Deferred"
],
function(
    require,
    declare,
    config,
    when,
    domConstruct,
    Deferred
) {
    var Renderer = declare(null, {
    });

  /**
     * Render the given value according to the given attribute definition.
     * @param value The value
     * @param attribute The attribute definition
     * @param options Object with attributes 'truncate' (integer)
     * @returns Deferred
     */
    Renderer.render = function(value, attribute, options) {
        options = options === undefined ? {} : options;
        var deferred = new Deferred();
        Renderer.getRenderer(attribute.displayType).then(function(renderer) {
            if (typeof renderer === 'function') {
                when(renderer(value, attribute), function(value) {
                    if (options.truncate) {
                        var length = parseInt(options.truncate);
                        if (attribute.displayType.toLowerCase() === 'text' && length > 0 && value) {
                            // strip tags
                            value = domConstruct.create("div", { innerHTML: value }).textContent;
                            if (value.length > length) {
                                value = value.substring(0, length)+'…';
                            }
                        }
                    }
                    deferred.resolve(value);
                });
            }
            else {
                deferred.resolve(value);
            }
            });
        return deferred;
    };

    Renderer.getRenderer = function(displayType) {
        var deferred = new Deferred();
        Renderer.loadRenderers().then(function() {
            if (displayType) {
                var displayTypes = Renderer.renderers;

                // get best matching renderer
                var bestMatch = '';
                for (var rendererDef in displayTypes) {
                    if (displayType.indexOf(rendererDef) === 0 && rendererDef.length > bestMatch.length) {
                        bestMatch = rendererDef;
                    }
                }
                // get the renderer
                if (bestMatch.length > 0) {
                    var renderer = displayTypes[bestMatch];
                    deferred.resolve(renderer);
                }
            }
            // default
            deferred.resolve(Renderer.renderers["text"]);
        });
        return deferred;
    };

    Renderer.loadRenderers = function() {
        var deferred = new Deferred();
        if (Renderer.renderers["text"]) {
            // if renderes were loaded already, resolve immediately
            deferred.resolve();
        }
        else {
            // load renderers
            var requiredRenderers = [];
            var displayTypes = config.app.displayTypes;
            for (var key in displayTypes) {
                requiredRenderers.push(displayTypes[key]);
            }
            require(requiredRenderers, function() {
                var i=0;
                for (var key in config.app.displayTypes) {
                    Renderer.renderers[key] = arguments[i++];
                }
                deferred.resolve();
            }, function(error) {
                deferred.reject(error);
            });
        }
        return deferred;
    };

    // initialize renderers
    Renderer.renderers = {};

    return Renderer;
});