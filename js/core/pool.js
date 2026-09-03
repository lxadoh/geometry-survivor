class Pool {
  constructor(factory) {
    this.factory = factory;
    this.freeList = [];
  }
  obtain() { return this.freeList.pop() || this.factory(); }
  release(obj) { this.freeList.push(obj); }
}
