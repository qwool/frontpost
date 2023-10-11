/*
  style definition:
   - anything with ## before means you should prolly read it because
      something else wouldn't make sense
   - also i like to comment something i wanna reuse later, so,
      just in case, actual comments are prefixed with #
   - multiline comments above functions
   - also attempt to not use more than 3-4 indents
*/
const marked = require('marked');
const strftime = require('strftime');
const fs = require('fs');
const path = require('path');
// # im sorry for including YAML as a dependency, but it also cut 100+ lines
// # of sub-par code so that's nice :)
const yaml = require('js-yaml');
let config = require('./config.js');
marked.use({
  gfm: true,
});

[config.src, config.output, config.input].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

let templates = {
  "index": fs.readFileSync(config.src + "/templates/index.html", 'utf8'),
  "post": fs.readFileSync(config.src + "/templates/post.html", 'utf8'),
  "listing": fs.readFileSync(config.src + "/templates/articleListing.html", 'utf8'),
}
/* chat gibbidy gave me this when i asked it for pseudocode so i can get rid of my 8 indents!!

1. Initialize an empty array `fileResults`.
2. Read the contents of a directory asynchronously.
3. For each file in the directory:
   1. Check if the file has a ".md" extension.
   2. If it's an ".md" file, read the content from the file asynchronously.
   3. Apply an asynchronous function to process the content of the file and get a result.
   4. Store the result in an object with the filename.
   5. Add the object to the `fileResults` array.
4. Sort the `fileResults` array based on the result of the processing function.
5. Initialize an empty array `sortedFilenames`.
6. For each object in `fileResults`:
   1. Extract the filename from the object.
   2. Add the filename to the `sortedFilenames` array.
7. Write the sorted filenames to another document asynchronously.

*/

let pages = [];
let files = [];

fs.readdir(config.input, (err, files) => {
  if (err) console.error(err);
  files = files.filter(file => path.extname(file) === ".md")
  files.forEach((file) => {
    const parsed = path.parse(file)
    const filePath = path.join(config.input, file);
    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) console.error(err);
      const gc = getContent(contents)
      let target = path.join(config.output, parsed.name  +".html");
      // # getContent(contents).content? whatever
      fs.writeFile(target, generateContent(gc.content), (err) => {
        if (err) console.error(err); else {
          const created = gc.frontmatter.created ? gc.frontmatter.created : fs.statSync(filePath).mtime;
          pages.push({ "path": filePath, "created": new Date(created), "target": target, "filename": parsed.name+".html"}) ;
          completedTasks++;
          console.log(completedTasks + "/" + files.length + ": " + filePath);
          if (completedTasks >= files.length) {
            pages.sort((a, b) => b.created - a.created);
            generateIndex();
          };
        };
      });
    });
  });
});


// # god knows why template is loaded before anyting else, i think its fine tho bc youre gonna need it anyways
function generateContent(data) {
  x = tokenParser(templates.post, {
    "{content}": marked.parse(data),
    "{title}": generateSummary(data),
    "{header}": config.name,
  })
  return x
}

function generateSummary(dom) {
  let heading = marked.parse(dom).match(/<h(\d)>(.*?)<\/h\1>/i);
  return heading[0].replace(/<\/?[^>]+(>|$)/g, "");
}

/**
 * returns:
 *   frontmatter: yaml -> json, separated by --- \n {yaml} \n ---.
 *   content: everything after
*/
function getContent(fileContent) {
  try {

    const [_, frontmatter, content] = fileContent.split('---'); // Assuming '---' is the frontmatter delimiter

    const frontmatterData = yaml.load(frontmatter);

    return { "frontmatter": frontmatterData, "content": content };
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}

let completedTasks = 0;

function tokenParser(html, tokens) {
  let file = html
  // const overrides = { ...tagReplacements, ...tokens};
  for (const [tag, replacement] of Object.entries(tokens)) {
    const regexp = new RegExp(tag, "g")
    file = file.replace(regexp, replacement)
  }
  return file
}

function generateIndex() {
  // console.log(pages)
  let indexFilePath = path.join(config.output, "index.html");
  let articles = [];
  fs.writeFileSync(indexFilePath, '', 'utf8');
  pages.forEach(entry => {
    const content = fs.readFileSync(entry.path, 'utf8');
    const meta = getContent(content).frontmatter
    let time
    if (!meta.created) {
      time = strftime('%b %d, %Y %H:%M', new Date(entry.accessTime))
    } else {
      time = strftime('%b %d, %Y %H:%M', new Date(meta.created))
    }

    // let template = fs.readFileSync(config.src + "/templates/articleListing.html", 'utf8');
    articles += tokenParser(templates.listing, {
      "{title}": meta.title,
      "{created}": time,
      "{description}": meta.description,
      "{url}": entry.filename,
    })

  })
  // staticIncludes(templates.index)
  fs.writeFileSync(indexFilePath, tokenParser(templates.index, {
    "{articles}": articles,
    "{header}": config.name,
    // "{footer}": "made w/ \<3 by gay furry studios"
  })
  )

  finalize();
}

function finalize() {
  const files = fs.readdirSync(path.join(config.src, "static"));
  files.forEach((file) => {
    const sourceFile = path.join(path.join(config.src, "static"), file);
    const destinationFile = path.join(config.output, file);

    // Copy the file
    fs.copyFileSync(sourceFile, destinationFile);
    console.log(`${sourceFile} => ${destinationFile}`);
  });

}


