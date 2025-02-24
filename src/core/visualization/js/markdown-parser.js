class MarkdownParser {
    constructor() {
        this.nodes = [];
        this.edges = [];
        this.nodeIndex = 0;
    }

    async parseFiles(files) {
        for (const file of files) {
            try {
                console.log(`Fetching file: ${file}`);
                const response = await fetch(file, {
                    headers: {
                        'Accept': 'text/plain, text/markdown',
                        'Cache-Control': 'no-cache'
                    },
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    console.error(`Failed to load ${file}: ${response.status} ${response.statusText}`);
                    continue;
                }

                let content = await response.text();
                
                // Remove any BOM characters that might be present
                content = content.replace(/^\uFEFF/, '');
                
                console.log(`Content received for ${file}:`, content.substring(0, 100) + '...');
                
                if (content) {
                    this.parseDocument(file, content);
                    console.log(`Parsed document ${file}. Current nodes:`, this.nodes.length);
                }
            } catch (error) {
                console.error(`Error loading ${file}:`, error);
            }
        }
        
        console.log('Final parse results:', {
            nodeCount: this.nodes.length,
            edgeCount: this.edges.length,
            nodes: this.nodes,
            edges: this.edges
        });
        
        return { nodes: this.nodes, edges: this.edges };
    }

    parseDocument(filePath, content) {
        // Create document node
        const fileName = filePath.split('/').pop();
        const documentNode = this.createNode({
            id: `doc_${this.nodeIndex++}`,
            name: fileName,
            type: 'document',
            content: content,
            level: 0
        });

        const lines = content.split('\n');
        let currentSection = null;
        let sectionContent = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect headers
            const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
            if (headerMatch) {
                // Save previous section if exists
                if (currentSection) {
                    this.processSectionContent(currentSection, sectionContent.join('\n'), documentNode.id);
                    sectionContent = [];
                }

                const level = headerMatch[1].length;
                const title = headerMatch[2];
                
                currentSection = this.createNode({
                    id: `section_${this.nodeIndex++}`,
                    name: title,
                    type: 'section',
                    level: level
                });

                // Connect section to document
                this.createEdge(documentNode.id, currentSection.id, 'contains');
            } else {
                // Accumulate content for current section
                sectionContent.push(line);
            }
        }

        // Process last section
        if (currentSection && sectionContent.length > 0) {
            this.processSectionContent(currentSection, sectionContent.join('\n'), documentNode.id);
        }
    }

    processSectionContent(sectionNode, content, documentId) {
        // Extract key concepts (words or phrases that appear multiple times or are emphasized)
        const concepts = this.extractConcepts(content);
        
        for (const concept of concepts) {
            const conceptNode = this.findOrCreateConceptNode(concept);
            // Connect concept to section
            this.createEdge(sectionNode.id, conceptNode.id, 'mentions');
        }

        // Update section with its content
        sectionNode.content = content;
        this.nodes.push(sectionNode);
    }

    extractConcepts(content) {
        // Simple concept extraction based on:
        // 1. Words in bold/italic
        // 2. Words that appear in lists
        // 3. Key technical terms
        const concepts = new Set();

        // Extract emphasized text
        const emphasisRegex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g;
        let match;
        while ((match = emphasisRegex.exec(content)) !== null) {
            const concept = match[1] || match[2] || match[3];
            if (concept.length > 3) { // Ignore short words
                concepts.add(concept.toLowerCase());
            }
        }

        // Extract list items
        const listItems = content.match(/^[-*]\s+(.+)$/gm);
        if (listItems) {
            listItems.forEach(item => {
                const text = item.replace(/^[-*]\s+/, '');
                if (text.length > 3) {
                    concepts.add(text.toLowerCase());
                }
            });
        }

        // Extract technical terms
        const technicalTerms = [
            'api', 'database', 'framework', 'algorithm', 'interface',
            'system', 'network', 'protocol', 'architecture', 'component',
            'service', 'module', 'function', 'class', 'method',
            'implementation', 'deployment', 'integration', 'testing'
        ];

        const words = content.toLowerCase().split(/\W+/);
        words.forEach(word => {
            if (technicalTerms.includes(word)) {
                concepts.add(word);
            }
        });

        return Array.from(concepts);
    }

    findOrCreateConceptNode(concept) {
        const existingNode = this.nodes.find(n => n.type === 'concept' && n.name.toLowerCase() === concept.toLowerCase());
        if (existingNode) {
            return existingNode;
        }

        const conceptNode = this.createNode({
            id: `concept_${this.nodeIndex++}`,
            name: concept,
            type: 'concept',
            level: 2
        });

        return conceptNode;
    }

    createNode(data) {
        const node = {
            id: data.id,
            name: data.name,
            type: data.type,
            content: data.content || '',
            level: data.level
        };
        this.nodes.push(node);
        return node;
    }

    createEdge(sourceId, targetId, type) {
        const edge = {
            source: sourceId,
            target: targetId,
            type: type
        };
        this.edges.push(edge);
    }
}

export default MarkdownParser;
