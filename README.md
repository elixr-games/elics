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

This repository includes a benchmark suite comparing EliCS to popular object-based ECS implementations - [becsy](https://lastolivegames.github.io/becsy/) and [ecsy](https://ecsyjs.github.io/ecsy/). Build the project and run the benchmark suite:

```bash
npm run bench
```

The suite runs several scenarios derived from the [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark) tests:

- **Packed Iteration (5 queries)** – 1,000 entities each with components A–E. Each query doubles the value stored in a single component.
- **Simple Iteration** – 4,000 entities split across various component sets; three systems swap component values.
- **Fragmented Iteration** – 26 component types (A–Z) with 100 entities each plus a Data component. Two queries double the Data and Z values.
- **Entity Cycle** – 1,000 entities repeatedly spawn and then destroy entities with a B component.
- **Add / Remove** – 1,000 entities each add then remove a B component.

Execution times for EliCS and ecsy are printed in milliseconds for easy comparison, here's a snapshot of the results (**smaller is better**):

<!-- benchmark-start -->

**Packed Iteration**:
  - `EliCS`: █████████ **4.24 ms**
  - `Becsy`: ██████████████████ 8.38 ms
  - `Ecsy `: ████████████████████ 8.99 ms

**Simple Iteration**:
  - `EliCS`: ██████ **3.95 ms**
  - `Becsy`: ███████████ 6.94 ms
  - `Ecsy `: ████████████████████ 11.87 ms

**Fragmented Iteration**:
  - `EliCS`: ██████████ **2.56 ms**
  - `Becsy`: ████████████████████ 4.79 ms
  - `Ecsy `: █████████████ 3.31 ms

**Entity Cycle**:
  - `EliCS`: ██ **17.78 ms**
  - `Becsy`: █████ 36.95 ms
  - `Ecsy `: ████████████████████ 131.54 ms

**Add / Remove**:
  - `EliCS`: ████ **8.72 ms**
  - `Becsy`: ████ 9.03 ms
  - `Ecsy `: ████████████████████ 40.49 ms
<!-- benchmark-end -->
