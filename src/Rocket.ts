import { Mesh, BufferGeometry, BufferAttribute, MeshBasicMaterial, Vector3 } from "three";
import RocketDNA from "./RocketDNA";

class Rocket {
  Mesh: Mesh;
  Gravity: Vector3;
  DNA: RocketDNA;

  // Constants
  InitialMass: number;
  ExhaustVelocity: Vector3;
  InitialPos: Vector3;

  // Per frame variables
  CurrentMass: number;
  PreviousMass: number;
  FlightTime: number; // The duration of the flight in milliseconds
  NetForce: Vector3;
  FrameCount: number;
  IsFrozen: boolean;
  ReachedTarget: boolean;
  DistanceToTarget: number;

  constructor(dna: RocketDNA, initialPos: Vector3, initialMass: number) {
    this.Mesh = new Mesh(geometry, material);
    this.Mesh.geometry.computeBoundingBox();

    this.Gravity = new Vector3(0, -9.81, 0);
    this.DNA = dna;
    this.InitialMass = initialMass;
    this.CurrentMass = this.InitialMass;
    this.PreviousMass = this.CurrentMass;
    this.InitialPos = initialPos;
    this.ExhaustVelocity = new Vector3(0, 25.0, 0);
    this.FlightTime = 0;
    this.NetForce = new Vector3(0, 0, 0);
    this.FrameCount = 0;
    this.IsFrozen = false;
    this.ReachedTarget = false;
    this.DistanceToTarget = 999999;

    this.reset();
  }

  reset(): void {
    this.Mesh.position.set(this.InitialPos.x, this.InitialPos.y, this.InitialPos.z);

    this.CurrentMass = this.InitialMass;
    this.PreviousMass = this.CurrentMass;
    this.FlightTime = 0;
    this.NetForce = new Vector3(0, 0, 0);
    this.FrameCount = 0;
    this.IsFrozen = false;
    this.ReachedTarget = false;
    this.DistanceToTarget = 999999;
  }

  step(dt: number): boolean {
    if (this.IsFrozen) {
      return false;
    }

    // Spend some fuel!
    const massFlowRate = 1.5 * dt;
    if (this.CurrentMass > (this.InitialMass * 0.25)) {
      this.CurrentMass -= massFlowRate;
    }

    // Calculate the net force on the rocket
    // Apply gravity
    const gravitationalForce = this.Gravity.clone();
    gravitationalForce.multiplyScalar(this.CurrentMass);
    gravitationalForce.multiplyScalar(dt);
    this.NetForce.add(gravitationalForce);

    // Create an upward force
    const upwardThrust = this.generateUpwardThrust(dt);
    this.NetForce.add(upwardThrust);

    // Apply directional thrust from DNA
    this.NetForce.add(this.DNA.DirectionalThrusts[this.FrameCount]);

    // Create directional resistive force
    const directionalResistiveForce = this.generateDirectionalResistiveForce(this.NetForce);
    this.NetForce.add(directionalResistiveForce);

    // Calculate velocity => Force = (mass * velocity) / dt
    const velocity = this.NetForce.clone();
    velocity.divideScalar(this.CurrentMass);
    velocity.multiplyScalar(dt);

    // Calculate displacement => displacement = velocity * dt
    const displacement = velocity.clone();
    displacement.multiplyScalar(dt);

    // Update position
    this.Mesh.position.add(displacement);

    // Update rotation
    const angle = Math.atan(this.NetForce.x / this.NetForce.y);
    this.Mesh.setRotationFromAxisAngle(new Vector3(0, 0, -1), angle);

    // Update tracking variables
    this.PreviousMass = this.CurrentMass;
    this.FlightTime += dt;
    this.FrameCount += 1;

    return true;
  }

  freeze(reachedTarget: boolean): void {
    this.IsFrozen = true;
    this.ReachedTarget = reachedTarget;
  }

  private generateUpwardThrust(dt: number): Vector3 {
    const upwardThrust = new Vector3(0, 0, 0);

    // T = v * (dm / dt)
    upwardThrust.add(this.ExhaustVelocity);
    upwardThrust.multiplyScalar(1.0 + this.FlightTime); // Over time, increase the ExhaustVelocity proportionally to time

    const dm = Math.abs(this.CurrentMass - this.PreviousMass);
    if (dm > 0) {
      upwardThrust.multiplyScalar(dm / dt);
    } else {
      upwardThrust.multiplyScalar(0);
    }

    return upwardThrust;
  }

  private generateDirectionalResistiveForce(directionalForce: Vector3): Vector3 {
    const resistiveForce = new Vector3(0, 0, 0);

    const epsilon = 1e-3;
    if (Math.abs(directionalForce.x - epsilon) > epsilon) {
      const dir = -Math.sign(directionalForce.x);

      const modifier = 100;
      resistiveForce.setX(dir * modifier);
    }

    return resistiveForce;
  }
}

const vertices = new Float32Array([-0.2, -0.75, 0.0, 0.2, -0.75, 0.0, 0.2, 0.75, 0.0, 0.2, 0.75, 0.0, -0.2, 0.75, 0.0, -0.2, -0.75, 0.0]);

const geometry = new BufferGeometry();
geometry.setAttribute("position", new BufferAttribute(vertices, 3));

const material = new MeshBasicMaterial({ color: "#33D7FF" });

export default Rocket;
