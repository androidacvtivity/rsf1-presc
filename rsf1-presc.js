(function ($) {
    var completedTables = {
        'processed': false,
        'tables': {}
    };

    Drupal.behaviors.rsf1_presc = {
        attach: function (context, settings) {
            jQuery('#mywebform-edit-form').on('keypress', 'input.numeric, input.float, input.money', function (event) {
                var allowNegative = jQuery(this).attr('allow-negative') || false;
                if (isNumberPressed(this, event, allowNegative) === false) {
                    event.preventDefault();
                }
            });

            jQuery('#mywebform-edit-form', context).on('paste', 'input.numeric, input.money, input.float', function (event) {
                var obj = event.originalEvent || event;

                if (typeof obj.clipboardData !== 'undefined') {
                    var value = obj.clipboardData.getData('text/plain');
                    var number = Number(value);
                    var isNotNumber = isNaN(number);

                    if (jQuery(this).hasClass('allow-negative')) {
                        if (isNotNumber) {
                            event.preventDefault();
                        }
                    } else {
                        if (isNotNumber || is_negative(number)) {
                            event.preventDefault();
                        }
                    }
                }
            });

            if (!Drupal.settings.mywebform.preview) {
                var periodInfo = Drupal.settings.mywebform.period;
                $("#dec_period_from").datepicker("option", "minDate", new Date(periodInfo.start.year, periodInfo.start.month - 1, periodInfo.start.day));
                $("#dec_period_from").datepicker("option", "maxDate", new Date(periodInfo.end.year, periodInfo.end.month - 1, periodInfo.end.day));

                $("#dec_period_to").datepicker("option", "minDate", new Date(periodInfo.start.year, periodInfo.start.month - 1, periodInfo.start.day));
                $("#dec_period_to").datepicker("option", "maxDate", new Date(periodInfo.end.year, periodInfo.end.month - 1, periodInfo.end.day));

                delete_unnecessary_cfp_options();
            }

            $("#dec_period_to").on("change", function () {
                var val = $(this).val();
                var year = "";

                if (val) {
                    var periodArr = val.split(".");
                    if (periodArr.length === 3) {
                        year = periodArr[2];
                    }
                }

                $("#nalogPeriodYear").val(year).trigger("change");
            });
        }
    };

    webform.beforeLoad.rsf1_presc = function () {
        $('#dinamicAttachments').on('mywebform:showFileInfo', '.mywebform-file-widget', function () {
            $(this).parents('div.row').find('.delrow').show();
        });

        $('#dinamicAttachments').on('mywebform:sync', '.mywebform-file-widget', function () {
            var length = Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file.length;
            if (Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file[length - 1] != '') {
                $('#dinamicAttachments .grid-addrow').trigger('click');
            }
        });
    };

    webform.afterLoad.rsf1_presc = function () {
        if (Drupal.settings.mywebform.preview) {
            if (!Drupal.settings.mywebform.values.dec_lichidare) {
                $(".lichidare").hide();
            }
        }
    };

    webform.validators.validate_rsf1_presc_1 = function () {
        var values = Drupal.settings.mywebform.values;

        identifyCompletedTables(true);

        var orgs = [890, 899, 900, 930, 700, 940, 970, 910, 960, 871, 997];
        if (orgs.indexOf(toFloat(values.dec_fiscCod_cfoj)) !== -1) {
            webform.errors.push({
                'fieldName': 'dec_fiscCod_cfoj',
                'index': 0,
                'weight': 1,
                'msg': concatMessage('RF3-001', '', Drupal.t('Dacă forma organizatorico-juridică este 890, 899, 900, 930, 700, 940, 970, 910, 960, 871, 997 – entitatea prezintă situaţii financiare ale organizaţiilor necomerciale RSF2')),
            });
        }

        var currentDate = new Date();
        var lastYear = new Date().getFullYear() - 1;
        var plusDays = isLeap(new Date().getFullYear()) ? 121 : 120;
        var validDate = new Date(lastYear, 11, 31 + plusDays, 23, 59, 59); // lastYear/12/31 + 120 || 121 days
        var endPeriod = values.dec_period_to.split(".");
        var startPeriod = values.dec_period_from.split(".");
        var validEndPeriod = new Date(endPeriod[2], parseInt(endPeriod[1]) - 1, parseInt(endPeriod[0]) + plusDays, 23, 59, 59);

        if (Drupal.settings.declarations.declarations_submission_deadline_rsf1_presc) {
            var erObj002 = {
                'index': 0,
                'weight': 2,
                'msg': concatMessage('RF3-002', '', Drupal.t('Termenul prezentarii Situațiilor financiare a expirat')),
            };

            if (currentDate > validDate) {
                erObj002.fieldName = 'dec_period_from';
                webform.errors.push(erObj002);
            }
        }

        var filesExists = false;
        var files = Drupal.settings.mywebform.values.dec_dinamicAttachments_row_file;
        for (var i = 0; i < files.length; i++) {
            if (files[i]) {
                filesExists = true;
                break;
            }
        }

        if (!filesExists) {
            webform.errors.push({
                'fieldName': '',
                'index': 0,
                'weight': 3,
                'msg': concatMessage('RF3-003', '', Drupal.t('Nu este atașată Nota explicativă')),
            });
        }

        if (parseInt(startPeriod[2]) < lastYear) {
            webform.errors.push({
                'fieldName': 'dec_period_from',
                'index': 0,
                'weight': 4,
                'msg': concatMessage('RF3-004', '', Drupal.t('Data începutului perioadei de raportare nu este corectă')),
            });
        } else if (endPeriod.length == 3 && startPeriod.length == 3) {
            var periodToStr = endPeriod[2] + '-' + endPeriod[1] + '-' + endPeriod[0];
            var periodFromStr = startPeriod[2] + '-' + startPeriod[1] + '-' + startPeriod[0];

            if (periodFromStr > periodToStr) {
                webform.errors.push({
                    'fieldName': 'dec_period_from',
                    'index': 0,
                    'weight': 4,
                    'msg': concatMessage('RF3-004', '', Drupal.t('Data începutului perioadei de raportare nu este corectă')),
                });
            }
        }

        if (endPeriod.length == 3) {
            var periodToStr = endPeriod[2] + '-' + endPeriod[1] + '-' + endPeriod[0];
            var comparedDateStr = lastYear + '-12-31';
            if ((values.dec_lichidare && periodToStr >= comparedDateStr) || (!values.dec_lichidare && periodToStr != comparedDateStr)) {
                webform.errors.push({
                    'fieldName': 'dec_period_to',
                    'index': 0,
                    'weight': 5,
                    'msg': concatMessage('RF3-005', '', Drupal.t('Data sfârșitului perioadei de raportare nu este corectă')),
                });
            }
        }

        if (startPeriod.length == 3 && endPeriod.length == 3) {
            var fromDate = new Date(startPeriod[2], startPeriod[1] - 1, startPeriod[0]);
            var toDate = new Date(endPeriod[2], endPeriod[1] - 1, endPeriod[0]);

            var diffDays = Math.ceil(Math.abs(toDate.getTime() - fromDate.getTime()) / (86400000));
            var currentYear = new Date().getFullYear();
            if ((isLeap(currentYear) && diffDays > 366) || (!isLeap(currentYear) && diffDays > 365)) {
                webform.errors.push({
                    'fieldName': 'dec_period_to',
                    'index': 0,
                    'weight': 6,
                    'msg': concatMessage('RF3-006', '', Drupal.t('Perioada de raportare este mai mare de un an')),
                });
            }
        }

        if (values.dec_lichidare && values.dec_table1_row_r230c5 > 0) {
            webform.errors.push({
                'fieldName': 'dec_table1_row_r230c5',
                'index': 0,
                'weight': 7,
                'msg': concatMessage('RF3-007', '', Drupal.t('Situatia financiară nu corespunde bilanțului de lichidare')),
            });
        }


        if ((!parseInt(values.dec_fiscCod_nrEmployees) && !values.dec_fiscCod_employeesAbs) || (parseInt(values.dec_fiscCod_nrEmployees) && values.dec_fiscCod_employeesAbs)) {
            webform.errors.push({
                'fieldName': 'dec_fiscCod_nrEmployees',
                'index': 0,
                'weight': 24,
                'msg': concatMessage('RF3-024', '', Drupal.t('Completați Numărul mediu al salariaţilor în perioada de gestiune sau confirmați lipsa salariaților')),
            });
        }

        if (!values.dec_pers_respons) {
            webform.warnings.push({
                'fieldName': 'dec_pers_respons',
                'index': 0,
                'weight': 25,
                'msg': concatMessage('RF3-025', '', Drupal.t('Completați Persoanele responsabile de semnarea situațiilor financiare')),
            });
        }

        var autofield_exp = [
            // table 1
            { 'rezField': 'dec_table1_row_r050c4', 'callback': _mywebform_expression_dec_table1_row_r050c4, 'err': '011', 'text': function () { return Drupal.t('Anexa 1 Rd.050 col.@col = Rd 010 + Rd 020 + Rd 030 + Rd 040 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table1_row_r050c5', 'callback': _mywebform_expression_dec_table1_row_r050c5, 'err': '011', 'text': function () { return Drupal.t('Anexa 1 Rd.050 col.@col = Rd 010 + Rd 020 + Rd 030 + Rd 040 col.@col', { '@col': 5 }); } },
            { 'rezField': 'dec_table1_row_r100c4', 'callback': _mywebform_expression_dec_table1_row_r100c4, 'err': '012', 'text': function () { return Drupal.t('Anexa 1 Rd.100 col.@col = Rd 060 + Rd 070 + Rd 080 + Rd 090 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table1_row_r100c4', 'callback': _mywebform_expression_dec_table1_row_r100c4, 'err': '012', 'text': function () { return Drupal.t('Anexa 1 Rd.100 col.@col = Rd 060 + Rd 070 + Rd 080 + Rd 090 col.@col', { '@col': 5 }); } },
            { 'rezField': 'dec_table1_row_r110c4', 'callback': _mywebform_expression_dec_table1_row_r110c4, 'err': '013', 'text': function () { return Drupal.t('Anexa 1 Rd.110 col.@col = Rd 050 + Rd 100 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table1_row_r110c5', 'callback': _mywebform_expression_dec_table1_row_r110c5, 'err': '013', 'text': function () { return Drupal.t('Anexa 1 Rd.110 col.@col = Rd 050 + Rd 100 col.@col', { '@col': 5 }); } },
            { 'rezField': 'dec_table1_row_r180c4', 'callback': _mywebform_expression_dec_table1_row_r180c4, 'err': '014', 'text': function () { return Drupal.t('Anexa 1 Rd.180 col.@col = Rd 120 + Rd 130 + Rd 140 + Rd 150 + Rd 160 + Rd 170 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table1_row_r180c5', 'callback': _mywebform_expression_dec_table1_row_r180c5, 'err': '014', 'text': function () { return Drupal.t('Anexa 1 Rd.180 col.@col = Rd 120 + Rd 130 + Rd 140 + Rd 150 + Rd 160 + Rd 170 col.@col', { '@col': 5 }); } },
            { 'rezField': 'dec_table1_row_r210c4', 'callback': _mywebform_expression_dec_table1_row_r210c4, 'err': '015', 'text': function () { return Drupal.t('Anexa 1 Rd.210 col.@col = Rd 190 + Rd 200 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table1_row_r210c5', 'callback': _mywebform_expression_dec_table1_row_r210c5, 'err': '015', 'text': function () { return Drupal.t('Anexa 1 Rd.210 col.@col = Rd 190 + Rd 200 col.@col', { '@col': 5 }); } },
            { 'rezField': 'dec_table1_row_r230c4', 'callback': _mywebform_expression_dec_table1_row_r230c4, 'err': '016', 'text': function () { return Drupal.t('Anexa 1 rd.230 col.@col = rd.180 + rd.210 + Rd 220 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table1_row_r230c5', 'callback': _mywebform_expression_dec_table1_row_r230c5, 'err': '016', 'text': function () { return Drupal.t('Anexa 1 rd.230 col.@col = rd.180 + rd.210 + Rd 220 col.@col', { '@col': 5 }); } },

            // table 2
            { 'rezField': 'dec_table2_row_r030c3', 'callback': _mywebform_expression_dec_table2_row_r030c3, 'err': '018', 'text': function () { return Drupal.t('Anexa 2 rd.030 col.@col = rd.010 - rd.020 col.@col', { '@col': 3 }); } },
            { 'rezField': 'dec_table2_row_r030c4', 'callback': _mywebform_expression_dec_table2_row_r030c4, 'err': '018', 'text': function () { return Drupal.t('Anexa 2 rd.030 col.@col = rd.010 - rd.020 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table2_row_r080c3', 'callback': _mywebform_expression_dec_table2_row_r080c3, 'err': '019', 'text': function () { return Drupal.t('Anexa 2 rd.080 col.@col = rd.030 + rd.040 - rd.050 - rd.060 - rd.070 col.@col', { '@col': 3 }); } },
            { 'rezField': 'dec_table2_row_r080c4', 'callback': _mywebform_expression_dec_table2_row_r080c4, 'err': '019', 'text': function () { return Drupal.t('Anexa 2 rd.080 col.@col = rd.030 + rd.040 - rd.050 - rd.060 - rd.070 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table2_row_r110c3', 'callback': _mywebform_expression_dec_table2_row_r110c3, 'err': '020', 'text': function () { return Drupal.t('Anexa 2 rd.110 col.@col = rd.090 + rd.100 col.@col', { '@col': 3 }); } },
            { 'rezField': 'dec_table2_row_r110c4', 'callback': _mywebform_expression_dec_table2_row_r110c4, 'err': '020', 'text': function () { return Drupal.t('Anexa 2 rd.110 col.@col = rd.090 + rd.100 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table2_row_r120c3', 'callback': _mywebform_expression_dec_table2_row_r120c3, 'err': '021', 'text': function () { return Drupal.t('Anexa 2 rd.120 col.@col = rd.080 + rd.110 col.@col', { '@col': 3 }); } },
            { 'rezField': 'dec_table2_row_r120c4', 'callback': _mywebform_expression_dec_table2_row_r120c4, 'err': '021', 'text': function () { return Drupal.t('Anexa 2 rd.120 col.@col = rd.080 + rd.110 col.@col', { '@col': 4 }); } },
            { 'rezField': 'dec_table2_row_r140c3', 'callback': _mywebform_expression_dec_table2_row_r140c3, 'err': '026', 'text': function () { return Drupal.t('Anexa 2 rd.140 col.@col = rd.120 - rd.130 col.@col', { '@col': 3 }); } },
            { 'rezField': 'dec_table2_row_r140c4', 'callback': _mywebform_expression_dec_table2_row_r140c4, 'err': '026', 'text': function () { return Drupal.t('Anexa 2 rd.140 col.@col = rd.120 - rd.130 col.@col', { '@col': 4 }); } },
        ];

        for (var i = 0; i < autofield_exp.length; i++) {
            validate_autofields(autofield_exp[i]);
        }

        var comparable_err_msg_callback = function (annex, row, col, op, comp_annex, comp_row, comp_col) {
            return function () {
                return Drupal.t('Anexa @annex rd.@row col.@col @op Anexa @comp_annex rd.@comp_row col.@comp_col', {
                    '@annex': annex,
                    '@row': row,
                    '@col': col,
                    '@op': op,
                    '@comp_annex': comp_annex,
                    '@comp_row': comp_row,
                    '@comp_col': comp_col
                });
            };
        };

        var comparable_fields = [
            //table 1
            { 'field': 'dec_table1_row_r110c4', 'comparable_field': 'dec_table1_row_r230c4', 'err': '017', 'validate': true, 'op': '!=', 'text': comparable_err_msg_callback(1, '110', 4, '=', 1, '230', 4) },
            { 'field': 'dec_table1_row_r110c5', 'comparable_field': 'dec_table1_row_r230c5', 'err': '017', 'validate': true, 'op': '!=', 'text': comparable_err_msg_callback(1, '110', 5, '=', 1, '230', 5) },
        ];

        for (var i = 0; i < comparable_fields.length; i++) {
            compare_fields(comparable_fields[i]);
        }

        webform.validatorsStatus.validate_rsf1_presc_1 = 1;
        validateWebform();
    };

    webform.validators.validate_rsf1_presc_a1 = function () {
        var values = Drupal.settings.mywebform.values;

        msg = concatMessage('RF3-010', '', Drupal.t("Anexa 1 Valoarea trebuie sa fie pozitivă"));
        validatePositiveFields('.annex-1', msg, 10);

        if (!isTableCompleted('table1')) {
            webform.warnings.push({
                'fieldName': '',
                'index': 0,
                'weight': 9,
                'msg': concatMessage('RF3-009', '', Drupal.t('Nu este completată Anexa 1„Bilanţul prescurtat”')),
            });
        }

        if (toFloat(values.dec_table2_row_r020c3) > 0 && !toFloat(values.dec_table2_row_r010c3)) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r010c3',
                'index': 0,
                'weight': 27,
                'msg': concatMessage('RF3-027', '', Drupal.t('Daca Anexa 2 rd.020 col.3 > 0 atunci Anexa 2 rd.010 col.3 > 0')),
            });
        }

        if (toFloat(values.dec_table2_row_r020c4) > 0 && !toFloat(values.dec_table2_row_r010c4)) {
            webform.errors.push({
                'fieldName': 'dec_table2_row_r010c4',
                'index': 0,
                'weight': 27,
                'msg': concatMessage('RF3-027', '', Drupal.t('Daca Anexa 2 rd.020 col.4 > 0 atunci Anexa 2 rd.010 col.4 > 0')),
            });
        }

        if (!values.dec_fiscCod_street) {
            webform.warnings.push({
                "fieldName": "dec_fiscCod_street",
                "msg": Drupal.t('Câmpul nu este completat')
            });
        }

        webform.validatorsStatus.validate_rsf1_presc_a1 = 1;
        validateWebform();
    };

    webform.validators.validate_rsf1_presc_a2 = function () {
        msg = concatMessage('RF3-022', '', Drupal.t("Anexa 2 Valoarea trebuie sa fie pozitivă"));
        validatePositiveFields('.annex-2', msg, 22);

        if (!isTableCompleted('table2')) {
            webform.warnings.push({
                'fieldName': '',
                'index': 0,
                'weight': 23,
                'msg': concatMessage('RF3-023', '', Drupal.t('Nu este completată Anexa 2 „Situaţia de profit şi pierdere”')),
            });
        }

        webform.validatorsStatus.validate_rsf1_presc_a2 = 1;
        validateWebform();
    };

    webform.validators.rsf1_presc_last_validator = function () {
        prepare_errors('errors');
        prepare_errors('warnings');

        //Sort warnings & errors
        webform.warnings.sort(function (a, b) {
            return sort_errors_warinings(a, b);
        });

        webform.errors.sort(function (a, b) {
            return sort_errors_warinings(a, b);
        });

        webform.validatorsStatus.rsf1_presc_last_validator = 1;
        validateWebform();
    };

    function delete_unnecessary_cfp_options() {
        var unnecessary_opt = [10, 21, 25, 27];

        for (var i = 0; i < Drupal.settings.mywebform.fields.dec_fiscCod_cfp.options.length; i++) {
            if (unnecessary_opt.indexOf(Drupal.settings.mywebform.fields.dec_fiscCod_cfp.options[i].id) !== -1) {
                Drupal.settings.mywebform.fields.dec_fiscCod_cfp.options.splice(i, 1);
                i--;
            }
        }
    }

    function errorActuality(tables) {
        return isTablesCompleted(tables);
    }

    function concatMessage(errorCode, fieldTitle, msg) {
        var titleParts = [];

        if (errorCode) {
            titleParts.push(getErrorMessage(errorCode));
        }

        if (fieldTitle) {
            titleParts.push(fieldTitle);
        }

        if (titleParts.length) {
            msg = titleParts.join(', ') + ' - ' + msg;
        }

        return msg;
    }

    function getFieldTitle(field) {
        return Drupal.settings.mywebform.fields[field].title;
    }

    function getErrorMessage(errorCode) {
        return Drupal.t('Error code: @error_code', { '@error_code': errorCode });
    }

    function isErrorMessageWithCode(msg) {
        if (msg) {
            var regexp = /RF3-\d+/;
            if (regexp.test(msg)) {
                return true;
            }
        }

        return false;
    }

    function isLeap(year) {
        return new Date(year, 1, 29).getDate() === 29;
    }

    function identifyCompletedTables(reset) {
        if (!completedTables.processed || reset) {
            var values = Drupal.settings.mywebform.values;
            completedTables = {
                'processed': true,
                'tables': {}
            };
            for (var fieldName in values) {
                var exp = /^dec_(table\d*|dinamicTable\d*)_/;
                var result = fieldName.match(exp);

                if (result) {
                    if (!completedTables.tables.hasOwnProperty(result[1])) {
                        if (values[fieldName] instanceof Array) {
                            if (values[fieldName].length > 1) {
                                completedTables.tables[result[1]] = true;
                            } else if (values[fieldName].length == 1) {
                                var gridName = Drupal.settings.mywebform.fields[fieldName].grid_name;
                                var indexField = Drupal.settings.mywebform.grids[gridName].defField;

                                if (fieldName != indexField) {
                                    if (values[fieldName][0] !== '' && values[fieldName][0] !== null) {
                                        completedTables.tables[result[1]] = true;
                                    }
                                }
                            }
                        } else {
                            if (values[fieldName] !== '' && values[fieldName] !== null) {
                                completedTables.tables[result[1]] = true;
                            }
                        }
                    }
                }
            }
        }
    }

    function isTableCompleted(table) {
        if (completedTables.tables.hasOwnProperty(table) && completedTables.tables[table]) {
            return true;
        }

        return false;
    }

    function isTablesCompleted(tables) {
        for (var i = 0; i < tables.length; i++) {
            if (!isTableCompleted(tables[i])) {
                return false;
            }
        }

        return true;
    }

    function validatePositiveFields(selector, msg, weight) {
        var values = Drupal.settings.mywebform.values;
        var error = false;

        jQuery(selector + ' input').each(function () {
            var fieldName = jQuery(this).attr('field');
            var allowNegative = jQuery(this).attr('allow-negative');

            if (!allowNegative && is_negative(values[fieldName])) {
                error = true;
                webform.errors.push({
                    'fieldName': fieldName,
                    'index': 0,
                    'msg': ''
                });
            }
        });

        if (error) {
            webform.errors.push({
                'fieldName': '',
                'index': 0,
                'weight': weight,
                'msg': msg
            });
        }
    }

    function validate_autofields(item) {
        var values = Drupal.settings.mywebform.values;
        if (item.callback() != values[item.rezField]) {
            var msg = item.text;
            if (typeof msg == 'function') {
                msg = msg();
            }

            webform.errors.push({
                'fieldName': item.rezField,
                'index': 0,
                'weight': parseInt(item.err),
                'msg': concatMessage('RF3-' + item.err, '', msg)
            });
        }
    }

    function compare_fields(item) {
        var values = Drupal.settings.mywebform.values;
        var validate = !item.hasOwnProperty('validate') || item.validate;

        if (validate) {
            var value = values[item.field];
            var comparable_value = 0;
            if (typeof item.comparable_field == 'function') {
                comparable_value = item.comparable_field();
            } else {
                comparable_value = values[item.comparable_field];
            }

            var expression = toFloat(value) + item.op + toFloat(comparable_value);
            if (eval(expression)) {
                var msg = item.text;
                if (typeof msg == 'function') {
                    msg = msg();
                }

                webform.errors.push({
                    'fieldName': item.field,
                    'index': 0,
                    'weight': parseInt(item.err),
                    'msg': concatMessage('RF3-' + item.err, '', msg)
                });
            }
        }
    }

    function sort_errors_warinings(a, b) {
        if (!a.hasOwnProperty('weight')) {
            a.weight = 9999;
        }

        if (!b.hasOwnProperty('weight')) {
            b.weight = 9999;
        }

        return toFloat(a.weight) - toFloat(b.weight);
    }

    function prepare_errors(type) {
        var dateFields = {};
        var requiredFields = {};
        var total = webform[type].length;
        var dateError = Drupal.t('Wrong field format: date needed');
        var requiredError = Drupal.t('This field is required');

        for (var i = 0; i < total; i++) {
            var error = webform[type][i];
            var fieldName = error.fieldName;
            var field = Drupal.settings.mywebform.fields.hasOwnProperty(fieldName) ? Drupal.settings.mywebform.fields[fieldName] : false;

            if (field) {
                if (field.type == 'date') {
                    if (error.msg == dateError) {
                        error.msg = '';
                        dateFields[fieldName] = field.title;
                    }
                } else if (field.type == 'period') {
                    error.msg = '';
                }

                if (field.required && error.msg == requiredError) {
                    error.msg = '';
                    requiredFields[fieldName] = field.title;
                }
            }

            if (isErrorMessageWithCode(error.msg)) {
                if (!error.hasOwnProperty('options')) {
                    error.options = {};
                }

                error.options.hide_title = true;
            }
        }

        if (Object.keys(requiredFields).length) {
            var elements = Object.values(requiredFields).join('<br />');

            webform[type].push({
                'fieldName': '',
                'weight': 10000,
                'msg': Drupal.t("<u>Cîmpuri obligatorii pentru completare:</u><br />!fields", { '!fields': elements })
            });
        }

        if (Object.keys(dateFields).length) {
            var elements = Object.values(dateFields).join('<br />');
            webform[type].push({
                'fieldName': '',
                'weight': 10001,
                'msg': Drupal.t("<u>Data trebuie să fie în formatul: ZZ.LL.AAAA, pentru:</u><br />!fields", { '!fields': elements })
            });
        }
    }

})(jQuery);