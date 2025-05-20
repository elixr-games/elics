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

This repository includes a comprehensive performance benchmark comparing EliCS to
[ecsy](https://ecsy.io/). After building the library, run the benchmark script
to measure ECS update performance across several scenarios:

- **Packed Iteration** – five queries over 1,000 packed entities
- **Simple Iteration** – three independent systems operating on 4,000 entities
- **Fragmented Iteration** – 26 component types with 100 entities each
- **Entity Cycle** – repeatedly create and destroy entities
- **Add / Remove** – add and then remove a component from existing entities

```bash
npm run build
node benchmarks/ecs-benchmark.js [entities] [iterations]
```

The optional arguments define the number of entities to create and the number of
update iterations to execute. Results are printed in milliseconds for both
frameworks, allowing easy side‑by‑side comparisons.
