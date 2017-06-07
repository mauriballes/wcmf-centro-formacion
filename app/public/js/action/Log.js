define([
    "dojo/_base/declare",
    "dojo/_base/config",
    "dojo/request"
], function (
    declare,
    config,
    request
) {
    var Log = declare(null, {
    });

    Log.trace = function(message) {
        Log.log(message, 'TRACE');
    };

    Log.debug = function(message) {
        Log.log(message, 'DEBUG');
    };

    Log.info = function(message) {
        Log.log(message, 'INFO');
    };

    Log.warning = function(message) {
        Log.log(message, 'WARNING');
    };

    Log.error = function(message) {
        Log.log(message, 'ERROR');
    };

    Log.fatal = function(message) {
        Log.log(message, 'FATAL');
    };

    /**
     * Write to the backend log
     * @param message The log message
     * @param level Log level (TRACE|DEBUG|INFO|WARNING|ERROR|FATAL)
     * @return Deferred instance
     */
    Log.log = function(message, level) {
      return request.post(config.app.backendUrl+'log', {
          data: {
              message: message,
              type: level
          },
          headers: {
              Accept: "application/json"
          },
          handleAs: 'json'
      });
    };

    return Log;
});
