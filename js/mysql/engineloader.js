var util = require("util");

var recordCount = 0;
var types = new Array();

readline(function(line, i) {
  if (i) {
    var fields = line.split("\t");
    if( fields[0] != "engine" ) {

      console.log(fields[0] + ": [\"" + fields[1] + "\",\"" + fields[2] + "\"],");
      recordCount++;
    }
  }
});

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
