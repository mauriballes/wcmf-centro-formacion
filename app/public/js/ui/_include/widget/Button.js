define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dijit/form/Button"
], function (
    declare,
    lang,
    domStyle,
    domConstruct,
    Button
) {
    return declare([Button], {

        initialLabel: "",
        progressBar: null,
        isProcessing: false,
        isCancelable: false,

        postCreate: function () {
            this.inherited(arguments);

            domStyle.set(this.domNode, "position", "relative");
            this.progressBar = domConstruct.create("span", {
                style: {
                    backgroundColor: "#ddd",
                    position: "absolute",
                    left: 0,
                    width: 0,
                    height: "100%",
                    opacity: 0.3,
                    borderRadius: "4px 0 0 4px"
                },
                onclick: lang.hitch(this, function(e) {
                    if (!this.get("disabled")) {
                        this.onClick(e);
                    }
                })
            });
            domConstruct.place(this.progressBar, this.domNode, 'first');
        },

        setCancelable: function(isCancelable) {
            this.isCancelable = isCancelable;
        },

        setProgress: function(value) {
            if (!this.isProcessing) {
                this.setProcessing();
            }
            value = (value >= 0 && value < 1) ? value : 0;
            domStyle.set(this.progressBar, 'width', (value*100)+'%');
        },

        setProcessing: function() {
            this.isProcessing = true;
            this.initialLabel = this.get("label");
            this.set("label", this.initialLabel+' <i class="fa fa-spinner fa-spin"></i>');
            if (!this.isCancelable) {
                this.set("disabled", true);
            }
        },

        reset: function() {
            this.set("label", this.initialLabel);
            if (!this.isCancelable) {
                this.set("disabled", false);
            }
            this.setProgress(0);
            this.isProcessing = false;
        }
    });
});