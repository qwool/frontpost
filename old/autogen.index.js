/*
  style definition:
   - anything with ## before means you should prolly read it because
      something else wouldn't make sense
   - also i like to comment something i wanna reuse later, so,
      just in case, actual comments are prefixed with #
   - multiline comments above functions
*/
const marked = require('marked');
const strftime = require('strftime');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
let config = require('./config.js');

[config.src, config.output, config.input].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

let pages = [];
let templates = {
  "index": fs.readFileSync(config.src + "/templates/template.html", 'utf8'),
  "post": fs.readFileSync(config.src + "/templates/post.html", 'utf8'),
  "listing": fs.readFileSync(config.src + "/templates/articleListing.html", 'utf8'),
}
// # god knows why template is loaded before anyting else, i think its fine tho bc youre gonna need it anyways
function generateContent(data) {
  x = tokenParser(templates.post, {
    "{content}": marked.parse(data),
    "{title}": generateSummary(data),
    })
  return x
}

/**
 * yaml -> json, separated by --- \n {yaml} \n ---.
 * @param {string} filePath - The path to the file containing frontmatter.
 * @returns {object|null} - The frontmatter data as a JavaScript object or null if frontmatter is not found.
 */
function extractFrontmatterToJson(fileContent) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');

    const [_, frontmatter] = fileContent.split('---'); // Assuming '---' is the frontmatter delimiter
    console.log(frontmatter)

    const frontmatterData = yaml.load(frontmatter);

    return frontmatterData;
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}

let completedTasks = 0;
function generateSummary(dom) {
  let heading = marked.parse(dom).match(/<h(\d)>(.*?)<\/h\1>/i);
  return heading[0].replace(/<\/?[^>]+(>|$)/g, "");
}

function staticIncludes(html) {
  const regex = /\[include ([^\]]+)\]/g;
  let match;
  const values = [];

  while ((match = regex.exec(html)) !== null) {
    values.push(match[1]);
  }
  
  console.log(values);

}

function tokenParser(html, tokens) {
  let file = html
  // const overrides = { ...tagReplacements, ...tokens};
  for (const [tag, replacement] of Object.entries(tokens)) {
    const regexp = new RegExp(tag, "g")
    file = file.replace(regexp, replacement)
  }
  return file
}

function parseFrontMatter(md, tag) {
  const regexp = new RegExp(`\\[${tag}:\\s*(.*?)\\s*\\]`);
  // # you may notice that sometimes new RegExp is used and sometimes
  // # it's string /pattern/. thats because javascript sucks and i cant be bothered
  const match = md.match(regexp);
  if (match) { return match[1] } else return "";
  // # idk why ```match ? return match[1] : return ""```
  // # doesnt work but wouldve been cool to see :(
}

function generateIndex() {
  // console.log(pages)
  let indexFilePath = path.join(config.output, "index.html");
  let articles = [];
  fs.writeFileSync(indexFilePath, '', 'utf8');
  pages.forEach(entry => {
    const content = fs.readFileSync(entry.path, 'utf8');
    const meta = {};
    config.tags.forEach(tag => {
      meta[tag] = parseFrontMatter(content, tag);
    });
    entry.title = generateSummary(content)
    let time
    if (meta.created == "") {
      time = strftime('%b %d, %Y %H:%M', new Date(entry.created))
    } else {
      time = strftime('%b %d, %Y %H:%M', new Date(meta.created))
    }

    // let template = fs.readFileSync(config.src + "/templates/articleListing.html", 'utf8');
    articles += tokenParser(templates.listing, {
      "{title}": entry.title,
      "{date}": time,
      "{description}": meta.description,
      "{url}": entry.filename,
    })

  })
  staticIncludes(templates.index)
  fs.writeFileSync(indexFilePath, tokenParser(templates.index, {
    "{content}": articles,
    "{header}": config.name,
    "{title}": config.name,
    "{footer}": "idkas"
  })
  )

  finalize();
}

function finalize() {
  
}

fs.readdir(config.input, (err, files) => {
  if (err) console.error(err);
  const totalTasks = files.filter(file => path.extname(file) === ".md").length;

  files.forEach((file) => {
    const parsed = path.parse(file)
    const filePath = path.join(config.input, file);
    fs.stat(filePath, (statError, stats) => {
      if (statError) new Error(statError);
      // # checks done: not a directory and is .md
      if (stats.isFile() && parsed.ext === ".md") {
        fs.readFile(filePath, 'utf8', (err, contents) => {
          if (err) new Error(err);
          let target = path.join(config.output, parsed.name+".html");
          fs.writeFile(target, generateContent(contents), (err) => {
            if (err) new Error(err);
            else {
              pages.push({ "path": filePath, "created": stats.mtimeMs, "target": target, "filename": parsed.name+".html"});
              completedTasks++;
              console.log(completedTasks + "/" + totalTasks + ": " + filePath);
              if (completedTasks >= totalTasks) {
                generateIndex();
              };
            };
          });
        });
      };
    });
  });
});

