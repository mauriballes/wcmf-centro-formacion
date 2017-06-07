<?php
/**
 * wCMF - wemove Content Management Framework
 * Copyright (C) 2005-2016 wemove digital solutions GmbH
 *
 * Licensed under the terms of the MIT License.
 *
 * See the LICENSE file distributed with this work for
 * additional information.
 */

/**
 * This script is used to run a request from the command line.
 * E.g. RPCClient instances of other wCMF instances use this script
 * to connect to this wCMF instance.
 *
 * Usage:
 * /path/to/php rpc_call.php request sid
 *
 * Parameters:
 * - request A serialized and base64 encoded Request instance
 * - sid A session id [optional]
 */
error_reporting(E_ERROR);

if (!defined('WCMF_BASE')) {
  define('WCMF_BASE', realpath(dirname(__FILE__).'/../..').'/');
}
require_once(WCMF_BASE."/vendor/autoload.php");

use wcmf\lib\config\impl\InifileConfiguration;
use wcmf\lib\core\ClassLoader;
use wcmf\lib\core\impl\DefaultFactory;
use wcmf\lib\core\impl\MonologFileLogger;
use wcmf\lib\core\LogManager;
use wcmf\lib\core\ObjectFactory;
use wcmf\lib\presentation\Application;

$arguments = $_SERVER['argv'];
array_shift($arguments);
$numArguments = sizeof($arguments);

if ($numArguments < 1) {
  echo <<<END
Usage:
/path/to/php cli.php request sid

Parameters:
- request request A serialized and base64 encoded Request instance
- sid A session id [optional]


END;
}

// if the call has two parameters, the second one is supposed to be
// the session id
if ($numArguments == 2) {
  $_POST['sid'] = $arguments[1];
}

new ClassLoader(WCMF_BASE);

$configPath = WCMF_BASE.'app/config/';

// setup logging
$logger = new MonologFileLogger('main', $configPath.'log.ini');
LogManager::configure($logger);

// setup configuration
$configuration = new InifileConfiguration($configPath);
$configuration->addConfiguration('config.ini');

// setup object factory
ObjectFactory::configure(new DefaultFactory($configuration));
ObjectFactory::registerInstance('configuration', $configuration);

// initialize the remote application
$application = new Application();
$application->initialize('wcmf\application\controller\LoginController', '', 'login');

// process the requested action
$serializedRequest = base64_decode($arguments[0]);
$request = unserialize($serializedRequest);
if ($request) {
  $formats = ObjectFactory::getInstance('formats');
  $request->setFormat($formats['null']);
  $request->setResponseFormat($formats['null']);
  $logger->debug("Process remote request:\n".$request->toString());

  $response = $application->run();
  $logger->debug("Response:\n".$response->toString());
}
else {
  echo "Error: Invalid request.";
}
?>
