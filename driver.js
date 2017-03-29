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
let QTM = Builder.machineFromFile("./specs/qtm-8.csv", T.length, 3);


let counts = {};
/** @type {Configuration} */
let c = null;

c  = QTM.execute(T, 0, 5);

console.log(c.toString());
console.log(QTM._getSuperposition().toString());





