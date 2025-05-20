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

This repository includes a simple performance benchmark comparing EliCS to
[ecsy](https://ecsyjs.github.io/ecsy/). After building the library, run the benchmark script
to measure update loop performance:

This script runs several scenarios inspired by the noctjs ecs-benchmark:
- Packed Iteration
- Simple Iteration
- Fragmented Iteration
- Entity Cycle
- Add/Remove

```bash
npm run build
node benchmarks/ecs-benchmark.js [iterations]
```

Pass an optional iteration count to control the duration of each test. Results are printed in milliseconds for both frameworks.
