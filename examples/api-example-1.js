"use strict";
/**
 * Created by sdiemert on 2017-03-29.
 */

const qtmjs = require("../qtmjs");

// a simple machine specification that overwrites the
// the tape with 1's until it reaches the first blank.
const S = "0,0,1,0,R,1\n0,1,1,0,R,1\n0,#,#,0,0,1\n";

const T = "000#";

const Q = qtmjs.buildQTMFromText(S, 4);

Q.execute(qtmjs.buildTape(T),0,10);

console.log(Q.measure().toString());