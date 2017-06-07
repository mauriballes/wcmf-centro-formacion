define([
    "require",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/dom-form",
    "dijit/form/TextBox",
    "../_include/_PageMixin",
    "../_include/_NotificationMixin",
    "../_include/widget/NavigationWidget",
    "../_include/widget/Button",
    "../../User",
    "../../Startup",
    "../../locale/Dictionary",
    "../../action/Login",
    "dojo/text!./template/LoginPage.html"
], function (
    require,
    declare,
    lang,
    config,
    domForm,
    TextBox,
    _Page,
    _Notification,
    NavigationWidget,
    Button,
    User,
    Startup,
    Dict,
    Login,
    template
) {
    return declare([_Page, _Notification], {

        templateString: lang.replace(template, Dict.tplTranslate),
        contextRequire: require,
        title: Dict.translate('Login'),

        constructor: function (params) {
            // template variables
            this.title = config.app.title;
        },

        postCreate: function() {
            this.setHeaderBackground();
        },

        setHeaderBackground: function() {
            this.header.setAttribute('style', 'background-image: '+config.app.background);
        },

        /**
         * http://www.sitepoint.com/javascript-generate-lighter-darker-color/
         */
        colorLuminance: function(hex, lum) {
            // validate hex string
            hex = String(hex).replace(/[^0-9a-f]/gi, '');
            if (hex.length < 6) {
                hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
            }
            lum = lum || 0;

            // convert to decimal and change luminosity
            var rgb = "#", c, i;
            for (i = 0; i < 3; i++) {
                c = parseInt(hex.substr(i*2,2), 16);
                c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
                rgb += ("00"+c).substr(c.length);
            }

            return rgb;
        },

        createNotificationNode: function() {
            // do nothing, it's defined in the template already
        },

        _login: function(e) {
            // prevent the page from navigating after submit
            e.preventDefault();

            var data = domForm.toObject("loginForm");

            this.loginBtn.setProcessing();

            this.hideNotification();
            new Login({
                user: data.user,
                password: data.password
            }).execute().then(lang.hitch(this, function(response) {
                // success
                this.loginBtn.reset();
                User.create(data.user, response.roles);

                // run startup code
                Startup.run().then(lang.hitch(this, function(result) {
                      var redirectRoute = this.request.getQueryParam("route");
                      if (redirectRoute) {
                          // redirect to initially requested route if given
                          this.pushState(this.request.getPathname()+redirectRoute);
                      }
                      else {
                          // redirect to default route
                          var route = this.router.getRoute("home");
                          var url = route.assemble();
                          this.pushState(url);
                      }
                }), lang.hitch(this, function(error) {
                      // error
                      this.showBackendError(error);
                }));
            }), lang.hitch(this, function(error) {
                // error
                this.loginBtn.reset();
                this.showBackendError(error);
            }));
        }
    });
});