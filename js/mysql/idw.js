var util = require("util"),
    emitter = require("../emitter"),
    options = require("./idw-config"),
    lookup = require("./accounts-config");

// Connect to websocket.
util.log("starting websocket client");
var client = emitter().open(options["http-host"], options["http-port"]);
var recordCount = 0;
var unknownClients = new Array();

// Emit production data
//random  host    time    clientid        userid
// successful      message clientip        sessionid
// type    t       fingerprint     params  path1   path2   path3
// mogile_cmd_store        mogile_cmd_store_time   mogile_cmd_delete
// mogile_cmd_delete_time  mogile_cmd_retrieve     mogile_cmd_retrieve_time
// db_connect_time db_query_time   db_num_queries  cache_cmd_get_time
// cache_cmd_set   cache_cmd_set_time      cache_get_hits_global   cache_get_misses
// sess_lock_wait

readline(function(line, i) {
    if (i) {
        var fields = line.split("\t");
        if (fields[0] != "random") {
            var date = fields[2].split(" ");
            var dt = date[0] + "T" + date[1] + "-05:00";
            var clientid = fields[3];
            var accountinfo = lookup[clientid];

            if (accountinfo == undefined) {
                accountinfo = [-1,-1];
                if (unknownClients.indexOf(clientid) == -1) {
                    util.log("clientid not found: " + clientid);
                    unknownClients.push(clientid);
                }
            }

            client.send({
                type: "production",
                time: new Date(dt),
                data: {
                    t: +fields[10],
                    clientid: +clientid,
                    userid: fields[4],
                    clientip: fields[7],
                    account_type: +accountinfo[1],
                    engine: +accountinfo[0],
                    host: fields[1],
                    fingerprint: fields[11],
                    db: {
                        connect_time: +fields[22],
                        query_time: +fields[23],
                        num_queries: +fields[24]
                    },
                    mogile: {
                        store: +fields[16],
                        store_time: +fields[17],
                        delete: +fields[18],
                        delete_time: +fields[19],
                        retrieve: +fields[20],
                        retireve_time: +fields[21]
                    },
                    cache: {
                        get_time: +fields[25],
                        set: +fields[26],
                        set_time: +fields[27],
                        get_hits_global: +fields[28],
                        get_misses: +fields[29]
                    }

                }
            });
            recordCount++;
        }

//        if( 0 == recordCount % 100000 ) {
//            client.close();
//
//            client = emitter().open(options["http-host"], options["http-port"]);
//        }
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
