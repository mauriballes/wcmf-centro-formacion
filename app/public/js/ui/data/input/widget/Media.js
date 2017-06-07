define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dijit/form/TextBox",
    "../../../_include/widget/Button",
    "../../../_include/widget/PopupDlgWidget",
    "./FileBrowser",
    "../../../../locale/Dictionary"
],
function(
    declare,
    lang,
    config,
    TextBox,
    Button,
    PopupDlg,
    FileBrowser,
    Dict
) {
    return declare([FileBrowser], {

        browserUrl: config.app.pathPrefix+'media',

        postCreate: function() {
            this.inherited(arguments);

            // create embed button
            var codeTextBox = new TextBox({
                placeHolder: Dict.translate("Embed Code")
            });
            var embedBtn = new Button({
                innerHTML: '<i class="fa fa-external-link"></i>',
                "class": "btn-mini",
                onClick: lang.hitch(this, function() {
                    new PopupDlg({
                        title: Dict.translate("External source"),
                        contentWidget: codeTextBox,
                        okCallback: lang.hitch(this, function() {
                            // extract src from iframe
                            var text = codeTextBox.get("value");
                            var re = new RegExp('^<iframe .*src="([^"]+)".*');
                            var matches = re.exec(text);
                            if (matches && matches.length > 1) {
                                var url = matches[1];
                                this.set("value", url);
                            }
                        })
                    }).show();
                })
            });
            this.addChild(embedBtn);
        }
    });
});