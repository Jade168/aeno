import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createScene, createCamera, createRenderer, createLights } from "./SceneConfig.js";
import { createPostProcessing } from "./PostProcessing.js";
import { SpaceEnvironment } from "../world/SpaceEnvironment.js";
import { PlanetSystem } from "../world/PlanetSystem.js";
import { BlackHoleSystem } from "../world/BlackHoleSystem.js";

export class GameEngine {
    constructor() {
        this.scene = createScene();
        this.camera = createCamera();
        this.renderer = createRenderer();
        createLights(this.scene);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        this.environment = new SpaceEnvironment(this.scene);
        this.planets = new PlanetSystem(this.scene);
        this.blackHole = new BlackHoleSystem(this.scene);

        this.composer = createPostProcessing(this.renderer, this.scene, this.camera);

        this.clock = new THREE.Clock();
    }

    start() {
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();

        this.planets.update(delta);
        this.blackHole.update(delta);
        this.controls.update();

        this.composer.render();
    }
}
