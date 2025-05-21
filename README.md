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

This repository includes a benchmark suite comparing EliCS to popular ECS implementations -[bitecs](https://github.com/NateTheGreatt/bitECS), [koota](https://github.com/pmndrs/koota), [becsy](https://lastolivegames.github.io/becsy/) and [ecsy](https://ecsyjs.github.io/ecsy/). Build the project and run the benchmark suite:

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
  - `EliCS `: ██ **7.80 ms**
  - `Bitecs`: ██ 7.94 ms
  - `Koota `: ███████████ 33.26 ms
  - `Becsy `: ████████████████████ 58.91 ms
  - `Ecsy  `: ████ 13.10 ms

**Simple Iteration**:
  - `EliCS `: █ 10.60 ms
  - `Bitecs`: █ **10.15 ms**
  - `Koota `: █████████ 75.00 ms
  - `Becsy `: ████████████████████ 156.98 ms
  - `Ecsy  `: ██ 21.31 ms

**Fragmented Iteration**:
  - `EliCS `: ██ **3.55 ms**
  - `Bitecs`: ██████ 10.50 ms
  - `Koota `: ██████████████ 22.14 ms
  - `Becsy `: ████████████████████ 30.94 ms
  - `Ecsy  `: ████ 7.46 ms

**Entity Cycle**:
  - `EliCS `: ███ **52.97 ms**
  - `Bitecs`: ███████████ 179.39 ms
  - `Koota `: ██████████████████ 287.89 ms
  - `Becsy `: █████ 86.03 ms
  - `Ecsy  `: ████████████████████ 319.01 ms

**Add / Remove**:
  - `EliCS `: ██ **18.75 ms**
  - `Bitecs`: ████████████████████ 125.94 ms
  - `Koota `: ██████████████████ 119.17 ms
  - `Becsy `: ███ 20.64 ms
  - `Ecsy  `: █████████████████ 107.10 ms
<!-- benchmark-end -->
