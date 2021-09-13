import { CircleBufferGeometry, Mesh, MeshBasicMaterial, Vector3 } from "three";

class Target {
  Mesh: Mesh;

  constructor(position: Vector3, scale: Vector3) {
    this.Mesh = new Mesh(geometry, material);
    this.Mesh.position.set(position.x, position.y, position.z);
    this.Mesh.scale.set(scale.x, scale.y, scale.z);

    this.Mesh.geometry.computeBoundingSphere();
  }
}

const geometry = new CircleBufferGeometry(1.0, 32);
const material = new MeshBasicMaterial({ color: 0xffffff });

export default Target;
