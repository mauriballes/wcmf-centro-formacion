<?php
namespace app\src\lib;

use wcmf\lib\core\EventManager;
use wcmf\lib\io\Cache;
use wcmf\lib\persistence\PersistenceEvent;
use wcmf\lib\presentation\view\View;

/**
 * EventListener
 *
 * @author ingo herwig <ingo@wemove.com>
 */
class EventListener {

  private $_eventManager = null;
  private $_view = null;
  private $_dynamicCache = null;
  private $_frontendCache = null;

  /**
   * Constructor
   * @param $eventManager
   * @param $view
   * @param $dynamicCache
   * @param $frontendCache
   */
  public function __construct(EventManager $eventManager,
          View $view, Cache $dynamicCache, Cache $frontendCache) {
    $this->_eventManager = $eventManager;
    $this->_view = $view;
    $this->_dynamicCache = $dynamicCache;
    $this->_frontendCache = $frontendCache;
    $this->_eventManager->addListener(PersistenceEvent::NAME, [$this, 'persisted']);
  }

  /**
   * Destructor
   */
  public function __destruct() {
    $this->_eventManager->removeListener(PersistenceEvent::NAME, [$this, 'persisted']);
  }

  /**
   * Listen to PersistenceEvent
   * @param $event PersistenceEvent instance
   */
  public function persisted(PersistenceEvent $event) {
    $this->invalidateCachedViews();
    $this->invalidateDynamicCache();
    $this->invalidateFrontendCache();
  }

  /**
   * Invalidate cached views on object change.
   */
  protected function invalidateCachedViews() {
    $this->_view->clearCache();
  }

  /**
   * Invalidate the dynamic cache.
   */
  protected function invalidateDynamicCache() {
    $this->_dynamicCache->clearAll();
  }

  /**
   * Invalidate the frontend cache.
   */
  protected function invalidateFrontendCache() {
    $this->_frontendCache->clearAll();
  }
}
?>
