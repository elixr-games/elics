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
- **Packed Iteration**:
  - EliCS: ████████             **13.49 ms**
  - Ecsy:  █████████████        22.59 ms
  - Becsy: ████████████████████ 32.83 ms
- **Simple Iteration**:
  - EliCS: █████                **10.72 ms**
  - Ecsy:  ████████████████████ 39.32 ms
  - Becsy: ███████████████      30.21 ms
- **Fragmented Iteration**:
  - EliCS: ██████               **5.70 ms**
  - Ecsy:  ██████████           9.62 ms
  - Becsy: ████████████████████ 18.02 ms
- **Entity Cycle**:
  - EliCS: ██                   **56.65 ms**
  - Ecsy:  ████████████████████ 493.04 ms
  - Becsy: ██████               150.40 ms
- **Add / Remove**:
  - EliCS: ███                  34.44 ms
  - Ecsy:  ████████████████████ 177.60 ms
  - Becsy: ███                  **27.61 ms**
<!-- benchmark-end -->
