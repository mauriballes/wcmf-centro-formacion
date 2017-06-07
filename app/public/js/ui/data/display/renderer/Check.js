define([
],
function(
) {
    return function(value, attribute) {
        return value == 1 ? '&#10004;' : '';
    };
});