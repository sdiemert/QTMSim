# Quantum Turing Machine Simulator

This is a simulator package for a Quantum Turing Machine (QTM). This was completed as a course project for a graduate level course on quantum computing that the University of Victoria.

This simulator takes as input a machine specification and a tape and executes a up to a specified number of steps of the machine.

## Examples

Deutsch's problem is a toy problem for demonstrating how a quantum machine can provide exponential speed up (when compared with a classical machine). The problem is a simplification of the Deutsch-Jozsa problem. You can read more about it here [https://en.wikipedia.org/wiki/Deutsch%E2%80%93Jozsa_algorithm](https://en.wikipedia.org/wiki/Deutsch%E2%80%93Jozsa_algorithm).

Four QTM specifications are provided in `specs` folder, one for each possible configuration in Deutsch's problem.

Run them by `$ node qtmjs.js -m ./specs/qtm-x.csv` -t 01# -i 10`
