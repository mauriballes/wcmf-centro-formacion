define([
    "dojo/_base/declare",
    "./Process",
    "./ActionBase"
], function (
    declare,
    Process,
    ActionBase
) {
    return declare([ActionBase], {

        name: 'importCSV',
        iconClass: 'fa fa-file-excel-o',

        // action parameters
        type: null,
        file: null,

        execute: function() {
            var params = new FormData();
            params.set('className', this.type);
            params.append('docFile', this.file);
            return new Process('importCSV').run(params);
        }
    });
});
