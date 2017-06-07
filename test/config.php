<?php
  /**
  /* Define WCMF_BASE based on the dist version in order to test it
   * NOTE: if dist.dir is relative, it's the same from here or from the build directory
   */
  $buildConfig = parse_ini_file('../build/build.properties');
  $distDir = $buildConfig['dist.dir'];

  define('WCMF_BASE', realpath($distDir).'/');
?>
