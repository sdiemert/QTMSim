"use strict";
/**
 * Created by sdiemert on 2017-03-14.
 */

var fs = require("fs");
var csv = require("csv-parse/lib/sync");
var math = require("mathjs");

var blob = fs.readFileSync("./qtm-1.csv", "utf-8");
var TMSpec = csv(blob);

for(var i = 0; i < TMSpec.length; i++){
    for(var j = 0; j < TMSpec[i].length; j++){
        TMSpec[i][j] = parseInt(TMSpec[i][j]);
    }
}

blob  = fs.readFileSync("./tape-1.csv", "utf-8");
var T = csv(blob)[0];

for(var i = 0; i < T.length; i++){
    T[i] = parseInt(T[i]);
}

var Nt = T.length;
var Ns = 2; // TODO: make this count states on input
var Nx = math.pow(3, Nt) * Ns * Nt;

console.log(T);

// Setup the initial state matrix
var V = math.zeros(Nx, 1);
var j = indexFromState(0,0, T, Ns);
V = math.subset(V, math.index(j,0), 1);


// Get the machine transfer matrix

var U = math.zeros(Nx, Nx);

for(var i = 0; i < TMSpec.length; i++){
    U = math.add(U, makeTransferMatrix(TMSpec[i][0], TMSpec[i][1], TMSpec[i][2], TMSpec[i][4], TMSpec[i][3], Nt, Ns,TMSpec[i][5], Nx));
}


console.log(V.toString());
V = math.multiply(U, V);
console.log(V.toString());



/**
 * Returns the index of a 1 for the state vector.
 * @param q {number} the current state number
 * @param i {number} tape cell number
 * @param T {Array} the input tape
 * @param Q {number} the number of states in the TM.
 */
function indexFromState(q,i,T,Q){
    var t = T.length;
    j = (i*Q)*math.pow(3, t) + q*math.pow(3,t);
    for(var y = 0; y < t; y++){
        j = j + math.pow(3,y)*T[y];
    }
    return j;
}

/**
 * Makes a transfer matrix for the command
 * @param q1 {number} initial state
 * @param r {number} read the value on cell - 0,1,2
 * @param w {number} write the value to the cell - 0,1,2
 * @param m {number} move -1, 0, 1
 * @param q2 {number} next state
 * @param I {number} number of tape cells
 * @param Q {number} number of machine states
 * @param a {math.Complex} transition weight
 * @param x {number} rows and cols of square matrix
 */
function makeTransferMatrix(q1, r, w, m, q2, I, Q, a, x){

    var U = math.zeros(x,x);

    var i,k,z, b0, b1, cx, c0, rx, r1;
    for(i = 0; i < I; i++){
        b0 = math.pow(3, I)*Q*i + q1 * math.pow(3,I); // base of starting state
        b1 = math.pow(3, I)*Q*(i+m) + q2 * math.pow(3,I); // base of terminating state

        for(z=0; z < math.pow(3, I-i-1); z++){

            for(k = 0; k < math.pow(3,i); k++){
                cx = k + 3 * math.pow(3, i) * z + r * math.pow(3, i);
                c0 = b0 + cx;
                rx = k + 3 * math.pow(3, i) * z + w * math.pow(3, i);
                r1 = b1 + rx;

                if(r1 >= x){
                    U = math.subset(U, math.index(c0, c0), a);
                }else{
                    U = math.subset(U, math.index(r1, c0), a);
                }
            }
        }
    }

    return U;
}
