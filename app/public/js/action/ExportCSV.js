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

        name: 'exportCSV',
        iconClass: 'fa fa-file-excel-o',

        // action parameters
        type: null,
        query: null,

        execute: function() {
            var params = {
                className: this.type,
                query: this.query
            };
            return new Process('exportCSV').run(params);
        }
    });
});
