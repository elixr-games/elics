# EliCS

A lightweight ECS framework that excels in complex 3D web applications, emphasizing flexibility to suit various development styles, without compromising on performance.

## Documentation

For detailed information about using EliCS, including concepts, guides, and API references, please visit our documentation site:

- [EliCS Documentation](https://elixr-games.github.io/elics/)

## License

EliCS is created by [Felix Z](https://github.com/felixtrz). This project is licensed under the MIT License. For more details, see the [LICENSE](LICENSE) file in this repository.

## Contributing

Your contributions are welcome! Please feel free to submit issues and pull requests. Before contributing, make sure to review our [Code of Conduct](CODE_OF_CONDUCT.md).

Thank you for being a part of the EliCS community!

## Benchmarks

This repository includes a benchmark suite comparing EliCS to [ecsy](https://ecsyjs.github.io/ecsy/). Build the project and run the script:

```bash
npm run build
node benchmarks/ecs-benchmark.js
```

The suite runs several scenarios derived from the [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark) tests:

- **Packed Iteration (5 queries)** – 1,000 entities each with components A–E. Each query doubles the value stored in a single component.
- **Simple Iteration** – 4,000 entities split across various component sets; three systems swap component values.
- **Fragmented Iteration** – 26 component types (A–Z) with 100 entities each plus a Data component. Two queries double the Data and Z values.
- **Entity Cycle** – 1,000 entities repeatedly spawn and then destroy entities with a B component.
- **Add / Remove** – 1,000 entities each add then remove a B component.

Execution times for EliCS and ecsy are printed in milliseconds for easy comparison.

### Results
<!-- benchmark-start -->
- **Packed Iteration**: **EliCS 3.97 ms** | ecsy 9.02 ms | becsy 8.39 ms (56% better)
- **Simple Iteration**: **EliCS 4.22 ms** | ecsy 11.33 ms | becsy 8.03 ms (63% better)
- **Fragmented Iteration**: **EliCS 2.32 ms** | ecsy 3.43 ms | becsy 3.27 ms (32% better)
- **Entity Cycle**: **EliCS 36.00 ms** | ecsy 131.61 ms | becsy 38.33 ms (73% better)
- **Add / Remove**: EliCS 32.28 ms | ecsy 43.13 ms | **becsy 8.49 ms** (80% better)
<!-- benchmark-end -->
