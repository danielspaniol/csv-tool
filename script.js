var OWNER_IDX = 11;
var ID_IDX = 1;
var T_IDX = 2;

function handleFiles() {
    var el = document.getElementById("upload");
    var resultList = document.getElementById("results");
    for (var f of el.files) {

        var reader = new FileReader();
        reader.fileName = f.name;
        reader.onload = function (e) {
            var num_ts = 0;
            var num_ts_per_owner = {};
            var owners = new Set();
            var content = e.target.result;

            var rows = content.split("\n");
            for (var r of rows) {
                var cols = r.split(";");

                if (cols.length > OWNER_IDX) {
                    var owner = cols[OWNER_IDX];
                    var id = cols[ID_IDX];

                    owners.add(owner)

                    if (id && id.charAt(T_IDX) == 't') {
                        num_ts_per_owner[owner] = (num_ts_per_owner[owner] || 0) + 1;
                        ++num_ts;
                    }
                }
            };

            var docText = e.target.fileName + " (" + num_ts + " t)";
            var nameDOM = document.createElement("li");
            nameDOM.appendChild(document.createTextNode(docText));
            resultList.appendChild(nameDOM);


            var ownersDOM = document.createElement("ul");
            for (var o of owners) {
                var ownerText = o + " (" + (num_ts_per_owner[o] || 0) + " t)";

                var ownerDOM = document.createElement("li");
                ownerDOM.appendChild(document.createTextNode(ownerText));
                ownersDOM.appendChild(ownerDOM);
            }
            nameDOM.appendChild(ownersDOM);
        };

        reader.readAsText(f);
    }
}
