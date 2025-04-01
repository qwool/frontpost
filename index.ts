
/*
  style definition:
   - anything with ## before means you should prolly read it because
      something else wouldn't make sense
   - also i like to comment something i wanna reuse later, so,
      just in case, actual comments are prefixed with #
   - multiline comments above functions
   - also attempt to not use more than 3-4 indents
*/
import { marked } from 'marked';
import strftime from 'strftime';
import fs from 'fs';
import path from 'path';
// # im sorry for including YAML as a dependency, but it also cut 100+ lines
// # of sub-par code so that's nice :)
import yaml from 'js-yaml';
import config from './config.js';

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
let templates: Record<string, string> = {
  "index": fs.readFileSync(config.src + "templates/index.html", 'utf8'),
  "post": fs.readFileSync(config.src + "templates/post.html", 'utf8'),
  "listing": fs.readFileSync(config.src + "templates/articleListing.html", 'utf8'),
}

interface Page {
  content: any;
  path: string;
  created: Date;
  target: string;
  filename: string;
}
let pages: Page[];

/*
	if you look back in the comment history a horrible horrible tragedy happened where this comment was
*/

async function processFiles(): Promise<void> {
  try {
    const files = (await fs.promises.readdir(config.input))
      .filter(file => path.extname(file) === ".md");

    let completedTasks = 0;
    pages = [];

    for (const file of files) {
      const page = await processFile(file);
      if (page) pages.push(page);
      completedTasks++;
      console.log(`${completedTasks}/${files.length}: ${file}`);

      if (completedTasks >= files.length) {
        pages.sort((a, b) => b.created.getTime() - a.created.getTime());
        generateIndex();
      }
    }
  } catch (err) {
    console.error("couldnt read directory!:", err);
  }
}

async function processFile(file: string): Promise<Page | undefined> {
  try {
    const filePath = path.join(config.input, file);
    const contents = await fs.promises.readFile(filePath, 'utf8');
    const parsed = path.parse(file);
    const gc = getContent(contents);
    let target = path.join(config.output, parsed.name + ".html");

    await fs.promises.writeFile(target, generateContent(gc));

    let created = gc.frontmatter?.created ? new Date(gc.frontmatter.created) : (await fs.promises.stat(filePath)).mtime;
    const page: Page = {
      // # so gc.content is page.content.content? 
      "content": gc,
      "path": filePath,
      "created": new Date(created),
      "target": target,
      // # i dont know if theres another way
      "filename": parsed.name + ".html"
    }
    return page;
  } catch (err) {
    console.error("error with file:", file, err);
  }
}

processFiles();

// # god knows why template is loaded before anyting else, i think its fine tho bc youre gonna need it anyways
function generateContent(data: { frontmatter: any; content: string }): string {
  let title = data.frontmatter.title || generateHeading(data.content);
  // # x = dict; return x? i still dont know why return dict doesnt work
  let x = tokenParser(templates.post, {
    "content": marked.parse(data.content),
    "title": title,
    "header": config.name,
    "created": strftime(config.timeFormat, new Date(data.frontmatter.created)),
    "fm": data.frontmatter
  });
  return x;
}

function generateHeading(dom: string): string | undefined {
  try {
    let heading = marked.parse(dom).match(/<h(\d)>(.*?)<\/h\1>/i);
    return heading ? heading[0].replace(/<\/?[^>]+(>|$)/g, "") : undefined;
  } catch {
    return undefined;
  }
}

function getContent(fileContent: string): { frontmatter: any; content: string } {
  if (!fileContent.match(/^---([\s\S]*?)---/)) return { "frontmatter": "", "content": fileContent };
  try {
    const [_, frontmatter, content] = fileContent.split('---'); // # assuming '---' is the delimiter

    let frontmatterData = yaml.load(frontmatter);
    if (!frontmatterData) frontmatterData = "";
    return { "frontmatter": frontmatterData, "content": content };
  } catch (err) {
    console.error('Error reading file:', err);
    return { "frontmatter": "", "content": "" };
  }
}

function tokenParser(html: string, tokens: Record<string, any>): string {
  let file = html;
  const templch = config.templatingChars;
  for (const [tag, replacement] of Object.entries(tokens)) {
    const regexp = new RegExp(templch[0] + tag + templch[1], "gm");
    file = file.replace(regexp, replacement);
  }
  const tagPattern = /{fm [a-zA-Z]+}/g; // Match {fm value} patterns
  const matches = file.match(tagPattern);
  if (tokens.fm && matches) {
    for (const tag of matches) {
      const value = tag.replace(/{fm /, '').replace('}', '');
      file = file.replace(tag, tokens.fm[value] || '');
    }
  }
  return file;
}

function summary(content: string, chars: number): string | null {
  const noHeadings = content.replace(/#{1,6}.*\n/g, '');
  let x = noHeadings.substring(0, chars);
  return x.match('[a-zA-Z].*\n')?.[0] || null;
}

function generateIndex(): void {
  let indexFilePath = path.join(config.output, "index.html");
  let articles = "";
  fs.writeFileSync(indexFilePath, '', 'utf8');
  pages.forEach(entry => {
    let time = strftime(config.timeFormat, entry.created);
    articles += tokenParser(templates.listing, {
      "created": time,
      "description": entry.content.frontmatter.description || summary(entry.content.content, 150),
      "url": entry.filename,
      "title": entry.content.frontmatter.title || generateHeading(entry.content.content)
    });
  });
  fs.writeFileSync(indexFilePath, tokenParser(templates.index, { "articles": articles, "header": config.name }));
  finalize();
}

function finalize(): void {
  const files = fs.readdirSync(path.join(config.src, "static"));
  files.forEach(file => {
    const sourceFile = path.join(config.src, "static", file);
    const destinationFile = path.join(config.output, file);
    fs.copyFileSync(sourceFile, destinationFile);
    console.log(`${sourceFile} => ${destinationFile}`);
  });
}

