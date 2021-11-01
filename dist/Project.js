"use strict";
//JavaScript Project (Hard)
//Creating a new transaction based on a business scenario.
//Data availability at each step using the parameter `store`.
// After starting a transaction, the property `store` appears in the ` transaction` object with the value `{}` or `null`.
class Transaction {
  constructor() {
    this.scenario = [];
    this.scenarioObject = [];
    this.logs = [];
    this.store = {};
    this.store2 = {};
  }
  //Performing a transaction using the `dispatch` method.

  async dispatch(scenario) {
    for (let step of scenario) {
      if (typeof step.index !== "number") {
        throw new Error("Index Is Required To Be A Number");
      } else if (
        typeof step.meta === "Undefined" ||
        typeof step.meta.title === "Undefined" ||
        typeof step.meta.description === "Undefined"
      ) {
        throw new Error("No Meta, Title Or Description");
      } else if (
        typeof step.call !== "function" ||
        typeof step.call == "Undefined"
      ) {
        throw new Error("Call Is No function or Call Is Not Found");
      }

      this.scenario.push(step.index);
    }

    this.scenario.sort().forEach((value) => {
      for (let step of scenario) {
        if (value === step.index) {
          return this.scenarioObject.push(step);
        }
      }
    });

    function generateErrorObject(element, err) {
      var objectRes = {
        ...{},
        ...{
          index: element.index,
          meta: element.meta,
          error: {
            name: err.name,
            message: err.message,
            stack: "Error Stack",
          },
        },
      };
      return objectRes;
    }

    //If `transaction.store` returns ` null`, this means that the rollback mechanism was successfully launched.
    function generateSuccessObject(storebefore, element, result) {
      var objectRes = {
        ...{},
        ...{
          index: element.index,
          meta: element.meta,
          storeBefore: GenerateSucObject,
          storeAfter: result,
          error: null,
        },
      };

      return objectRes;
    }

    //Logging of all actions and all errors.
    //Data availability at each step using the parameter `store`.
    //Generate error if transaction rollback failed.

    for (var element of this.scenarioObject) {
      try {
        var result = await element.call(this.store2);

        this.logs.push(generateSuccessObject(this.store2, element, result));
      } catch (err) {
        try {
          if (typeof element.restore !== "undefined") {
            var result = await element.restore(this.store2);
            this.logs.push(generateSuccessObject(this.store2, element, result));
            this.store = null;
          } else {
            this.logs.push(generateErrorObject(element, err));
            this.store = {};
          }
        } catch (err) {
          this.logs.push(generateErrorObject(element, err));
          this.store = {};
          for (
            let element2 = this.scenarioObject.indexOf(element) - 1;
            element2 >= 0;
            element2--
          ) {
            var element = this.scenarioObject[element2];
            try {
              var result = await element.restore(this.store2);
              this.logs.push(
                generateSuccessObject(this.store2, element, result)
              );
              this.store = null;
            } catch (err) {
              this.logs.push(generateErrorObject(element, err));
              this.store = {};
            }
          }
        }
      }
    }
  }
}
//Rollback of all steps if an error occurred on some of the steps.
//Generate error if transaction rollback failed.
const scenario = [
  {
    index: 1,
    meta: {
      title: "Read popular customers",
      description:
        "This action is responsible for reading the most popular customers",
    },
    // callback for main execution
    call: async (store) => {
      return "success";
    },
    // callback for rollback
    restore: async (store) => {},
  },
  {
    index: 3,
    meta: {
      title: "Third custumer",
      description: "This action is responsible for deleting customer",
    },
    // callback for main execution
    call: async (store) => {
      throw new Error("Call Error");
    },
    //Without restore
    // callback for rollback
  },
  {
    index: 2,
    meta: {
      title: "Delete customer",
      description: "This action is responsible for deleting customer",
    },
    // callback for main execution
    call: async (store) => {
      throw new Error("Error");
    },
    // callback for rollback
    restore: async (store) => {
      return "restored";
    },
  },
  {
    index: 4,
    meta: {
      title: "Fourth",
      description: "This action is responsible for deleting customer",
    },
    // callback for main execution
    call: async (store) => {
      throw new Error("Call Error");
    },
    // callback for rollback
    restore: async (store) => {
      throw new Error("Rollback Error");
    },
  },
];

const transaction = new Transaction();

(async () => {
  try {
    await transaction.dispatch(scenario);
    const store = transaction.store; // {} | null
    const logs = transaction.logs; // []
    console.log(logs);
  } catch (err) {
    // log detailed error
    console.log(err.message);
  }
})();
//In the `logs` property, you must store an array of objects, where each object contains a step execution state.
