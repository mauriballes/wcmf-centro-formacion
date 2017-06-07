define([
    "require",
    "dojo/_base/config"
], function (
    require,
    config
) {
    var p = config['routing-map'].pathPrefix,
        l = config['routing-map'].layers || {},
        mid = require.toAbsMid
    ;
    p = ''+p.slice(-1) !== '/' ? p+'/' : p;

    return {
        /*
        'myRoute': {
            schema: p + 'my-route',
            widget: mid('../app/ui/MyPage'),
            layers: l.app || []
        }
        */
    };
});