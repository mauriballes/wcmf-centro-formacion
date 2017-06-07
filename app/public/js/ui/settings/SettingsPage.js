define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-form",
    "dijit/form/TextBox",
    "../_include/_PageMixin",
    "../_include/_NotificationMixin",
    "../_include/widget/NavigationWidget",
    "../_include/FormLayout",
    "../_include/widget/Button",
    "../../locale/Dictionary",
    "../../action/ChangePassword",
    "dojo/text!./template/SettingsPage.html"
], function (
    require,
    declare,
    lang,
    domForm,
    TextBox,
    _Page,
    _Notification,
    NavigationWidget,
    FormLayout,
    Button,
    Dict,
    ChangePassword,
    template
) {
    return declare([_Page, _Notification], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Settings'),

        postCreate: function() {
            this.inherited(arguments);
        },

        _save: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            var data = domForm.toObject("settingsForm");

            this.saveBtn.setProcessing();

            this.hideNotification();
            new ChangePassword({
                oldpassword: data.oldpassword,
                newpassword1: data.newpassword1,
                newpassword2: data.newpassword2
            }).execute().then(lang.hitch(this, function(response) {
                // success
                this.saveBtn.reset();
                this.showNotification({
                    type: "ok",
                    message: Dict.translate("The password was successfully changed"),
                    fadeOut: true
                });
            }), lang.hitch(this, function(error) {
                // error
                this.saveBtn.reset();
                this.showBackendError(error);
            }));
        }
    });
});