module.exports = {
  
  /* directories for your source mostly.
      input: directory for articles
      src, output: run the script and the directories will be self explnatory
  */ 
  "input": "src/content/", // never forget the slash at the end for now
  "src": "src/",
  "output": "dist/",
  
  // directory where all your posts are stored. / means it's stored together with index.html too
  "postDir": "/", 
  
  // i remember what this does, but not why it does it. i wont touch it for now, but any PR's are welcome
  "tags": ["created","description"],

  // your website's name, appears in the header + title
  "name": "i hate js",
};

/*
  feel free to put any logic into this file - it's just JS
*/


