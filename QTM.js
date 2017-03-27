"use strict";
/**
 * Created by sdiemert on 2017-03-14.
 */

const math = require("mathjs");

class Configuration{

    /**
     * @param i {number}
     * @param T {Array}
     * @param q {number}
     * @param a {math.Complex=1} default to 1
     */
    constructor(i, T, q, a){
        this.headPosition = i;
        this.tape = JSON.parse(JSON.stringify(T));
        this.machineState = q;
        this.amplitude = a || math.complex(1);
    }
    toString(){
        let S = "{ state: " + this.machineState + ", amp : "+this.amplitude+", tape: ";

        for(let i = 0; i < this.tape.length; i++){
            if(i === this.headPosition){
                S += "["+this.tape[i]+"] ";
            }else{
                S += this.tape[i]+" ";
            }
        }

        S += " }";
        return S;
    }
}

class QTM{

    constructor(U, numStates, start, tapeLength){
        /** @type U {math.Matrix} */
        this.U = U;
        this.tapeLength = tapeLength;
        this.numStates = numStates;
        this.start = start;
    }

    /**
     * Returns the index of a 1 for the state vector.
     * @param i {number} tape cell number
     * @param T {Array} the input tape
     */
    indexFromState(i,T){
        let j = (i*this.numStates)*math.pow(3, this.tapeLength) + this.start*math.pow(3,this.tapeLength);
        for(let y = 0; y < this.tapeLength; y++){
            j = j + math.pow(3,y)*T[y];
        }
        return j;
    }

    /**
     *
     * @param i {number} the index into the state vector
     *
     * @return {Configuration}
     */
    stateFromIndex(i){

        const head = Math.floor(i / (this.numStates * Math.pow(3, this.tapeLength)));
        const state = Math.floor((i - (head * this.numStates * Math.pow(3,this.tapeLength))) / Math.pow(3, this.tapeLength));

        const base = Math.floor(i - head * state * Math.pow(3, this.tapeLength));

        let tape = [];

        for(let k = this.tapeLength - 1; k >= 0; k--){
            tape.push(i % 3);
            i = Math.floor(i / 3);
        }

        //console.log(i, head, state, tape);

        return new Configuration(head,tape,state);

    }

    _getSuperposition(V){

        const L = this.tapeLength * this.numStates * math.pow(3, this.tapeLength);

        let v = null, r = null, R = [];

        for(let i = 0; i < L; i++){
            v = math.subset(V, math.index(i,0));
            if(v != 0){
                r = this.stateFromIndex(i);
                r.amplitude = v;
                R.push(r);
            }
        }

        return R
    }

    /**
     * Executes the QTM.
     *
     * @param T {Array} an array of integers (0,1,2) to represent the tape, must be same size as machine.
     * @param i {number} the index to start the head of the machine at on the tape, defaults to zero.
     * @param n {number} an upper bound on the number of steps to allow the machine to take.
     */
    execute(T, i, n) {

        if (i === null || i === undefined) i = 0;

        // TODO : Check tape length is OK.

        let V = math.zeros(this.U.size()[0], 1);
        let j = this.indexFromState(0, T);

        V = math.subset(V, math.index(j,0), 1);

        this._getSuperposition(V);

        for (let i = 0; i < n; i++) {
            V = math.multiply(this.U, V);
            console.log(this._getSuperposition(V).toString());
        }

    }
}

module.exports = {QTM : QTM};
