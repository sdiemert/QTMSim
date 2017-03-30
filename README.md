# Quantum Turing Machine Simulator

This is a simulator package for a Quantum Turing Machine (QTM). This was completed as a course project for a graduate level course on quantum computing at the University of Victoria.

This simulator takes as input a machine specification and a tape and executes up to a specified number of steps of the machine.

**Table of Contents:**

* [Machine Specification](#machine-specification)
* [Examples](#examples)
    + [Simple Example](#overwriter)
    + [Bit Parity Example](#bit-parity)
    + [Deutsch's Problem](#deutschs-problem)
* [JavaScript API](#api)

## Machine Specification

Recall that Turing Machine has a state transition function that maps an internal machine state and read tape symbol to write tape symbol, a next state, and a movement direction. QTMs use a similar formulation, however they also have a complex number that acts as a coefficient of the transition. Thus a tuple in the transition function could be represented as `(q,r,w,q',m,a)`, there is the added restriction that `sum(|a_i|^2) = 1.0` for all `a_i` that have the same `q,r` pairings.

The simulator uses a tape with an alphabet consiiting of three symbols: `{0,1,#}`, here `#` may be replaced by `2`. The simulator allows head movement to the left, right, and no movement: `{L, R, 0}` which may also be given as `{-1, 1, 0}` (if one thinks of the head location as indices in a tape array)
  
CSV strings are used to provide machine specifications. Each row in the specification must have form: `state,read,write,next-state,move,coefficient`.

1. `state` - the first state, i.e. state of to transition out of, must be a number.
2. `read` - the symbol to read from the tape, one of `{0,1,#}`.
3. `write` - write this symbol to the tape, one of `{0,1,#}`. 
4. `next-state` - move to this state after writing and moving the tape head, one of must be a number.
5. `move` - move the head left, right, or do not move it, one of `{L,R,0,1,-1}`.
6. `coefficient` - the coefficient for the state, specified as a complex number, e.g. `1`, `0.5`, `1+i1` etc.

Tapes may be specified by as a string of characters (optionally comma separated), e.g. `000#` or `0,1,#`. Tapes are finite in length (this is a simulator) and are unidirectional, they extend from the left (index 0) to the right (index n-1).

See the examples below for sample machine and tape specifications.

### Note About Tape and Machine Sizes 

The space required by the simulator grows as `Q*n*3^n` where `n` is the size of the tape and `Q` is the number of states of the machine. In practice, any tapes larger than 4 cells (including blanks), will result in high memory usage*. This is at simulator and must explicitly consider all possible configurations of the machine. A true QTM would handle this much better. A quote from Bernstein and Vazirani's 1993 paper captures this sentiment nicely:

> The implications of this are quite extraordinary: even for a small system consisting of 200 particles, nature must keep track of 2^200 complex numbers just to “remember” its instantaneous state. Moreover, it must update these numbers at each instant to evolve the system in time. This is an extravagant amount of effort, since 2^200 is larger than the standard estimates on the number of particles in the visible universe. So if nature puts in such extravagant amounts of effort to evolve even a tiny system at the level of quantum mechanics, it would make sense that we should design our computers to take advantage of this.


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

**Problem Statement:** Given an oracle machine, M0, that implements some unary function, `f : {0,1} -> {0,1}`, we would like to determine if it is *constant* or *balanced*. 

**Formulation:** We create two machines: 0) machine M0, which computes `y XOR f(x)` for two inputs provided to it; and 1) machine M1, which determines whethere `f(x)` is constant or balanced by calling M0. 

**Classical Approach:** The classical approach would require `O(2^n)` operations. For this problem M1 would call M0 `2^1` times to determine whether the function is constant or balanced. This is an exponential operation for M1.  

**Quantum Approach:** In the quantum approach, the machine M1 first puts the input tape `xy# = 01#` into a superposition such that there are 4 possible configurations (`xy` is one of `00`, `01`, `10`, `11`). M1 then invokes M0 which computes `y XOR f(x)` and passes control back to M1 which tne reads cell `x`. If `x=0` then `f(x)` is constant, if `x=1` then `f(x)` is balanced.  

Here is a machine specification containing M1 and M0 where M0 computes `y XOR (f(x) = x)`. 

```text
; M1: put the input x into superposition
0,0,1,1,1,0.7071067811865476
0,0,0,1,1,0.7071067811865476
0,1,1,1,1,0.7071067811865476
0,1,0,1,1,-0.7071067811865476

; M1: put the input y into superposition
1,0,0,2,-1,0.7071067811865476
1,0,1,2,-1,0.7071067811865476
1,1,0,2,-1,0.7071067811865476
1,1,1,2,-1,-0.7071067811865476

; M0: read input x and advance to y.
2,0,0,3,1,1
2,1,1,4,1,1

; M0: f(x) = x, compute x is 0, we are reading y for y xor f(x)
3,0,0,5,-1,1
3,1,1,5,-1,1

; M0: f(x) = x, compute x is 1, we are reading y for y xor f(x)
4,0,1,5,-1,1
4,1,0,5,-1,1

; M1: collapse the super position on x
5,0,0,6,0,0.7071067811865476
5,0,1,6,0,0.7071067811865476
5,1,0,6,0,0.7071067811865476
5,1,1,6,0,-0.7071067811865476

; halting state
6,0,0,6,0,1
6,1,1,6,0,1
6,2,2,6,0,1
```

The following code will execute the machine, this is also in `examples/api-example-3.js`.

```JavaScript
const qtmjs = require("../qtmjs");

const T = "01#";

const Q = qtmjs.buildQTMFromFile('examples/qtm-deutsch.csv', 3);

Q.execute(qtmjs.buildTape(T),0,10, function(Q){
    console.log(Q.getSuperposition().toString());
});

console.log("------------");
console.log(Q.measure().toString());
```

Execute this code via: `$ js examples/api-example-3.js`. 

The following output is produced: 

```text
{ id: 21, state: 0, coeff : 1.00, amp^2: 1.00, tape: [0] 1 # }
{ id: 237, state: 1, coeff : 0.71, amp^2: 0.50, tape: 0 [1] # },{ id: 238, state: 1, coeff : 0.71, amp^2: 0.50, tape: 1 [1] # }
{ id: 72, state: 2, coeff : 0.50, amp^2: 0.25, tape: [0] 0 # },{ id: 73, state: 2, coeff : 0.50, amp^2: 0.25, tape: [1] 0 # },{ id: 75, state: 2, coeff : -0.50, amp^2: 0.25, tape: [0] 1 # },{ id: 76, state: 2, coeff : -0.50, amp^2: 0.25, tape: [1] 1 # }
{ id: 288, state: 3, coeff : 0.50, amp^2: 0.25, tape: 0 [0] # },{ id: 291, state: 3, coeff : -0.50, amp^2: 0.25, tape: 0 [1] # },{ id: 316, state: 4, coeff : 0.50, amp^2: 0.25, tape: 1 [0] # },{ id: 319, state: 4, coeff : -0.50, amp^2: 0.25, tape: 1 [1] # }
{ id: 153, state: 5, coeff : 0.50, amp^2: 0.25, tape: [0] 0 # },{ id: 154, state: 5, coeff : -0.50, amp^2: 0.25, tape: [1] 0 # },{ id: 156, state: 5, coeff : -0.50, amp^2: 0.25, tape: [0] 1 # },{ id: 157, state: 5, coeff : 0.50, amp^2: 0.25, tape: [1] 1 # }
{ id: 181, state: 6, coeff : 0.71, amp^2: 0.50, tape: [1] 0 # },{ id: 184, state: 6, coeff : -0.71, amp^2: 0.50, tape: [1] 1 # }
------------
{ id: 181, state: 6, tape: [1] 0 # }
```

The final superposition contains only the value `x=1`, thus M1 has correctly determined that `f(x)` was balanced. Moreover, it did it with 1 call to M0, in constrast to the 2 calls to M0 a classical machine would require.

The Deutsch-Josza problem is a generalization of this problem to functions with n inputs, i.e. `f : {0,1}^n -> {0,1}`. 

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
