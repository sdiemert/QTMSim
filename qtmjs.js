"use strict";
/**
 * Created by sdiemert on 2017-03-29.
 */
/**
 * This file is the entry point for this package.
 *
 * Provides options for running on the command line or via a GUI.
 */

const cmdArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const fs = require("fs");
const csv = require("csv-parse/lib/sync");

const cmdOpts = [
    {name : "machine", alias : "m", type:String, description: "Path to a machine specification (csv) file"},
    {name : "tape", alias : "t", type:String, description: "Path to a (csv) file containing a tape OR a string representing the tape with alphabet {0,1,#}, e.g. 010#"},
    {name : "iterations", alias : "i", type:Number, defaultOption: 10, description : "The maximum number of iterations to run the simulation for, may halt sooner"},
    {name : "help", alias : 'h', type:Boolean, description: "Prints this help message"}
];

const args = cmdArgs(cmdOpts);

const usage = getUsage([
    { header : "Quantum Turing Machine Simulator", content : "A simulator for quantum turing machines (QTMs) written in JavaScript"},
    { header : "Options", optionList: cmdOpts },
    { header : "Examples", content : [
        {desc : "Deutsch's problem with (f(x) = x) as the oracle", example: '$ node qtmjs.js -m ./specs/qtm-6.csv -t 01# -i 5'}
    ]
    }
]);


if(printHelp(args)){
    console.log(usage);
    process.exit();
}

const mFile = args.machine;

if(!fs.existsSync(mFile)){
    console.log("Cannot find machine file:", mFile);
    process.exit(1);
}

const tapeMatch = new RegExp(/^[012#]+$/g);
const tapeInput = args.tape;

let x,y;
if((x = !tapeMatch.exec(tapeInput)) && (y = !fs.existsSync(tapeInput))){
    if(y && !x) console.log("Could not find tape file:", tapeInput);
    else console.log("Tape", tapeInput, "is invalid, you may only use the alphabet {0,1,#}");
}

// -------------- DONE CHECKS, begin parsing.... -------------------------

const Builder = require("./Builder");
const qtm = require("./QTM");

runCommadLineSimluation();

function runCommadLineSimluation () {

    let T;
    if (x && !y) T = csv(fs.readFileSync(tapeInput, "utf-8"))[0];
    else T = tapeInput;

    for (let i = 0; i < T.length; i++) {
        T[i] = parseInt(T[i]);
    }

    /** @type QTM {qtm.QTM} */
    let QTM = Builder.machineFromFile(mFile, T.length, 3);

    console.log("Running Simulation");
    console.log("-----------------------");
    QTM.execute(T, 0, args.iterations || 10, function (M) {
    });
    console.log("-----------------------");
    console.log("Simulation Complete!");
    console.log("=======================");
    console.log('Measured Configuration:');
    displayConfiguration(QTM.measure());
    console.log('Final superposition:');
    displaySuperposition(QTM.getSuperposition());
}


// ------------ UTIL FUNCTIONS -----------------

function printHelp(A){
    if(A.help) return true;
    else if(!A.machine) return true;
    else if(!A.tape) return true;
    else return false;
}

/**
 * @param C {Configuration[]}
 */
function displaySuperposition(C){
    for(let c = 0; c < C.length; c++){
        displayConfiguration(C[c],true);
    }
}

/**
 *
 * @param C {Configuration}
 * @param p {Boolean} show the probability?
 */
function displayConfiguration(C, p){
    let S = "";
    for(let i = 0; i < C.tape.length; i++){
        if(i === C.headPosition){
            S += "["+C.tape[i]+"] ";
        }else{
            S += C.tape[i]+" ";
        }
    }
    if (p) S += "-> "+ C.amplitudeSquared.toFixed(4);
    console.log("\tq"+C.machineState, ":", S);
}
