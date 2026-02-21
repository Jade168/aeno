import * as THREE from "three";

export class PlanetSystem {
    constructor(scene) {
        this.scene = scene;
        this.planets = [];
        this.orbits = [];
        this.createPlanets();
    }

    createPlanets() {
        for (let i = 0; i < 20; i++) {
            const group = new THREE.Group();

            const geometry = new THREE.SphereGeometry(
                1.5 + Math.random(),
                64,
                64
            );

            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(`hsl(${Math.random()*360},70%,50%)`),
                roughness: 0.6,
                metalness: 0.2
            });

            const planet = new THREE.Mesh(geometry, material);
            const distance = 20 + i * 6;

            planet.position.x = distance;

            group.add(planet);
            this.scene.add(group);

            this.planets.push(planet);
            this.orbits.push(group);
        }
    }

    update(delta) {
        this.planets.forEach((planet, i) => {
            planet.rotation.y += 0.4 * delta;
            this.orbits[i].rotation.y += 0.08 * delta / (i + 1);
        });
    }
}
