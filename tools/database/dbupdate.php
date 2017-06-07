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
use wcmf\lib\model\mapper\RDBMapper;
use wcmf\lib\util\DBUtil;

new ClassLoader(WCMF_BASE);

$configPath = WCMF_BASE.'app/config/';

// setup logging
$logger = new MonologFileLogger('dbupdate', '../log.ini');
LogManager::configure($logger);

// setup configuration
$configuration = new InifileConfiguration($configPath);
$configuration->addConfiguration('backend.ini');
$configuration->addConfiguration('../../tools/database/config.ini');

// setup object factory
ObjectFactory::configure(new DefaultFactory($configuration));
ObjectFactory::registerInstance('configuration', $configuration);

$logger->info("updating wCMF database tables...");

if (!ensureDatabases()) {
  exit();
}

// execute custom scripts from the directory 'custom-dbupdate'
$migrationScriptsDir = $configuration->getDirectoryValue('migrationScriptsDir', 'installation');
if (is_dir($migrationScriptsDir)) {
  $sqlScripts = FileUtil::getFiles($migrationScriptsDir, '/[^_]+_.*\.sql$/', true);
  sort($sqlScripts);
  foreach ($sqlScripts as $script) {
    // extract the initSection from the filename
    $parts = preg_split('/_/', basename($script));
    $initSection = array_shift($parts);
    DBUtil::executeScript($script, $initSection);
  }
}

// parse tables definition file
$tables = array();
$readingTable = false;
$tableDef = '';
$lines = file($configuration->getFileValue('ddlFile', 'installation'));
foreach($lines as $line) {
  $line = trim($line);
  if(strlen($line) > 0) {
    // check table start
    if (preg_match('/CREATE\s+TABLE/', $line)) {
      // table definition
      $readingTable = true;
    }
    // add line to table definition
    if ($readingTable) {
      $tableDef .= $line."\n";
    }
    // check table end
    if ($readingTable && strpos($line, ';') !== false) {
      // end table definition
      $readingTable = false;
      processTableDef($tableDef, $tables);
      $tableDef = '';
    }
  }
}

// process table definitions
$persistenceFacade = ObjectFactory::getInstance('persistenceFacade');
foreach ($tables as $tableDef) {
  $logger->info(("processing table ".$tableDef['name']."..."));
  $mapper = $persistenceFacade->getMapper($tableDef['entityType']);
  $connection = $mapper->getConnection();
  $connection->beginTransaction();

  if (ensureUpdateTable($connection)) {
    $oldValue = getOldValue($connection, $tableDef['id'], null, 'table');
    $oldColumns = getMetaData($connection, $tableDef['name']);

    // check if the table already has an update entry
    if ($oldValue == null && $oldColumns === null) {
      // the table has no update entry and does not exist
      createTable($connection, $tableDef);
    }
    else {
      if ($oldValue != null && $oldColumns === null) {
        // the old table needs to be renamed
        alterTable($connection, $oldValue['table'], $tableDef['name']);
        $oldColumns = getMetaData($connection, $tableDef['name']);
      }
      // the table has an update entry and/or exists
      updateColumns($connection, $tableDef, $oldColumns);
    }
    // update table update entry
    updateEntry($connection, $tableDef);
  }
  $connection->commit();
}

$logger->info("done.");


/**
 * Ensure the existance of the databases (only mysql)
 * @param parser The inifile parser
 * @return True/False
 */
function ensureDatabases() {
  global $logger;
  $createdDatabases = array();
  // check all initparams sections for database connections
  $persistenceFacade = ObjectFactory::getInstance('persistenceFacade');
  foreach ($persistenceFacade->getKnownTypes() as $type) {
    $mapper = $persistenceFacade->getMapper($type);
    if ($mapper instanceof RDBMapper) {
      $connectionParams = $mapper->getConnectionParams();
      if (strtolower($connectionParams['dbType']) === 'mysql') {
        $dbKey = join(':', array_values($connectionParams));
        if (!in_array($dbKey, $createdDatabases)) {
          $logger->info('preparing database '.$connectionParams['dbName']);
          DBUtil::createDatabase(
                  $connectionParams['dbName'],
                  $connectionParams['dbHostName'],
                  $connectionParams['dbUserName'],
                  $connectionParams['dbPassword']
          );
          $createdDatabases[] = $dbKey;
        }
      }
    }
  }
  return true;
}

/**
 * Ensure the existence of the update table 'dbupdate'
 * @param connection The database connection
 * @return True/False
 */
function ensureUpdateTable($connection) {
  global $logger;
  try {
    $connection->query('SELECT count(*) FROM dbupdate');
  }
  catch (\Exception $e) {
    try {
      // the update table does not exist
      $connection->query('CREATE TABLE `dbupdate` (`table_id` VARCHAR(100) NOT NULL, `column_id` VARCHAR(100) NOT NULL, `type` VARCHAR(100) NOT NULL, '.
                                '`table` VARCHAR(255), `column` VARCHAR(255), `updated` DATETIME, PRIMARY KEY (`table_id`, `column_id`, `type`)) ENGINE=MyISAM');
    }
    catch (\Exception $e) {
      $logger->error('Error creating update table '.$e->getMessage());
      return false;
    }
  }
  return true;
}

/**
 * Get the existing table/column definition that is stored in the update table
 * @param connection The database connection
 * @param tableId The id of the table definition
 * @param columnId The id of the column definition (ignored for type table)
 * @param type 'table' or 'column'
 * @return An array with keys 'table' and 'column' or null if not stored
 */
function getOldValue($connection, $tableId, $columnId, $type) {
  global $logger;
  $result = null;
  if ($type == 'column') {
    // selection for columns
    $st = $connection->prepare('SELECT * FROM `dbupdate` WHERE `table_id`=? AND `column_id`=? AND `type`=\'column\'');
    $st->execute(array($tableId, $columnId));
    $result = $st->fetchAll(PDO::FETCH_ASSOC);
  }
  else {
    // selection for tables
    $st = $connection->prepare('SELECT * FROM `dbupdate` WHERE `table_id`=? AND `type`=\'table\'');
    $st->execute(array($tableId));
    $result = $st->fetchAll(PDO::FETCH_ASSOC);
  }
  if (sizeof($result) > 0) {
    $data = $result[0];
    return array('table' => $data['table'], 'column' => $data['column']);
  }
  return null;
}

/**
 * Store a table/column definition in the update table
 * @param connection The database connection
 * @param tableId The id of the table definition
 * @param columnId The id of the column definition
 * @param type 'table' or 'column'
 * @param table The table name
 * @param column The column name
 */
function updateValue($connection, $tableId, $columnId, $type, $table, $column) {
  global $logger;
  $oldValue = getOldValue($connection, $tableId, $columnId, $type);
  $result = false;
  try {
    if ($oldValue === null) {
      $st = $connection->prepare('INSERT INTO `dbupdate` (`table_id`, `column_id`, `type`, `table`, `column`, `updated`) VALUES (?, ?, ?, ?, ?, ?)');
      $result = $st->execute(array($tableId, $columnId, $type, $table, $column, date("Y-m-d H:i:s")));
    }
    else {
      $st = $connection->prepare('UPDATE `dbupdate` SET `table`=?, `column`=?, `updated`=? WHERE `table_id`=? AND `column_id`=? AND `type`=?');
      $result = $st->execute(array($table, $column, date("Y-m-d H:i:s"), $tableId, $columnId, $type));
    }
  }
  catch (\Exception $e) {
    $logger->error('Error inserting/updating entry '.$e->getMessage());
  }
}

/**
 * Store a table/column definition in the update table
 * @param connection The database connection
 * @param tableDef The table definition array as provided by processTableDef
 */
function updateEntry($connection, $tableDef) {
  global $logger;
  updateValue($connection, $tableDef['id'], '-', 'table', $tableDef['name'], '-');
  foreach ($tableDef['columns'] as $columnDef) {
    if ($columnDef['id']) {
      updateValue($connection, $tableDef['id'], $columnDef['id'], 'column', $tableDef['name'], $columnDef['name']);
    }
  }
}

/**
 * Create a table
 * @param connection The database connection
 * @param tableDef The table definition array as provided by processTableDef
 */
function createTable($connection, $tableDef) {
  global $logger;
  $logger->info("> create table '".$tableDef['name']."'");
  $sql = $tableDef['create'];
  try {
    $connection->query($sql);
  }
  catch (\Exception $e) {
    $logger->error('Error creating table '.$e->getMessage()."\n".$sql);
  }
}

/**
 * Alter a table
 * @param connection The database connection
 * @param oldName The old name
 * @param name The new name
 */
function alterTable($connection, $oldName, $name) {
  global $logger;
  $logger->info("> alter table '".$name."'");
  $sql = 'ALTER TABLE `'.$oldName.'` RENAME `'.$name.'`';
  try {
    $connection->query($sql);
  }
  catch (\Exception $e) {
    $logger->error('Error altering table '.$e->getMessage()."\n".$sql);
  }
}

/**
 * Create a column
 * @param connection The database connection
 * @param table The name of the table
 * @param columnDef An associative array with keys 'name' and 'type'
 */
function createColumn($connection, $table, $columnDef) {
  global $logger;
  $logger->info("> create column '".$table.".".$columnDef['name']);
  $sql = 'ALTER TABLE `'.$table.'` ADD `'.$columnDef['name'].'` '.$columnDef['type'];
  try {
    $connection->query($sql);
  }
  catch (\Exception $e) {
    $logger->error('Error creating column '.$e->getMessage()."\n".$sql);
  }
}

/**
 * Alter a column
 * @param connection The database connection
 * @param table The name of the table
 * @param oldColumnDef An associative array with keys 'name' and 'type'
 * @param columnDef An associative array with keys 'name' and 'type'
 */
function alterColumn(&$connection, $table, $oldColumnDef, $columnDef) {
  global $logger;
  $logger->info("> alter column '".$table.".".$columnDef['name']);
  $sql = 'ALTER TABLE `'.$table.'` CHANGE `'.$oldColumnDef['name'].'` `'.$columnDef['name'].'` '.$columnDef['type'];
  try {
    $connection->query($sql);
  }
  catch (\Exception $e) {
    $logger->error('Error altering column '.$e->getMessage()."\n".$sql);
  }
}

/**
 * Update the columns of a table
 * @param connection The database connection
 * @param tableDef The table definition array as provided by processTableDef
 * @param columnDefs The column definitions as provided by conncetion->MetaColumns
 */
function updateColumns($connection, $tableDef, $oldColumnDefs) {
  global $logger;
  foreach ($tableDef['columns'] as $columnDef) {
    $logger->debug("> process column '".$columnDef['name']);
    $oldValue = getOldValue($connection, $tableDef['id'], $columnDef['id'], 'column');
    if ($oldValue) {
      $oldColumnDef = isset($oldColumnDefs[$oldValue['column']]) ? $oldColumnDefs[$oldValue['column']] : null;
    }
    else {
      $oldColumnDef = isset($oldColumnDefs[$columnDef['name']]) ? $oldColumnDefs[$columnDef['name']] : null;
    }

    if ($oldValue === null && $oldColumnDef === null) {
      // the column has no update entry and does not exist
      createColumn($connection, $tableDef['name'], $columnDef);
    }
    else {
      // translate oldColumnDef type
      $oldColumnType = strtoupper($oldColumnDef['Type']);
      if ($oldColumnDef['Null'] == 'NO') {
        $oldColumnType .= ' NOT NULL';
      }
      $oldColumnDefTransl = array('name' => $oldColumnDef['Field'], 'type' => $oldColumnType);

      if (($oldValue != null && $oldValue['column'] != $columnDef['name']) ||
            strtolower($oldColumnDefTransl['type']) != strtolower($columnDef['type'])) {
        // ignore changes in 'not null' for primary keys ('not null' is set anyway)
        $typeDiffersInNotNull = strtolower(trim(str_replace($columnDef['type'], "", $oldColumnDefTransl['type']))) == 'not null';
        if ($typeDiffersInNotNull && in_array($columnDef['name'], $tableDef['pks'])) {
          continue;
        }
        // the column has an update entry and does exist
        alterColumn($connection, $tableDef['name'], $oldColumnDefTransl, $columnDef);
      }
    }
  }
}

/**
 * Extract table information from a sql command string
 */
function processTableDef($tableDef, &$tables) {
  global $logger;
  preg_match('/CREATE\s+TABLE\s+`(.*?)`.+entityType=(.*?)\s+tableId=(.*?)\s+\((.*)\)/s', $tableDef, $matches);
  $tableName = $matches[1];
  $entityType = $matches[2];
  $id = $matches[3];
  $tables[$tableName] = array('name' => $tableName, 'create' => $tableDef, 'entityType' => $entityType, 'id' => $id);

  // extract columns/pks
  $columns = array();
  $pks = array();
  $columnDef = preg_split('/\n/', $matches[4]);
  foreach ($columnDef as $columnDef) {
    if (strlen(trim($columnDef)) > 0) {
      preg_match_all('/`(.*?)`\s+(.*),([^`]*)/', $columnDef, $matches);
      if (isset($matches)) {
        $columnNames = $matches[1];
        $columnTypes = $matches[2];
        $comments = $matches[3];
        for($i=0; $i<sizeof($columnNames); $i++) {
          preg_match('/columnId=([^\s]+)/', $comments[$i], $matches1);
          if (isset($matches1[1])) {
            if ($matches1[1] == 'UNDEFINED') {
              $matches1[1] = '';
            }
            $columns[] = array('name' => $columnNames[$i], 'type' => $columnTypes[$i], 'id' => $matches1[1]);
          }
        }
      }
      preg_match_all('/PRIMARY KEY \(`(.*?)`\)/', $columnDef, $matches);
      if (isset($matches)) {
        if (sizeof($matches[1]) > 0) {
          $pks = preg_split('/`\s*,\s*`/', $matches[1][0]);
        }
      }
    }
  }
  $tables[$tableName]['pks'] = $pks;
  $tables[$tableName]['columns'] = $columns;
  $logger->debug("processed table: '".$tableName."'");
  $logger->debug($tables[$tableName]['columns']);
}

/**
 * Get the meta data of a table
 * @return An associative array with the column names as keys and
 * associative arrays with keys 'Field', 'Type', 'Null'[YES|NO], 'Key' [empty|PRI], 'Default', 'Extra' as values
 */
function getMetaData(&$connection, $table) {
  global $logger;
  $result = array();
  try {
    $columns = $connection->query('SHOW COLUMNS FROM `'.$table.'`', PDO::FETCH_ASSOC);
    foreach($columns as $key => $col) {
      $result[$col['Field']] = $col;
    }
  }
  catch (\Exception $e) {
    return null;
  }
  return $result;
}
?>