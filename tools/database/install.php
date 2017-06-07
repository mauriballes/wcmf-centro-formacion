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
error_reporting(E_ALL & ~E_NOTICE);
define('WCMF_BASE', realpath(dirname(__FILE__).'/../..').'/');
require_once(WCMF_BASE."/vendor/autoload.php");

use wcmf\lib\config\impl\InifileConfiguration;
use wcmf\lib\core\ClassLoader;
use wcmf\lib\core\impl\DefaultFactory;
use wcmf\lib\core\impl\MonologFileLogger;
use wcmf\lib\core\LogManager;
use wcmf\lib\core\ObjectFactory;
use wcmf\lib\io\FileUtil;
use wcmf\lib\security\principal\impl\DefaultPrincipalFactory;
use wcmf\lib\util\DBUtil;

new ClassLoader(WCMF_BASE);

$configPath = WCMF_BASE.'app/config/';

// setup logging
$logger = new MonologFileLogger('install', '../log.ini');
LogManager::configure($logger);

// setup configuration
$configuration = new InifileConfiguration($configPath);
$configuration->addConfiguration('backend.ini');
$configuration->addConfiguration('../../tools/database/config.ini');

// setup object factory
ObjectFactory::configure(new DefaultFactory($configuration));
ObjectFactory::registerInstance('configuration', $configuration);

$logger->info("initializing wCMF database tables...");

// execute custom scripts from the directory 'custom-install'
$installScriptsDir = $configuration->getDirectoryValue('installScriptsDir', 'installation');
if (is_dir($installScriptsDir)) {
  $sqlScripts = FileUtil::getFiles($installScriptsDir, '/[^_]+_.*\.sql$/', true);
  sort($sqlScripts);
  foreach ($sqlScripts as $script) {
    // extract the initSection from the filename
    $parts = preg_split('/_/', basename($script));
    $initSection = array_shift($parts);
    DBUtil::executeScript($script, $initSection);
  }
}

$persistenceFacade = ObjectFactory::getInstance('persistenceFacade');
$transaction = $persistenceFacade->getTransaction();
$transaction->begin();
try {
  // create default user/role
  $principalFactory = ObjectFactory::getInstance('principalFactory');
  if ($principalFactory instanceof DefaultPrincipalFactory) {
    $roleType = $configuration->getValue('roleType', 'principalFactory');
    $userType = $configuration->getValue('userType', 'principalFactory');

    $adminRole = $principalFactory->getRole("administrators");
    if (!$adminRole) {
      $logger->info("creating role with name 'administrators'...");
      $adminRole = $persistenceFacade->create($roleType);
      $adminRole->setName("administrators");
    }
    $adminUser = $principalFactory->getUser("admin");
    if (!$adminUser) {
      $logger->info("creating user with login 'admin' password 'admin'...");
      $adminUser = $persistenceFacade->create($userType);
      $adminUser->setLogin("admin");
      $adminUser->setPassword("admin");
      $adminUser->setIsActive(1);
      $adminUser->setIsSuperUser(1);
      if (in_array("admin.ini", $configuration->getConfigurations())) {
        $adminUser->setConfig("admin.ini");
      }
    }
    if (!$adminUser->hasRole("administrators")) {
      $logger->info("adding user 'admin' to role 'administrators'...");
      $adminUser->addNode($adminRole);
    }
  }

  $transaction->commit();
  $logger->info("done.");
}
catch (\Exception $ex) {
  $logger->error($ex);
  $transaction->rollback();
}
?>