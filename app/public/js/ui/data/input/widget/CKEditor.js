if (typeof window !== "undefined") {
    // window is undefined in non-browser context
    window.CKEDITOR_BASEPATH = dojoConfig.app.pathPrefix+'vendor/ckeditor/ckeditor/';
}

define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/_base/window",
    "dojo/topic",
    "dojo/query",
    "dijit/form/TextBox",
    "ckeditor/ckeditor",
    "../Factory",
    "../../../../locale/Dictionary",
    "../../../_include/_HelpMixin",
    "../../../_include/widget/MediaBrowserDlgWidget",
    "./_AttributeWidgetMixin",
    "dojo/text!./template/CKEditor.html"
],
function(
    declare,
    lang,
    config,
    win,
    topic,
    query,
    TextBox,
    CKEditor,
    ControlFactory,
    Dict,
    _HelpMixin,
    MediaBrowserDlg,
    _AttributeWidgetMixin,
    template
) {
    return declare([TextBox, _HelpMixin, _AttributeWidgetMixin], {

        templateString: template,
        intermediateChanges: true,
        inputType: null, // control description as string as used in Factory.getControlClass()
        entity: null,
        editorInstance: null,
        mediaBrowser: null,

        constructor: function(args) {
            declare.safeMixin(this, args);

            this.label = Dict.translate(this.name);
        },

        create: function(){
          this.inherited(arguments);
          // only send change events, when content changes
          this._onChangeActive = false;
        },

        postCreate: function() {
            this.inherited(arguments);

            var pathPrefix = config.app.pathPrefix;
            var mediaBrowserRoute = pathPrefix+'media';
            var linkBrowserRoute = pathPrefix+'link';
            var mediaBaseHref = config.app.wcmfBaseHref;

            this.editorInstance = CKEDITOR.replace(this.textbox, {
                customConfig: pathPrefix+'js/config/ckeditor_config.js',
                filebrowserBrowseUrl: mediaBrowserRoute,
                filebrowserLinkBrowseUrl: linkBrowserRoute,
                baseHref: mediaBaseHref,
                toolbar: this.getToolbarName(),
                filebrowserWindowWidth: '800',
                filebrowserWindowHeight: '700',
                readOnly: this.disabled
            });

            // custom filebrowser dialog instantiation
            // @see https://github.com/simogeo/Filemanager/wiki/How-to-open-the-Filemanager-from-CKEditor-in-a-modal-window
            var browseDlg = null;
            CKEDITOR.on('dialogDefinition', function(event) {
                var editor = event.editor;
                var dialogDefinition = event.data.definition;
                var tabCount = dialogDefinition.contents.length;
                var cleanUpFunc = CKEDITOR.tools.addFunction(function () {
                    browseDlg.hide();
                });

                for (var i=0; i<tabCount; i++) {
                    var browseButton = dialogDefinition.contents[i].get('browse');
                    if (browseButton !== null) {
                        browseButton.hidden = false;
                        browseButton.onClick = function(dialog, i) {
                            editor._.filebrowserSe = this;
                            browseDlg = new MediaBrowserDlg({
                                url: this.filebrowser.url+'?CKEditorFuncNum='+
                                        CKEDITOR.instances[event.editor.name]._.filebrowserFn+
                                        '&CKEditorCleanUpFuncNum='+cleanUpFunc
                            });
                            browseDlg.show();
                        };
                    }
                }
            });

            this.own(
                topic.subscribe("entity-datachange", lang.hitch(this, function(data) {
                    if ((this.entity && this.entity.get('oid') === data.entity.get('oid')) &&
                            data.name === this.name) {
                        var newValue = this.sanitiseValue(data.newValue);
                        this.set("value", newValue);
                        this.editorInstance.setData(newValue);
                    }
                }))
            );
            this.editorInstance.on("instanceReady", lang.hitch(this, function() {
                this.editorInstance.on("change", lang.hitch(this, this.editorValueChanged));
                // set padding on editor content
                var content = query("iframe", this.domNode)[0].contentWindow.document;
                win.withDoc(content, function() {
                  query(".cke_editable").style("padding", "5px");
                }, this);
                // fix edit state (editor instance is initially read only)
                this.set("disabled", this.disabled);
            }));
        },

        _setDisabledAttr: function(value) {
            if (this.editorInstance) {
                this.editorInstance.setReadOnly(value);
            }
        },

        editorValueChanged: function() {
            setTimeout(lang.hitch(this, function() {
                this._onChangeActive = true;
                this.set("value", this.sanitiseValue(this.editorInstance.getData()));
                // send change event
                this.emit("change", this);
                this._onChangeActive = false;
            }, 0));
        },

        getToolbarName: function() {
            var options = ControlFactory.getOptions(this.inputType);
            return (options.toolbarSet) ? options.toolbarSet : "wcmf";
        },

        destroy: function() {
            this.editorInstance.removeAllListeners();
            this.inherited(arguments);
        },

        sanitiseValue: function(value) {
            return (typeof value === "string" || value instanceof String) ?
                value.trim() : value;
        }
    });
});