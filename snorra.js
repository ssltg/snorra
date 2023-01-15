$('#translation').blur(function () {
    let translation = JSON.parse(window.localStorage.getItem('translation'));
    if (translation === undefined || translation === null) {
        return;
    }
    let keySelect = document.getElementById('keySelect');
    if ($('#translation').hasClass('plain')) {
        translation[keySelect.value]['value'] = $('#pastebin').html($('#translation').html()).text();
    } else {
        if (translation[keySelect.value] === undefined) {
            translation[keySelect.value] = {
                key: $( "#keySelect option:selected" ).text()
            };
        }
        translation[keySelect.value]['value'] = $('#translation').html();
    }
    window.localStorage.setItem('translation', JSON.stringify(translation));
});

$('#translationContainer').on('show.bs.collapse', function () {
    fillSelect();
});

function insertColorGrey() {
    const tagStart = '<font style="color: grey">';
    const tagEnd = '</font>';
    document.execCommand('insertHTML', false, tagStart + document.getSelection()+tagEnd);
}

function insertColorGreen() {
    const tagStart = '<font style="color: green">';
    const tagEnd = '</font>';
    document.execCommand('insertHTML', false, tagStart + document.getSelection()+tagEnd);
}

function insertColorRed() {
    const tagStart = '<font style="color: red">';
    const tagEnd = '</font>';
    document.execCommand('insertHTML', false, tagStart + document.getSelection()+tagEnd);
}

function sourceView() {
    //let newpre = document.createElement( "pre" );
    //$('#translation').append()
    if ($('#translation').hasClass('plain')) {
        $('#translation').html($('#translation').text());
        $('#translation').toggleClass('plain');
        $('#source').html($('#source').text());
        $('#source').toggleClass('plain');
    } else {
        $('#translation').text($('#translation').html());
        $('#translation').toggleClass('plain');
        $('#source').text($('#source').html());
        $('#source').toggleClass('plain');
    }
}

function sourceToClipboard() {
    $('#pastebin').toggleClass('show').text($('#source').html().replace(/<br>/g, "\n")).select()
    document.execCommand("copy");
    $('#pastebin').toggleClass('show');
}

function doImport() {
    if (window.localStorage.getItem('translation')) {
        if (!confirm('You have current working data in storage.\nThis will delete all contents in your current translation!\nAre you sure?\nHave you saved your Working state via "Show Export"?')) {
            return;
        }
    }
    let source = splitTranslation(document.getElementById('import').value);
    window.localStorage.removeItem('source');
    window.localStorage.setItem('source', JSON.stringify(source));
    setTranslation();
    let selectTag = $('#keySelect');
    selectTag.empty();
    fillSelect();
}

function doImportUpdateSource() {
    if (!confirm('Only do this, if you know what you are doing!')) {
        return;
    }
    let source = splitTranslation(document.getElementById('import').value);
    let orgSource = JSON.parse(window.localStorage.getItem('source'));
    let mergedSource = {
        ...orgSource,
        ...source,
    };
    window.localStorage.setItem('source', JSON.stringify(mergedSource));
    let selectTag = $('#keySelect');
    selectTag.empty();
    fillSelect();
}

function doImportUpdateTranslation() {
    if (!confirm('Only do this, if you know what you are doing!')) {
        return;
    }
    let translation = splitTranslation(document.getElementById('import').value);
    let orgTranslation = {};
    try {
        orgTranslation = JSON.parse(window.localStorage.getItem('translation'));
    } catch(error) {
        // ignore
    }

    let mergedTranslation = {
        ...orgTranslation,
        ...translation,
    };
    window.localStorage.setItem('translation', JSON.stringify(mergedTranslation));
}

function setTranslation() {
    let source = window.localStorage.getItem('source');
    if (source === undefined || source === null) {
        return;
    }
    window.localStorage.setItem('translation', source);
}

function fillSelect() {
    let selectTag = $('#keySelect');
    let source = JSON.parse(window.localStorage.getItem('source'));
    if (source === undefined || source === null) {
        selectTag.empty();
        return;
    }
    Object.entries(source).forEach((entry) => {
        if ($('#keySelect option[value="' + entry[0] + '"]').length > 0) {
            return;
        }
            let opt = document.createElement("option");
            opt.value = entry[0];
            opt.innerHTML = entry[1]['key'];
            selectTag.append(opt);
        });
}

function selectKey(select) {
    let source = JSON.parse(window.localStorage.getItem('source'));
    let translation = JSON.parse(window.localStorage.getItem('translation'));
    if (source === undefined || source === null || translation === undefined || translation === null) {
        return;
    }
    if ($('#source').hasClass('plain')) {
        sourceView();
    }
    $('#source').html(source[select.value]['value']);
    $('#translation').html(translation[select.value]?.['value']??'');
}

function splitTranslation(text) {
    const regex = new RegExp("^(.*?),(.*)$", 'gm');

    let m;
    let source = {};

    while ((m = regex.exec(text)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }
        let lastMatch = null;
        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            //console.log(`Found match, group ${groupIndex}: ${match}`);
            if (groupIndex === 1) {
                lastMatch = md5(match);
                source[lastMatch] = {
                    key: match
                }
            } else if (groupIndex === 2) {
                source[lastMatch]['value'] = cleanUpImport(match);
            }
        });
    }
    return source;
}

function refreshExport() {
    let exportTag = $('#export');
    let translation = JSON.parse(window.localStorage.getItem('translation'));
    let wholeString = '';
    Object.entries(translation).forEach((entry) => {
        wholeString += entry[1]['key'] + ',"' + cleanUpExport(entry[1]['value']) + "\"\n";
    });
    exportTag.text(wholeString);
}

function exportLocalStorage() {
    Object.assign(document.createElement("a"), {
        href: `data:application/JSON, ${encodeURIComponent(
            JSON.stringify(
                Object.keys(localStorage).reduce(
                    (obj, k) => ({ ...obj, [k]: JSON.parse(localStorage.getItem(k)) }),
                    {}
                ),
                null,
                2
            )
        )}`,
        download: "valkyrie_translation_state",
    }).click()
}

$('#restore').on('change', null, importLocalStorage);

function importLocalStorage(event) {
    let files = event.target.files; // FileList object
    if (files.length > 1) {
        alert('Only 1 File should be uploaded!');
        return;
    }
    let reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = function() {
        let backup = JSON.parse(reader.result);
        window.localStorage.setItem('source', JSON.stringify(backup.source));
        window.localStorage.setItem('translation', JSON.stringify(backup.translation));
    };
}

function cleanUpExport(text) {
    return text
        .replace(/\&#xf200/g, '{strength}')
        .replace(/\&#xf201/g, '{agility}')
        .replace(/\&#xf202/g, '{observation}')
        .replace(/\&#xf203/g, '{lore}')
        .replace(/\&#xf204/g, '{influence}')
        .replace(/\&#xf205/g, '{will}')
        .replace(/\&#xf206/g, '{eldersign}')
        .replace(/\&#xf207/g, '{clue}')
        .replace(/\&#xf208/g, '{action}')
        .replace(/\&#xf209|/g, '{MAD20}') //base
        .replace(/\&#xf20A/g, '{MAD21}') //nightmares
        .replace(/\&#xf20B/g, '{MAD06}') //alchemy
        .replace(/\&#xf20C/g, '{MAD09}') //call of the wild
        .replace(/\&#xf20D/g, '{MAD23}') //Threshold
        .replace(/\&#xf20E}/g, '{MAD25}') //streets
        .replace(/\&#xf20F/g, '{MAD26}') //sanctum
        .replace(/\&#xf480/g, '{MAD27}') //journeys
        .replace(/\&#xf481/g, '{MAD28}') //serpent
        .replace(/<\/br>/gi, '\\n')
        .replace(/<br>/gi, '\\n')
        .replace(/<\/div>/gi, '')
        .replace(/<div>/gi, '')
        .replace(/"/g, '\'')
        .replace(/<font style='color: red'>/g, '<color=red>')
        .replace(/<font style='color: green'>/g, '<color=green>')
        .replace(/<font style='color: grey'>/g, '<color=grey>')
        .replace(/<\/font>/g, '</color>')
        .replace(/\&qout;/g, '\'');
}


function cleanUpImport(text) {
    return text
        .replace(/\{strength\}/g, '&#xf200')
        .replace(/\{agility\}/g, '&#xf201')
        .replace(/\{observation\}/g, '&#xf202')
        .replace(/\{lore\}/g, '&#xf203')
        .replace(/\{influence\}/g, '&#xf204')
        .replace(/\{will\}/g, '&#xf205')
        .replace(/\{eldersign\}/g, '&#xf206')
        .replace(/\{clue\}/g, '&#xf207')
        .replace(/\{action\}/g, '&#xf208')
        .replace(/\{MAD20\}/g, '&#xf209') //base
        .replace(/\{MAD21\}/g, '&#xf20A') //nightmares
        .replace(/\{MAD06\}/g, '&#xf20B') //alchemy
        .replace(/\{MAD09\}/g, '&#xf20C') //call of the wild
        .replace(/\{MAD23\}/g, '&#xf20D') //Threshold
        .replace(/\{MAD25\}/g, '&#xf20E') //streets
        .replace(/\{MAD26\}/g, '&#xf20F') //sanctum
        .replace(/\{MAD27\}/g, '&#xf480') //journeys
        .replace(/\{MAD28\}/g, '&#xf481') //serpent
        .replace(/\\n/gi, '<br>')
        .replace(/\\\\n/gi, '<br>')
        .replace(/^"|"$/g, '')
        .replace(/"/g, '\'')
        .replace(/<color=red>/g, '<font style="color: red">')
        .replace(/<color=green>/g, '<font style="color: green">')
        .replace(/<color=grey>/g, '<font style="color: grey">')
        .replace(/<\/color>/g, '<\/font>')
        .replace(/\|\|\|/g, '')
}