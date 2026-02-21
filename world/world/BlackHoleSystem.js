import * as THREE from "three";

export class BlackHoleSystem {
    constructor(scene) {
        this.scene = scene;
        this.createBlackHole();
    }

    createBlackHole() {
        const coreGeo = new THREE.SphereGeometry(6, 64, 64);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        this.scene.add(this.core);

        const diskGeo = new THREE.TorusGeometry(10, 2, 32, 200);
        const diskMat = new THREE.MeshStandardMaterial({
            emissive: 0xff3300,
            emissiveIntensity: 2
        });

        this.disk = new THREE.Mesh(diskGeo, diskMat);
        this.disk.rotation.x = Math.PI / 2;
        this.scene.add(this.disk);
    }

    update(delta) {
        this.disk.rotation.z += 0.5 * delta;
    }
}
