/**
* @vue/shared v3.5.12
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
/*! #__NO_SIDE_EFFECTS__ */
// @__NO_SIDE_EFFECTS__
function lt(t) {
  const e = /* @__PURE__ */ Object.create(null);
  for (const r of t.split(",")) e[r] = 1;
  return (r) => r in e;
}
process.env.NODE_ENV !== "production" && Object.freeze({});
process.env.NODE_ENV !== "production" && Object.freeze([]);
const Q = Object.assign, ft = Object.prototype.hasOwnProperty, H = (t, e) => ft.call(t, e), O = Array.isArray, N = (t) => X(t) === "[object Map]", ht = (t) => typeof t == "string", I = (t) => typeof t == "symbol", P = (t) => t !== null && typeof t == "object", dt = Object.prototype.toString, X = (t) => dt.call(t), Z = (t) => X(t).slice(8, -1), C = (t) => ht(t) && t !== "NaN" && t[0] !== "-" && "" + parseInt(t, 10) === t, pt = (t) => {
  const e = /* @__PURE__ */ Object.create(null);
  return (r) => e[r] || (e[r] = t(r));
}, _t = pt((t) => t.charAt(0).toUpperCase() + t.slice(1)), y = (t, e) => !Object.is(t, e);
/**
* @vue/reactivity v3.5.12
* (c) 2018-present Yuxi (Evan) You and Vue contributors
* @license MIT
**/
function M(t, ...e) {
}
let gt, k = 0, A;
function Y() {
  k++;
}
function B() {
  if (--k > 0)
    return;
  let t;
  for (; A; ) {
    let e = A;
    for (A = void 0; e; ) {
      const r = e.next;
      if (e.next = void 0, e.flags &= -9, e.flags & 1)
        try {
          e.trigger();
        } catch (o) {
          t || (t = o);
        }
      e = r;
    }
  }
  if (t) throw t;
}
let D = !0;
const tt = [];
function vt() {
  tt.push(D), D = !1;
}
function bt() {
  const t = tt.pop();
  D = t === void 0 ? !0 : t;
}
class et {
  constructor(e) {
    this.computed = e, this.version = 0, this.activeLink = void 0, this.subs = void 0, this.map = void 0, this.key = void 0, this.sc = 0, process.env.NODE_ENV !== "production" && (this.subsHead = void 0);
  }
  track(e) {
  }
  trigger(e) {
    this.version++, this.notify(e);
  }
  notify(e) {
    Y();
    try {
      if (process.env.NODE_ENV !== "production")
        for (let r = this.subsHead; r; r = r.nextSub)
          r.sub.onTrigger && !(r.sub.flags & 8) && r.sub.onTrigger(
            Q(
              {
                effect: r.sub
              },
              e
            )
          );
      for (let r = this.subs; r; r = r.prevSub)
        r.sub.notify() && r.sub.dep.notify();
    } finally {
      B();
    }
  }
}
const $ = /* @__PURE__ */ new WeakMap(), w = Symbol(
  process.env.NODE_ENV !== "production" ? "Object iterate" : ""
), W = Symbol(
  process.env.NODE_ENV !== "production" ? "Map keys iterate" : ""
), x = Symbol(
  process.env.NODE_ENV !== "production" ? "Array iterate" : ""
);
function p(t, e, r) {
  if (D && gt) {
    let o = $.get(t);
    o || $.set(t, o = /* @__PURE__ */ new Map());
    let n = o.get(r);
    n || (o.set(r, n = new et()), n.map = o, n.key = r), process.env.NODE_ENV !== "production" ? n.track({
      target: t,
      type: e,
      key: r
    }) : n.track();
  }
}
function v(t, e, r, o, n, s) {
  const i = $.get(t);
  if (!i)
    return;
  const c = (a) => {
    a && (process.env.NODE_ENV !== "production" ? a.trigger({
      target: t,
      type: e,
      key: r,
      newValue: o,
      oldValue: n,
      oldTarget: s
    }) : a.trigger());
  };
  if (Y(), e === "clear")
    i.forEach(c);
  else {
    const a = O(t), l = a && C(r);
    if (a && r === "length") {
      const f = Number(o);
      i.forEach((h, _) => {
        (_ === "length" || _ === x || !I(_) && _ >= f) && c(h);
      });
    } else
      switch ((r !== void 0 || i.has(void 0)) && c(i.get(r)), l && c(i.get(x)), e) {
        case "add":
          a ? l && c(i.get("length")) : (c(i.get(w)), N(t) && c(i.get(W)));
          break;
        case "delete":
          a || (c(i.get(w)), N(t) && c(i.get(W)));
          break;
        case "set":
          N(t) && c(i.get(w));
          break;
      }
  }
  B();
}
function E(t) {
  const e = u(t);
  return e === t ? e : (p(e, "iterate", x), b(t) ? e : e.map(d));
}
function F(t) {
  return p(t = u(t), "iterate", x), t;
}
const wt = {
  __proto__: null,
  [Symbol.iterator]() {
    return K(this, Symbol.iterator, d);
  },
  concat(...t) {
    return E(this).concat(
      ...t.map((e) => O(e) ? E(e) : e)
    );
  },
  entries() {
    return K(this, "entries", (t) => (t[1] = d(t[1]), t));
  },
  every(t, e) {
    return g(this, "every", t, e, void 0, arguments);
  },
  filter(t, e) {
    return g(this, "filter", t, e, (r) => r.map(d), arguments);
  },
  find(t, e) {
    return g(this, "find", t, e, d, arguments);
  },
  findIndex(t, e) {
    return g(this, "findIndex", t, e, void 0, arguments);
  },
  findLast(t, e) {
    return g(this, "findLast", t, e, d, arguments);
  },
  findLastIndex(t, e) {
    return g(this, "findLastIndex", t, e, void 0, arguments);
  },
  // flat, flatMap could benefit from ARRAY_ITERATE but are not straight-forward to implement
  forEach(t, e) {
    return g(this, "forEach", t, e, void 0, arguments);
  },
  includes(...t) {
    return V(this, "includes", t);
  },
  indexOf(...t) {
    return V(this, "indexOf", t);
  },
  join(t) {
    return E(this).join(t);
  },
  // keys() iterator only reads `length`, no optimisation required
  lastIndexOf(...t) {
    return V(this, "lastIndexOf", t);
  },
  map(t, e) {
    return g(this, "map", t, e, void 0, arguments);
  },
  pop() {
    return S(this, "pop");
  },
  push(...t) {
    return S(this, "push", t);
  },
  reduce(t, ...e) {
    return q(this, "reduce", t, e);
  },
  reduceRight(t, ...e) {
    return q(this, "reduceRight", t, e);
  },
  shift() {
    return S(this, "shift");
  },
  // slice could use ARRAY_ITERATE but also seems to beg for range tracking
  some(t, e) {
    return g(this, "some", t, e, void 0, arguments);
  },
  splice(...t) {
    return S(this, "splice", t);
  },
  toReversed() {
    return E(this).toReversed();
  },
  toSorted(t) {
    return E(this).toSorted(t);
  },
  toSpliced(...t) {
    return E(this).toSpliced(...t);
  },
  unshift(...t) {
    return S(this, "unshift", t);
  },
  values() {
    return K(this, "values", d);
  }
};
function K(t, e, r) {
  const o = F(t), n = o[e]();
  return o !== t && !b(t) && (n._next = n.next, n.next = () => {
    const s = n._next();
    return s.value && (s.value = r(s.value)), s;
  }), n;
}
const Et = Array.prototype;
function g(t, e, r, o, n, s) {
  const i = F(t), c = i !== t && !b(t), a = i[e];
  if (a !== Et[e]) {
    const h = a.apply(t, s);
    return c ? d(h) : h;
  }
  let l = r;
  i !== t && (c ? l = function(h, _) {
    return r.call(this, d(h), _, t);
  } : r.length > 2 && (l = function(h, _) {
    return r.call(this, h, _, t);
  }));
  const f = a.call(i, l, o);
  return c && n ? n(f) : f;
}
function q(t, e, r, o) {
  const n = F(t);
  let s = r;
  return n !== t && (b(t) ? r.length > 3 && (s = function(i, c, a) {
    return r.call(this, i, c, a, t);
  }) : s = function(i, c, a) {
    return r.call(this, i, d(c), a, t);
  }), n[e](s, ...o);
}
function V(t, e, r) {
  const o = u(t);
  p(o, "iterate", x);
  const n = o[e](...r);
  return (n === -1 || n === !1) && Kt(r[0]) ? (r[0] = u(r[0]), o[e](...r)) : n;
}
function S(t, e, r = []) {
  vt(), Y();
  const o = u(t)[e].apply(t, r);
  return B(), bt(), o;
}
const Ot = /* @__PURE__ */ lt("__proto__,__v_isRef,__isVue"), rt = new Set(
  /* @__PURE__ */ Object.getOwnPropertyNames(Symbol).filter((t) => t !== "arguments" && t !== "caller").map((t) => Symbol[t]).filter(I)
);
function mt(t) {
  I(t) || (t = String(t));
  const e = u(this);
  return p(e, "has", t), e.hasOwnProperty(t);
}
class nt {
  constructor(e = !1, r = !1) {
    this._isReadonly = e, this._isShallow = r;
  }
  get(e, r, o) {
    const n = this._isReadonly, s = this._isShallow;
    if (r === "__v_isReactive")
      return !n;
    if (r === "__v_isReadonly")
      return n;
    if (r === "__v_isShallow")
      return s;
    if (r === "__v_raw")
      return o === (n ? s ? ct : ot : s ? Dt : it).get(e) || // receiver is not the reactive proxy, but has the same prototype
      // this means the receiver is a user proxy of the reactive proxy
      Object.getPrototypeOf(e) === Object.getPrototypeOf(o) ? e : void 0;
    const i = O(e);
    if (!n) {
      let a;
      if (i && (a = wt[r]))
        return a;
      if (r === "hasOwnProperty")
        return mt;
    }
    const c = Reflect.get(
      e,
      r,
      // if this is a proxy wrapping a ref, return methods using the raw ref
      // as receiver so that we don't have to call `toRaw` on the ref in all
      // its class methods
      m(e) ? e : o
    );
    return (I(r) ? rt.has(r) : Ot(r)) || (n || p(e, "get", r), s) ? c : m(c) ? i && C(r) ? c : c.value : P(c) ? n ? ut(c) : at(c) : c;
  }
}
class Rt extends nt {
  constructor(e = !1) {
    super(!1, e);
  }
  set(e, r, o, n) {
    let s = e[r];
    if (!this._isShallow) {
      const a = R(s);
      if (!b(o) && !R(o) && (s = u(s), o = u(o)), !O(e) && m(s) && !m(o))
        return a ? !1 : (s.value = o, !0);
    }
    const i = O(e) && C(r) ? Number(r) < e.length : H(e, r), c = Reflect.set(
      e,
      r,
      o,
      m(e) ? e : n
    );
    return e === u(n) && (i ? y(o, s) && v(e, "set", r, o, s) : v(e, "add", r, o)), c;
  }
  deleteProperty(e, r) {
    const o = H(e, r), n = e[r], s = Reflect.deleteProperty(e, r);
    return s && o && v(e, "delete", r, void 0, n), s;
  }
  has(e, r) {
    const o = Reflect.has(e, r);
    return (!I(r) || !rt.has(r)) && p(e, "has", r), o;
  }
  ownKeys(e) {
    return p(
      e,
      "iterate",
      O(e) ? "length" : w
    ), Reflect.ownKeys(e);
  }
}
class st extends nt {
  constructor(e = !1) {
    super(!0, e);
  }
  set(e, r) {
    return process.env.NODE_ENV !== "production" && M(
      `Set operation on key "${String(r)}" failed: target is readonly.`,
      e
    ), !0;
  }
  deleteProperty(e, r) {
    return process.env.NODE_ENV !== "production" && M(
      `Delete operation on key "${String(r)}" failed: target is readonly.`,
      e
    ), !0;
  }
}
const St = /* @__PURE__ */ new Rt(), Nt = /* @__PURE__ */ new st(), yt = /* @__PURE__ */ new st(!0), z = (t) => t, T = (t) => Reflect.getPrototypeOf(t);
function Mt(t, e, r) {
  return function(...o) {
    const n = this.__v_raw, s = u(n), i = N(s), c = t === "entries" || t === Symbol.iterator && i, a = t === "keys" && i, l = n[t](...o), f = r ? z : e ? L : d;
    return !e && p(
      s,
      "iterate",
      a ? W : w
    ), {
      // iterator protocol
      next() {
        const { value: h, done: _ } = l.next();
        return _ ? { value: h, done: _ } : {
          value: c ? [f(h[0]), f(h[1])] : f(h),
          done: _
        };
      },
      // iterable protocol
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function j(t) {
  return function(...e) {
    if (process.env.NODE_ENV !== "production") {
      const r = e[0] ? `on key "${e[0]}" ` : "";
      M(
        `${_t(t)} operation ${r}failed: target is readonly.`,
        u(this)
      );
    }
    return t === "delete" ? !1 : t === "clear" ? void 0 : this;
  };
}
function xt(t, e) {
  const r = {
    get(n) {
      const s = this.__v_raw, i = u(s), c = u(n);
      t || (y(n, c) && p(i, "get", n), p(i, "get", c));
      const { has: a } = T(i), l = e ? z : t ? L : d;
      if (a.call(i, n))
        return l(s.get(n));
      if (a.call(i, c))
        return l(s.get(c));
      s !== i && s.get(n);
    },
    get size() {
      const n = this.__v_raw;
      return !t && p(u(n), "iterate", w), Reflect.get(n, "size", n);
    },
    has(n) {
      const s = this.__v_raw, i = u(s), c = u(n);
      return t || (y(n, c) && p(i, "has", n), p(i, "has", c)), n === c ? s.has(n) : s.has(n) || s.has(c);
    },
    forEach(n, s) {
      const i = this, c = i.__v_raw, a = u(c), l = e ? z : t ? L : d;
      return !t && p(a, "iterate", w), c.forEach((f, h) => n.call(s, l(f), l(h), i));
    }
  };
  return Q(
    r,
    t ? {
      add: j("add"),
      set: j("set"),
      delete: j("delete"),
      clear: j("clear")
    } : {
      add(n) {
        !e && !b(n) && !R(n) && (n = u(n));
        const s = u(this);
        return T(s).has.call(s, n) || (s.add(n), v(s, "add", n, n)), this;
      },
      set(n, s) {
        !e && !b(s) && !R(s) && (s = u(s));
        const i = u(this), { has: c, get: a } = T(i);
        let l = c.call(i, n);
        l ? process.env.NODE_ENV !== "production" && J(i, c, n) : (n = u(n), l = c.call(i, n));
        const f = a.call(i, n);
        return i.set(n, s), l ? y(s, f) && v(i, "set", n, s, f) : v(i, "add", n, s), this;
      },
      delete(n) {
        const s = u(this), { has: i, get: c } = T(s);
        let a = i.call(s, n);
        a ? process.env.NODE_ENV !== "production" && J(s, i, n) : (n = u(n), a = i.call(s, n));
        const l = c ? c.call(s, n) : void 0, f = s.delete(n);
        return a && v(s, "delete", n, void 0, l), f;
      },
      clear() {
        const n = u(this), s = n.size !== 0, i = process.env.NODE_ENV !== "production" ? N(n) ? new Map(n) : new Set(n) : void 0, c = n.clear();
        return s && v(
          n,
          "clear",
          void 0,
          void 0,
          i
        ), c;
      }
    }
  ), [
    "keys",
    "values",
    "entries",
    Symbol.iterator
  ].forEach((n) => {
    r[n] = Mt(n, t, e);
  }), r;
}
function G(t, e) {
  const r = xt(t, e);
  return (o, n, s) => n === "__v_isReactive" ? !t : n === "__v_isReadonly" ? t : n === "__v_raw" ? o : Reflect.get(
    H(r, n) && n in o ? r : o,
    n,
    s
  );
}
const It = {
  get: /* @__PURE__ */ G(!1, !1)
}, Tt = {
  get: /* @__PURE__ */ G(!0, !1)
}, jt = {
  get: /* @__PURE__ */ G(!0, !0)
};
function J(t, e, r) {
  const o = u(r);
  if (o !== r && e.call(t, o)) {
    const n = Z(t);
    M(
      `Reactive ${n} contains both the raw and reactive versions of the same object${n === "Map" ? " as keys" : ""}, which can lead to inconsistencies. Avoid differentiating between the raw and reactive versions of an object and only use the reactive version if possible.`
    );
  }
}
const it = /* @__PURE__ */ new WeakMap(), Dt = /* @__PURE__ */ new WeakMap(), ot = /* @__PURE__ */ new WeakMap(), ct = /* @__PURE__ */ new WeakMap();
function Pt(t) {
  switch (t) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function At(t) {
  return t.__v_skip || !Object.isExtensible(t) ? 0 : Pt(Z(t));
}
function at(t) {
  return R(t) ? t : U(
    t,
    !1,
    St,
    It,
    it
  );
}
function ut(t) {
  return U(
    t,
    !0,
    Nt,
    Tt,
    ot
  );
}
function $t(t) {
  return U(
    t,
    !0,
    yt,
    jt,
    ct
  );
}
function U(t, e, r, o, n) {
  if (!P(t))
    return process.env.NODE_ENV !== "production" && M(
      `value cannot be made ${e ? "readonly" : "reactive"}: ${String(
        t
      )}`
    ), t;
  if (t.__v_raw && !(e && t.__v_isReactive))
    return t;
  const s = n.get(t);
  if (s)
    return s;
  const i = At(t);
  if (i === 0)
    return t;
  const c = new Proxy(
    t,
    i === 2 ? o : r
  );
  return n.set(t, c), c;
}
function R(t) {
  return !!(t && t.__v_isReadonly);
}
function b(t) {
  return !!(t && t.__v_isShallow);
}
function Kt(t) {
  return t ? !!t.__v_raw : !1;
}
function u(t) {
  const e = t && t.__v_raw;
  return e ? u(e) : t;
}
const d = (t) => P(t) ? at(t) : t, L = (t) => P(t) ? ut(t) : t;
function m(t) {
  return t ? t.__v_isRef === !0 : !1;
}
function Wt(t) {
  return Vt(t, !1);
}
function Vt(t, e) {
  return m(t) ? t : new Ht(t, e);
}
class Ht {
  constructor(e, r) {
    this.dep = new et(), this.__v_isRef = !0, this.__v_isShallow = !1, this._rawValue = r ? e : u(e), this._value = r ? e : d(e), this.__v_isShallow = r;
  }
  get value() {
    return process.env.NODE_ENV !== "production" ? this.dep.track({
      target: this,
      type: "get",
      key: "value"
    }) : this.dep.track(), this._value;
  }
  set value(e) {
    const r = this._rawValue, o = this.__v_isShallow || b(e) || R(e);
    e = o ? e : u(e), y(e, r) && (this._rawValue = e, this._value = o ? e : d(e), process.env.NODE_ENV !== "production" ? this.dep.trigger({
      target: this,
      type: "set",
      key: "value",
      newValue: e,
      oldValue: r
    }) : this.dep.trigger());
  }
}
export {
  Wt as a,
  ut as r,
  $t as s
};
//# sourceMappingURL=reactivity.esm-bundler-B9rVewCG.js.map
