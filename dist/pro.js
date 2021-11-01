"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Transaction {
    constructor() {
        this.scenario = {};
        this.scenarioObject = [];
        this.logs = [];
        this.store = {};
        this.store2 = {};
    }
    dispatch(scenario) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let step of scenario) {
                if (typeof step.index !== "number") {
                    throw new Error("Index Is Required To Be A Number");
                }
                else if (typeof step.meta === "undefined" ||
                    typeof step.meta.title === "undefined" ||
                    typeof step.meta.description === "undefined") {
                    throw new Error("No Meta, Title Or Description");
                }
                else if (typeof step.call !== "function" ||
                    typeof step.call == "undefined") {
                    throw new Error("Call Is No function or Call Is Not Found");
                }
            }
            scenario.forEach((value) => {
                for (let step of scenario) {
                    if (value === step.index) {
                        return this.scenarioObject.push(step);
                    }
                }
            });
            function generateErrorObject(element, err) {
                var objectRes = Object.assign({}, {
                    index: element.index,
                    meta: element.meta,
                    error: {
                        name: err.name,
                        message: err.message,
                        stack: "Error Stack",
                    },
                });
                return objectRes;
            }
            function generateSuccessObject(_storebefore, element, result) {
                var objectRes = Object.assign({}, {
                    index: element.index,
                    meta: element.meta,
                    storeBefore: generateSuccessObject,
                    storeAfter: result,
                    error: null,
                });
                return objectRes;
            }
            for (var element of this.scenarioObject) {
                try {
                    var result = yield element.call(this.store2);
                    this.logs.push.call(generateSuccessObject(this.store2, element, result));
                }
                catch (err) {
                    try {
                        if (typeof element.restore !== "undefined") {
                            var result = yield element.restore(this.store2);
                            this.logs.push.call(generateSuccessObject(this.store2, element, result));
                            this.store = null;
                        }
                        else {
                            this.logs.push.call(generateErrorObject(element, err));
                            this.store = {};
                        }
                    }
                    catch (err) {
                        this.logs.push.call(generateErrorObject(element, err));
                        this.store = {};
                        for (let element2 = this.scenarioObject.indexOf(element) - 1; element2 >= 0; element2--) {
                            var element = this.scenarioObject[element2];
                            try {
                                var result = yield element.restore(this.store2);
                                this.logs.push.call(generateSuccessObject(this.store2, element, result));
                                this.store = null;
                            }
                            catch (err) {
                                this.logs.push.call(generateErrorObject(element, err));
                                this.store = {};
                            }
                        }
                    }
                }
            }
        });
    }
}
const scenario = [
    {
        index: 1,
        meta: {
            title: "Read popular customers",
            description: "This action is responsible for reading the most popular customers",
        },
        call: (_store) => __awaiter(void 0, void 0, void 0, function* () {
            return "success";
        }),
        restore: (_store) => __awaiter(void 0, void 0, void 0, function* () { }),
    },
    {
        index: 3,
        meta: {
            title: "Third customer",
            description: "This action is responsible for deleting customer",
        },
        call: (_store) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error("Call Error");
        }),
    },
    {
        index: 2,
        meta: {
            title: "Delete customer",
            description: "This action is responsible for deleting customer",
        },
        call: (_store) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error("Error");
        }),
        restore: (_store) => __awaiter(void 0, void 0, void 0, function* () {
            return "restored";
        }),
    },
    {
        index: 4,
        meta: {
            title: "Fourth",
            description: "This action is responsible for deleting customer",
        },
        call: (_store) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error("Call Error");
        }),
        restore: (_store) => __awaiter(void 0, void 0, void 0, function* () {
            throw new Error("Rollback Error");
        }),
    },
];
const transaction = new Transaction();
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield transaction.dispatch(scenario);
        const logs = transaction.store;
        console.log(logs);
    }
    catch (err) {
        console.log(err.message);
    }
}))();
//# sourceMappingURL=pro.js.map