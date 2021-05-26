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

    showBusyIndicator(totalFiles);

    for (var f of el.files) {
        readFile(f, function (name, content) {
            contents.push({ name, content });
            ++doneFiles;

            updateDoneCount(doneFiles);

            if (doneFiles == totalFiles) {
                contents.sort(function (a, b) { return a.name.localeCompare(b.name) });
                setTimeout(hideBusyIndicator, 500);
            }
        });
    }
}

function readFile(file, callback) {
    let reader = new FileReader();
    reader.fileName = file.name;
    reader.onload = function (e) {
        let csv = e.target.result;
        let content = deserialize(csv);
        callback(e.target.fileName, content);
    }
    reader.readAsText(file);
}

function deserialize(csv) {
    csv = csv || "";

    let rows = csv.split("\n").filter(function (row) { return row && row.length > 0; });
    let cols = rows.map(function (row) { return row.split(";") });

    return cols;
}

function addOwnersResult(fileName, owners, numTs, numTsPerOwner) {
    let resultEl = document.getElementById("results");
    let [fileEl, fileListEl] = createFileEntry(fileName + " (" + numTs + " t)");

    for (let o of owners) {
        fileListEl.appendChild(createOwnerEntry(o, numTsPerOwner[o] || "0"));
    }

    resultEl.appendChild(fileEl);
}

function createFileEntry(fileName) {
    let nameDOM = document.createElement("li");
    nameDOM.appendChild(document.createTextNode(fileName));
    let listDOM = document.createElement("ul");
    nameDOM.appendChild(listDOM);

    return [nameDOM, listDOM];
}

function createOwnerEntry(owner, numTs) {
    var nameDOM = document.createElement("li");
    nameDOM.appendChild(document.createTextNode(owner + " (" + numTs + " t)"));
    return nameDOM;
}

////////////////////////////////////////////////////////////////////////////////
// LOGIC
////////////////////////////////////////////////////////////////////////////////

function listOwners() {
    let doneFiles = 0;
    let totalFiles = contents.length;

    showBusyIndicator(totalFiles);

    for (let file of contents) {
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

        ++doneFiles;
        updateDoneCount(doneFiles);
        if (doneFiles == totalFiles) {
            setTimeout(hideBusyIndicator, 500);
        }
    }

}

function listEstates() {

}

