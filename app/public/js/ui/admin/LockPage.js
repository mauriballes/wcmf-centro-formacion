define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "../data/EntityPage",
    "../../model/meta/Model",
    "../../locale/Dictionary",
    "dojo/text!./template/LockPage.html"
], function (
    require,
    declare,
    lang,
    config,
    EntityPage,
    Model,
    Dict,
    template
) {
    return declare([EntityPage], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Lock Management'),
        type: Model.getSimpleTypeName(config.app.lockType),

        baseRoute: "lock",
        types: [
          Model.getSimpleTypeName(config.app.lockType)
        ]
    });
});