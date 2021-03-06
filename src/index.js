var freeze = require("@nathanfaucett/freeze"),
    Iterator = require("@nathanfaucett/iterator"),
    ImmutableHashMap = require("@nathanfaucett/immutable-hash_map"),
    isUndefined = require("@nathanfaucett/is_undefined"),
    isArrayLike = require("@nathanfaucett/is_array_like"),
    defineProperty = require("@nathanfaucett/define_property");


var INTERNAL_CREATE = {},

    ITERATOR_SYMBOL = typeof(Symbol) === "function" ? Symbol.iterator : false,
    IS_SET = "_ImmutableSet_",

    EMPTY_SET = freeze(new Set(INTERNAL_CREATE)),

    IteratorValue = Iterator.Value,

    SetPrototype = Set.prototype;


module.exports = Set;


function Set(value) {
    this._hashMap = ImmutableHashMap.EMPTY;

    if (value !== INTERNAL_CREATE) {
        return Set_createSet(this, value, arguments);
    } else {
        return this;
    }
}

Set.EMPTY = EMPTY_SET;

function Set_createSet(_this, value, values) {
    var length = values.length;

    if (length === 1) {
        if (isArrayLike(value)) {
            return Set_fromArray(_this, value.toArray ? value.toArray() : value);
        } else {
            return EMPTY_SET.set(value);
        }
    } else if (length > 1) {
        return Set_fromArray(_this, values);
    } else {
        return EMPTY_SET;
    }
}

function Set_fromArray(_this, array) {
    var i = -1,
        il = array.length - 1,
        hashMap = _this._hashMap;

    while (i++ < il) {
        hashMap = hashMap.set(array[i], true);
    }

    if (hashMap.size() !== 0) {
        _this._hashMap = hashMap;
        return freeze(_this);
    } else {
        return EMPTY_SET;
    }
}

Set.fromArray = function(array) {
    if (array.length > 0) {
        return Set_createSet(new Set(INTERNAL_CREATE), array[0], array);
    } else {
        return EMPTY_SET;
    }
};

Set.of = function() {
    return Set_createSet(new Set(INTERNAL_CREATE), arguments[0], arguments);
};

Set.isSet = function(value) {
    return !!(value && value[IS_SET]);
};

defineProperty(SetPrototype, IS_SET, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: true
});

SetPrototype.size = function() {
    return this._hashMap.size();
};

if (defineProperty.hasGettersSetters) {
    defineProperty(SetPrototype, "length", {
        get: SetPrototype.size
    });
}

SetPrototype.count = SetPrototype.size;

SetPrototype.isEmpty = function() {
    return this._hashMap.isEmpty();
};

SetPrototype.has = function(value) {
    return this._hashMap.has(value);
};

SetPrototype.get = function(value, notSetValue) {
    if (this._hashMap.has(value)) {
        return value;
    } else {
        return notSetValue;
    }
};

function Set_set(_this, values) {
    var hashMap = _this._hashMap,
        i = -1,
        il = values.length - 1,
        added = 0,
        newImmutableHashMap, set;

    while (i++ < il) {
        newImmutableHashMap = hashMap.set(values[i], true);

        if (newImmutableHashMap !== hashMap) {
            hashMap = newImmutableHashMap;
            added += 1;
        }
    }

    if (added !== 0) {
        set = new Set(INTERNAL_CREATE);
        set._hashMap = hashMap;
        return freeze(set);
    } else {
        return _this;
    }
}

SetPrototype.set = function() {
    if (arguments.length > 0) {
        return Set_set(this, arguments);
    } else {
        return this;
    }
};

SetPrototype.conj = SetPrototype.cons = SetPrototype.add = SetPrototype.set;

function Set_remove(_this, values) {
    var hashMap = _this._hashMap,
        i = -1,
        il = values.length - 1,
        removed = 0,
        newImmutableHashMap, set;

    while (i++ < il) {
        newImmutableHashMap = hashMap.remove(values[i]);

        if (newImmutableHashMap !== hashMap) {
            hashMap = newImmutableHashMap;
            removed += 1;
        }
    }

    if (removed !== 0) {
        set = new Set(INTERNAL_CREATE);
        set._hashMap = hashMap;
        return freeze(set);
    } else {
        return _this;
    }
}

SetPrototype.remove = function() {
    if (arguments.length > 0) {
        return Set_remove(this, arguments);
    } else {
        return this;
    }
};

function Set_toArray(size, iterator) {
    var results = new Array(size),
        next = iterator.next(),
        index = 0;

    while (!next.done) {
        results[index] = next.value;
        next = iterator.next();
        index += 1;
    }

    return results;
}

SetPrototype.toArray = function() {
    var size = this.size();

    if (size === 0) {
        return [];
    } else {
        return Set_toArray(size, this.iterator());
    }
};

function Set_join(size, iterator, separator) {
    var result = "",
        next = iterator.next(),
        value;

    while (true) {
        value = next.value;
        next = iterator.next();

        if (next.done) {
            result += value;
            break;
        } else {
            result += value + separator;
        }
    }

    return result;
}

SetPrototype.join = function(separator) {
    separator = separator || " ";

    if (this.size() === 0) {
        return "";
    } else {
        return Set_join(this.size(), this.iterator(), separator);
    }
};

SetPrototype.toString = function() {
    return "#{" + this.join() + "}";
};

SetPrototype.toJSON = SetPrototype.toArray;
Set.fromJSON = Set.fromArray;

SetPrototype.inspect = SetPrototype.toString;

SetPrototype.iterator = function(reverse) {
    var hashMapIterator = this._hashMap.iterator(reverse);

    return new Iterator(function next() {
        var iteratorValue = hashMapIterator.next();

        if (iteratorValue.done) {
            return iteratorValue;
        } else {
            return new IteratorValue(iteratorValue.value[0], iteratorValue.done);
        }
    });
};

if (ITERATOR_SYMBOL) {
    SetPrototype[ITERATOR_SYMBOL] = SetPrototype.iterator;
}

function Set_every(_this, it, callback) {
    var next = it.next();

    while (next.done === false) {
        if (!callback(next.value, _this)) {
            return false;
        }
        next = it.next();
    }

    return true;
}

SetPrototype.every = function(callback, thisArg) {
    return Set_every(this, this.iterator(), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 3));
};

function Set_filter(_this, it, callback) {
    var results = [],
        next = it.next(),
        j = 0,
        value;

    while (next.done === false) {
        value = next.value;

        if (callback(value, _this)) {
            results[j++] = value;
        }

        next = it.next();
    }

    return Set.of(results);
}

SetPrototype.filter = function(callback, thisArg) {
    return Set_filter(this, this.iterator(), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 3));
};

function Set_forEach(_this, it, callback) {
    var next = it.next();

    while (next.done === false) {
        if (callback(next.value, _this) === false) {
            break;
        }
        next = it.next();
    }

    return _this;
}

SetPrototype.forEach = function(callback, thisArg) {
    return Set_forEach(this, this.iterator(), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 3));
};

SetPrototype.each = SetPrototype.forEach;

function Set_forEachRight(_this, it, callback) {
    var next = it.next();

    while (next.done === false) {
        if (callback(next.value, _this) === false) {
            break;
        }
        next = it.next();
    }

    return _this;
}

SetPrototype.forEachRight = function(callback, thisArg) {
    return Set_forEachRight(this, this.iterator(true), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 3));
};

SetPrototype.eachRight = SetPrototype.forEachRight;

function Set_map(_this, it, callback) {
    var next = it.next(),
        results = new Array(_this.size()),
        index = 0;

    while (next.done === false) {
        results[index] = callback(next.value, _this);
        next = it.next();
        index += 1;
    }

    return Set.of(results);
}

SetPrototype.map = function(callback, thisArg) {
    return Set_map(this, this.iterator(), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 3));
};

function Set_reduce(_this, it, callback, initialValue) {
    var next = it.next(),
        value = initialValue;

    if (isUndefined(value)) {
        value = next.value;
        next = it.next();
    }

    while (next.done === false) {
        value = callback(value, next.value, _this);
        next = it.next();
    }

    return value;
}

SetPrototype.reduce = function(callback, initialValue, thisArg) {
    return Set_reduce(this, this.iterator(), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 4), initialValue);
};

function Set_reduceRight(_this, it, callback, initialValue) {
    var next = it.next(),
        value = initialValue;

    if (isUndefined(value)) {
        value = next.value;
        next = it.next();
    }

    while (next.done === false) {
        value = callback(value, next.value, _this);
        next = it.next();
    }

    return value;
}

SetPrototype.reduceRight = function(callback, initialValue, thisArg) {
    return Set_reduceRight(this, this.iterator(true), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 4), initialValue);
};

function Set_some(_this, it, callback) {
    var next = it.next();

    while (next.done === false) {
        if (callback(next.value, _this)) {
            return true;
        }
        next = it.next();
    }

    return false;
}

SetPrototype.some = function(callback, thisArg) {
    return Set_some(this, this.iterator(), isUndefined(thisArg) ? callback : fastBindThis(callback, thisArg, 3));
};

Set.equal = function(a, b) {
    return ImmutableHashMap.equal(a._hashMap, b._hashMap);
};

SetPrototype.equals = function(other) {
    return Set.equal(this, other);
};