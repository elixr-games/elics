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

Each scenario is executed 20 times and the average time is reported to reduce variance between runs.

Execution times for EliCS and ecsy are printed in milliseconds for easy comparison, here's a snapshot of the results (**smaller is better**):

<!-- benchmark-start -->

**Packed Iteration**:
  - `EliCS`: ██ **2.60 ms**
  - `Becsy`: ████████████████████ 27.02 ms
  - `Ecsy `: ██████ 7.92 ms

**Simple Iteration**:
  - `EliCS`: █ **3.25 ms**
  - `Becsy`: ████████████████████ 66.47 ms
  - `Ecsy `: ████ 10.61 ms

**Fragmented Iteration**:
  - `EliCS`: ██ **1.35 ms**
  - `Becsy`: ████████████████████ 14.00 ms
  - `Ecsy `: █████ 2.92 ms

**Entity Cycle**:
  - `EliCS`: ████ **21.84 ms**
  - `Becsy`: ███████ 40.57 ms
  - `Ecsy `: ████████████████████ 130.27 ms

**Add / Remove**:
  - `EliCS`: ████ **7.77 ms**
  - `Becsy`: █████ 8.85 ms
  - `Ecsy `: ████████████████████ 40.97 ms
<!-- benchmark-end -->
