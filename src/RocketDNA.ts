import { Vector3 } from "three";

class RocketDNA {
  Length: number;
  DirectionalThrusts: Array<Vector3>;
  Fitness: number;  // Fitness is rated 0 to 1 with 0 being fittest

  constructor(length: number) {
    this.Length = length;
    this.DirectionalThrusts = [];
    this.Fitness = 1; // fitness of 1 denotes poor fitness
  }

  static create(dt: number, length: number): RocketDNA {
    const DNA = new RocketDNA(length);

    // Generate the DirectionalThrusts array with random thrust values along the x-axis
    for (let i = 0; i < DNA.Length; ++i) {
      DNA.DirectionalThrusts[i] = this.createRandomDirectionalThrust(dt);
    }

    return DNA;
  }

  static alter(dt: number, dna: RocketDNA): RocketDNA {
    const altered = new RocketDNA(dna.Length);

    // The higher the fitness of the DNA, the lower chance of mutation
    const maxMutationChance = 0.025;
    const mutationChance = maxMutationChance * Math.max(dna.Fitness, 0.025);

    for (let i = 0; i < altered.Length; ++i) {
      if (Math.random() < mutationChance) {
        altered.DirectionalThrusts[i] = this.createRandomDirectionalThrust(dt);
      } else {
        altered.DirectionalThrusts[i] = dna.DirectionalThrusts[i];
      }
    }

    return altered;
  }

  static merge(dt: number, first: RocketDNA, second: RocketDNA): RocketDNA {
    if (first.Length !== second.Length) {
      console.error('Incompatible RocketDNA: Lengths differ.');
      return new RocketDNA(0);
    } 

    const mergedDNA = new RocketDNA(first.Length);

    const fittestDNA = first.Fitness < second.Fitness ? first : second;
    const weakerDNA = first.Fitness > second.Fitness ? first : second;

    // The closer fitness the two DNA are, the more of an equal chance of a 50:50 merge
    // Otherwise the fittest DNA has the high chance of its DNA being chosen
    const weakerMergeChance = 0.5 * (fittestDNA.Fitness / weakerDNA.Fitness);

    // Chance at which no merge occurs and straight mutation occurs
    const maxMutationChance = 0.025;
    const mutationChance = maxMutationChance * Math.max(fittestDNA.Fitness, 0.025);
     
    for (let i = 0; i < mergedDNA.Length; ++i) {
      if (Math.random() < mutationChance) {
        mergedDNA.DirectionalThrusts[i] = this.createRandomDirectionalThrust(dt);
      } else {
        if (Math.random() < weakerMergeChance) {
          mergedDNA.DirectionalThrusts[i] = weakerDNA.DirectionalThrusts[i];
        } else {
          mergedDNA.DirectionalThrusts[i]= fittestDNA.DirectionalThrusts[i];
        }
      }
    }

    return mergedDNA;
   }

   private static createRandomDirectionalThrust(dt: number): Vector3 {
    const sign = Math.sign(Math.random() - 0.5);
    const scalingFactor = 250000 * dt;

    return new Vector3(sign * scalingFactor * Math.random(), 0, 0);
   }
}

export default RocketDNA;
