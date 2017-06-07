define( [
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/dom-style",
    "./TextBox"
],
function(
    declare,
    lang,
    on,
    domStyle,
    TextBox
) {
    return declare([TextBox], {

        placeHolder: '#FFFFFF',

        postCreate: function() {
            this.inherited(arguments);

            this.own(
                  on(this, "change", lang.hitch(this, function() {
                      this.setColors();
                  }))
            );
            this.setColors();
        },

        setColors: function() {
            // get background color
            var bgColor = this.get('value');
            if (!bgColor || !bgColor.match(/^#[0-9a-f]{3,}$/i)) {
                bgColor = '#FFFFFF';
            }

            // calculate luminance
            var colorValue = bgColor.substring(1);
            var rgb = parseInt(colorValue, 16);
            var r = (rgb >> 16) & 0xff;
            var g = (rgb >>  8) & 0xff;
            var b = (rgb >>  0) & 0xff;
            var luminance = (r + g + b)/3;

            // get font color
            var fontColor = luminance < 128 ? '#FFFFFF' : '#000000';

            // set colors
            domStyle.set(this.domNode, "background-color", bgColor);
            domStyle.set(this.domNode, "color", fontColor);
        }
    });
});