"use strict";
/**
 * Created by sdiemert on 2017-03-14.
 */

const fs = require("fs");
const csv = require("csv-parse/lib/sync");
const math = require("mathjs");
const Builder = require("./Builder");
const qtm = require("./QTM");



let blob  = fs.readFileSync("./specs/tape-2.csv", "utf-8");
let T = csv(blob)[0];

for(let i = 0; i < T.length; i++){
    T[i] = parseInt(T[i]);
}

/** @type QTM {qtm.QTM} */
const QTM = Builder.machineFromFile("./specs/qtm-2-parity.csv", T.length, 3);

/*
const Nt = T.length;
const Ns = 2; // TODO: make this count states on input
const Nx = math.pow(3, Nt) * Ns * Nt;

// Setup the initial state matrix
let V = math.zeros(Nx, 1);
let j = indexFromState(0,0, T, Ns);
V = math.subset(V, math.index(j,0), 1);

console.log(V.toString());
V = math.multiply(QTM.U, V);
console.log(V.toString());

*/

QTM.execute(T, 0, 5);





