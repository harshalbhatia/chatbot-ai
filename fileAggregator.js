var fs = require('fs');
var stringSimilarity = function (str1, str2, substringLength, caseSensitive) {
    if (substringLength === void 0) { substringLength = 2; }
    if (caseSensitive === void 0) { caseSensitive = false; }
    if (!caseSensitive) {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();
    }
    if (str1.length < substringLength || str2.length < substringLength)
        return 0;
    var map = new Map();
    for (var i = 0; i < str1.length - (substringLength - 1); i++) {
        var substr1 = str1.substr(i, substringLength);
        map.set(substr1, map.has(substr1) ? map.get(substr1) + 1 : 1);
    }
    var match = 0;
    for (var j = 0; j < str2.length - (substringLength - 1); j++) {
        var substr2 = str2.substr(j, substringLength);
        var count = map.has(substr2) ? map.get(substr2) : 0;
        if (count > 0) {
            map.set(substr2, count - 1);
            match++;
        }
    }
    return (match * 2) / (str1.length + str2.length - ((substringLength - 1) * 2));
};
var filePath = 'transcript.txt';

// Read the file
fs.readFile(filePath, 'utf8', function(err, data) {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  var lines = data.split('\n');
  var aggregatedContent = [];

  // Aggregate the content
  for (var i = 0; i < lines.length; i++) {
    var trimmedLine = lines[i].trim();
    if (trimmedLine) {
      // Check similarity with existing lines
      var isSimilar = aggregatedContent.some(function(existingLine) {
        var similarity = stringSimilarity(trimmedLine, existingLine);
        return similarity > 0.9; // Adjust similarity threshold as needed
      });

      // Add line if not similar to existing lines
      if (!isSimilar) {
        aggregatedContent.push(trimmedLine);
      }
    }
  }

  // Print the aggregated content
  console.log('Aggregated content of the file:',aggregatedContent.length);
  aggregatedContent.forEach(function(line) {
    console.log(line);
  });
});
