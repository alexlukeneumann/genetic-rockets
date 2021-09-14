import { Vector3, Mesh, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import Rocket from "./Rocket";
import RocketDNA from "./RocketDNA";
import Target from "./Target";
import Wall from "./Wall";

// The number of rockets per generation to create (must be an even number)
const numRockets: number = 100;

// The number of frames allocated for each generation to live
const lifeTime: number = 400;

// Generic rocket properties
const rocketInitialPos: Vector3 = new Vector3(0.0, -44.0, 0.0);
const rocketInitialMass: number = 10;

// The wall obstacle properties
const wallPosition: Vector3 = new Vector3(0.0, 0.0, 0.0);
const wallScale: Vector3 = new Vector3(40.0, 1.0, 1.0);

// The target properties
const targetPosition: Vector3 = new Vector3((Math.random() - 0.5) * 50.0, 35.0, 0.0);
const targetScale: Vector3 = new Vector3(2.0, 2.0, 1.0);

// The target frame rate
const targetFrameRate: number = 1.0 / 90.0;

class Application {
  private _scene: THREE.Scene = new Scene();
  private _camera: THREE.Camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private _renderer: THREE.WebGLRenderer = new WebGLRenderer();
  
  private _runSimulation: boolean = false;

  private _frameCount: number = 0;
  private _rockets: Array<Rocket> = [];
  private _target: Target = new Target(new Vector3(), new Vector3());
  private _wall: Wall = new Wall(new Vector3(), new Vector3());
  private _generation: number = 0;

  constructor() {
    this._camera.position.z = 60.0;

    this._renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this._renderer.domElement);
  }

  initialise(): boolean {
    if (numRockets % 2 != 0) {
      console.error("numRockets is not an even number!");
      return false;
    }

    // Create an initial number of rockets
    for (let i = 0; i < numRockets; ++i) {
      const rocket = new Rocket(RocketDNA.create(targetFrameRate, lifeTime), rocketInitialPos, rocketInitialMass);

      this._scene.add(rocket.Mesh);
      this._rockets.push(rocket);
    }

    // Create a target with a random position
    this._target = new Target(targetPosition, targetScale);
    this._scene.add(this._target.Mesh);

    // Create a wall obstacle
    this._wall = new Wall(wallPosition, wallScale);
    this._scene.add(this._wall.Mesh);

    this.reset(targetFrameRate);

    const runBtn = document.getElementById("run-btn");
    if (runBtn != null) {
      runBtn.onclick = (e: MouseEvent) => {
        this._runSimulation = true;
      }
    }

    return true;
  }

  run(timestamp: number): void {
    requestAnimationFrame((timestamp: number) => this.run(timestamp));
    
    this._renderer.clear();

    // If runSimulation hasn't been pressed, we will take an early bail out.
    if (!this._runSimulation) {
      this._renderer.render(this._scene, this._camera);
      return;
    }

    if (++this._frameCount === lifeTime) {
      this.reset(targetFrameRate);
    }

    writeHTMLElementInnerText("frame", this._frameCount);

    // Update each one of the rockets and check any collision that might of occurred.
    for (let i = 0; i < numRockets; ++i) {
      const rocket = this._rockets[i];

      if (rocket.IsFrozen) {
        continue;
      }

      if (rocket.step(targetFrameRate)) {
        if (collisionBoxCheck(this._wall.Mesh, rocket.Mesh)) {
          rocket.freeze(false);
        } else if (collisionBoxSphereCheck(rocket.Mesh, this._target.Mesh)) {
          rocket.freeze(true);
        }
      }
    }

    this._renderer.render(this._scene, this._camera);
  }

  private reset(dt: number): void {
    this._frameCount = 0;

    // Calculate the distance between the rocket and the target
    const distances = [];
    for (let i = 0; i < numRockets; ++i) {
      distances.push(calculateDistanceToTarget(this._rockets[i], this._target));
    }

    // Calculate the fitness of each rocket (lower the score the better!)
    const maxDist = 200;
    const minDist = 0;

    for (let i = 0; i < numRockets; ++i) {
      const rocket = this._rockets[i];

      if (rocket.IsFrozen) {
        rocket.DNA.Fitness = rocket.ReachedTarget ? 0 : 1;
      } else {
        rocket.DNA.Fitness = Math.min(distances[i] / (maxDist + minDist), 1.0);
      }
    }

    // Sort rockets based on fitness value
    // Fittest rockets near the beginning of the array (lowest score)
    this._rockets.sort((a: Rocket, b: Rocket): number => {
      if (a == b) {
        return 0;
      }

      return a.DNA.Fitness < b.DNA.Fitness ? -1 : 1;
    });

    const bestFitness = this._rockets[0].DNA.Fitness;

    let averageFitness = 0;
    for (let i = 0; i < numRockets; ++i) {
      averageFitness += this._rockets[i].DNA.Fitness;
    }
    averageFitness /= numRockets;

    // Create new DNA for next generation!
    const numMerges = numRockets / 2;
    for (let i = 0; i < numMerges; ++i) {
      const firstRocket = this._rockets[i];
      const secondRocket = this._rockets[numRockets - 1 - i];

      // The less fit rocket gets its DNA merged with the fitter rocket
      secondRocket.DNA = RocketDNA.merge(dt, firstRocket.DNA, secondRocket.DNA);

      // The fitter rocket has a chance of altering its own DNA via mutations
      firstRocket.DNA = RocketDNA.alter(dt, firstRocket.DNA);
    }

    writeHTMLElementInnerText("gen-id", this._generation++);
    writeHTMLElementInnerText("avg-fitness", averageFitness.toPrecision(4));
    writeHTMLElementInnerText("best-fitness", bestFitness.toPrecision(4));
    writeHTMLElementInnerText("num-rockets", numRockets);
    writeHTMLElementInnerText("life-time", lifeTime);

    for (let i = 0; i < numRockets; ++i) {
      this._rockets[i].reset();
    }
  }
}

// Given a rocket & target, calculates the distance squared between the rocket and the target
const calculateDistanceToTarget = (rocket: Rocket, target: Target): number => {
  const rPos = rocket.Mesh.position;
  const tPos = target.Mesh.position;

  return Math.sqrt(rPos.distanceToSquared(tPos));
};

// Given two meshes, checks to see if their AABB intersects
const collisionBoxCheck = (a: Mesh, b: Mesh): boolean => {
  if (a.geometry.boundingBox == null || b.geometry.boundingBox == null) {
    return false;
  }

  // Every Mesh's world matrix isn't guarenteed to be updated straight away... force it
  // as we need to use it in AABB calculations
  a.updateWorldMatrix(true, true);
  b.updateWorldMatrix(true, true);

  const aBox = a.geometry.boundingBox.clone();
  const bBox = b.geometry.boundingBox.clone();

  aBox.applyMatrix4(a.matrixWorld);
  bBox.applyMatrix4(b.matrixWorld);

  return aBox.intersectsBox(bBox);
};

const collisionBoxSphereCheck = (a: Mesh, b: Mesh): boolean => {
  if (a.geometry.boundingBox == null || b.geometry.boundingSphere == null) {
    return false;
  }

  // Every Mesh's world matrix isn't guarenteed to be updated straight away... force it
  // as we need to use it in AABB calculations
  a.updateWorldMatrix(true, true);
  b.updateWorldMatrix(true, true);

  const aBox = a.geometry.boundingBox.clone();
  const bSphere = b.geometry.boundingSphere.clone();

  aBox.applyMatrix4(a.matrixWorld);
  bSphere.applyMatrix4(b.matrixWorld);

  return aBox.intersectsSphere(bSphere);
};

const writeHTMLElementInnerText = (id: string, value: any): void => {
  const element = document.getElementById(id);
  if (element != null) {
    element.innerText = value;
  }
};

const app = new Application();
if (app.initialise()) {
  app.run(targetFrameRate);
}
