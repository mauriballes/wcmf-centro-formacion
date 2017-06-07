<?php
/**
 * This script converts a word into a wCMF password
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
use wcmf\lib\security\principal\PasswordService;

new ClassLoader(WCMF_BASE);

$configPath = WCMF_BASE.'app/config/';

// setup logging
$logger = new MonologFileLogger('password', '../log.ini');
LogManager::configure($logger);

// setup configuration
$configuration = new InifileConfiguration($configPath);
$configuration->addConfiguration('backend.ini');

// setup object factory
ObjectFactory::configure(new DefaultFactory($configuration));
ObjectFactory::registerInstance('configuration', $configuration);

$requestPassword = filter_input(INPUT_GET, 'password');
$hashedPassword = $requestPassword ? PasswordService::hash($requestPassword) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>wCMF - Password</title>
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
            <h1>wCMF Password</h1>
          </div>
        </section>
        <form action="<?php echo $_SERVER['SCRIPT_NAME'] ?>" method="get">
          <fieldset>
            <input type="text" name="password" placeholder="Password">
            <button type="submit" class="btn">Hash</button>
          </fieldset>
        </form>
        <section>
          <?php if (strlen($requestPassword) > 0) : ?>
          <pre>Password hash for <em><?php echo $requestPassword; ?></em>: <strong><?php echo $hashedPassword; ?></strong></pre>
          <?php endif; ?>
        </section>
      </div>
    </div>
  </div>
</body>
</html>
