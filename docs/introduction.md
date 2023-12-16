---
outline: deep
title: Introduction
---

# What is EliCS?

EliCS is a TypeScript and JavaScript ECS (Entity-Component-System) framework designed for building dynamic and complex applications, especially in the domain of 3D web applications and games. As a lightweight, flexible, and robust ECS framework, EliCS is inspired by the principles and architecture of the now archived [ECSY](https://github.com/ecsyjs/ecsy) project by Mozilla.

EliCS stands out with its approach to combining simplicity with functionality, offering an intuitive and predictable experience for developers. It aims to streamline the development process without sacrificing the core strengths of an ECS framework: modularity, maintainability, and scalability.

## Why Was EliCS Built?

### The Journey from ECSY to EliCS

My journey with ECS frameworks began with the implementation of Project Flowerbed, a WebXR experience developed at Meta Reality Labs. During this project, we chose ECSY for its popularity and the backing of a reputable organization like Mozilla. Despite its strengths, the unexpected archiving of ECSY by Mozilla posed a challenge, especially when we encountered unpredictable behavior and lack of robustness towards the end of the project's development cycle.

#### Unpredictable Behavior and Lack of Robustness

The complexities encountered in ECSY highlighted the need for a more predictable and robust system. As a developer, I realized the importance of simplicity in operation and the need for a type-safe implementation to ease the diagnostic process.

#### The Search for Alternatives

After moving away from ECSY, I explored [BitECS](https://github.com/NateTheGreatt/bitECS). Despite its impressive performance, BitECS's low-level approach and focus on TypedArrays led to a trade-off in ergonomics. The limitations in data storage and system implementations, particularly in handling non-primitive types and maintaining state, made it less suitable for complex 3D web applications.

### The Philosophy Behind EliCS

#### Ergonomics Over Extreme Performance

In the development of complex 3D web applications, the main performance bottleneck often lies in the 3D rendering process, not in the ECS processing. Through my experience with Project Flowerbed, it became evident that the overall impact of ECS on performance was minimal compared to the rendering demands.

In our observations, the ECS processing time (which includes creating, removing, querying, and updating entities, excluding the actual game logic) accounted for approximately 1-2% of the total frame time. When comparing the use of ECSY versus BitECS, which theoretically offers a tenfold performance improvement, the actual gain in the overall application performance was less than 1%.

This data highlighted a critical insight: sacrificing developer ergonomics for a marginal performance boost is not justifiable. While BitECS, with its focus on using TypedArrays for maximum performance, showed significant improvements on paper, the real-world impact on the total application performance was minimal.

#### Filling the Gap

EliCS was thus conceived with the philosophy of prioritizing developer ergonomics, offering a framework that is intuitive, easy to use, and type-safe, without being encumbered by the complexities that often accompany performance-centric designs. It's built to provide a balanced approach, ensuring that while performance is not ignored, it does not come at the cost of the ease and simplicity crucial for efficient development.

EliCS is more than just an ECS framework; it's a tool crafted from real-world experiences and challenges, aimed at simplifying the development process while maintaining the power and flexibility of the ECS architecture.

## About EliXR Games

I am [Felix Z](https://twitter.com/felix_trz), a software engineer at Reality Labs, Meta, specializing in WebXR projects. My work includes the creation of the [Immersive Web Emulator](https://github.com/meta-quest/immersive-web-emulator), a WebXR development tool with over 6,000 active users. I also played a key role in developing [Project Flowerbed](https://github.com/meta-quest/ProjectFlowerbed), an award-winning WebXR experience.

In my personal endeavors, I am an active indie game developer. In 2022, I founded EliXR Games, focusing on developing innovative web-based gaming experiences. A major project under EliXR Games is the [EliXR Engine](https://github.com/felixtrz/elixr), a fully open-source WebXR game engine that I am actively developing.

One of our notable titles is [Elysian](https://elysian.fun/), a well-received WebXR shooter game that boasts over 100K monthly active users. Elysian showcases the viability and potential of the EliXR Engine in delivering compelling gaming experiences.

The development of EliCS was inspired by my work on these projects. EliCS is designed to be the backbone of the EliXR Engine, providing a robust and flexible ECS framework that enhances the engine's capabilities. The integration of EliCS into the EliXR Engine is a testament to our commitment to creating a powerful and user-friendly platform for WebXR development.
