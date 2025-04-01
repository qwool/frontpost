export default {
  
  /* directories for your source mostly.
      input: directory for articles
      src, output: run the script and the directories will be self explnatory
  */ 
  "input": "./src/content/", // never forget the slash at the end for now
  "src": "./src/",
  "output": "./blog/",

  // characters used when parsing templates!! useful for when you have alpine.js or jsx fighting for parsing
  // common options are (pasteable): "[[", "]]"; "<?=", "=>";
  "templatingChars": ["{", "}"],
  
  // directory where all your posts are stored. / means it's stored together with index.html too
  "postDir": "/", 
  
  // i remember what this does, but not why it does it. i wont touch it for now, but any PR's are welcome
  "tags": ["created","description"],

  /* format in unix format, basically if you're on any unix do ```man date``` and it'll give u everything
     suggessted common values:
     - "%b %d, %Y %H:%M" (Oct 11, 2023 11:08)
     - "%F, %H:%M" (2023-10-11, 11:08)
     - "%c" (Wed 11 Oct 2023 11:07:50 AM EEST)
     - "%D %r" (10/11/23 11:07:24 AM)
  */
  "timeFormat": "%b %d, %Y %H:%M",

  // your website's name, appears in the header + title
  "name": "i hate js",
};

/*
  feel free to put any logic into this file - it's just JS
*/


