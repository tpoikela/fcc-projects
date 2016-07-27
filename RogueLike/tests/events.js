




var listener = {
    notify: function(name, args) {
        console.log("Event " + name + " notified. Args:");
        for (var p in args) {
            console.log(p + " -> " + args[p]);
        }
    },
};

var emitter = {
    pool: null,

    emit: function(name, args) {
        pool.emitEvent(name, args);
    },
};

var empty = {

};

var pool = new EventPool();
pool.listenEvent("ActualEvent", listener);
pool.listenEvent("TestEvent", empty);
emitter.pool = pool;
emitter.emit("TestEvent", {data: "abcd"});
emitter.emit("ActualEvent", {data: "abcd"});



