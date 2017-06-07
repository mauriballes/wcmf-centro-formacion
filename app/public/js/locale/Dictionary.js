define([
    "dojo/_base/declare",
    "dojo/_base/lang"
],
function(
    declare,
    lang
) {
    var Dictionary = declare(null, {
    });

    /**
     * Set the content for the dictionary
     * @param data Map containing message ids and translations
     */
    Dictionary.setContent = function(data) {
        Dictionary.dict = data;
    };

    /**
     * Translate templates to the ui language.
     * It will translate text_to_translate in occurences of {translate:text_to_translate}
     * or {translate:text_%0%_%1%|r0,r1} in the given template. Template variables
     * that should be replaced by dojo's lang.replace function must be written
     * without brackets e.g. {translate:Create %0%|$typeName}. Usage:
     *
     * lang.replace(template, Dict.tplReplace)
     *
     * @param _ To be ignored
     * @param text Text to be translated
     * @returns String
     */
    Dictionary.tplTranslate = function(_, text) {
        if (text.match(/^translate:/)) {
            var key = text.replace(/^translate:/, "");
            // check for message|params combination
            var params = [];
            if (key.indexOf("|") >= 0) {
                var splitKey = key.split("|");
                key = splitKey[0];
                params = splitKey[1].split(",");
            }
            var result = Dictionary.translate(key, params);
            // replace template variables for further processing ($var -> ${var})
            result = result.replace(/\$([a-z0-9]+)/ig, "${$1}");
            return result;
        }
        else {
            return _;
        }
    };

    /**
     * Translate the given text into the ui language. Use params array
     * to replace %0%, %1%, .... variables in the text.
     *
     * @param text Text to be translated
     * @param params Array of replacements [optional]
     * @returns String
     */
    Dictionary.translate = function(text, params) {
        var dict = Dictionary.getDictionary();
        var translation = !dict[text] ? text : dict[text];
        // replace parameters
        if (typeof params === "object") {
            return lang.replace(translation, params, /\%([^\%]+)\%/g);
        }
        else {
            return translation;
        }
    };

    Dictionary.dict = {};

    Dictionary.getDictionary = function() {
        return Dictionary.dict;
    };

    return Dictionary;
});