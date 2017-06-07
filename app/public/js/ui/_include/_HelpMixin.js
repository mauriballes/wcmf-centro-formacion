define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dijit/TooltipDialog",
    "dijit/popup",
    "dojo/on",
    "dojo/ready"
], function (
    declare,
    lang,
    query,
    TooltipDialog,
    popup,
    on,
    ready
) {
    return declare([], {

        dialog: null,
        labelNode: null,

        startup: function() {
            this.inherited(arguments);
            var text = this.helpText;
            if (text && text.length > 0) {
                this.dialog = new TooltipDialog({
                    content: text,
                    onMouseLeave: lang.hitch(this, function() {
                        popup.close(this.dialog);
                    })
                });
                var _this = this;
                ready(function() {
                    _this.attachTooltip();
                });
            }
        },

        attachTooltip: function() {
            var labelNodes = query("label[for="+this.get("id")+"]");
            if (labelNodes.length > 0) {
                this.labelNode = labelNodes[0];
                this.labelNode.innerHTML += ' <i class="fa fa-info-circle"></i>';
                this.own(
                    on(this.labelNode, 'mouseover', lang.hitch(this, function() {
                        this.showTooltip();
                    })),
                    on(this.labelNode, 'mouseleave', lang.hitch(this, function() {
                        this.hideTooltip();
                    }))
                );
            }
        },

        showTooltip: function() {
            popup.open({
                popup: this.dialog,
                orient: ["above", "above-alt", "below", "below-alt"],
                around: this.labelNode
            });
        },

        hideTooltip: function() {
            popup.close(this.dialog);
        }
    });
});