# Genetic Rockets
Genetic Rockets is a simple demonstration which applies the theory of genetic algorithms; solving a problem through the process of natural selection. This repository contains a web application that models a simple rocket whose goal it is, is to reach the circular target which is blocked by a wall. 

This web application was written using:

 - Typescript
 - HTML
 - Three.js

## Demo
A demo is available at: <https://alexlukeneumann.github.io/genetic-rockets/public>.

## How To
To run the repository locally, run the following command (using http-server npm packaged installed globally):

 - npm run serve

To compile any local changes to the repository, run the following command:

 - npm run build

Or use the watcher to listen out for changes and automatically compile them:

 - npm run watch

## Rocket Model
Each rocket is modelled using a simple force diagram:

![A diagram depicting the forces acting upon the rocket.](https://raw.githubusercontent.com/alexlukeneumann/genetic-rockets/main/docs/force-diagram.PNG)

The upward thrust of the rocket is depicted by the well known, simplified, rocket thrust equation:

![Thrust equation acting upon the rocket.](https://raw.githubusercontent.com/alexlukeneumann/genetic-rockets/main/docs/thrust-equation.PNG)

where T is the thrust of the rocket, v is the particle exhaust velocity and dm/dt represents the mass flow rate of the rocket.

The directional force on the rocket (along the x-axis) can be applied in either direction. This force is modelled as a simple instaneous force applied to the rocket with a 'wind-resistive' like force applied to the rocket along the x-axis to constrain the x-axis movement.

## Algorithm
Each rocket is setup up with a some 'DNA' which is represented by the RocketDNA class. This class contains the information needed to apply a random directional force to the rocket for a given length. 

On the initial seed of the simulation, each rocket has its DNA randomly generated which will contain the directional information of the rocket for the lifetime of a generation. The simulation is then random for the number of specified frames.

Per frame:

 - The rocket's distance to the target is calculated and the best result is stored over the course of the lifetime.

At the end of the generation lifetime, the following occurs:

 - Normalize each rocket's best distance to the target against a defined linear scale. This defines the 'fitness' of the rocket.
 - All rockets are sorted against their fitness values.
 - Rockets with a better fitness value are then 'mated' with the weakest rockets. For each rocket pair: the weaker rocket's DNA has a chance to take parts of the fitter rocket's DNA, where the greater the fitness difference, the higher the chance that more of the fitter rocket's DNA is merged into the weaker rocket's DNA.
 - The fitness rockets DNA remains mostly unaltered but may mutate slightly. A mutation is where a random directional gene is completely replaced with a new random directional gene. As a rocket gets closer to the target, the chance for mutation decreases to a base value.

During the generation:

 - If a rocket collides with the wall, then the rocket is scored a fitness value of 1.0 denoting poor fitness.
 - If a rocket collides with the target, then the rocket is scored a fitness value of 0.0 denoting great fitness.
