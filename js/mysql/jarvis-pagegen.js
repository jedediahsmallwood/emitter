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
//web_server      is_successful   clientip        clientid        userid            4
//url     sessionid       page_duration   db_connect_duration     db_query_num      9
//db_query_duration       db_current_engine mem_get_numhits mem_get_nummisses       13
//mem_get_duration  mem_set_num     mem_set_duration        mog_get_num             17
//mog_get_duration  mog_set_num     mog_set_duration        mog_del_num             21
//mog_del_duration  lockwait_duration       pagegentime                             24

readline(function(line, i) {
    if (i) {
        var fields = line.split("\t");
        if (fields[0] != "web_server") {
            var date = fields[24].split(" ");
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
                    pagegen_time: +fields[7],
                    clientid: +clientid,
                    userid: +fields[4],
                    clientip: +fields[2],
                    account_type: +accountinfo[1],
                    webserver: fields[0],
                    url: fields[5],
                    fingerprint: generateFingerprint(fields[5]),
                    session: fields[6],
                    lockwait_duration: fields[23],
                    engine : {
                        id: accountinfo[0],
                        name: engineinfo[0],
                        host: engineinfo[1]
                    },
                    db: {
                        connect_time: +fields[8],
                        num_queries: +fields[9],
                        query_time: +fields[10]
                    },
                    cache: {
                        get: +fields[12],
                        get_misses: +fields[13],
                        get_time: +fields[14],
                        set: +fields[15],
                        set_time: +fields[16]
                    },
                    mogile: {
                        get: +fields[17],
                        get_time: +fields[18],
                        store: +fields[19],
                        store_time: +fields[20],
                        delete: +fields[21],
                        delete_time: +fields[22]
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
