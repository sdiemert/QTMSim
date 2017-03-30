"use strict";
/**
 * Created by sdiemert on 2017-03-29.
 */

const qtmjs = require("../qtmjs");


const T = "01#";

const Q = qtmjs.buildQTMFromFile('examples/qtm-deutsch.csv', 3);

Q.execute(qtmjs.buildTape(T),0,10, function(Q){
    console.log(Q.getSuperposition().toString());
});

console.log("------------");
console.log(Q.measure().toString());