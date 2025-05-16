class ThreeScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        this.loadModel();
        this.setupCamera();
        this.handleResize();
        this.animate();
    }

    setupCamera() {
        this.camera.position.z = 4; // Moved camera closer
        this.camera.position.y = 1; // Adjusted height
        this.camera.lookAt(0, 0, 0);
    }

    loadModel() {
        const loader = new THREE.OBJLoader();
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x4a90e2,
            side: THREE.DoubleSide 
        });

        loader.load(
            '/WWW/Assets/wifi-icon-1/source/wifi-icon (1)/source/wifi/wifi.obj',
            (object) => this.onModelLoaded(object, material),
            (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
            (error) => console.error('Error loading model:', error)
        );
    }

    onModelLoaded(object, material) {
        // Apply material to all meshes in the model
        object.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = material;
            }
        });

        // Center and scale the model
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4 / maxDim; // Increased scale factor for larger model
        object.scale.multiplyScalar(scale);
        
        object.position.sub(center.multiplyScalar(scale));
        
        // Center the model vertically a bit higher
        object.position.y = 0.5;
        
        this.model = object;
        this.scene.add(object);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(width, height);
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.model) {
            // Optional: Add any model animations here
            // this.model.rotation.y += 0.01;
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}