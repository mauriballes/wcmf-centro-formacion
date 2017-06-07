// get path of directory ckeditor
var basePath = CKEDITOR.basePath;
basePath = basePath.substr(0, basePath.indexOf("ckeditor/"));

// load external plugins
(function() {
   CKEDITOR.plugins.addExternal('find', basePath+'ckeditor-plugins/find/', 'plugin.js');
   CKEDITOR.plugins.addExternal('mediaembed', basePath+'ckeditor-plugins/mediaembed/', 'plugin.js');
})();

// fix inserting spans in chrome
// @see http://ckeditor.com/forums/CKEditor/ckeditor-4.01-inserting-span-elements-everywhere-with-a-line-height-of-1.6em
(function() {
    var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (isChrome) {
        CKEDITOR.on( 'instanceLoaded', function( e ){
            this.addCss('.cke_editable { line-height: normal; }');
        });
    }
})();

CKEDITOR.editorConfig = function( config ) {
    config.language = dojoConfig.app.uiLanguage;
    config.stylesSet = 'default:'+dojoConfig.app.pathPrefix+'js/config/ckeditor_styles.js';
    config.baseFloatZIndex = 900;
    config.forcePasteAsPlainText = true;
    config.resize_dir = 'vertical';
    config.stylesSet = [
        { name: 'Strong Emphasis', element: 'strong' },
        { name: 'Emphasis', element: 'em' }
    ];
    config.theme = 'default';
    config.extraPlugins = 'find,mediaembed';
    config.toolbarStartupExpanded = false;
    config.toolbarCanCollapse = true;
    config.uiColor = "#E0E0D6";
    config.toolbar_wcmf = [
        ['Maximize'],['Source'],['Cut','Copy','Paste'],['Undo','Redo','Find'],
        ['Image','MediaEmbed','Link','Unlink','Anchor'],
        ['Bold','Italic','RemoveFormat'],['Table','BulletedList','HorizontalRule','SpecialChar'],['Format','Styles'],['About']
    ];
    config.toolbar = 'wcmf';
    config.contentsCss = dojoConfig.app.pathPrefix+'css/app.css';
};
