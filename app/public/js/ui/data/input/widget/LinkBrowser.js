define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/topic",
    "../../../_include/widget/Button",
    "../../../_include/widget/ConfirmDlgWidget",
    "../../../../model/meta/Model",
    "../../../../locale/Dictionary",
    "./_BrowserControl"
],
function(
    declare,
    lang,
    config,
    topic,
    Button,
    ConfirmDlg,
    Model,
    Dict,
    _BrowserControl
) {
    return declare([_BrowserControl], {

        browserUrl: config.app.pathPrefix+'link',

        postCreate: function() {
            this.inherited(arguments);

            var testBtn = new Button({
                innerHTML: '<i class="fa fa-external-link"></i>',
                "class": "btn-mini",
                onClick: lang.hitch(this, function() {
                    var route = this.getLinkRoute();
                    if (route) {
                        // internal link
                        if (this.isDirty()) {
                            new ConfirmDlg({
                                title: Dict.translate("Confirm Leave Page"),
                                message: Dict.translate("There are unsaved changes. Leaving the page will discard these. Do you want to proceed?"),
                                okCallback: lang.hitch(this, function(dlg) {
                                    topic.publish('navigate', route.name, route.pathParams);
                                })
                            }).show();
                        }
                        else {
                            topic.publish('navigate', route.name, route.pathParams);
                        }
                    }
                    else if (this.isFile()) {
                        // file
                        window.open(this.getFile(), "_blank");
                    }
                    else {
                        // external link
                        var value = this.get("value");
                        if (value && !value.match(/http[s]?:\/\//)) {
                            value = 'http://'+value;
                        }
                        window.open(value, "_blank");
                    }
                })
            });
            this.addChild(testBtn);
        },

        /**
         * Get the link navigation parameters
         * @returns Object with attributes name, pathParams
         */
        getLinkRoute: function() {
            var value = this.get("value");
            if (value && value.match(/^link:\/\//)) {
                var oid = value.replace(/^link:\/\//, '');
                var type = Model.getSimpleTypeName(Model.getTypeNameFromOid(oid));
                var id = Model.getIdFromOid(oid);
                var pathParams = { type:type, id:id };
                return {
                    name: "entity",
                    pathParams: pathParams
                };
            }
            return null;
        }
    });
});