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
 * Library lib tests
 *
 * @package    local_library
 * @copyright  2022 Edunao SAS (contact@edunao.com)
 * @author     rcolet <remi.colet@edunao.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

global $CFG;

require_once($CFG->dirroot . '/local/library/lib.php');
require_once($CFG->libdir . '/navigationlib.php');

class local_library_lib_testcase extends advanced_testcase {

    /**
     * Reset the singletons
     *
     * @throws ReflectionException
     */
    public function reset_singletons() {
        // Reset the mentor core db interface singleton.
        $dbinterface = \local_mentor_core\database_interface::get_instance();
        $reflection = new ReflectionClass($dbinterface);
        $instance = $reflection->getProperty('instance');
        $instance->setAccessible(true); // Now we can modify that :).
        $instance->setValue(null, null); // Instance is gone.
        $instance->setAccessible(false); // Clean up.

        \local_mentor_core\training_api::clear_cache();
    }

    /**
     * Test local_library_init_config
     *
     * @covers  ::local_library_init_config
     * @covers  ::local_library_set_library
     */
    public function test_local_library_init_config() {
        global $DB;

        $this->resetAfterTest(true);
        $this->reset_singletons();
        $this->setOutputCallback(function() {
        });

        self::setAdminUser();

        // Remove library entity and config.
        $dbi = \local_mentor_core\database_interface::get_instance();
        $category = core_course_category::get($dbi->get_library_object()->id);
        unset_config(\local_mentor_core\library::CONFIG_VALUE_ID);

        $library = \local_mentor_core\library::get_instance();
        
        $reflection = new ReflectionClass($library);
        $instance = $reflection->getProperty('instance');
        $instance->setAccessible(true); // Now we can modify that :).
        $instance->setValue(null, null); // Instance is gone.
        $instance->setAccessible(false); // Clean up.

        $visiteurbibliorole = $DB->get_record('role', ['shortname' => get_string('viewroleshortname', 'local_library')]);

        // Remove visiteurbiblio role.
        self::assertTrue(delete_role($visiteurbibliorole->id));

        self::assertFalse($DB->record_exists('role', ['id' => $visiteurbibliorole->id]));
        self::assertFalse(
            $DB->record_exists('role', ['shortname' => get_string('viewroleshortname', 'local_library')])
        );
        self::assertFalse($DB->record_exists('role_context_levels', ['roleid' => $visiteurbibliorole->id]));
        self::assertFalse($DB->record_exists('role_capabilities', ['roleid' => $visiteurbibliorole->id]));

        local_library_init_config();

        // Check if library has created.
        self::assertTrue($DB->record_exists('course_categories',
            ['name' => \local_mentor_core\library::NAME, 'idnumber' => \local_mentor_core\library::SHORTNAME]
        ));

        $libraryobject = $DB->get_record('course_categories',
            ['name' => \local_mentor_core\library::NAME, 'idnumber' => \local_mentor_core\library::SHORTNAME]
        );
        $librarysingleton = \local_mentor_core\library_api::get_library();
        self::assertEquals($libraryobject->id, $librarysingleton->id);
        self::assertEquals(\local_mentor_core\library::NAME, $librarysingleton->name);
        self::assertEquals(local_mentor_core\library::SHORTNAME, $librarysingleton->shortname);

        $libraryconfigid = \local_mentor_core\library_api::get_library_id();
        self::assertEquals($libraryobject->id, $libraryconfigid);

        // Check if role has created.
        self::assertTrue(
            $DB->record_exists('role', ['shortname' => get_string('viewroleshortname', 'local_library')])
        );
        $newvisiteurbibliorole = $DB->get_record('role', ['shortname' => get_string('viewroleshortname', 'local_library')]);

        // Check new role context level.
        self::assertTrue($DB->record_exists('role_context_levels', ['roleid' => $newvisiteurbibliorole->id]));
        $newcontextlevel = $DB->get_records('role_context_levels', ['roleid' => $newvisiteurbibliorole->id]);
        self::assertCount(1, $newcontextlevel);
        self::assertEquals(current($newcontextlevel)->contextlevel, CONTEXT_COURSECAT);

        // Check new role capability.
        self::assertTrue($DB->record_exists('role_capabilities', ['roleid' => $newvisiteurbibliorole->id]));
        $newcapabilty = $DB->get_records('role_capabilities', ['roleid' => $newvisiteurbibliorole->id]);
        self::assertCount(1, $newcapabilty);
        self::assertEquals(current($newcapabilty)->capability, 'local/library:view');

        self::resetAllData();
    }
}
