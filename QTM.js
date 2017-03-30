"use strict";
/**
 * Created by sdiemert on 2017-03-14.
 */

const math = require("mathjs");
const util = require("util");

class Configuration{

    /**
     * @param cid {number}
     * @param i {number} head position
     * @param T {Array} tape
     * @param q {number} state
     * @param a {math.Complex=1} coefficient for the configuration.
     */
    constructor(cid, i, T, q, a){

        this.configurationId = cid;

        this.headPosition = i;
        this.tape         = JSON.parse(JSON.stringify(T));
        this.machineState = q;

        /** @type {math.Complex} */
        this.coefficent = null;

        if(a !== undefined && a !== null) this.coefficent = math.complex(a);
        else this.coefficent = math.complex(1,0);

        /** @type {number} */
        this.amplitudeSquared = math.pow(this.coefficent.re, 2) + math.pow(this.coefficent.im, 2);

    }

    /**
     *
     * @param z {Complex}
     * @param p {number} fixed point precision
     */
    complexToString(z, p){
        if(z){
            return z.re.toFixed(p) + (z.im !==0 ? ("i" + z.im.toFixed(p)) : "");
        }else{
            return "";
        }
    }

    toString(){
        let S = "{ id: "+this.configurationId+", state: " + this.machineState
            + (this.coefficent !== null ? ", coeff : "+this.complexToString(this.coefficent, 2) : "")
            + (this.amplitudeSquared !== null ? ", amp^2: "+ this.amplitudeSquared.toFixed(2) : "")
            +", tape: ";

        let s = "";
        for(let i = 0; i < this.tape.length; i++){

            if(this.tape[i] === 2) s = "#";
            else s = this.tape[i];

            if(i === this.headPosition){
                S += "["+s+"] ";
            }else{
                S += s+" ";
            }
        }

        S += "}";
        return S;
    }

    setCoefficent(c){
        this.coefficent       = c;
        this.amplitudeSquared = math.pow(this.coefficent.re, 2) + math.pow(this.coefficent.im, 2);
    }
}

class QTM{

    /**
     * @param U {math.Matrix}
     * @param numStates {number}
     * @param start {number}
     * @param tapeLength {number}
     * @param halt {number}
     */
    constructor(U, numStates, start, tapeLength, halt){
        /** @type U {math.Matrix} */
        this.U = U;
        this.tapeLength = tapeLength;
        this.numStates = numStates;
        this.start = start;
        this.halt = halt || (numStates - 1); // default is highest state number

        this.V = null;
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

        const index = i;
        const pow3t = Math.pow(3, this.tapeLength);

        const head = Math.floor(i / (this.numStates * pow3t));
        const state = Math.floor((i - (head * this.numStates * pow3t)) / pow3t);

        i = Math.floor(i - head * state * pow3t);

        let tape = [];

        for(let k = this.tapeLength - 1; k >= 0; k--){
            tape.push(i % 3);
            i = Math.floor(i / 3);
        }

        return new Configuration(index, head,tape,state);

    }

    /**
     * @returns {Configuration[]}
     * @private
     */
    getSuperposition(){

        const L = this.tapeLength * this.numStates * math.pow(3, this.tapeLength);

        let v = null, r = null, R = [];

        for(let i = 0; i < L; i++){
            v = math.subset(this.V, math.index(i,0));
            if(v != 0){
                r            = this.stateFromIndex(i);
                r.setCoefficent(math.complex(v));
                R.push(r);
            }
        }

        if(R.length === 0) R.push("empty");

        return R
    }

    /**
     * Executes the QTM. The machine will halt if: 1) the number of steps taken exceeds in provided bound, or
     *  2) the machine ends up in a superposition of the halting state.
     *
     * @param T {Array} an array of integers (0,1,2) to represent the tape, must be same size as machine.
     * @param i {number} the index to start the head of the machine at on the tape, defaults to zero.
     * @param n {number} an upper bound on the number of steps to allow the machine to take.
     * @param fn {function=} call this function after each machine step, passes machine reference.
     *
     * @return nothing, finishes when the machine has halted (after n steps or when halting state is reached).
     */
    execute(T, i, n, fn) {

        if (i === null || i === undefined) i = 0;

        // TODO : Check tape length is OK.

        this.V = math.zeros(this.U.size()[0], 1);
        let j = this.indexFromState(0, T);
        this.V = math.subset(this.V, math.index(j,0), 1);

        for (let i = 0; i < n && !this.haltingSuperposition(); i++) {
            this.V = math.multiply(this.U, this.V);
            if(fn) fn(this);
        }

    }

    /**
     * Determines if the machine is in a superposition of halting states.
     *
     *  @return {boolean}
     */
    haltingSuperposition(){

        if(this.start === this.halt) return false; //if the start and halting state are the same we have a problem.

        const S = this.getSuperposition();
        for(let s = 0; s < S.length; s++){
            if(S[s].machineState !== this.halt) return false;
        }
        return true;
    }


    _checkRow(i){
        let u, v;
        for(let k = 0; k < this.U.size()[0]; k++){

            u = math.subset(this.U, math.index(i,k));
            if(u != 0){
                v = math.subset(this.V, math.index(k, 0));
                console.log(u, v);
            }
        }
    }

    /**
     * Measures the current state of the QTM - does this using "real" quantum
     * measurement, i.e. collapses the super position and returns a machine
     * configuration based on a probabilistic measure.
     *
     * @return {Configuration}
     */
    measure(){

        let S = this.getSuperposition();

        const r = Math.random(); // random between 0 and 1.
        let s = 0;

        for(let i = 0; i < S.length; i++){
            if(r >= s && r < s + S[i].amplitudeSquared){

                S[i].amplitudeSquared = null;
                S[i].coefficent = null;

                return S[i]; // return the Configuration
            }
            s += S[i].amplitudeSquared;
        }

    }

    /**
     * @return {string}
     */
    toString(){
        return "{ numStates : " + this.numStates +", tapeLength: "
            + this.tapeLength + ", start:" + this.start + ", halt: " + this.halt + ", U: " + this.U.size()[0] + " }"
    }
}

module.exports = {QTM : QTM};
