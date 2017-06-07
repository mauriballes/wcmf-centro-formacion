<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>wCMF - graph</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link href="../../app/public/vendor/twitter-bootstrap/css/bootstrap.css" rel="stylesheet">
  <link href="../../app/public/css/app.css" rel="stylesheet">
</head>
<body>
  <div class="container">
    <div class="row">
      <div class="span12">
        <section id="what-next">
          <div class="page-header">
            <h1>wCMF graph</h1>
          </div>
        </section>
        <section id="result">
          <pre>
<?php
/**
 * This script demonstrates how to output an object tree to a dot file
 */
error_reporting(E_ALL & ~E_NOTICE);
define('WCMF_BASE', realpath(dirname(__FILE__).'/../..').'/');
require_once(WCMF_BASE."/vendor/autoload.php");

use wcmf\lib\config\impl\InifileConfiguration;
use wcmf\lib\core\ClassLoader;
use wcmf\lib\core\impl\DefaultFactory;
use wcmf\lib\core\impl\MonologFileLogger;
use wcmf\lib\core\LogManager;
use wcmf\lib\core\ObjectFactory;
use wcmf\lib\model\output\DotOutputStrategy;
use wcmf\lib\model\visitor\OutputVisitor;

new ClassLoader(WCMF_BASE);

$configPath = WCMF_BASE.'app/config/';

// setup logging
$logger = new MonologFileLogger('graph', '../log.ini');
LogManager::configure($logger);

// setup configuration
$configuration = new InifileConfiguration($configPath);
$configuration->addConfiguration('backend.ini');
$configuration->addConfiguration('../../tools/graph/config.ini');

// setup object factory
ObjectFactory::configure(new DefaultFactory($configuration));
ObjectFactory::registerInstance('configuration', $configuration);

$persistenceFacade = ObjectFactory::getInstance('persistenceFacade');

// get root oids
$oids = array();
$rootTypes = $configuration->getValue('rootTypes', 'application');
if (is_array($rootTypes)) {
  foreach($rootTypes as $rootType) {
    $logger->info("Getting oids for: ".$rootType);
    $oidsTmp = $persistenceFacade->getOIDs($rootType);
    $logger->info("Found: ".sizeof($oidsTmp));
    $oids = array_merge($oids, $oidsTmp);
  }
}

// construct tree from root oids
$nodes = array();
foreach($oids as $oid) {
  $nodes[] = $persistenceFacade->load($oid);
}

// output tree to dot
$filename = "graph.dot";
$os = new DotOutputStrategy($filename);
$ov = new OutputVisitor($os);
$ov->startArray($nodes);
$logger->info("Created file: <a href='".$filename."'>".$filename."</a>");
$logger->info("Use dot to create image: dot -Tpng ".$filename." > graph.png");
?>
          </pre>
        </section>
      </div>
    </div>
  </div>
</body>
</html>