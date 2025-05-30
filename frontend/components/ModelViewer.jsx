import React, { useEffect, useRef, memo } from 'react'; 
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

const ModelViewer = ({ file, onModelLoadError }) => { 
    const mountRef = useRef(null);
    const modelGroupRef = useRef(null);

    useEffect(() => {
        const currentMount = mountRef.current;

        if (!currentMount) {
            console.error("ModelViewer: Mount point not available in useEffect.");
            return;
        }

        if (currentMount.clientWidth === 0 || currentMount.clientHeight === 0) {
             console.warn("ModelViewer: Mount point has zero dimensions IN useEffect. Renderer cannot be sized correctly.");
             return;
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x252525);

        const axesHelper = new THREE.AxesHelper(50);
        scene.add(axesHelper);

        const gridHelper = new THREE.GridHelper(100, 10, 0x444444, 0x888888);
        scene.add(gridHelper);

        const camera = new THREE.PerspectiveCamera(
            75,
            currentMount.clientWidth / currentMount.clientHeight,
            0.1,
            2000
        );
        camera.position.set(0, 20, 100);


        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        currentMount.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 1000;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
        directionalLight1.position.set(50, 50, 50);
        scene.add(directionalLight1);
        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-50, -50, -50);
        scene.add(directionalLight2);

        let animationFrameId;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            if (currentMount) {
                camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            }
        };
        window.addEventListener('resize', handleResize);

        if (file) {
            if (modelGroupRef.current) {
                scene.remove(modelGroupRef.current);
                modelGroupRef.current.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else if (child.material.dispose) child.material.dispose();
                    }
                });
                modelGroupRef.current = null;
            }

            const objectURL = URL.createObjectURL(file);
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let loader;

            if (fileExtension === 'stl') loader = new STLLoader();
            else if (fileExtension === 'obj') loader = new OBJLoader();
            else {
                console.error('ModelViewer: Unsupported file type:', fileExtension);
                URL.revokeObjectURL(objectURL);
                if (onModelLoadError) onModelLoadError(`Unsupported file type: .${fileExtension}`);
                return;
            }

            const material = new THREE.MeshStandardMaterial({
                color: 0x00aaff,
                metalness: 0.2,
                roughness: 0.6,
                flatShading: fileExtension === 'stl',
            });

            loader.load(
                objectURL,
                (loadedObject) => {
                    let mesh;
                    if (loadedObject.isBufferGeometry) {
                        mesh = new THREE.Mesh(loadedObject, material);
                    } else {
                        mesh = loadedObject;
                        mesh.traverse((child) => {
                            if (child.isMesh) child.material = material;
                        });
                    }

                    const box = new THREE.Box3().setFromObject(mesh);
                    const center = box.getCenter(new THREE.Vector3());
                    const size = box.getSize(new THREE.Vector3());
                    const maxDim = Math.max(size.x, size.y, size.z);
                    
                    mesh.position.sub(center);

                    const fov = camera.fov * (Math.PI / 180);
                    let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
                    cameraDistance *= 1.5;
                    cameraDistance = Math.max(cameraDistance, 20);

                    camera.position.set(0, size.y * 0.1, cameraDistance);
                    controls.target.set(0, 0, 0);
                    controls.update();
                    renderer.render(scene, camera);

                    const newModelGroup = new THREE.Group();
                    newModelGroup.add(mesh);
                    scene.add(newModelGroup);
                    modelGroupRef.current = newModelGroup;

                    URL.revokeObjectURL(objectURL);
                },
                undefined,
                (error) => {
                    console.error('ModelViewer: An error happened during model loading:', error);
                    URL.revokeObjectURL(objectURL);
                    if (onModelLoadError) onModelLoadError('Failed to load model. Check console for details.');
                }
            );
        } else {
            if (modelGroupRef.current) {
                scene.remove(modelGroupRef.current);
                modelGroupRef.current.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else if (child.material.dispose) child.material.dispose();
                    }
                });
                modelGroupRef.current = null;
            }
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            if (modelGroupRef.current) {
                scene.remove(modelGroupRef.current);
                modelGroupRef.current.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                        else if (child.material.dispose) child.material.dispose();
                    }
                });
            }
            scene.traverse(object => {
                if (!object.isMesh && !object.isLight && !object.isCamera) return;
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(mat => mat.dispose());
                    } else if (object.material.dispose) {
                        object.material.dispose();
                    }
                }
            });
            if (currentMount && renderer.domElement && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose();
        };
    }, [file, onModelLoadError]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '300px', border: '1px dashed orange' }} />;
};

export default memo(ModelViewer);
