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

// i know a lot of times i should use path.normalize instead of
// hardcoding the "right" values, but that's one less call
let templates = {
  "index": fs.readFileSync(config.src + "templates/index.html", 'utf8'),
  "post": fs.readFileSync(config.src + "templates/post.html", 'utf8'),
  "listing": fs.readFileSync(config.src + "templates/articleListing.html", 'utf8'),
}

let pages = [];

/*
 what the fuck. this looks like chthulu is represented in media.
 the disintegrating tentacles of the naive fs.readdir who didn't
 know it would be subjected to the fate of 6 indents.
 it is a gimp - the everinclining monster, who may only lean to its
 right side. you may ask me, for what reason can i not fix this?
 well, my friend, it seems like the only solution would be breaking
 it down into functions. you gotta ask yourself questions:
  - are there any performance improvements by doing this?
  - will it make the code more readable?
 answer to which is absolutely no.
 the only thing that can be done is switching to async-await - it might
 improve the exec time by logarithmic complexity
*/
fs.readdir(config.input, (err, files) => {
  if (err) console.error(err);
  files = files.filter(file => path.extname(file) === ".md")
  files.forEach((file) => {
    const parsed = path.parse(file)
    const filePath = path.join(config.input, file);
    fs.readFile(filePath, 'utf8', (err, contents) => {
      if (err) console.error(err);
      const gc = getContent(contents)
      let target = path.join(config.output, parsed.name +".html");
      fs.writeFile(target, generateContent(gc), (err) => {
        if (err) console.error(err); else {
          let created = gc.frontmatter.created ? gc.frontmatter.created : fs.statSync(filePath).mtime;
          pages.push({
            // # so gc.content is page.content.content? 
            "content": gc,
            "path": filePath,
            "created": new Date(created),
            "target": target,
            // # i dont know if theres another way
            "filename": parsed.name +".html"
          });
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
  let title = data.frontmatter.title || generateHeading(data.content)
  // # x = dict; return x? i still dont know why return dict doesnt work
  x = tokenParser(templates.post, {
    "content": marked.parse(data.content),
    "title": title,
    "header": config.name,
    "created": strftime(config.timeFormat, new Date(data.frontmatter.created)),
    "fm": data.frontmatter
  })
  return x
}

function generateHeading(dom) {
  try {
    let heading = marked.parse(dom).match(/<h(\d)>(.*?)<\/h\1>/i);
    return heading[0].replace(/<\/?[^>]+(>|$)/g, "");
  } catch {
    return undefined
  }
}

/**
 * returns:
 *   frontmatter: yaml -> json, separated by --- \n {yaml} \n ---.
 *   content: everything after
*/
function getContent(fileContent) {
  if(!fileContent.match(/^---([\s\S]*?)---/)) return {"frontmatter": "", "content": fileContent}
  try {

    const [_, frontmatter, content] = fileContent.split('---'); // # assuming '---' is the delimiter

    let frontmatterData = yaml.load(frontmatter);
    if (!frontmatterData) frontmatterData = ""
    return { "frontmatter": frontmatterData, "content": content };
  } catch (err) {
    console.error('Error reading file:', err);
    return { "frontmatter": "", "content": "" };;
  }
}

let completedTasks = 0;

function tokenParser(html, tokens) {
  let file = html;
  // const tagPattern = /fm\s(.*)}/g; 
  
  const templch = config.templatingChars;
  for (const [tag, replacement] of Object.entries(tokens)) {
    const regexp = new RegExp(templch[0]+tag+templch[1], "gm");
    file = file.replace(regexp, replacement);
  }

  /*
    arguably the most braindead function here
    the best thing is that it didn't impact performance at all -
    a perk of picking a language that's slow as it is
    if im getting a job anywhere and someone sees this, i am sorry,
    im definetly better in the future
  */
  const tagPattern = /{fm [a-zA-Z]+}/g; // Match {fm value} patterns
  const matches = file.match(tagPattern);
  if (tokens.fm && matches) {
    for (const tag of matches) {
      const value = tag.replace(/{fm /, '').replace('}', '');
      file = file.replace(tag, tokens.fm[value] || '');
    }
  }

  return file
}

// # get first x chars after title (if exists)
function summary(content, chars) {
  const noHeadings = content.replace(/#{1,6}.*\n/g, '');
  let x = noHeadings.substring(0, chars);
  return x.match('[a-zA-Z].*\n')
}

function generateIndex() {
  // console.log(pages)
  let indexFilePath = path.join(config.output, "index.html");
  let articles = [];
  fs.writeFileSync(indexFilePath, '', 'utf8');
  pages.forEach(entry => {
    let time = strftime(config.timeFormat, entry.created)
    articles += tokenParser(templates.listing, {
      "created": time,
      "description": entry.content.frontmatter.description || summary(entry.content.content, 150),
      "url": entry.filename,
      "title": entry.content.frontmatter.title || generateHeading(entry.content.content)
    })

  })
  fs.writeFileSync(indexFilePath, tokenParser(templates.index, {
    "articles": articles,
    "header": config.name,
    // "{footer}": "made with \<3 by gay furry studios"
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


