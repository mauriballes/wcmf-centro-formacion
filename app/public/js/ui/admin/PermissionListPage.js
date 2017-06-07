define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "../data/EntityListPage",
    "../../model/meta/Model",
    "../../locale/Dictionary",
    "dojo/text!./template/PermissionListPage.html"
], function (
    require,
    declare,
    lang,
    config,
    EntityListPage,
    Model,
    Dict,
    template
) {
    return declare([EntityListPage], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Permission Management'),
        type: Model.getSimpleTypeName(config.app.permissionType),

        baseRoute: "permission",
        types: [
          Model.getSimpleTypeName(config.app.permissionType)
        ],
        hasTree: false
    });
});