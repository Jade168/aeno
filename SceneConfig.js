import * as THREE from "three";

export function createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000010);
    return scene;
}

export function createCamera() {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        3000
    );
    camera.position.set(0, 60, 120);
    return camera;
}

export function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);
    return renderer;
}

export function createLights(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);

    const sun = new THREE.PointLight(0xffffff, 5, 2000);
    scene.add(sun);
}
