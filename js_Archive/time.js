
//Validarile RF3-004 si RF3-005 sunt valabile pentru orice cod IDNO si CUIIO  inafara de - IDNO: "1234567890123", CUIIO: "88888888"
//adauga o functionalitatea noua  pentru IDNO: "1234567890123", CUIIO: "88888888" perioada sa fie 01.07.2023-30.06.2024
//daca este depasita sa afiseze eroare RF3-004 si RF3-005
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


var IDNO = jQuery('#dec_fiscCod_fiscal').val().trim();
var CUIIO = jQuery('#dec_fiscCod_cuiio').val().trim();


var idnoCuiioList = [{
    IDNO: "1234567890123", CUIIO: "88888888"
},
];

// Check if both IDNO and CUIIO match any entry in the list
var match = idnoCuiioList.some(function (entry) {
    return entry.CUIIO === CUIIO && entry.IDNO === IDNO;

});

if (parseInt(startPeriod[2]) < lastYear && !match) {
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

if (endPeriod.length == 3 && !match) {
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


//--------------------------------------------------------------------------------------------

// Daca de lichidare este  bifat si anult de raporttare pana la 31.12.2025 - Sa treaca 


//B092425 rsf1 - presc Modificare js - rsf1 - presc24_022.js

// Buna ziua, Cristina.
// Cand aveti uamratorul Deploy - noi avem o modificare pentru RSF Prescurtat.BunaAm creat si branch-ul rsf1-presc24_022 pentru aceasta modificare. 
// Va rog sa il folositi pentru Deploy.
// Multumesc!


// B101625 rsf1 - presc Modificare js - rsf1 - presc24_023.js

//SELECT code, CONCAT(code, ' - ', name) FROM taxonomy_term_data t JOIN classifier_76 c ON c.tid = t.tid WHERE(code NOT BETWEEN 7001 AND 7055) AND(code NOT BETWEEN 8001 AND 8060) ORDER BY code