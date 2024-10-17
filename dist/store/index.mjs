import { s as a, r as s } from "../reactivity.esm-bundler-B9rVewCG.js";
function i(t) {
  const n = a(t._state || {}), e = a(t.state || {}), c = s(t._action || {}), o = s(t.action || {});
  return a({
    _state: n,
    state: e,
    _action: c,
    action: o
  });
}
export {
  i as defineApi
};
//# sourceMappingURL=index.mjs.map
