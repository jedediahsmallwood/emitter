var util = require("util");

var recordCount = 0;
var types = new Array();

readline(function(line, i) {
  if (i) {
    var fields = line.split(";");
    if( fields[0] != "client_id" ) {
      if( types.indexOf(fields[2]) == -1 ) {
        types.push(fields[2]);
      }
      console.log(fields[0] + ": [" + fields[1] + "," + lookup(fields[2]) + "],");
      recordCount++;
    }
  }
});

function lookup(type) {
  code = -1;
  type = type.trim();
 
  if( type == 'Small Business') {
      code = 0;
  } else if ( type == 'Large Sender' ) {
      code = 1;
  } else if ( type == 'Enterprise' ) {
      code = 2;
  } else if ( type == 'Agency' ) {
      code = 4;
  } else if ( type == 'Concierge' ) {
      code = 8;
  } else if ( type == 'Partner' ) {
      code = 16;
  } else if ( type == 'iContact For Salesforce' ) {
      code = 32;
  } else if ( type == 'Free' ) {
      code = 64;
  }
  return code;
};

function readline(callback) {
  console.log("// Default configuration for development.");
  console.log("module.exports = {");
  var stdin = process.openStdin(), line = "", i = -1;
  stdin.setEncoding("utf8");
  stdin.on("data", function(string) {
    var lines = string.split("\n");
    lines[0] = line + lines[0];
    line = lines.pop();
    lines.forEach(function(line) { callback(line, ++i); });
  });
  stdin.on("end", function() {
    console.log('};');
  });
}
