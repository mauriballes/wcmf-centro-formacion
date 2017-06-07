<?php
require_once('config.php');
require_once(WCMF_BASE.'/vendor/autoload.php');

use wcmf\lib\core\ClassLoader;
use wcmf\lib\io\FileUtil;
use wcmf\lib\util\TestUtil;
new ClassLoader(WCMF_BASE);

setup();
TestUtil::startServer(WCMF_BASE.'app/public', 'router.php');
register_shutdown_function("cleanup");

/**
 * Set up test resources
 */
function setup() {
  @unlink(WCMF_BASE.'app/test-db.sq3');
  $fileUtil = new FileUtil();
  $fileUtil->mkdirRec(WCMF_BASE.'app/public');
  $fileUtil->emptyDir(WCMF_BASE.'app/cache');
  $fileUtil->emptyDir(WCMF_BASE.'app/log');
  $fileUtil->emptyDir(WCMF_BASE.'app/searchIndex');
  $fileUtil->mkdirRec(WCMF_BASE.'install');
  copy('../install/tables_sqlite.sql', WCMF_BASE.'install/tables_sqlite.sql');
  copy('../install/tables_mysql.sql', WCMF_BASE.'install/tables_mysql.sql');
}

/**
 * Clean up test resources
 */
function cleanup() {
  @rmdir(WCMF_BASE.'install');
}
?>
