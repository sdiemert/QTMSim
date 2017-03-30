# Quantum Turing Machine Simulator

This is a simulator package for a Quantum Turing Machine (QTM). This was completed as a course project for a graduate level course on quantum computing that the University of Victoria.

This simulator takes as input a machine specification and a tape and executes a up to a specified number of steps of the machine.

## Examples

### Overwriter

*Note: this is not a quantum algorithm, for a simple quantum algorithm/problem see Deutsch's problem below.*

This example shows how to create a new QTM using only strings. It shows how to use the API to build a new machine, execute it, and then observe its state. 

```JavaScript
const qtmjs = require("../qtmjs"); 

// a simple machine specification that overwrites the
// the tape with 1's until it reaches the first blank.
const S = "0,0,1,0,R,1\n0,1,1,0,R,1\n0,#,#,0,0,1\n";

// Create tape string, this should be keep fairly short... 
const T = "000#";

// Build the new QTM object from the machine specification, tape length is 4.
const Q = qtmjs.buildQTMFromText(S, 4);

// Execute the machine, start with the head at cell 0 and halt after at most 10 iterations.
Q.execute(qtmjs.buildTape(T),0,10);


// After execution the machine will be in a halted state, 
// observe the superposition (in this cases mathematically trivial)
// by calling machine's observe method. 
console.log(Q.measure().toString());
```

The output of this script will be: 

```
{ id: 310, state: 0, tape: 1 1 1 [2] }
```

The machine terminated in state `0`  with a tape of `1112` and the head on the last cell. 

The code the this example may be found in `examples/api-example-1.js`. To run the example execute, `$ node examples/api-example.js`

### Bit Parity

*Note: this is not a quantum algorithm, for a simply quantum algorithm/problem see Deutsch's problem below.*




### Deutsch's Problem

Deutsch's problem is a toy problem for demonstrating how a quantum machine can provide exponential speed up (when compared with a classical machine). The problem is a simplification of the Deutsch-Jozsa problem. You can read more about it here [https://en.wikipedia.org/wiki/Deutsch%E2%80%93Jozsa_algorithm](https://en.wikipedia.org/wiki/Deutsch%E2%80%93Jozsa_algorithm).

Four QTM specifications are provided in `specs` folder, one for each possible configuration in Deutsch's problem.

Run them by `$ node qtmjs.js -m ./specs/qtm-x.csv -t 01# -i 10`

## API

### Building

QTMs are built using one of two factory methods:

#### buildQTMFromText(text, tapeLength)

Creates a new QTM object based on the machine specification provided as a CSV string via the text parameter. Also requires that the tape length (integer > 0) be provided. The new machine will only work on tapes of the specified length.


#### buildQTMFromFile(file_path, tapeLength)

Creates a new QTM object based on the machine specification found in the file at the provided path. The machine must be specified as a CSV string within the file. Also requires that the tape length (integer > 0) be provided. The new machine will only work on tapes of the specified length.



### Executing