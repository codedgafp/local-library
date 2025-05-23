/**
 * Javascript containing function of the library publication
 */

define([
    'jquery',
    'jqueryui',
    'format_edadmin/format_edadmin',
    'local_mentor_core/mentor',
    'local_mentor_core/cookie',
    'core/str'
], function ($, ui, format_edadmin, mentor, cookie, str) {
    var local_library = {
        /**
         * Init JS
         * @param {array} collections
         */
        init: function (collections) {

            // Set to true if a the scroll can load more results.
            $(window).data('ajaxready', true);

            // Get list available trainings.
            this.listLibraryTrainings = JSON.parse($('#library-trainings').html());

            // Store the page title by default.
            this.basePageTitle = document.title;

            // Init filters.
            this.selectedFilters = {
                entities: [],
                collections: []
            };

            // List of all the collections.
            this.collections = collections;

            // Nb trainings shown on screen.
            this.trainingsCount = 0;

            // Set nb results per scroll depending on the screen size.
            this.nbResultsPerScroll = this.initOffset = (window.innerWidth >= 1920) ? 20 : 10;

            var that = this;
            this.trainingsDictionnary = JSON.parse(mentor.sanitizeText($('#library-dictionnary').html()));

            this.initFromCookies();

            // Search with preset search input and filter with preset filters.
            this.searchWithFilters();

            // Search and filter on click.
            $('#search-button').on('click', function () {
                that.searchByText();
            });

            // Search and filter on enter keypress.
            $('#search').on('keypress', function () {
                var keycode = (event.keyCode ? event.keyCode : event.which);
                if (keycode === 13) {
                    that.searchByText();
                }
            });

            this.initInfiniteScroll();

            // Set the scroll at the top of the page to manage the previous button.
            window.addEventListener('unload', function (e) {
                //set scroll position to the top of the page.
                window.scrollTo(0, 0);
            });
        },
        /**
         * Start a new search by text
         */
        searchByText: function () {
            this.initOffset = this.nbResultsPerScroll;
            this.searchWithFilters();
            this.setFirstTileFocus();

            // Refresh the search cookie.
            cookie.create('librarySearch', JSON.stringify($('#search').val()));
        },
        /**
         * Initialise filters from cookies
         */
        initFromCookies: function () {
            var search = JSON.parse(cookie.read('librarySearch'));
            if (typeof search != 'undefined') {
                $('#search').val(search);
            }

            var filters = JSON.parse(cookie.read('libraryFilters'));
            if (typeof filters != 'undefined' && filters != null) {
                this.selectedFilters = filters;
            }
        },
        /**
         * Initialise infinite scroll
         */
        initInfiniteScroll: function () {

            var that = this;

            // Add loading image.
            $('#library-tile').append('<div id="loader"><img src="' + M.cfg.wwwroot + '/local/library/pix/loading.svg" alt="loader ajax"></div>');

            this.updateLoader();

            var deviceAgent = navigator.userAgent.toLowerCase();
            var agentID = deviceAgent.match(/(iphone|ipod|ipad)/);

            // Load more results on scroll.
            $(window).scroll(function () {

                that.updateLoader();

                if ($(window).data('ajaxready') == false) return;

                if (($(window).scrollTop() + $(window).height() + 400) > $(document).height()
                    || agentID && ($(window).scrollTop() + $(window).height()) + 150 > $(document).height()) {

                    $(window).data('ajaxready', false);

                    that.initOffset += that.nbResultsPerScroll;

                    // Load more results.
                    that.searchWithFilters();

                    $(window).data('ajaxready', true);
                }
            });
        },
        /**
         * Update the loader visibility
         * @return boolean true if all results have been loaded
         */
        updateLoader: function () {
            // Get all shown results before a new load.
            var nbResultsShown = $('.training-tile:not(.hidden)').length;

            // All results have been shown.
            if (nbResultsShown == this.trainingsCount) {
                $('#library-tile #loader').fadeOut(400);
                return true;
            }

            $('#library-tile #loader').fadeIn(400);
            return false;
        },
        /**
         * Add images into trainings tiles
         */
        addImages: function () {
            $('.training-tile:visible').each(function () {
                // Adding image.
                var thumbnailDiv = $(this).find('div.training-tile-thumbnail-resize');
                var thumbnailUrl = thumbnailDiv.attr('data-thumbnail-url');
                thumbnailDiv.css('background-image', 'url(' + thumbnailUrl + ')');
            });
        },
        /**
         * Search and filter in trainings list
         */
        searchWithFilters: function () {
            var search = $('#search').val();

            if (search.length === 0) {
                this.filter();
                return;
            }

            search = this.cleanupString(search);

            var words = this.splitString(search);
            var trainingsFound = this.searchTrainings(words, this.trainingsDictionnary);

            this.filter(trainingsFound);
        },
        /**
         * Update page title with filters and search text
         */
        updatePageTitle: function () {
            var search = $('#search').val();

            // Add the base page title.
            var pageTitle = this.basePageTitle;

            // Add search text to page title.
            if (search.length !== 0) {
                pageTitle += ' - ' + search;
            }

            // Add collections to page title.
            for (var i in this.selectedFilters.collections) {
                pageTitle += ' - ' + this.selectedFilters.collections[i];
            }

            // Add entities to page title.
            for (var j in this.selectedFilters.entities) {
                pageTitle += ' - ' + this.selectedFilters.entities[j];
            }

            document.title = pageTitle;
        },
        /**
         * Search words in dictionnary and returns a list of trainings ids
         * @param {array} words
         * @param {array} dictionnary
         * @return {array}
         */
        searchTrainings: function (words, dictionnary) {
            var trainingsFound = [];

            $.each(dictionnary, function (key, value) {
                trainingsFound[key] = key;
            });

            for (var index in dictionnary) {
                words.forEach(function (element) {
                    if (dictionnary[index].indexOf(element) === -1) {
                        delete trainingsFound[index];
                    }
                });
            }

            return trainingsFound;
        },
        /**
         * Filter trainings
         * @param {array} trainings
         */
        filter: function (trainings) {
            if (typeof trainings === 'undefined') {
                trainings = [];
            }

            var filters = this.getFiltersData();

            this.filterTrainings(
                filters.collections,
                filters.entities,
                trainings
            );
        },
        /**
         * Returns filters data (collections, entities)
         * @returns {array}
         */
        getFiltersData: function () {
            return this.selectedFilters;
        },
        /**
         * Filter available trainings by collection and entity
         * @param {array} collections
         * @param {array} entities
         * @param {array} selectedTrainings
         */
        filterTrainings: function (
            collections,
            entities,
            selectedTrainings
        ) {

            var that = this;

            if (typeof collections === 'undefined') {
                collections = [];
            }
            if (typeof entities === 'undefined') {
                entities = [];
            }
            if (typeof selectedTrainings === 'undefined') {
                selectedTrainings = [];
            }

            var trainings = local_library.listLibraryTrainings;
            var libraryTileChildrens = $('#library-tile').children('.training-tile');
            that.trainingsCount = libraryTileChildrens.length;

            var filteredTrainings = [];

            var countTrainingShown = 0;

            libraryTileChildrens.each(function () {

                var currentTile = this;
                var currentTrainingId = $(this).attr('data-training-id');

                // Exclude non selected trainings, if given.
                if (selectedTrainings.length !== 0 && $.inArray(currentTrainingId, selectedTrainings) === -1) {
                    $(this).addClass('hidden').removeClass('odd').removeClass('even');
                    that.trainingsCount--;
                    return;
                }

                var currentTraining = trainings[currentTrainingId];
                var currentTrainingCollections = currentTraining.collectionstr.split(';');
                var currentTrainingEntity = currentTraining.entityid;

                // Filter from collections.
                var collectionsok = true;
                if (collections.length !== 0) {
                    $(collections).each(function (i, elem) {
                        if ($.inArray(elem, currentTrainingCollections) === -1) {
                            collectionsok = false;
                        }
                    });

                    if (!collectionsok) {
                        $(this).addClass('hidden').removeClass('odd').removeClass('even');
                        that.trainingsCount--;
                        return;
                    }
                }

                // Filter from entities.
                if (entities.length !== 0 && entities.find(element => element != currentTrainingEntity)) {
                    $(this).addClass('hidden').removeClass('odd').removeClass('even');
                    that.trainingsCount--;
                    return;
                }

                if (countTrainingShown >= that.initOffset) {
                    $(this).addClass('hidden').removeClass('odd').removeClass('even');
                } else {

                    // Add training image.
                    var thumbnailDiv = $(this).find('div.training-tile-thumbnail-resize');
                    var thumbnailUrl = thumbnailDiv.attr('data-thumbnail-url');

                    countTrainingShown++;
                    var classToAdd = countTrainingShown % 2 ? 'odd' : 'even';
                    var classToRemove = countTrainingShown % 2 ? 'even' : 'odd';
                    $(currentTile).removeClass(classToRemove).addClass(classToAdd).removeClass('hidden');

                    $('<img/>').attr('src', thumbnailUrl).on('load', function () {
                        $(this).remove();
                        thumbnailDiv.css('background-image', 'url(' + thumbnailUrl + ')');
                        $(currentTile).removeClass('hidden');
                    });

                }

                filteredTrainings.push(currentTraining);

            });

            // Update filters list.
            this.updateFilters(filteredTrainings);

            // Trainings count display.
            var trainingsCountText = '<span class="countnumber">' + that.trainingsCount + "</span> " + M.util.get_string('trainings_found', 'local_library');

            if (0 === that.trainingsCount) {
                trainingsCountText = M.util.get_string('no_training_found', 'local_library');
            } else if (1 === that.trainingsCount) {
                trainingsCountText = '<span class="countnumber">' + that.trainingsCount + "</span> " + M.util.get_string('training_found', 'local_library');
            }

            $('#library-count').html(trainingsCountText);

            // Update loader.
            that.updateLoader();
        },
        /**
         * Set the focus on the first visible tile.
         */
        setFirstTileFocus: function () {
            if ($('.training-tile:not(.hidden)').length > 0) {
                $('.training-tile:not(.hidden)')[0].focus();
            }
        },
        /**
         * Update collection and entity filters with trainings results
         *
         * @param {array} trainings
         */
        updateFilters: function (trainings) {
            var that = this;

            var collections = [];
            var entities = [];

            var currentFilters = this.getFiltersData();

            $(trainings).each(function () {

                // Set collections
                var trainingCollections = this.collection.split(',');

                $(trainingCollections).each(function () {

                    var col = collections.find(x => x.name === that.collections[this]);

                    if (typeof col != 'undefined') {
                        col.nbresults++;
                    } else {
                        collections.push({
                            'name': that.collections[this],
                            'identifier': this,
                            'nbresults': 1
                        });
                    }
                });

                // Set entities.
                var ent = entities.find(x => x.id === this.entityid);

                if (typeof ent != 'undefined') {
                    ent.nbresults++;
                } else {
                    entities.push({
                        'id': this.entityid,
                        'name': this.entityname,
                        'fullname': this.entityfullname,
                        'nbresults': 1
                    });
                }
            });

            collections.sort(
                (a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                }
            );

            entities.sort(
                (a, b) => {
                    if (a.name < b.name) {
                        return -1;
                    }
                    if (a.name > b.name) {
                        return 1;
                    }
                    return 0;
                }
            );

            // Set buttons.
            $('#collections').html('');

            var cross = '<div class="cross" title="Supprimer le filtre">x</div>';

            // Update collections buttons.
            $(collections).each(function () {
                var selected = currentFilters.collections.find(element => element == this.name) ? 'class="selected"' : '';
                $('#collections').append('<li><button data-type="collections" data-identifier="' + this.name + '" ' + selected + '>' + this.name + '<span' +
                    ' class="nbresults">(' + this.nbresults + ')</span>' + cross + '</button></li>');
            });

            $('#entities').html('');

            // Update entities buttons.
            $(entities).each(function () {
                var selected = currentFilters.entities.find(element => element == this.id) ? 'class="selected"' : '';
                $('#entities').append('<li><button title="' + this.fullname + '" data-type="entities" data-identifier="' + this.id + '" ' + selected + '>' + this.name + '<span' +
                    ' class="nbresults">(' + this.nbresults + ')</span>' + cross + '</button></li>');
            });

            // Manage click on filters.
            $('#collections button, #entities button').on('click', function () {
                that.selectFilter(this);
            });

            // Update page title.
            this.updatePageTitle();
        },
        /**
         * Manage click on a filter
         *
         * @param {string} $element the jquery button element
         */
        selectFilter: function ($element) {
            var identifier = $($element).data('identifier');
            var type = $($element).data('type');

            if ($($element).hasClass('selected')) {
                this.removeFilter(type, identifier);
                $($element).removeClass('selected');
            } else {
                this.addFilter(type, identifier);
                $($element).addClass('selected');
            }

            this.initOffset = this.nbResultsPerScroll;

            // Launch a new search with filters.
            this.searchWithFilters();

            // Set the focus on the first visible tile.
            this.setFirstTileFocus();
        },
        /**
         * Add a filter
         * @param {string} type collections or entities
         * @param {string} identifier
         */
        addFilter: function (type, identifier) {
            var index = this.selectedFilters[type].findIndex(e => e === identifier);

            if (index === -1) {
                this.selectedFilters[type].push(identifier);
            }

            // Refresh filters cookie.
            this.updateFiltersCookie(JSON.stringify(this.selectedFilters));
        },
        /**
         * Remove a filter
         * @param {string} type collections or entities
         * @param {string} identifier
         */
        removeFilter: function (type, identifier) {
            var index = this.selectedFilters.collections.indexOf(identifier);
            this.selectedFilters[type].splice(index, 1);


            // Refresh filters cookie.
            this.updateFiltersCookie(JSON.stringify(this.selectedFilters));
        },
        /**
         * Refresh filters cookie.
         *
         * @param {string} values
         */
        updateFiltersCookie: function (values) {
            cookie.create('libraryFilters', values);
        },
        /**
         * Cleanup a string by removing special chars and accents
         * @param {string} str
         * @returns {string}
         */
        cleanupString: function (str) {
            str = str.toLowerCase();
            str = str.trim();
            var nonasciis = { 'a': '[àáâãäå]', 'ae': 'æ', 'c': 'ç', 'e': '[èéêë]', 'i': '[ìíîï]', 'n': 'ñ', 'o': '[òóôõö]', 'oe': 'œ', 'u': '[ùúûűü]', 'y': '[ýÿ]' };
            for (var i in nonasciis) {
                str = str.replace(new RegExp(nonasciis[i], 'g'), i);
            }
            str = str.replace(new RegExp("[^a-zA-Z0-9\\s]", "g"), ' ');
            str = str.replace(/ +/g, ' ');
            return str;
        },
        /**
         * Split a string on spaces and remove words shorter than 3 caracters
         * @param {string} str
         * @returns {array}
         */
        splitString: function (str) {
            var split = str.split(' ');

            var words = [];

            for (var i in split) {
                if (words.indexOf(split[i]) == -1 && split[i].length > 2) {
                    words.push(split[i]);
                }
            }

            return words;
        },
        /**
         * Init introduction to the library event show/hide text.
         */
        initIntroductionLibrary: function () {

            var isTruncated = true;

            // Fonction pour basculer l'affichage et mettre à jour le texte du bouton
            function toggleContentVisibility() {
                let toggleButton = $('#header-library .show-more');
                if (isTruncated) {
                    $('#introduction-last-part').removeClass('truncate');
                    $('#header-library #gradientmask').addClass('hidden');
                    toggleButton.attr('aria-expanded', 'true');
                    // get i18n string relative to "viewless" and then replace the button text by the string content
                    str.get_string('viewless', 'local_catalog').then(function (str) {
                        $('#header-library .show-more').text(str);
                    });
                } else {
                    $('#introduction-last-part').addClass('truncate');
                    $('#header-library #gradientmask').removeClass('hidden');
                    toggleButton.attr('aria-expanded', 'false');
                    str.get_string('readmore', 'local_catalog').then(function (str) {
                        $('#header-library .show-more').text(str);
                    });
                }
                isTruncated = !isTruncated;
            }

            $('#header-library .show-more, #header-library #gradientmask').click(function (e) {
                e.preventDefault();
                toggleContentVisibility();
            });
        },
        /**
         * Set publication confirm modal.
         *
         * @param {string} text
         * @param {string} url
         */
        confirmSuccess: function (text, url) {
            // Confirm publish popin.
            mentor.dialog(
                '<p class="text-center">' +
                text + '</p>',
                {
                    width: 550,
                    title: M.util.get_string('confirmation', 'local_mentor_core'),
                    close: function () {
                        window.location.href = url;
                    },
                    buttons: [{
                        text: M.util.get_string('close', 'local_mentor_core'),
                        class: "btn btn-primary",
                        click: function () {
                            $(this).dialog("close");
                        }
                    }]
                });

        },
    };

    //add object to window to be called outside require
    window.local_library = local_library;
    return local_library;
});
