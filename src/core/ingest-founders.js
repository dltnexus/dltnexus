const fs = require('fs').promises;
const path = require('path');

async function readMarkdownFiles() {
    const founderDir = path.join(__dirname, 'founder');
    const files = await fs.readdir(founderDir);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    const contents = await Promise.all(mdFiles.map(async file => {
        const content = await fs.readFile(path.join(founderDir, file), 'utf8');
        return {
            name: file.replace('.md', ''),
            content
        };
    }));
    
    return contents;
}

async function createKnowledgeGraphEntities(documents) {
    // Create entities for each document
    const entities = documents.map(doc => ({
        name: doc.name,
        entityType: 'founder_document',
        observations: [doc.content]
    }));

    // Output the entities as JSON
    console.log(JSON.stringify({ entities }, null, 2));
}

async function main() {
    try {
        console.log('Reading markdown files...');
        const documents = await readMarkdownFiles();
        
        // Generate entities JSON
        await createKnowledgeGraphEntities(documents);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
