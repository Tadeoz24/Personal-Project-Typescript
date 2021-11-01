class Transaction {
  scenario: any;
  scenarioObject: any;
  logs: [];
  store: {};
  store2: {};
  constructor() {
    this.scenario = {};
    this.scenarioObject = [];
    this.logs = [];
    this.store = {};
    this.store2 = {};
  }
  //Performing a transaction using the dispatch method.

  async dispatch(
    scenario: (
      | {
          index: number;
          meta: { title: string; description: string };
          // callback for main execution
          call: (store: any) => Promise<string>;
          // callback for rollback
          restore: (store: any) => Promise<void>;
        }
      | {
          index: number;
          meta: { title: string; description: string };
          // callback for main execution
          call: (store: any) => Promise<any>;
          // callback for rollback
          restore?: undefined;
        }
      | {
          index: number;
          meta: { title: string; description: string };
          // callback for main execution
          call: (store: any) => Promise<any>;
          // callback for rollback
          restore: (store: any) => Promise<string>;
        }
    )[]
  ): Promise<void> {
    for (let step of scenario) {
      if (typeof step.index !== "number") {
        throw new Error("Index Is Required To Be A Number");
      } else if (
        typeof step.meta === "undefined" ||
        typeof step.meta.title === "undefined" ||
        typeof step.meta.description === "undefined"
      ) {
        throw new Error("No Meta, Title Or Description");
      } else if (
        typeof step.call !== "function" ||
        typeof step.call == "undefined"
      ) {
        throw new Error("Call Is No function or Call Is Not Found");
      }
    }

    scenario.forEach((value: any) => {
      for (let step of scenario) {
        if (value === step.index) {
          return this.scenarioObject.push(step);
        }
      }
    });

    function generateErrorObject(element: any, err: any): object {
      var objectRes: object = {
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

    //If transaction.store returns  null, this means that the rollback mechanism was successfully launched.
    function generateSuccessObject(
      _storebefore: {},
      element: any,
      result: any
    ): object {
      var objectRes = {
        ...{},
        ...{
          index: element.index,
          meta: element.meta,
          storeBefore: generateSuccessObject,
          storeAfter: result,
          error: null,
        },
      };

      return objectRes;
    }

    //Logging of all actions and all errors.
    //Data availability at each step using the parameter store.
    //Generate error if transaction rollback failed.

    for (var element of this.scenarioObject) {
      try {
        var result: any = await element.call(this.store2);

        this.logs.push.call(
          generateSuccessObject(this.store2, element, result)
        );
      } catch (err: any) {
        try {
          if (typeof element.restore !== "undefined") {
            var result: any = await element.restore(this.store2);
            this.logs.push.call(
              generateSuccessObject(this.store2, element, result)
            );
            this.store = null!;
          } else {
            this.logs.push.call(generateErrorObject(element, err));
            this.store = {};
          }
        } catch (err: any) {
          this.logs.push.call(generateErrorObject(element, err));
          this.store = {};
          for (
            let element2 = this.scenarioObject.indexOf(element) - 1;
            element2 >= 0;
            element2--
          ) {
            var element = this.scenarioObject[element2];
            try {
              var result: any = await element.restore(this.store2);
              this.logs.push.call(
                generateSuccessObject(this.store2, element, result)
              );
              this.store = null!;
            } catch (err: any) {
              this.logs.push.call(generateErrorObject(element, err));
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
    call: async (_store: {}) => {
      return "success";
    },
    // callback for rollback
    restore: async (_store: {}) => {},
  },
  {
    index: 3,
    meta: {
      title: "Third customer",
      description: "This action is responsible for deleting customer",
    },
    // callback for main execution
    call: async (_store: {}) => {
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
    call: async (_store: {}) => {
      throw new Error("Error");
    },
    // callback for rollback
    restore: async (_store: {}) => {
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
    call: async (_store: {}) => {
      throw new Error("Call Error");
    },
    // callback for rollback
    restore: async (_store: {}) => {
      throw new Error("Rollback Error");
    },
  },
];

const transaction = new Transaction();

(async () => {
  try {
    await transaction.dispatch(scenario);
    const logs = transaction.store; // []
    console.log(logs);
  } catch (err: any) {
    // log detailed error
    console.log(err.message);
  }
})();
