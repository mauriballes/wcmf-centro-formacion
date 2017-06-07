define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/keys",
    "dojo/dom-construct",
    "dojo/Deferred",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "../_NotificationMixin",
    "dijit/Dialog",
    "./Button",
    "../../../locale/Dictionary",
    "dojo/text!./template/PopupDlgWidget.html"
], function (
    declare,
    lang,
    on,
    keys,
    domConstruct,
    Deferred,
    _WidgetBase,
    _TemplatedMixin,
    _Notification,
    Dialog,
    Button,
    Dict,
    template
) {
    /**
     * Modal popup dialog. Usage:
     * @code
     * new PopupDlg({
     *      title: Dict.translate("Confirm Object Deletion"),
     *      message: Dict.translate("Do you really want to delete <em>%0%</em> ?", [Model.getTypeFromOid(entity.get('oid')).getDisplayValue(entity)]),
     *      contentWidget: myTextBox, // optional, will be set below message
     *      okCallback: function() {
     *          // will be called when OK button is clicked
     *          var deferred = new Deferred();
     *          // do something
     *          return deferred;
     *      },
     *      cancelCallback: function() {
     *          // will be called when Cancel button is clicked
     *          ....
     *      }
     * }).show();
     * @endcode
     */
    var PopupDlg = declare([Dialog, _Notification], {

        // OK button (will be displayed, if callback is not null)
        okBtnText: Dict.translate('OK'),
        okCallback: null,

        // Cancel button (will be displayed, if callback is not null)
        cancelBtnText: Dict.translate('Cancel'),
        cancelCallback: function() {
            this.hide();
        },

        okBtn: null,
        cancelBtn: null,
        deferred: null,

        constructor: function(args) {
            lang.mixin(this, args);

            // create the dialog content
            // NOTE: all attach points contained in the template are accessible
            // via this.content
            var dialogWidget = new (declare([_WidgetBase, _TemplatedMixin], {
                templateString: lang.replace(template, Dict.tplTranslate)
            }));
            dialogWidget.startup();
            this.content = dialogWidget;
        },

        postCreate: function () {
            this.inherited(arguments);

            if (this.message) {
              this.content.messageNode.innerHTML = this.message;
            }

            var contentWidget = this.getContentWidget();
            if (contentWidget) {
              domConstruct.place(contentWidget.domNode, this.content.contentNode, "after");
              contentWidget.startup();
            }

            // create buttons
            if (this.okCallback !== null) {
                this.okBtn = new Button({
                    label: this.okBtnText,
                    'class': "primary",
                    onClick: lang.hitch(this, function(e) {
                        this.okBtn.setProcessing();
                        this.doCallback(e, this.okCallback);
                    })
                });
                domConstruct.place(this.okBtn.domNode, this.content.buttonsNode);
                this.okBtn.startup();
            }
            if (this.cancelCallback !== null) {
                this.cancelBtn = new Button({
                    label: this.cancelBtnText,
                    onClick: lang.hitch(this, function(e) {
                        this.doCallback(e, this.cancelCallback);
                    })
                });
                domConstruct.place(this.cancelBtn.domNode, this.content.buttonsNode);
                this.cancelBtn.startup();
            }

            this.own(
                on(this, "hide", lang.hitch(this, function(e) {
                    this.deferred.resolve();
                })),
                on(dojo.body(), "keyup", lang.hitch(this, function (e) {
                    switch(e.keyCode) {
                        case keys.ENTER:
                            this.okBtn.setProcessing();
                            this.doCallback(e, this.okCallback);
                            break;
                        case keys.ESCAPE:
                            this.doCallback(e, this.cancelCallback);
                            break;
                    }
                }))
            );
        },

        /**
         * Override this method in subclasses to provide a custom content
         * widget. The default implentation returns the contentWidget property.
         * @returns Widget
         */
        getContentWidget: function() {
            return this.contentWidget;
        },

        doCallback: function(e, callback) {
            this.hideNotification();
            if (typeof callback === 'function') {
                e.preventDefault();
                var result = lang.hitch(this, callback)(this);
                if (result && typeof result.then === 'function') {
                    result.then(lang.hitch(this, function() {
                        // success
                        this.hide();
                    }), lang.hitch(this, function(error) {
                        // error
                        this.okBtn.reset();
                        this.showBackendError(error);
                    }))
                }
                else {
                    this.hide();
                }
            }
            else {
                this.hide();
            }
        },

        /**
         * Show the dialog
         * @return Deferred instance that will resolve, when the dialog is
         * closed.
         */
        show: function() {
            this.inherited(arguments);
            this.deferred = new Deferred();
            return this.deferred;
        }
    });

    return PopupDlg;
});