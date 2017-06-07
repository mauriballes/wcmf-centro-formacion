define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/on",
    "../../../_include/widget/Button",
    "./_BrowserControl"
],
function(
    declare,
    lang,
    config,
    on,
    Button,
    _BrowserControl
) {
    return declare([_BrowserControl], {

        browserUrl: config.app.pathPrefix+'media',

        postCreate: function() {
            this.inherited(arguments);

            this.downloadBtn = new Button({
                disabled: this.disabled,
                innerHTML: '<i class="fa fa-download"></i>',
                "class": "btn-mini",
                onClick: lang.hitch(this, function() {
                    window.open(this.getFile(), "_blank");
                })
            });
            this.downloadBtn.set("disabled", this.disabled || !this.isFile());
            this.addChild(this.downloadBtn);

            this.own(
                on(this.textbox, "change", lang.hitch(this, function(value) {
                    this.downloadBtn.set("disabled", this.disabled || !this.isFile());
                }))
            );
        }
    });
});