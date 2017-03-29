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

    console.log("Building machine, state size:", Ns, "tape size:", Nt, "Size: ", Nx);

    let U = math.zeros(Nx, Nx);

    for(let i = 0; i < S.length; i++){
        U = math.sparse(math.add(U, makeTransferMatrix(S[i][0], S[i][1], S[i][2], S[i][4], S[i][3], Nt, Ns, S[i][5], Nx)));
    }

    console.log("Unitary?", checkUnitary(U, Ns, Nt));

    var Q = new QTM(math.matrix(U, 'sparse'), Ns, 0, Nt, getLastState(S));

    console.log("New machine: " + Q.toString());

    return Q;

}


function getLastState(S){

    let maxVal = S[0][0];

    for(let i = 0; i < S.length; i++){
        if(S[i][0] > maxVal) maxVal = S[i][0];
    }

    return maxVal;

}

/**
 *
 * @param fname {string}
 */
function machineFromMatrixFile(fname){

    /** @type {QTM} */
    const M = JSON.parse(fs.readFileSync(fname, 'utf-8'));

    const U =  math.matrix(math.complex(M.U.data), 'sparse');

    return new QTM(U, M.numStates, M.start, M.tapeLength, M.halt);

}

function machineFromFile(fname, Nt, base){

    let matrixRegex = /\.matrix/;
    let csvRegex = /\.csv/;

    if(matrixRegex.exec(fname)){

        return machineFromMatrixFile(fname);

    }else if(csvRegex.exec(fname)){
        // read file and remove duplicate new line characters.
        const blob = fs.readFileSync(fname, "utf-8").replace(/\n\n/g, "\n").replace(/\n;.*\n/g, "\n");
        const M =  buildMachine(csv(blob), Nt, base);

        //write machine to file for speed later.
        fs.writeFileSync(fname.replace(/\.csv/g, ".matrix"), JSON.stringify(M), 'utf-8');

        return M;

    }else{
        return null; // nothing found.
    }


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

    let i,k,z, b0, b1, cx, c0, rx, r1, ip3, Ip3;

    for(i = 0; i < I; i++){

        // cache some frequently computed values...
        ip3 = math.pow(3,i);
        Ip3 = math.pow(3,I);

        b0 = Ip3*Q*i + q1 * Ip3; // base of starting state
        b1 = Ip3*Q*(i+m) + q2 * Ip3; // base of terminating state


        for(z=0; z < math.pow(3, I-i-1); z++){

            for(k = 0; k < ip3; k++){
                cx = k + 3 * ip3* z + r * ip3;
                c0 = b0 + cx;
                rx = k + 3 * ip3 * z + w * ip3;
                r1 = b1 + rx;

                //console.log(r1, c0, a);

                if(r1 >= x || r1 < 0){
                    console.log("overflow", r1, c0, a);
                    U = math.subset(U, math.index(c0, c0), 0);
                }else{
                    U = math.subset(U, math.index(r1, c0), a);
                }
            }
        }
    }


    return U;
}


/**
 *
 * @param U {Matrix}
 * @param t {number}
 * @param q {number}
 */
function checkUnitary(U, q, t){

    console.log("checking unitary...");
   const Up = math.matrix(math.transpose(math.conj(U)), 'sparse');

   console.log("found conj transpose");

   const X = math.multiply(Up, U);

   console.log("found result"); /*

     /*
    We can only consider the first t-1 cells of the tape,
    the last cell will have invalid movements due to the machine
    actually needing an infinite tape....
    */

    var S = "", Su = "";

    for(var i = 0; i < X.size()[0]; i++){

        for(var j = 0; j < X.size()[0]; j++){

            S += math.subset(X, math.index(i,j)) +" ";
            Su += math.subset(U, math.index(i,j)) +" ";

        }
        S += "\n";
        Su += "\n";
    }

    //console.log(S);
    //console.log(Su);

    fs.writeFileSync('matrix.txt', Su, 'utf-8');

   const R = math.range(0, math.pow(3, t-1) * (t-1) * q);

   const Xs = math.subset(X, math.index(R, R));

   return math.deepEqual(Xs, math.eye(R.size()[0]));
}

/**
 *
 * @param U {math.Matrix}
 *
 * @return {boolean}
 */
function checkMatrixAmplitudes(U){

    const s = U.size()[0];

    let rowSum, v;

    for(let i = 0; i < s; i++){
        rowSum = 0;
        for(let j = 0; j < s; j++){

            v = math.complex(math.subset(U, math.index(i,j)));

            rowSum += math.pow(v.re, 2) + math.pow(v.im, 2);

        }

        if(rowSum > 1) return false;

    }

    return true;

}



module.exports = {
    buildMachine : buildMachine,
    machineFromFile : machineFromFile
};
