define([
    "../../input/Factory"
],
function(
    ControlFactory
) {
    return function(value, attribute) {
        return ControlFactory.translateValue(attribute.inputType, value);
    };
});