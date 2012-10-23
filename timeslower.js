//made by dave homan, @mrlasertron, while making drugbound
//http://drugbound.com
//Licenced under WTFPL
ig.module(
    'plugins.timeslower'
)
.requires(
    //'plugins.supertimer'
    'impact.system'
)
.defines(function(){
/*======================
 a Supertimer object is just an ig.Timer object that ignores
 the timeScale property of ig.Timer.  Note it is not a subclass of ig.Timer
 and does not inherit from ig.Timer, but is it's own class and
 inherits from ig.Class.
 Perfect for things that you want to remain in real-world time when using the Timeslower
 object below.
=========================*/
Supertimer = ig.Class.extend({
    target: 0,
    base: 0,
    last: 0,
    
    init: function( seconds ) {
        this.base = Supertimer.time;
        this.last = Supertimer.time;
        
        this.target = seconds || 0;
    },
    set: function( seconds ) {
        this.target = seconds || 0;
        this.base = Supertimer.time;
    },
    reset: function() {
        this.base = Supertimer.time;
    },
    tick: function() {
        var delta = Supertimer.time - this.last;
        this.last = Supertimer.time;
        return delta;
    },
    delta: function() {
        return Supertimer.time - this.base - this.target;
    }
});

Supertimer._last = 0;
Supertimer.time = 0;
Supertimer.maxStep = 0.05;

Supertimer.step = function(){
    var current = Date.now();
    var delta = (current - Supertimer._last) / 1000;
    Supertimer.time += Math.min(delta, Supertimer.maxStep);
    Supertimer._last = current;  
};

ig.System.inject({
    run: function() {
        ig.Timer.step();
                Supertimer.step();
        this.tick = this.clock.tick();
        
        this.delegate.run();
        ig.input.clearPressed();
        
        if( this.newGameClass ) {
            this.setGameNow( this.newGameClass );
            this.newGameClass = null;
        }
    }, 
});

/*====================================================
A TimeSlower object lets you trigger moments where you want
time to slow down, and then to speed back up to regular time.
The time slowdown and speedup are both gradual that happen
over periods of time that you can specify via the
alterTimeScale() method. see below.
====================================================*/

TimeSlower = ig.Class.extend({
    currentTimeScale: 1,
    timeScaleHolder: 1,
    changedTimer: null,
    changedTime: 0,
    //returnToNormalTime: 0,
    constantDuration: 0,
    slowingDownDuration: 0,
    returnToNormalDuration: 0,
    slowingDown: false,
    constant: false,
    returningToNormal: false,
    segmentStartValue: 0,
    segmentEndValue: 0,
    
    update: function(){
        if (this.slowingDown == true){
            if (this.changedTimer && this.changedTimer.delta() < 0){
                ig.Timer.timeScale = this.changedTimer.delta().map(-this.slowingDownDuration, 0, 1, this.timeScaleHolder);
            }
            else if (this.changedTimer && this.changedTimer.delta() >= 0){
                this.slowingDown = false;
                this.constant = true;
                this.changedTimer.set(this.constantDuration);
                ig.Timer.timeScale = this.timeScaleHolder;
                ig.log("timescale = " + ig.Timer.timeScale);
            }
        }
        if (this.constant == true){
            if (this.changedTimer && this.changedTimer.delta() >=0){
                this.constant = false;
                this.returningToNormal = true;
                this.changedTimer.set(this.returnToNormalDuration);
                ig.Timer.timeScale = this.timeScaleHolder;
                ig.log("timescale constant = " + ig.Timer.timeScale);

            }
        }
        if (this.returningToNormal == true){
            if (this.changedTimer && this.changedTimer.delta() < 0){
                ig.Timer.timeScale = this.changedTimer.delta().map(-this.returnToNormalDuration, 0, this.timeScaleHolder, 1);
            }
            else if (this.changedTimer && this.changedTimer.delta() >= 0){
                ig.Timer.timeScale = 1;
                this.returningToNormal = false;
                this.constant = false;
                this.slowingDown = false;
                ig.log("timescale returning to normal = " + ig.Timer.timeScale);

            }
        }
    },
    /*===========================
    alterTimeScale() - Method by which you alter the impact Timer.timeScale property.
    timescale - a number between 0 and 1 where 0 is time stopped and 1 is normal time.
    slowingDownDuration - amount of time you want it to gradually slow down, or 0.
    constantDuration - amount of time you want it to stay at the target timeScale before speeding up again
    returnToNormalDuration - amountof time you want it to gradually speed up from the target timeScale to 1.
    ===========================*/
    alterTimeScale: function(timescale, slowingDownDuration, constantDuration, returnToNormalDuration){
        if (ig.Timer.timeScale == 1){   //don't do anything unless timescale is 1.  only one timeslower can change at a time.
            this.timeScaleHolder = timescale;
            this.slowingDownDuration = slowingDownDuration;
            this.constantDuration = constantDuration;
            this.returnToNormalDuration = returnToNormalDuration;
            this.changedTime = slowingDownDuration;
            this.changedTimer = new Supertimer(slowingDownDuration);
            ig.log("timer delta = " + this.changedTimer.delta());
            this.slowingDown = true;
        }
    }
});
});
