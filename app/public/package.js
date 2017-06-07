var profile = (function (){

    var miniExcludes = {
            "app/package": 1,
            "app/package.json": 1
        }
    ;

    return {
        resourceTags: {
            miniExclude: function (filename, moduleId) {
                return moduleId in miniExcludes;
            },

            amd: function (filename, moduleId) {
                return /\.js$/.test(filename) && /^app\/js\//.test(moduleId) && !/^app\/js\/config\//.test(moduleId);
            }
        }
    };
})();