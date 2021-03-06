var Benchmark = require("benchmark"),
    mori = require("mori"),
    Immutable = require("immutable"),
    Set = require("..");


var suite = new Benchmark.Suite();


suite.add("Immutable", function() {
    var a = Immutable.Set.of([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    return function() {
        a.remove(0);
    };
}());

suite.add("mori set", function() {
    var a = mori.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

    return function() {
        mori.disj(a, 0);
    };
}());

suite.add("immutable-set", function() {
    var a = new Set(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);

    return function() {
        a.remove(0);
    };
}());

suite.on("cycle", function(event) {
    console.log(String(event.target));
});

suite.on("complete", function() {
    console.log("Fastest is " + this.filter("fastest").map("name"));
    console.log("=========================================\n");
});

console.log("\n= remove ================================");
suite.run();
