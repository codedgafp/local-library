<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Notification library tests
 *
 * @package    local_library
 */
use PHPUnit\Framework\TestCase;
use \local_mentor_specialization\custom_notifications_service;
 defined('MOODLE_INTERNAL') || die();

 //global $CFG;
 
 //require_once($CFG->dirroot . '/local/library/lib.php');
 //require_once($CFG->libdir . '/navigationlib.php');
 

class library_notifications_test extends advanced_testcase {

     /**
     * Test get_mentor_collections
     *
     * @covers    \local_mentor_core\library_api::get_mentor_collections
     */
    /*public function test_publication_library_task() {
        $this->resetAfterTest(true);
        self::setAdminUser();
        $collections = \local_mentor_core\library_api::get_mentor_collections();
        self::assertNotEmpty($collections);
    }*/

      /**
     * Test get_user_collection_notifications
     *
     * @covers    \local_mentor_core\library_api::get_user_collection_notifications
     */
    /*public function test_get_user_collection_notifications() {
        $this->resetAfterTest(true);
        self::setAdminUser();
        global $USER;
        $type = custom_notifications_service::$LIBRARY_PAGE_TYPE;
        $notificationRecords = \local_mentor_core\library_api::get_user_collection_notifications($type);
        self::assertEmpty($notificationRecords);


        //Get collections available
        $collections = \local_mentor_core\library_api::get_mentor_collections();
        var_dump($collections);

        //Notify user with collection id=1
        $notitifations = array(0 => array("id" => (int)$collections[1]->id,"notify" => true));
        $saveNotifications =\local_mentor_core\library_api::set_user_notifications($notitifations,$type);

        $userNotifications = \local_mentor_core\library_api::get_user_collection_notifications($type);

        self::assertCount(1,array_values($userNotifications));        
        self::assertEquals($collections[1]->id,array_values($userNotifications)[0]->collection_id);
        self::assertEquals($type,array_values($userNotifications)[0]->type);
        self::assertEquals($USER->id,array_values($userNotifications)[0]->user_id);
            
    }*/

    /**
     * Test set_user_notifications
     *
     * @covers    \local_mentor_core\library_api::set_user_notifications
     */
    /*public function test_set_user_notifications() {

        $this->resetAfterTest(true);
        self::setAdminUser();

        $type = custom_notifications_service::$LIBRARY_PAGE_TYPE;
        //Get user collections to notify
        $userNotifications = \local_mentor_core\library_api::get_user_collection_notifications($type);
        self::assertEmpty($userNotifications);

        //Get available collections 
        $collections = \local_mentor_core\library_api::get_mentor_collections();

        //Notify user with collection id=1
        $notitifations = array(0 => array("id" => (int)$collections[1]->id,"notify" => true));
        $saveNotifications =\local_mentor_core\library_api::set_user_notifications($notitifations,$type);
        self::assertEquals(get_string('usercollectionnotif:sucess', 'local_catalog'),$saveNotifications);

        //Unotify user with collection id=1
        $notitifations = array(0 => array("id" => (int)$collections[1]->id,"notify" => false));
        $saveNotifications =\local_mentor_core\library_api::set_user_notifications($notitifations,$type);

        $userNotifications = \local_mentor_core\library_api::get_user_collection_notifications($type);

        self::assertEmpty($userNotifications);    

        
    }*/

}
