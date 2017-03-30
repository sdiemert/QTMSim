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
const S = "" +
    "0,0,1,0,R,1\n" +
    "0,1,1,0,R,1\n" +
    "0,#,#,0,0,1\n";

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

```text
{ id: 310, state: 0, tape: 1 1 1 [#] } 
```

The machine terminated in state `0`  with a tape of `111#` and the head on the last cell. The `id` field gives a unique identifier for this particular state. 

The code the this example may be found in `examples/api-example-1.js`. To run the example execute, `$ node examples/api-example-1.js`

### Bit Parity

*Note: this is not a quantum algorithm, for a simply quantum algorithm/problem see Deutsch's problem below.*

This example shows how to create a new QTM from a machine specification in a file. As above, it uses the API to build a new machine, execute it, and then observe its state.

The machine specification CSV, given as: state, read, write, next state, move, amplitude.

```
; even parity state
0,0,0,0,R,1
0,1,1,1,R,1
0,#,0,2,0,1

; odd parity state
1,0,0,1,R,1
1,1,1,0,R,1
1,#,1,2,0,1

; halting state
2,0,0,#,0,1
2,1,1,#,0,1
2,#,#,#,0,1
```

This machine specification may be found in `examples/qtm-parity.csv`.

```JavaScript
const qtmjs = require("../qtmjs");

const T = "000#";

// Build the machine from a file
const Q = qtmjs.buildQTMFromFile('examples/qtm-parity.csv', 4);

// Execute the machine and provide call back to called after each execution step.
// Print the machine's superposition after each execution step.
Q.execute(qtmjs.buildTape(T),0,10, function(Q){
    console.log(Q.getSuperposition().toString());
});

console.log("------------");
console.log(Q.measure().toString());
```

This code produces the following: 

```text
{ id: 54, state: 0, coeff : 1.00, amp^2: 1.00, tape: [0] 0 0 # }
{ id: 297, state: 0, coeff : 1.00, amp^2: 1.00, tape: 0 [0] 0 # }
{ id: 540, state: 0, coeff : 1.00, amp^2: 1.00, tape: 0 0 [0] # }
{ id: 783, state: 0, coeff : 1.00, amp^2: 1.00, tape: 0 0 0 [#] }
{ id: 891, state: 2, coeff : 1.00, amp^2: 1.00, tape: 0 0 0 [0] }
------------
{ id: 891, state: 2, tape: 0 0 0 [0] }
```

Here, after each step the superposition of the machine is printed. Since this machine is entirely deterministic the machine remains in a single configuration after each step. The machine ends up in state 2 with the calculated parity on the last cell being 0 as wanted.

The code for this example may be found in: `examples/api-example-2.js`. To run the code execute: `$ node examples/api-example-2.js`

### Deutsch's Problem

Deutsch's problem is a toy problem for demonstrating how a quantum machine can provide exponential speed up (when compared with a classical machine). The problem is a simplification of the Deutsch-Jozsa problem. You can read more about it here [https://en.wikipedia.org/wiki/Deutsch%E2%80%93Jozsa_algorithm](https://en.wikipedia.org/wiki/Deutsch%E2%80%93Jozsa_algorithm).

Four QTM specifications are provided in `specs` folder, one for each possible configuration in Deutsch's problem.

Run them by `$ node qtmjs.js -m ./specs/qtm-x.csv -t 01# -i 10`

## API

QTMS are builting using factory methods which return a QTM object which may be executed and measured.

#### buildQTMFromText(text, tapeLength)

Creates a new QTM object based on the machine specification provided as a CSV string via the text parameter. Also requires that the tape length (integer > 0) be provided. The new machine will only work on tapes of the specified length.

See the Overwriter example for sample usage.  


#### buildQTMFromFile(file_path, tapeLength)

Creates a new QTM object based on the machine specification found in the file at the provided path. The machine must be specified as a CSV string within the file. Also requires that the tape length (integer > 0) be provided. The new machine will only work on tapes of the specified length.

See the Parity example for sample usage.  

#### buildTape(tapeString)

Creates an array tha represents the machine's tape. The first cell of tape will be the 0th index of array. Blank (`#`) characters are replaced by the integer `2`.

#### QTM.execute(tapeArray, headStart, iterations [, callback])

Executes the QTM on the provided tapeArray (ideally built using the `buildTape` function above). The execution will start with the machine's head at position `headState` and continue for at most `iterations` steps. 

The execution will stop if: 1) the number of steps executed reaches `iterations`; or 2) the machine is in a superposition consisting solely of the halting state (the last state given in the machine specification).

A callback by optionally be provided, this will be called after each execution step with a reference to the machine passed as a parameter. The caller may do anyhting they want to the machine's state at this point.

See the examples above for sample usage. 

#### QTM.measure()

Measures (observes) the QTM's state. This method simulates "collapsing" the superposition of the machine and returns only one configuration. Note, this does not effect the actual machine superposition. Use this method if you wish to simulate what would occur if one were actually observe a real quantum turing machine.

The returned machine `Configuration` is measured with some probability, if a non-deterministic machine is being used several executions and measurements may be required to achieve the desired confidence in the result.

If you would like to see the *superposition* of the machine, call `QTM.getSuperposition()` instead.

See the examples above for sample usage.

#### QTM.getSuperposition()

Returns an array of machine `Configuration` objects which represent the superposition of states the QTM is in. `Configuration`s contain the machine and tape state as well as a complex coefficent describing the probability of being in that particular state (actaully abs(coefficent)^2 gives probability).

*Note: we are able to do this because this is a simulator, if we had a real QTM observation would result in a superposition collapose*

See the examples above for sample usage.
