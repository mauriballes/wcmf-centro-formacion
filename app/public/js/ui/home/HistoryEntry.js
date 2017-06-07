define([
    "dojo/_base/declare",
    "../../model/meta/Model",
    "../../model/meta/Node"
], function(
    declare,
    Model,
    Node
) {
// Names to be included by l10n tools
// Dict.translate('_displayValue')
// Dict.translate('_summary')
// Dict.translate('_type')
    var HistoryEntry = declare([Node
    ], {
        typeName: "HistoryEntry",
        description: "",
        isSortable: false,
        displayValues: [
            "_displayValue", "_summary", "_type", "created", "creator", "modified", "last_editor"
        ],
        pkNames: [
            "id"
        ],

        attributes: [{
            name: "id",
            type: "",
            description: "",
            isEditable: false,
            inputType: 'text',
            displayType: 'text',
            regexp: '',
            regexpDesc: '',
            tags: ['DATATYPE_IGNORE'],
            isReference: false
        }, {
            name: "_displayValue",
            type: "String",
            description: "",
            isEditable: false,
            inputType: 'text',
            displayType: 'text',
            regexp: '',
            regexpDesc: '',
            tags: ['DATATYPE_ATTRIBUTE'],
            isReference: false
        }, {
            name: "_summary",
            type: "String",
            description: "",
            isEditable: false,
            inputType: 'text',
            displayType: 'text',
            regexp: '',
            regexpDesc: '',
            tags: ['DATATYPE_ATTRIBUTE'],
            isReference: false
        }, {
            name: "_type",
            type: "String",
            description: "",
            isEditable: false,
            inputType: 'text',
            displayType: 'text',
            regexp: '',
            regexpDesc: '',
            tags: ['DATATYPE_ATTRIBUTE'],
            isReference: false
        }, {
            name: "created",
            type: "Date",
            description: "",
            isEditable: false,
            inputType: "text",
            displayType: "text",
            validateType: "",
            validateDesc: "",
            tags: ["DATATYPE_ATTRIBUTE", "GROUP_INTERNAL"],
            defaultValue: null,
            isReference: false
        }, {
            name: "creator",
            type: "String",
            description: "",
            isEditable: false,
            inputType: "text",
            displayType: "text",
            validateType: "",
            validateDesc: "",
            tags: ["DATATYPE_ATTRIBUTE", "GROUP_INTERNAL"],
            defaultValue: null,
            isReference: false
        }, {
            name: "modified",
            type: "Date",
            description: "",
            isEditable: false,
            inputType: "text",
            displayType: "text",
            validateType: "",
            validateDesc: "",
            tags: ["DATATYPE_ATTRIBUTE", "GROUP_INTERNAL"],
            defaultValue: null,
            isReference: false
        }, {
            name: "last_editor",
            type: "String",
            description: "",
            isEditable: false,
            inputType: "text",
            displayType: "text",
            validateType: "",
            validateDesc: "",
            tags: ["DATATYPE_ATTRIBUTE", "GROUP_INTERNAL"],
            defaultValue: null,
            isReference: false
        }],

        relations: []

        , listView: '../data/widget/EntityListWidget'
        , detailView: '../data/widget/EntityFormWidget'
        , getSummary: function(data) {
            var typeClass = Model.getType(data['_type']);
            if (typeof typeClass.getSummary === 'function') {
                return typeClass.getSummary(data);
            }
            return '';
        }
    });
    return HistoryEntry;
});
