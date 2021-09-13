import { BufferAttribute, BufferGeometry, Mesh, MeshBasicMaterial, Vector3 } from "three";

class Wall {
  Mesh: Mesh;

  constructor(position: Vector3, scale: Vector3) {
    this.Mesh = new Mesh(geometry, material);
    this.Mesh.position.set(position.x, position.y, position.z);
    this.Mesh.scale.set(scale.x, scale.y, scale.z);

    this.Mesh.geometry.computeBoundingBox();
  }
}

const vertices = new Float32Array([-1.0, 0.2, 0.0, -1.0, -0.2, 0.0, 1.0, -0.2, 0.0, 1.0, -0.2, 0.0, 1.0, 0.2, 0.0, -1.0, 0.2, 0.0]);

const geometry = new BufferGeometry();
geometry.setAttribute("position", new BufferAttribute(vertices, 3));

const material = new MeshBasicMaterial({ color: 0xffffff });

export default Wall;
