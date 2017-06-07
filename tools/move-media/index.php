<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>wCMF - move media</title>
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
            <h1>wCMF move media</h1>
          </div>
        </section>
        <section id="result">
          <pre>
<?php
/**
 * This script moves a given file to another location and updates all references
 * in the database
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

new ClassLoader(WCMF_BASE);

$configPath = WCMF_BASE.'app/config/';

// setup logging
$logger = new MonologFileLogger('move', '../log.ini');
LogManager::configure($logger);

// setup configuration
$configuration = new InifileConfiguration($configPath);
$configuration->addConfiguration('backend.ini');
$configuration->addConfiguration('../../tools/move-media/config.ini');

// setup object factory
ObjectFactory::configure(new DefaultFactory($configuration));
ObjectFactory::registerInstance('configuration', $configuration);

// get config values
$dbParams = $configuration->getSection("database", true);
$toolConfig = $configuration->getSection("move", true);
$locations = $configuration->getSection("locations", true);

$deleteEmptyFolders = ($toolConfig['deleteEmptyFolders'] == 1);
$logger->info($deleteEmptyFolders);

// process locations
foreach ($locations as $source => $target) {
  relocate($source, $target,
          $toolConfig['fileBasePath'],
          $toolConfig['dbBasePath'],
          $dbParams,
          $deleteEmptyFolders
  );
}
?>
          </pre>
        </section>
      </div>
    </div>
  </div>
</body>
</html>
<?php
/**
 * Functions
 */

/**
 * Check if the given string denotes a directory (trailing /)
 * @param path String
 * @return Boolean
 */
function isDirName($path) {
  return preg_match('/\/$/', $path);
}

/**
 * Relocate the given source directory/file to the given target
 * directory/file in filesystem and database
 * @param source Path to the source directory/file relative to bsaePath
 * @param target Path to the target directory/file relative to bsaePath
 * @param fileBasePath Base path in filesystem
 * @param dbBasePath Base path in database
 * @param deleteEmptyFolders Boolean defining if empty source folders should be
 * deleted or not (default: false)
 */
function relocate($source, $target, $fileBasePath, $dbBasePath, $dbParams, $deleteEmptyFolders=false) {
  global $logger;
  $fileUtil = new FileUtil();

  // collect files first
  $filesToMove = array();
  $sourcePath = $fileBasePath.$source;
  if (file_exists($sourcePath)) {
    if (is_dir($sourcePath)) {
      $files = $fileUtil->getFiles($sourcePath, '/./', true, true);
      foreach ($files as $file) {
        $fileWithoutBase = str_replace($fileBasePath, '', $file);
        $filesToMove[$fileWithoutBase] = $target;
      }
    }
    else if (is_file($sourcePath)) {
      $filesToMove[$source] = $target;
    }
  }
  else {
    $logger->error($source." does not exist");
  }

  // actually move
  foreach ($filesToMove as $source => $target) {
    // move file
    $newFile = moveFile($source, $target, $fileBasePath, $deleteEmptyFolders);
    if ($newFile !== null) {
      // replace database references
      replaceInDatabase($dbBasePath.urldecode($source), $dbBasePath.$newFile, $dbParams);
    }
    else {
      $logger->error("Failed to move ".$source);
    }
  }
}

/**
 * Move the given source file to the given target directory/file
 * @param source Path to the source file relative to basePath
 * @param target Path to the target directory/file relative to basePath
 * @param basePath Base path
 * @param dbParams Array with database connection parameters
 * @param deleteEmptyFolders Boolean defining if empty source folders should be
 * deleted or not (default: false)
 * @return The new location of the file or null, on failure
 */
function moveFile($source, $target, $basePath, $deleteEmptyFolders=false) {
  global $logger;
  $result = null;
  $fileUtil = new FileUtil();

  if (isDirName($target)) {
    // target is a directory, so we have to add the source filename
    $target .= basename($source);
  }

  $sourceFile = $basePath.$source;
  $targetFile = $basePath.$target;
  $logger->info("move file: ".$sourceFile." -> ".$targetFile);

  // create the target directory if not existing
  $targetDir = dirname($targetFile);
  if (!is_dir($targetDir)) {
    $fileUtil->mkdirRec($targetDir);
  }

  // move the file
  if (copy($sourceFile, $targetFile)) {
    unlink($sourceFile);
    $result = $target;
  }

  // delete empty folder, if requested
  if ($deleteEmptyFolders) {
    $sourceDir = dirname($sourceFile);
    if (sizeof($fileUtil->getFiles($sourceDir, '/./', true, true)) == 0) {
      $logger->info("delete directory: ".$sourceDir);
      rmdir($sourceDir);
    }
  }
  return $result;
}

/**
 * Replace the given string in the datebase
 * @param dbParams Array with connection parameters
 * @param oldStr String to be replaced
 * @param newStr String to replace with
 */
function replaceInDatabase($oldStr, $newStr, $dbParams) {
  global $logger;
  $logger->info("replace in database: ".$oldStr." -> ".$newStr);

  // Connect to database server
  mysql_connect(
          $dbParams['dbHostName'],
          $dbParams['dbUserName'],
          $dbParams['dbPassword']
  );

  // Select database
  mysql_select_db($dbParams['dbName']);

  // List all tables in database
  $sql = "SHOW TABLES FROM ".$dbParams['dbName'];
  $tables_result = mysql_query($sql);

  if (!$tables_result) {
    $logger->error("Database error, could not list tables\nMySQL error: ".mysql_error());
    exit;
  }

  $logger->debug("In these fields '$oldStr' have been replaced with '$newStr'");
  while ($table = mysql_fetch_row($tables_result)) {
    $logger->debug("Table: ".$table[0]);
    $fields_result = mysql_query("SHOW COLUMNS FROM ".$table[0]);
    if (!$fields_result) {
      $logger->error("Could not run query: ".mysql_error());
      exit;
    }
    if (mysql_num_rows($fields_result) > 0) {
      while ($field = mysql_fetch_assoc($fields_result)) {
        if (stripos($field['Type'], "VARCHAR") !== false || stripos($field['Type'], "TEXT") !== false) {
          $logger->debug("  ".$field['Field']);
          $sql = "UPDATE ".$table[0]." SET ".$field['Field']." = replace(".$field['Field'].", '$oldStr', '$newStr')";
          mysql_query($sql);
        }
      }
    }
  }
  mysql_free_result($tables_result);
}
?>