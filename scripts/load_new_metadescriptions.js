const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

const inputPath = process.argv[2]; // Pass CSV file path as command-line argument
const docsPath = '../docs'

// Function to add metaDescription to the frontmatter
function appendMetaDescription(filePath, metaDescription) {
  const docPath = path.resolve(__dirname, `${docsPath}/${filePath}`);
  console.log('DOCPATH', docPath);
  // path.resolve(__dirname, relativePath);
  try {
    const fileContent = fs.readFileSync(docPath, 'utf-8');
    const frontmatterRegex = /^(---\n[\s\S]*?---)/;
    const match = fileContent.match(frontmatterRegex); // check if frontmatter exists in the doc

    if(match && match[1].includes('description:')) {
      console.error('metaDescription is already provided, overriding disabled')
      return;
    }

    // Escape special characters in metaDescription
    const escapedMetaDescription = escapeMetaDescription(metaDescription);

    // frontmatter exists
    if(match) {
      const frontmatter = match[1]

      // check if title meta exists
      if (fileContent.includes('title:')) {
        // Find position right after the title
        const titleEndIndex = fileContent.indexOf('\n', fileContent.indexOf('title:')) + 1;
        const newContent = fileContent.slice(0, titleEndIndex) + `description: ${escapedMetaDescription}\n` + fileContent.slice(titleEndIndex);
        fs.writeFileSync(docPath, newContent, 'utf-8');
      } else {
        // Add metaDescription at the beginning if title isn't found
        const updatedFrontmatter = frontmatter.replace(
          '---\n',
          `---\ndescription: "${escapedMetaDescription}"\n`
        );

        const newContent = fileContent.replace(frontmatter, updatedFrontmatter);
        fs.writeFileSync(docPath, newContent, 'utf-8');
      }
    } else {
      const newFrontmatter = `---\ndescription: "${escapedMetaDescription}"\n---\n\n`;
      const newContent = newFrontmatter + fileContent;
      fs.writeFileSync(docPath, newContent, 'utf-8');
    }


  } catch (error) {
    console.error(error)
    throw error;
  }

}

const appendToDocs = (url) => {
  if(!inputPath) {
    console.error('Please provide the input file in csv format:', '\`node index.js <inputPath.csv>`');
    process.exit(1)
  }
  console.log(inputPath)


  fs.createReadStream(inputPath)
    .pipe(csv())
    .on('data', (row) => {
      const { "Page URL": pageUrl, "New Meta Description": metaDescription } = row;
      const filePath = getFilePathFromUrl(pageUrl);
      console.log({
        pageUrl,
        metaDescription,
        filePath
      })
      appendMetaDescription(filePath, metaDescription)
    })
    .on('end', () => {
      console.log("Metadata loaded successfully into Docusaurus docs.");
    });
}


appendToDocs();


function getFilePathFromUrl(url) {
  try {
    const urlObj = new URL(url);
    // Remove the leading and trailing slashes from the pathname
    return urlObj.pathname.replace(/^\/|\/$/g, '').concat('.md');
  } catch (error) {
    console.error("Invalid URL:", error);
    return null;
  }
}

function escapeMetaDescription(metaDescription) {
  return metaDescription.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}