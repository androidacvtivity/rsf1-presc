webform.validators.validate_rsf1_presc_1 = function () {
    var values = Drupal.settings.mywebform.values;

    validateIDNOAndCUIIO();
    //---------------------------------------------------------------------

    var fieldError = validateFieldNoHieroglyphs('Entitatea', values.dec_fiscCod_name);
    if (fieldError) {
        webform.warnings.push({
            'fieldName': fieldError.fieldName,
            'index': 0,
            'weight': 10,
            'msg': fieldError.message
        });
    }

    //--------------------------------------------------------------------

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
    // --------------------------------------------------------------------

    validateSpecialIDNOAndCUIIO();
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


    // ------------------------------------------------------------------------------


    // Check if both IDNO and CUIIO match any entry in the list
    var match = isTaxpayerInExceptionList();

    if (!match) {
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

            if (periodFromStr > periodToStr && !match) {
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
    }


    //--------------------------------------------------------------------------------------------



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