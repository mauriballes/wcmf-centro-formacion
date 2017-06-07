<?php
/**
 * Router script for test server
 */
error_reporting(E_ALL | E_PARSE);
require_once('config.php');

use wcmf\lib\core\ClassLoader;
use wcmf\lib\presentation\Application;
use wcmf\lib\util\TestUtil;

// remove everything after ? from url
$requestedFile = preg_replace('/\?.*$/', '', $_SERVER["REQUEST_URI"]);
if (is_file(WCMF_BASE.'app/public'.$requestedFile)) {
  // serve the requested resource as-is.
  return false;
}
else {
  require_once(WCMF_BASE.'/vendor/autoload.php');
  new ClassLoader(WCMF_BASE);

  TestUtil::initFramework(WCMF_BASE.'app/config/');

  // create the application
  $application = new Application();
  try {
    // initialize the application
    $request = $application->initialize('', '', 'cms');

    // run the application
    $application->run($request);
  }
  catch (Exception $ex) {
    try {
      $application->handleException($ex);
    }
    catch (Exception $unhandledEx) {
      echo "Exception in request to ".$_SERVER["REQUEST_URI"]."\n".
      $unhandledEx->getMessage()."\n".$unhandledEx->getTraceAsString()."\n".
      file_get_contents(WCMF_BASE."app/log/".(new \DateTime())->format('Y-m-d').".log");
    }
  }
}
?>