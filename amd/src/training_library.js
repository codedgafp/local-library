/**
 * Javascript containing function of the training library
 */

define([
    'jquery',
    'local_mentor_core/mentor',
    'format_edadmin/format_edadmin',
    'core/str',
    'local_mentor_core/select2'
], function ($, mentor, format_edadmin, str, select2) {

    var trainingLibrary = {
        /**
         * Init JS
         */
        init: function (trainingId) {
            this.trainingId = trainingId;

            this.initTrainingObjective();

            this.enrolTrainingLibrary();

            this.importToEntityDialog();
        },
        /**
         * Init training catalog objective event show/hide text.
         */
        initTrainingObjective: function () {
            var initialHeight = $('.training-goal').height();
            var isTruncated = false;

            // Truncate logic based on height
            function applyInitialTruncation() {
                if (initialHeight > 130) {
                    $('.training-goal').addClass('truncate');
                    $('#gradientmask').removeClass('hidden');
                    isTruncated = true;
                } else {
                    $('#gradientmask').addClass('hidden');
                    $('.toggle-content').addClass('hide');
                }
            }

            // Fonction pour basculer l'affichage et mettre à jour le texte du bouton
            function toggleContentVisibility() {
                let $toggleButton = $('.toggle-content');
                if (isTruncated) {
                    $('.training-goal').removeClass('truncate');
                    $('#gradientmask').addClass('hidden');
                    $toggleButton.attr('aria-expanded', 'true');
                    // get i18n string relative to "viewless" and then replace the button text by the string content
                    str.get_string('viewless', 'local_catalog').then(function (str) {
                        $('.toggle-content').text(str);
                    });
                } else {
                    $('.training-goal').addClass('truncate');
                    $('#gradientmask').removeClass('hidden');
                    $toggleButton.attr('aria-expanded', 'false');
                    str.get_string('readmore', 'local_catalog').then(function (str) {
                        $('.toggle-content').text(str);
                    });
                }
                isTruncated = !isTruncated;
            }

            applyInitialTruncation();

            // Attacher l'événement click au bouton et au masque pour basculer l'affichage
            $('.toggle-content, #gradientmask').click(function (e) {
                e.preventDefault();
                toggleContentVisibility();
            });

            $(window).on('resize', function () {
                $('.show-more:before').width($('#training-objective').width());
            });
        },
        /**
         * Enrol current user to training library.
         */
        enrolTrainingLibrary: function () {
            $('#demonstration-action').on('click', function () {
                format_edadmin.ajax_call({
                    url: M.cfg.wwwroot + '/local/library/ajax/ajax.php',
                    controller: 'library',
                    action: 'enrol_current_user',
                    format: 'json',
                    trainingid: trainingLibrary.trainingId,
                    callback: function (response) {
                        response = JSON.parse(response);

                        if (response.success) {
                            window.open(response.message, '_blank').focus();
                        } else {
                            format_edadmin.error_modal(response.message)
                        }
                    }
                });
            });
        },
        /**
         * Show import training library to entity modal
         * when user click to #import-action button
         */
        importToEntityDialog: function () {
            $('#import-action').on('click', function (e) {
                // If user click to info.
                if ($(e.target).hasClass('text-info')) {
                    return null;
                }

                $('#form-import-entity').select2()
                    .data('select2').$container.addClass("custom-select");

                format_edadmin.ajax_call({
                    url: M.cfg.wwwroot + '/local/library/ajax/ajax.php',
                    controller: 'training',
                    action: 'get_next_available_training_name',
                    format: 'json',
                    trainingid: trainingLibrary.trainingId,
                    callback: function (response) {
                        response = JSON.parse(response);

                        var trainingname = response.message;

                        trainingLibrary.showModalImportToEntity(trainingname);
                    }
                });
            });
        },
        /**
         * Show modal import to entity.
         *
         * @param {string} nextTrainingShortname
         */
        showModalImportToEntity: function (nextTrainingShortname) {
            // Set shortname training to form.
            $('#form-import-shortname').val(nextTrainingShortname);

            mentor.dialog('#import-to-entity', {
                width: 700,
                title: M.util.get_string('importoentity', 'local_library'),
                close: function () {
                    // Reset all form.
                    $('#popup-waring-message').html('');
                    $('#form-import-shortname').val(nextTrainingShortname);
                    $('#form-import-entity').val($('#form-import-entity option')[0].value).trigger('change');

                    // Close dialog.
                    $(this).dialog("destroy");
                },
                buttons: [
                    {
                        text: M.util.get_string('confirm', 'moodle'),
                        class: "btn btn-primary",
                        click: function () {
                            var wariningElement = $('#popup-waring-message');

                            wariningElement.html('');

                            // Get form data.
                            var formData = $('form#import-to-entity-form').serializeArray();
                            var warning = false;

                            // Check if training shortname data is not empty.
                            var trainingShortname = formData[0].value;
                            if (!trainingShortname.length) {
                                wariningElement.append(
                                    '<p>' + M.util.get_string('trainingshortnamenotempty', 'local_library') + '</p>'
                                );
                                warning = true;
                            }

                            // Check if entity is select.
                            var entityId = formData[1].value;
                            if (entityId === '0') {
                                wariningElement.append(
                                    '<p>' + M.util.get_string('entitymustbeselected', 'local_library') + '</p>'
                                );
                                warning = true;
                            }

                            // Check if warning message exist.
                            if (warning) {
                                return null;
                            }

                            // Call import request.
                            trainingLibrary.importToEntity(trainingShortname, entityId);
                        }
                    },
                    {
                        // Cancel button
                        text: M.util.get_string('cancel', 'moodle'),
                        class: "btn btn-secondary",
                        click: function () {//Just close the modal
                            $(this).dialog('close');
                        }
                    }
                ]
            });
        },
        /**
         * Call import training library to entity request.
         *
         * @param trainingShortname
         * @param entityId
         */
        importToEntity: function (trainingShortname, entityId) {
            format_edadmin.ajax_call({
                url: M.cfg.wwwroot + '/local/library/ajax/ajax.php',
                controller: 'library',
                action: 'import_to_entity',
                format: 'json',
                trainingid: trainingLibrary.trainingId,
                trainingshortname: trainingShortname,
                entityid: entityId,
                callback: function (response) {
                    response = JSON.parse(response);

                    if (!response.success) {
                        // Import fail.
                        format_edadmin.error_modal(response.message);
                    } else {
                        // Check if training shortname is used.
                        if (response.message === -1) {
                            $('#popup-waring-message').append(
                                '<p>' + M.util.get_string('trainingnameused', 'local_library') + '</p>'
                            )
                            return null;
                        }

                        // Import is OK.
                        $('#import-to-entity').dialog('destroy');

                        // Open confirm dialog.
                        trainingLibrary.confirmImport();
                    }
                }
            });
        },
        /**
         * Open import confirm dialog.
         */
        confirmImport: function () {
            mentor.dialog('<div class="text-center">' + M.util.get_string('confirmimport', 'local_library') + '</div>', {
                width: 500,
                title: M.util.get_string('confirmation', 'local_library'),
                buttons: [
                    {
                        // Cancel button
                        text: M.util.get_string('closebuttontitle', 'core'),
                        class: "btn btn-primary",
                        click: function () {//Just close the modal
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        }
    };

    // Add object to window to be called outside require.
    window.trainingLibrary = trainingLibrary;
    return trainingLibrary;
});
