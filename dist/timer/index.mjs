import { a } from "../reactivity.esm-bundler-B9rVewCG.js";
function T(l, r = new Error("timeout!")) {
  let e, i = a(() => {
    if (!e) {
      e = null;
      return;
    }
    clearTimeout(e), e = null;
  }), u = a((t) => {
  });
  const n = (t = l) => {
    e && (clearTimeout(e), e = setTimeout(() => {
      u.value(r);
    }, t), l = t);
  };
  let c = new Promise((t, o) => {
    if (e === null) {
      t();
      return;
    }
    e = setTimeout(() => {
      o(r);
    }, l), i.value = () => {
      t(), clearTimeout(e), e = null;
    }, u.value = () => {
      o(r);
    };
  });
  return {
    resolve: i,
    reject: u,
    reset: n,
    promise: c
  };
}
export {
  T as createTimeout
};
//# sourceMappingURL=index.mjs.map
