import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import MarkdownParser from './markdown-parser.js';

class KnowledgeGraph {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.labelRenderer = new CSS2DRenderer();
        this.nodes = new Map();
        this.edges = new Map();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedNode = null;
        this.isSimulating = false;
        this.positions = [];
        this.velocities = [];
        this.graphNodes = [];
        this.graphEdges = [];

        this.init();
        this.setupLighting();
        this.setupControls();
        this.setupEventListeners();
    }

    init() {
        console.log('Initializing Three.js components');
        try {
            // Setup renderers
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.renderer.setPixelRatio(window.devicePixelRatio);
            document.body.appendChild(this.renderer.domElement);
            console.log('WebGL renderer initialized');

            this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
            this.labelRenderer.domElement.style.position = 'absolute';
            this.labelRenderer.domElement.style.top = '0';
            this.labelRenderer.domElement.style.pointerEvents = 'none';
            document.body.appendChild(this.labelRenderer.domElement);
            console.log('Label renderer initialized');

            // Setup camera
            this.camera.position.set(0, 0, 20);
            this.camera.lookAt(0, 0, 0);
            console.log('Camera positioned');

            // Add ambient light
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            this.scene.add(ambientLight);
            console.log('Lighting setup complete');

            // Set background color
            this.scene.background = new THREE.Color(0x000000);
            this.renderer.setClearColor(0x000000);
            console.log('Scene background set');
        } catch (error) {
            console.error('Error during initialization:', error);
        }
    }

    setupLighting() {
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;
        
        // Map zoom to middle mouse button
        this.controls.mouseButtons = {
            MIDDLE: THREE.MOUSE.DOLLY,
            LEFT: THREE.MOUSE.ROTATE,
            RIGHT: THREE.MOUSE.PAN
        };
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('mousemove', (event) => this.onMouseMove(event), false);
        window.addEventListener('click', (event) => this.onMouseClick(event), false);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Highlight node under mouse
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(Array.from(this.nodes.values()));

        // Reset all nodes to normal state
        this.nodes.forEach(node => {
            node.material.opacity = 1;
            node.material.emissiveIntensity = 0.5;
        });

        // Highlight intersected node
        if (intersects.length > 0) {
            const node = intersects[0].object;
            node.material.opacity = 1;
            node.material.emissiveIntensity = 1;
        }
    }

    onMouseClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(Array.from(this.nodes.values()));

        if (intersects.length > 0) {
            const node = intersects[0].object;
            this.showNodeInfo(node.userData);
        } else {
            this.hideNodeInfo();
        }
    }

    showNodeInfo(data) {
        const panel = document.getElementById('info-panel');
        const nameElement = document.getElementById('entity-name');
        const typeElement = document.getElementById('entity-type');
        const observationsElement = document.getElementById('observations');

        nameElement.textContent = data.name;
        typeElement.textContent = `Type: ${data.entityType}`;
        
        observationsElement.innerHTML = '';
        if (typeof data.content === 'string') {
            const div = document.createElement('div');
            div.className = 'observation';
            div.textContent = data.content;
            observationsElement.appendChild(div);
        } else if (Array.isArray(data.observations)) {
            data.observations.forEach(obs => {
                const div = document.createElement('div');
                div.className = 'observation';
                div.textContent = obs;
                observationsElement.appendChild(div);
            });
        }

        panel.style.display = 'block';
    }

    hideNodeInfo() {
        const panel = document.getElementById('info-panel');
        panel.style.display = 'none';
    }

    getColorForType(type) {
        const colors = {
            document: 0xFF4081,  // Bright pink for documents
            section: 0x00BCD4,   // Cyan for sections
            concept: 0x76FF03,   // Bright green for concepts
            default: 0xFFD700    // Gold for unknown types
        };
        return colors[type] || colors.default;
    }

    getNodeSize(type, level) {
        const sizes = {
            document: 1.2,
            section: 0.9,
            concept: 0.6
        };
        return sizes[type] || 0.8;
    }

    createNode(entity) {
        const size = this.getNodeSize(entity.entityType, entity.level);
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.getColorForType(entity.entityType),
            transparent: true,
            opacity: 1,
            emissive: this.getColorForType(entity.entityType),
            emissiveIntensity: 0.5,
            shininess: 50
        });
        
        const sphere = new THREE.Mesh(geometry, material);
        sphere.userData = entity;
        
        // Add label
        const div = document.createElement('div');
        div.textContent = entity.name;
        div.style.color = 'white';
        div.style.padding = '4px 8px';
        div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        div.style.borderRadius = '4px';
        div.style.fontSize = '14px';
        
        const label = new CSS2DObject(div);
        label.position.set(0, size + 0.3, 0);
        sphere.add(label);

        this.nodes.set(entity.name, sphere);
        this.scene.add(sphere);

        return sphere;
    }

    async loadMarkdownFiles(files) {
        console.log('Starting to load markdown files');
        try {
            const parser = new MarkdownParser();
            const { nodes, edges } = await parser.parseFiles(files);
            console.log('Parsed markdown files:', { nodeCount: nodes.length, edgeCount: edges.length });

            // Initialize positions and velocities
            this.initializePositions(nodes);
            
            // Create nodes
            nodes.forEach((node, index) => {
                const sphere = this.createNode({
                    name: node.name,
                    entityType: node.type,
                    content: node.content,
                    level: node.level
                });
                
                // Set initial position
                const pos = this.positions[index];
                sphere.position.set(pos.x * 8, pos.y * 8, pos.z * 8);
                sphere.userData.id = node.id;
                console.log(`Created node: ${node.name} at position:`, sphere.position);
            });

            // Create edges
            edges.forEach(edge => {
                const sourceNode = Array.from(this.nodes.values()).find(n => n.userData.id === edge.source);
                const targetNode = Array.from(this.nodes.values()).find(n => n.userData.id === edge.target);
                
                if (sourceNode && targetNode) {
                    const points = [];
                    points.push(sourceNode.position);
                    points.push(targetNode.position);

                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({ 
                        color: 0x4FC3F7,
                        transparent: true,
                        opacity: 0.6
                    });
                    const line = new THREE.Line(geometry, material);
                    
                    this.edges.set(`${edge.source}-${edge.target}`, line);
                    this.scene.add(line);
                }
            });
            console.log('Created all edges');

            // Store edges data for force simulation
            this.graphEdges = edges;
            this.graphNodes = nodes;
            
            // Start simulation
            this.isSimulating = true;
            this.animate();
        } catch (error) {
            console.error('Error loading markdown files:', error);
        }
    }

    initializePositions(nodes) {
        this.positions = [];
        this.velocities = [];
        
        // Initialize positions in a spherical arrangement
        const radius = 1;
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

        nodes.forEach((_, index) => {
            const y = 1 - (index / (nodes.length - 1)) * 2;
            const r = Math.sqrt(1 - y * y);
            const theta = phi * index;

            this.positions.push({
                x: Math.cos(theta) * r,
                y: y,
                z: Math.sin(theta) * r
            });
            this.velocities.push({ x: 0, y: 0, z: 0 });
        });
    }

    updateForces() {
        if (!this.isSimulating) return;

        const repulsion = 1;
        const attraction = 0.1;
        const centerAttraction = 0.01;
        const maxSpeed = 0.1;

        // Calculate forces
        for (let i = 0; i < this.graphNodes.length; i++) {
            const nodeObj = Array.from(this.nodes.values())[i];
            
            // Center attraction
            const distToCenter = Math.sqrt(
                nodeObj.position.x * nodeObj.position.x +
                nodeObj.position.y * nodeObj.position.y +
                nodeObj.position.z * nodeObj.position.z
            );
            
            if (distToCenter > 0) {
                this.velocities[i].x -= nodeObj.position.x * centerAttraction;
                this.velocities[i].y -= nodeObj.position.y * centerAttraction;
                this.velocities[i].z -= nodeObj.position.z * centerAttraction;
            }

            // Node repulsion
            for (let j = 0; j < this.graphNodes.length; j++) {
                if (i !== j) {
                    const otherNode = Array.from(this.nodes.values())[j];
                    const dx = nodeObj.position.x - otherNode.position.x;
                    const dy = nodeObj.position.y - otherNode.position.y;
                    const dz = nodeObj.position.z - otherNode.position.z;
                    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1;
                    const force = repulsion / (distance * distance);

                    this.velocities[i].x += dx * force / distance;
                    this.velocities[i].y += dy * force / distance;
                    this.velocities[i].z += dz * force / distance;
                }
            }
        }

        // Edge attraction
        this.graphEdges.forEach(edge => {
            const sourceIndex = this.graphNodes.findIndex(n => n.id === edge.source);
            const targetIndex = this.graphNodes.findIndex(n => n.id === edge.target);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                const sourceNode = Array.from(this.nodes.values())[sourceIndex];
                const targetNode = Array.from(this.nodes.values())[targetIndex];

                const dx = sourceNode.position.x - targetNode.position.x;
                const dy = sourceNode.position.y - targetNode.position.y;
                const dz = sourceNode.position.z - targetNode.position.z;
                const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

                const force = distance * attraction;

                this.velocities[sourceIndex].x -= dx * force;
                this.velocities[sourceIndex].y -= dy * force;
                this.velocities[sourceIndex].z -= dz * force;

                this.velocities[targetIndex].x += dx * force;
                this.velocities[targetIndex].y += dy * force;
                this.velocities[targetIndex].z += dz * force;
            }
        });

        // Update positions and apply velocity limits
        this.graphNodes.forEach((_, i) => {
            const node = Array.from(this.nodes.values())[i];
            
            // Apply velocity limits
            const speed = Math.sqrt(
                this.velocities[i].x * this.velocities[i].x +
                this.velocities[i].y * this.velocities[i].y +
                this.velocities[i].z * this.velocities[i].z
            );
            
            if (speed > maxSpeed) {
                const scale = maxSpeed / speed;
                this.velocities[i].x *= scale;
                this.velocities[i].y *= scale;
                this.velocities[i].z *= scale;
            }

            // Update position
            node.position.x += this.velocities[i].x;
            node.position.y += this.velocities[i].y;
            node.position.z += this.velocities[i].z;

            // Update edges
            this.edges.forEach((line, key) => {
                const [sourceId, targetId] = key.split('-');
                const sourceNode = Array.from(this.nodes.values()).find(n => n.userData.id === sourceId);
                const targetNode = Array.from(this.nodes.values()).find(n => n.userData.id === targetId);
                
                if (sourceNode && targetNode) {
                    const positions = new Float32Array([
                        sourceNode.position.x, sourceNode.position.y, sourceNode.position.z,
                        targetNode.position.x, targetNode.position.y, targetNode.position.z
                    ]);
                    line.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                }
            });
        });

        // Damping
        this.velocities.forEach(v => {
            v.x *= 0.9;
            v.y *= 0.9;
            v.z *= 0.9;
        });

        // Check if simulation should continue
        const totalKineticEnergy = this.velocities.reduce((sum, v) => {
            return sum + (v.x * v.x + v.y * v.y + v.z * v.z);
        }, 0);

        if (totalKineticEnergy < 0.001) {
            this.isSimulating = false;
        }
    }

    animate() {
        if (!this.graphNodes || !this.graphEdges) return;
        
        try {
            if (this.isSimulating) {
                this.updateForces();
            }
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
            this.labelRenderer.render(this.scene, this.camera);
            requestAnimationFrame(() => this.animate());
        } catch (error) {
            console.error('Error in animation loop:', error);
            this.isSimulating = false;
        }
    }
}

// Initialize the graph and load markdown files
const graph = new KnowledgeGraph();
const markdownFiles = [
    '/knowledge-graph-3d/data/DLTNexus-PRD.md',
    '/knowledge-graph-3d/data/Grok-0218251330.md',
    '/knowledge-graph-3d/data/Grok-0218251654.md',
    '/knowledge-graph-3d/data/Grok-0218251740.md',
    '/knowledge-graph-3d/data/Grok-0218252347.md',
    '/knowledge-graph-3d/data/Grok-0219250102.md',
    '/knowledge-graph-3d/data/Grok-0219250152.md',
    '/knowledge-graph-3d/data/Grok-0219251449.md',
    '/knowledge-graph-3d/data/Grok-0220250127.md'
];

graph.loadMarkdownFiles(markdownFiles);
