import * as THREE from "three";

export class SpaceEnvironment {
    constructor(scene) {
        this.scene = scene;
        this.createStars();
    }

    createStars() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];

        for (let i = 0; i < 15000; i++) {
            vertices.push(
                THREE.MathUtils.randFloatSpread(3000),
                THREE.MathUtils.randFloatSpread(3000),
                THREE.MathUtils.randFloatSpread(3000)
            );
        }

        geometry.setAttribute(
            "position",
            new THREE.Float32BufferAttribute(vertices, 3)
        );

        const material = new THREE.PointsMaterial({ size: 1 });
        const stars = new THREE.Points(geometry, material);

        this.scene.add(stars);
    }
}
