const fs = require('fs');
const yaml = require('js-yaml');

/**
 * Extract YAML frontmatter from a file and return it as JSON.
 * @param {string} filePath - The path to the file containing frontmatter.
 * @returns {object|null} - The frontmatter data as a JavaScript object or null if frontmatter is not found.
 */
function extractFrontmatterToJson(filePath) {
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');

    // Separate the frontmatter from the rest of the content
    const [_, frontmatter] = fileContent.split('---'); // Assuming '---' is the frontmatter delimiter
    console.log(frontmatter)
    // Parse the frontmatter using js-yaml
    const frontmatterData = yaml.load(frontmatter);

    return frontmatterData;
  } catch (err) {
    console.error('Error reading file:', err);
    return null;
  }
}
console.log(extractFrontmatterToJson("./src/content/ukrlit.md"))
module.exports = {
  extractFrontmatterToJson,
};

