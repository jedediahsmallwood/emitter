var util = require("util"),
    emitter = require("../emitter"),
    options = require("./jarvis-config"),
    accountLookup = require("./accounts-config"),
    engineLookup = require("./engines-config");

// Connect to websocket.
util.log("starting websocket client");
var client = emitter().open(options["http-host"], options["http-port"]);
var recordCount = 0;
var unknownClients = new Array();

// Emit production data
//web_server      is_successful   clientip        clientid        url               4
// api_duration    db_connect_duration     db_query_num    db_query_duration        8
// db_current_engine    mem_get_numhits mem_get_nummisses       mem_get_duration    12
// mem_set_num  mem_set_duration        mog_get_num     mog_get_duration            16
// mog_set_num  mog_set_duration        mog_del_num     mog_del_duration            20
// lockwait_duration    apigentime

readline(function(line, i) {
    if (i) {
        var fields = line.split("\t");
        if (fields[0] != "web_server") {
            var date = fields[22].split(" ");
            var dt = date[0] + "T" + date[1] + "-05:00";
            var clientid = fields[3];
            var accountinfo = accountLookup[clientid];
            var engineinfo;

            if (accountinfo == undefined) {
                accountinfo = [-1,-1];
                engineinfo = ["unknown", "unknown"];
                if (unknownClients.indexOf(clientid) == -1) {
                    util.log("clientid not found: " + clientid);
                    unknownClients.push(clientid);
                }
            } else {
                engineinfo = engineLookup[accountinfo[0]]
            }

            client.send({
                type: "jarvis",
                time: new Date(dt),
                data: {
                    pagegen_time: +fields[5],
                    clientid: +clientid,
                    clientip: +fields[2],
                    account_type: +accountinfo[1],
                    webserver: fields[0],
                    url: fields[4],
                    fingerprint: generateFingerprint(fields[4]),
                    lockwait_duration: fields[21],
                    engine : {
                        id: accountinfo[0],
                        name: engineinfo[0],
                        host: engineinfo[1]
                    },
                    db: {
                        connect_time: +fields[6],
                        num_queries: +fields[7],
                        query_time: +fields[8]
                    },
                    cache: {
                        get: +fields[10],
                        get_misses: +fields[11],
                        get_time: +fields[12],
                        set: +fields[13],
                        set_time: +fields[14]
                    },
                    mogile: {
                        get: +fields[15],
                        get_time: +fields[16],
                        store: +fields[17],
                        store_time: +fields[18],
                        delete: +fields[19],
                        delete_time: +fields[20]
                    }
                }
            });
            recordCount++;
        }
    }
});

function readline(callback) {
    var stdin = process.openStdin(), line = "", i = -1;
    stdin.setEncoding("utf8");
    stdin.on("data", function(string) {
        var lines = string.split("\n");
        lines[0] = line + lines[0];
        line = lines.pop();
        lines.forEach(function(line) {
            callback(line, ++i);
        });
    });
    stdin.on("end", function() {
        util.log("stopping websocket client");
        util.log("sent " + recordCount + " records");
        client.close();
    });
}

function generateFingerprint(url) {
    url = url.replace(/\/\d+\//g, '/DIGITS/'); //Get rid of digits in path urls.
    url = url.replace(/\/\~\w+\//i, '/'); //Get rid of sudo user names.
    return url;
}
