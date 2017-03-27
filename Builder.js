"use strict";
/**
 * Created by sdiemert on 2017-03-14.
 */

const QTM = require("./QTM").QTM;
const fs = require("fs");
const csv = require("csv-parse/lib/sync");
const math = require("mathjs");

/**
 * Counts the number of unqiue states the machine has.
 *
 * @param A {Array} 2D array representing the machine spec.
 *
 * @return {number} the number of unqiue states in the machine spec.
 */
function countStates(A){
    const Q = [];
    for(let i = 0; i < A.length; i++){
        let x = A[i][0];
        if(Q.indexOf(x) < 0){
            Q.push(x);
        }
    }
    return Q.length;
}

/**
 * Makes a QTM from the input 2D array
 * @param M {Array} contains the specification for the QTM
 * @param Nt {number} number of cells in the tape
 * @param base {number} number of tape symbols
 */
function buildMachine(M, Nt, base){

    const S = [];

    for(let i = 0; i < M.length; i++){
        let q1 = parseInt(M[i][0]);
        let r = parseInt(M[i][1]);
        let w = parseInt(M[i][2]);
        let m = parseInt(M[i][3]);
        let q2 = parseInt(M[i][4]);
        let a = math.complex(M[i][5]);
        S.push([q1, r, w, m, q2, a]);
    }

    const Ns = countStates(S);
    const Nx = math.pow(base, Nt) * Ns * Nt;

    console.log("Building machine, tape size:", Nt, "Size: ", Nx);

    let U = math.zeros(Nx, Nx);

    for(let i = 0; i < S.length; i++){
        U = math.add(U, makeTransferMatrix(S[i][0], S[i][1], S[i][2], S[i][4], S[i][3], Nt, Ns, S[i][5], Nx));
    }

    console.log("Built new machine, matrix is size: ", U.size());

    return new QTM(U, Ns,0, Nt);

}

function machineFromFile(fname, Nt, base){
    // read file and remove duplicate new line characters.
    const blob = fs.readFileSync(fname, "utf-8").replace(/\n\n/g, "\n");

    console.log(blob);

    return buildMachine(csv(blob), Nt, base);
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

    console.log(q1, r, w, m, q2, I ,Q, a, x);

    let U = math.zeros(x,x, 'sparse');

    let i,k,z, b0, b1, cx, c0, rx, r1;
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



module.exports = {
    buildMachine : buildMachine,
    machineFromFile : machineFromFile
};
