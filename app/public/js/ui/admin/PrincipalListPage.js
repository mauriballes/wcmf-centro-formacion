define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "../data/EntityListPage",
    "../../model/meta/Model",
    "../../locale/Dictionary",
    "dojo/text!./template/PrincipalListPage.html"
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
        title: Dict.translate('User Management'),

        baseRoute: "principal",
        types: [
          Model.getSimpleTypeName(config.app.userType),
          Model.getSimpleTypeName(config.app.roleType)
        ],
        hasTree: false
    });
});