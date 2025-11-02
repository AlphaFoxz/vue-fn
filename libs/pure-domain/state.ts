class States {
  private data = {} as const;
  public addStates<T extends Record<string, any>>(map: T): asserts this is typeof this & T {
    Object.assign(this, map);
  }
  public getData() {
    return this.data;
  }
}

export function createStates() {
  return new States();
}

const states: States = createStates();

states.addStates({ a: '' });
const data = states.getData();
data;
