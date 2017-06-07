define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/dom-construct",
    "dijit/layout/ContentPane",
    "./PopupDlgWidget"
], function (
    declare,
    lang,
    config,
    domConstruct,
    ContentPane,
    PopupDlg
) {
    /**
     * Modal media browser dialog. Usage:
     * @code
     * new MediaBrowserDlg({
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
    return declare([PopupDlg], {

        url: config.app.pathPrefix+'media',

        /**
         * @Override
         */
        getContentWidget: function() {
            var url = this.url+(this.url.includes("?") ? "&" : "?")+"contentOnly=1";
            return new ContentPane({
                content: domConstruct.create("iframe", {
                    src: url,
                    style: "border: 0; width: 800px; height: 500px",
                    scrolling: "no"
                })
            });
        }
    });
});