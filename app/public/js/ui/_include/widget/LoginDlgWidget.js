define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/request",
    "dojo/dom-form",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dijit/form/TextBox",
    "../../../User",
    "../../../locale/Dictionary",
    "../../../action/Login",
    "./PopupDlgWidget",
    "dojo/text!./template/LoginDlgWidget.html"
], function (
    declare,
    lang,
    request,
    domForm,
    _WidgetBase,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    TextBox,
    User,
    Dict,
    Login,
    PopupDlg,
    template
) {
    /**
     * Modal login dialog. Usage:
     * @code
     * new LoginDlg({
     *      success: function() {
     *          // will be called, when the user is logged in
     *      }
     * }).show();
     * @endcode
     */
    var LoginDlg = declare([PopupDlg], {

        success: null,

        style: "width: 400px",
        title: '<i class="fa fa-sign-in"></i> '+Dict.translate("Sign in"),

        okCallback: function(dlg) {
            var data = domForm.toObject("loginForm");
            new Login({
                user: data.user,
                password: data.password
            }).execute().then(lang.hitch(this, function(response) {
                // success
                User.create(data.user, response.roles);
                if (typeof dlg.success === 'function') {
                    dlg.success(this);
                }
            }));
        },

        /**
         * @Override
         */
        getContentWidget: function() {
            this.formWidget = new (declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
                templateString: lang.replace(template, Dict.tplTranslate)
            }));
            return this.formWidget;
        },

        /**
         * Make sure there is only one instance
         */
        show: function() {
            if (!LoginDlg.isShowing) {
                LoginDlg.isShowing = true;
                this.inherited(arguments);
            }
        },

        /**
         * Reset showing flag
         */
        hide: function() {
            LoginDlg.isShowing = false;
            this.inherited(arguments);
        }
    });

    LoginDlg.isShowing = false;

    return LoginDlg;
});