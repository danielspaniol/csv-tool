////////////////////////////////////////////////////////////////////////////////
// INITIALIZATION
////////////////////////////////////////////////////////////////////////////////

window.onload = readCachedFiles

////////////////////////////////////////////////////////////////////////////////
// GLOBALS & CONSTANTS
////////////////////////////////////////////////////////////////////////////////

var OWNER_IDX = 11;
var ID_IDX = 1;
var T_IDX = 2;

let contents = [];

////////////////////////////////////////////////////////////////////////////////
// GUI
////////////////////////////////////////////////////////////////////////////////

let BUSY_INDICATOR_CLASS = "upload-indicator__background";
let BUSY_INDICATOR_INACTIVE_CLASS = "upload-indicator__background--inactive";

let TOTAL_COUNT_CLASS = "upload-indicator__total-count";
let DONE_COUNT_CLASS = "upload-indicator__done-count";

let FILE_RESULT_CLASS = "file-result";
let FILE_RESULT_HIDE_CLASS = "file-result--hidden";

let RETRACT_TEXT = "^";
let EXPAND_TEXT = "v";

function showBusyIndicator(totalFiles) {
    updateTotalCount(totalFiles);
    updateDoneCount(0);

    let indEls = document.getElementsByClassName(BUSY_INDICATOR_CLASS);
    for (let indEl of indEls) {
        indEl.classList.remove(BUSY_INDICATOR_INACTIVE_CLASS);
    }
}

function hideBusyIndicator() {
    let indEls = document.getElementsByClassName(BUSY_INDICATOR_CLASS);
    for (let indEl of indEls) {
        indEl.classList.add(BUSY_INDICATOR_INACTIVE_CLASS);
    }
}

function updateTotalCount(totalFiles) {
    let totalEls = document.getElementsByClassName(TOTAL_COUNT_CLASS);
    for (let totalEl of totalEls) {
        totalEl.innerHTML = "" + totalFiles;
    }
}

function updateDoneCount(doneFiles) {
    let doneEls = document.getElementsByClassName(DONE_COUNT_CLASS);
    for (let doneEl of doneEls) {
        doneEl.innerHTML = "" + doneFiles;
    }
}

////////////////////////////////////////////////////////////////////////////////
// IO
////////////////////////////////////////////////////////////////////////////////

function readCachedFiles() {
    let el = document.getElementById("upload");
    if (el.files && el.files.length > 0) { readFiles(); }
}

function readFiles() {
    let el = document.getElementById("upload");

    let doneFiles = 0;
    let totalFiles = el.files.length;

    contents = [];
    clearResult();

    showBusyIndicator(totalFiles);

    for (var f of el.files) {
        readFile(f, function(name, content) {
            contents.push({ name, content });
            ++doneFiles;

            updateDoneCount(doneFiles);

            if (doneFiles == totalFiles) {
                contents.sort(function(a, b) { return a.name.localeCompare(b.name) });
                setTimeout(hideBusyIndicator, 500);
            }
        });
    }
}

function readFile(file, callback) {
    let reader = new FileReader();
    reader.fileName = file.name;
    reader.onload = function(e) {
        let csv = e.target.result;
        let content = deserialize(csv);
        callback(e.target.fileName, content);
    }
    reader.readAsText(file);
}

function deserialize(csv) {
    csv = csv || "";

    let rows = csv.split("\n").filter(function(row) { return row && row.length > 0; });
    let cols = rows.map(function(row) { return row.split(";") });

    return cols;
}

function clearResult() {
    let resultEl = document.getElementById("results");
    resultEl.innerHTML = "";
}

function addOwnersResult(fileName, owners, numTs, numTsPerOwner) {
    let resultEl = document.getElementById("results");
    let [fileEl, fileListEl] = createFileEntry(fileName + " (" + numTs + " t)");

    for (let o of owners) {
        fileListEl.appendChild(createOwnerEntry(o, numTsPerOwner[o] || "0"));
    }

    resultEl.appendChild(fileEl);
}

function addEstatesResult(fileName, estates) {
    let resultEl = document.getElementById("results");
    let [fileEl, fileListEl] = createFileEntry(fileName + " (" + estates.length + " Flurstücke)");

    for (let e of estates) {
        fileListEl.appendChild(createEstateEntry(e));
    }

    resultEl.appendChild(fileEl);
}

function createFileEntry(fileName) {
    let nameDOM = document.createElement("li");
    let listDOM = document.createElement("ul");
    let buttonDOM = document.createElement('button');

    buttonDOM.innerHTML = RETRACT_TEXT;
    buttonDOM.onclick = function() {
        if (buttonDOM.innerHTML === EXPAND_TEXT) {
            buttonDOM.innerHTML = RETRACT_TEXT;
            nameDOM.classList.remove(FILE_RESULT_HIDE_CLASS);
        } else {
            buttonDOM.innerHTML = EXPAND_TEXT;
            nameDOM.classList.add(FILE_RESULT_HIDE_CLASS);
        }
    };

    nameDOM.appendChild(document.createTextNode(fileName));
    nameDOM.appendChild(buttonDOM)
    nameDOM.appendChild(listDOM);

    nameDOM.classList.add(FILE_RESULT_CLASS);

    return [nameDOM, listDOM];
}

function createOwnerEntry(owner, numTs) {
    var nameDOM = document.createElement("li");
    nameDOM.appendChild(document.createTextNode(owner + " (" + numTs + " t)"));
    return nameDOM;
}

function createEstateEntry(estate) {
    var nameDOM = document.createElement("li");
    nameDOM.appendChild(document.createTextNode(estate));
    return nameDOM;
}

////////////////////////////////////////////////////////////////////////////////
// LOGIC
////////////////////////////////////////////////////////////////////////////////

function traverseContent(fn) {
    clearResult();

    let doneFiles = 0;
    let totalFiles = contents.length;

    showBusyIndicator(totalFiles);

    for (let file of contents) {
        fn(file)
            ++doneFiles;
        updateDoneCount(doneFiles);
        if (doneFiles == totalFiles) {
            setTimeout(hideBusyIndicator, 500);
        }
    }
}

function listOwners() {
    traverseContent(function(file) {
        let owners = new Set();

        let numTs = 0;
        let numTsPerOwner = {};

        for (let row of file.content) {
            let owner = row[OWNER_IDX];
            let id = row[ID_IDX];

            owners.add(owner);

            if (id && id.charAt(T_IDX) == 't') {
                numTsPerOwner[owner] = (numTsPerOwner[owner] || 0) + 1;
                ++numTs;
            }
        }

        addOwnersResult(file.name, owners, numTs, numTsPerOwner)
    });
}

function listEstates() {
    traverseContent(function(file) {
        let estates = new Set();

        for (let row of file.content) {
            let id = row[ID_IDX];
            let [id1, id2, _] = id.split('-');

            id1 = id1.replace('t', '');

            estates.add(id1 + '-' + id2);
        }

        var sorted = Array.from(estates);
        sorted.sort();
        addEstatesResult(file.name, sorted);
    });
}