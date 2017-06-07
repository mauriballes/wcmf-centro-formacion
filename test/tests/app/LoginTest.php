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
namespace test\tests\app;

use wcmf\test\lib\ArrayDataSet;
use wcmf\test\lib\SeleniumTestCase;

class LoginTest extends SeleniumTestCase {

  protected function getDataSet() {
    return new ArrayDataSet(array(
      'DBSequence' => array(
        array('id' => 1),
      ),
      'User' => array(
        array('id' => 0, 'login' => 'admin', 'name' => 'Administrator', 'password' => '$2y$10$WG2E.dji.UcGzNZF2AlkvOb7158PwZpM2KxwkC6FJdKr4TQC9JXYm', 'active' => 1, 'super_user' => 1, 'config' => ''),
      ),
      'NMUserRole' => array(
        array('fk_user_id' => 0, 'fk_role_id' => 0),
      ),
      'Role' => array(
        array('id' => 0, 'name' => 'administrators'),
      ),
    ));
  }

  public function testTitle() {
    $this->setDisplay('large');

    $this->url(self::getAppUrl());
    $this->assertEquals('WCMF TEST MODEL', $this->title());
  }

  public function testLoginOk() {
    $this->setDisplay('large');

    $this->login('admin', 'admin');
    $this->assertEquals(self::getAppUrl().'/home', $this->url());
    $this->assertNotNull($this->byXPath("//*[@class='home-page']"));
    $this->assertEquals('WCMF TEST MODEL - Home', $this->title());
  }

  public function testLoginFailed() {
    $this->setDisplay('large');

    $this->login('admin', '');
    $this->assertEquals(self::getAppUrl().'/', $this->url());
    $this->assertEquals('WCMF TEST MODEL', $this->title());
    $this->assertRegExp('/Authentication failed/i', $this->source());
  }

  public function testLogout() {
    $this->setDisplay('large');

    $this->login('admin', 'admin');
    $this->assertEquals(self::getAppUrl().'/home', $this->url());
    $this->assertNotNull($this->byXPath("//*[@class='home-page']"));
    $this->assertEquals('WCMF TEST MODEL - Home', $this->title());
    // open navigation
    $this->byXPath("//*[@id='navSettings']/a")->click();
    // click logout
    $btn = $this->byXPath("//*[@data-wcmf-route='logout']");
    $btn->click();
    $this->timeouts()->implicitWait(5000);
    $this->assertEquals(self::getAppUrl().'/', $this->url());
    $this->assertEquals('WCMF TEST MODEL', $this->title());
  }

  public function testLogoutSmall() {
    $this->setDisplay('small');

    $this->login('admin', 'admin');
    $this->assertEquals(self::getAppUrl().'/home', $this->url());
    $this->assertNotNull($this->byXPath("//*[@class='home-page']"));
    $this->assertEquals('WCMF TEST MODEL - Home', $this->title());
    // open navigation
    $this->byXPath("//nav/div/div[1]/button")->click();
    $this->byXPath("//*[@id='navSettings']/a")->click();
    // click logout
    $btn = $this->byXPath("//*[@data-wcmf-route='logout']");
    $btn->click();
    $this->timeouts()->implicitWait(5000);
    $this->assertEquals(self::getAppUrl().'/', $this->url());
    $this->assertEquals('WCMF TEST MODEL', $this->title());
  }
}
?>