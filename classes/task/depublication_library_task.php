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
 * Ad hoc task for unpublished of training to the library
 *
 * @package    local_mentor_core
 * @copyright  2022 Edunao SAS (contact@edunao.com)
 * @author     adrien <adrien@edunao.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_library\task;

class depublication_library_task extends \core\task\adhoc_task {

    /**
     * Execute the task
     *
     * @return \local_mentor_core\training
     * @throws \dml_exception
     * @throws \moodle_exception
     * @throws \restore_controller_exception
     */
    public function execute() {
        global $CFG, $USER;

        require_once($CFG->dirroot . '/local/mentor_core/api/training.php');
        require_once($CFG->dirroot . '/local/mentor_core/api/library.php');

        $USER = get_admin();

        // Get data.
        $data = $this->get_custom_data();

        // Define all required custom data fields.
        $requiredfields = ['trainingid', 'userid'];

        // Check all required fields.
        foreach ($requiredfields as $requiredfield) {
            if (!isset($data->{$requiredfield})) {
                throw new \coding_exception('Field ' . $requiredfield . ' is missing in custom data');
            }
        }

        // Get the training.
        $training = \local_mentor_core\training_api::get_training($data->trainingid);

        $dbi = \local_mentor_core\database_interface::get_instance();

        // Check if training has published to library.
        if (!$existingtraininglibrary = \local_mentor_core\library_api::get_library_publication($data->trainingid)) {
            throw new \moodle_exception('unpublishnoexist', 'local_library');
        }

        // Remove old training publish to replace it if exists.
        if ($traininglibrary = \local_mentor_core\training_api::get_training($existingtraininglibrary->trainingid)) {
            $traininglibrary->delete();
        }

        // Delete recyclebin category item if exists.
        if ($item = $dbi->get_recyclebin_category_item(get_string('nametrainingpublish', 'local_library',
            $training->shortname))) {
            \local_mentor_core\training_api::remove_training_item(\local_mentor_core\library_api::get_library_id(), $item->id);
        }

        // Delete data to database.
        $dbi->unpublish_to_library($data->trainingid);

        // Get recipient and sender.
        $creator = \core_user::get_user($data->userid);
        $supportuser = \core_user::get_support_user();

        // Get the content of the email.
        $content = get_string('depublication_library_email', 'local_library', [
            'trainingfullname' => $training->name,
            'trainingshortname' => $training->shortname,
            'traininglibraryurlsheet' => $training->get_url()->out(false),
        ]);
        $contenthtml = text_to_html($content, false, false, true);

        // Send the email.
        email_to_user($creator, $supportuser,
            get_string('depublication_library_object_email', 'local_library'), $content,
            $contenthtml);

        return $training;
    }
}

