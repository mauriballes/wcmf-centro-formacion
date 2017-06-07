define([
    "dojo/_base/config"
],
function(
    config
) {
    return function(value, attribute) {
        if (value && value.toLowerCase().match(/\.gif$|\.jpg$|\.png$/)) {
            var url = value.replace(config.app.mediaSavePath, config.app.mediaBasePath);
            return '<a href="'+url+'" target="_blank"><img src="'+url+'" class="thumb"></a>';
        }
        return value;
    };
});