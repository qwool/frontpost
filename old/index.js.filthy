const marked = require('marked');
const strftime = require('strftime');
const fs = require('fs');
const path = require('path');
// const { isNull } = require('util');
// const args = process.argv;
let config = require('./config.js')
console.log(config)

let pages = [];
let template = fs.readFileSync(config.input + "template.html", 'utf8');
function generateContent(data) {
  let contentready = template.replace("{content}", marked.parse(data));
  return contentready.replace('{title}', parseHeading(data))
}

let completedTasks = 0;
function parseHeading(dom) {
  let heading = marked.parse(dom).match(/<h(\d)>(.*?)<\/h\1>/i);
  return heading[0].replace(/<\/?[^>]+(>|$)/g, "");
}

function getTime() {
}

function parseFrontMatter(md, tag) {
  const regexp = new RegExp(`\\[${tag}:\\s*(.*?)\\s*\\]`);
  const match = md.match(regexp);
  if (match) { return match[1] } else return "";
  // idk why ```match ? return match[1] : return ""```
  // doesnt work but wouldve been cool to see :(
}

function generateIndex() {
  // console.log(pages)
  let indexFilePath = path.join(config.output, "index.html")
  fs.writeFileSync(indexFilePath, '<html><body>\n', 'utf8');
  pages.forEach(entry => {
    const content = fs.readFileSync(entry[0], 'utf8');
    const meta = {};
    config.tags.forEach(tag => {
      meta[tag]=parseFrontMatter(content, tag);
    });
  entry[2] = parseHeading(content)
  let time = parseFrontMatter(content, "created")
  if (time == null) {
    time = strftime('%b %d, %Y %H:%M', new Date(entry[1]))
  }
  //i have no brainpower rn to make this readable unfortunatel y
  let html = marked.parse(
    "## [" + entry[2] + "](" + path.basename(entry[3]) + ")\
    \n" + time + "<br>" + "<p>" + meta.description
  )
  // console.log(parseFrontMatter(entry,"created"))
  // console.log(html)
  console.log(entry)
  fs.appendFileSync(indexFilePath, template.replace("{content}", html).replace('{title}', "index!"))
})
}

fs.readdir(config.input, (err, files) => {
  if (err) console.error(err);
  const totalTasks = files.filter(file => path.extname(file) === ".md").length;

  files.forEach((file) => {
    const filePath = path.join(config.input, file);
    fs.stat(filePath, (statError, stats) => {
      if (statError) console.error(statError);

      if (stats.isFile() && file.split('.').pop() === "md") {
        // all checks are done
        fs.readFile(filePath, 'utf8', (err, contents) => {
          if (err) console.error(err);
          let target = path.join(config.output, file.slice(0, -3) + ".html");
          fs.writeFile(target, generateContent(contents), (err) => {
            if (err) console.error(err);
            else {
              pages.push([filePath, stats.mtimeMs, "", target]);
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

