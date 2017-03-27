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


let counts = {};
/** @type {Configuration} */
let c = null;
for(let i = 0; i < 10; i++){
    c  = QTM.execute(T, 0, 5);

    if(!counts[c.configurationId]) counts[c.configurationId] = {configuration : c, count : 1};
    else counts[c.configurationId].count += 1;

    console.log(c.toString());

}

console.log(counts);





