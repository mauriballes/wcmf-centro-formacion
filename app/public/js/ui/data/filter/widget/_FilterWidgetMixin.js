define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dijit/layout/ContentPane",
    "dojo/dom-construct"
], function (
    declare,
    lang,
    on,
    topic,
    ContentPane,
    domConstruct
) {
    /**
     * Filter widget mixin. Manages filter change propagation and reset.
     */
    return declare([ContentPane], {

        postCreate: function() {
            this.inherited(arguments);

            var control = this.getControl();
            control.startup();
            this.addChild(control);

            var btn = '<a class="btn-mini"><i class="fa fa-ban"></i></a>';
            var resetBtn = domConstruct.place(btn, this.domNode, 'last');
            this.own(
                on(resetBtn, "click", lang.hitch(this, function(e) {
                    this.reset();
                    topic.publish('entity-filterchange');
                    e.stopPropagation();
                })),
                on(control, "change", lang.hitch(this, function (e) {
                    topic.publish('entity-filterchange');
                }))
            );
        },

        reset: function() {
            this.getControl().reset();
        },

        /**
         * Get the control to be watched for filter changes
         * @returns Widget
         */
        getControl: function() {
            throw new Error('Method getControl not implemented');
        },

        /**
         * Get the current filter
         * @returns dstore/Filter
         */
        getFilter: function() {
            throw new Error('Method getFilter not implemented');
        }
    });
});