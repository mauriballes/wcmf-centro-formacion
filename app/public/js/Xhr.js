define([
    "dojo/request/xhr",
    "dojo/request/util",
    "./AuthToken"
], function (
    xhr,
    util,
    AuthToken
) {
    function requestWithAuthToken(url, options) {
        // add auth token header if available
        var authTokenValue = AuthToken.get();
        if (authTokenValue !== undefined) {
            options.headers = options.headers || {};
            options.headers[AuthToken.name] = authTokenValue;
        }
        return xhr(url, options);
    };
    util.addCommonMethods(requestWithAuthToken);

    return requestWithAuthToken;
});