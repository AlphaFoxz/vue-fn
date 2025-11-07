import { expect, it } from 'vitest';
import { bindRef } from '../bind';
import { reactive, readonly, ref } from 'vue';

function createAgg() {
  const name = ref('');
  const age = ref(0);
  const mapRef = ref({ a: 1, b: '2' });
  const mapReactive = reactive({ a: 1, b: '2' });
  return {
    name: readonly(name),
    age: readonly(age),
    mapRef: readonly(mapRef),
    mapReactive: readonly(mapReactive),
    setName: (n: string) => {
      name.value = n;
    },
    setAge: (n: number) => {
      age.value = n;
    },
    setMapRef: (n: { a: number; b: string }) => {
      mapRef.value = n;
    },
    setMapReactive: (n: { a: number; b: string }) => {
      mapReactive.a = n.a;
      mapReactive.b = n.b;
    },
    setMapRefA: (n: number) => {
      mapRef.value.a = n;
    },
    setMapReactiveA: (n: number) => {
      mapReactive.a = n;
    },
  };
}

it('bindRef', async () => {
  const agg = createAgg();
  const name = bindRef(agg.name, (n) => {
    agg.setName(n);
  });
  const age = bindRef(agg.age, (n) => {
    agg.setAge(n);
  });
  const mapRef = bindRef(agg.mapRef, (n) => {
    agg.setMapRef(n);
  });
  const mapReactive = bindRef(agg.mapReactive, (n) => {
    agg.setMapReactive(n);
  });
  const mapA1 = bindRef(
    () => agg.mapRef.value.a,
    (v) => {
      agg.setMapRefA(v);
    }
  );
  const mapA2 = bindRef(
    () => agg.mapReactive.a,
    (v) => {
      agg.setMapReactiveA(v);
    }
  );
  expect(name.value).toBe('');
  expect(age.value).toBe(0);
  expect(mapRef.value).toEqual({ a: 1, b: '2' });
  expect(mapReactive.value).toEqual({ a: 1, b: '2' });
  expect(mapA1.value).toBe(1);
  expect(mapA2.value).toBe(1);
  name.value = 'Bob';
  age.value = 18;
  mapRef.value = { a: 2, b: '3' };
  mapReactive.value = { a: 2, b: '3' };
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.name.value).toBe('Bob');
  expect(agg.age.value).toBe(18);
  expect(agg.mapRef.value).toEqual({ a: 2, b: '3' });
  expect(agg.mapReactive).toEqual({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  mapA1.value = 3;
  mapA2.value = 3;
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.mapRef.value).toEqual({ a: 3, b: '3' });
  expect(agg.mapReactive).toEqual({ a: 3, b: '3' });
});

it('bindRef forceSync', async () => {
  const agg = createAgg();
  const name = bindRef(
    agg.name,
    (n) => {
      agg.setName(n);
    },
    { forceSync: true }
  );
  const age = bindRef(
    agg.age,
    (n) => {
      agg.setAge(n);
    },
    { forceSync: true }
  );
  const mapRef = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { forceSync: true }
  );
  const mapReactive = bindRef(
    agg.mapReactive,
    (n) => {
      agg.setMapReactive(n);
    },
    { forceSync: true }
  );
  const mapA1 = bindRef(
    () => agg.mapRef.value.a,
    (v) => {
      agg.setMapRefA(v);
    },
    { forceSync: true }
  );
  const mapA2 = bindRef(
    () => agg.mapReactive.a,
    (v) => {
      agg.setMapReactiveA(v);
    },
    { forceSync: true }
  );
  agg.setAge(18);
  agg.setName('Bob');
  agg.setMapRef({ a: 2, b: '3' });
  agg.setMapReactive({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  expect(name.value).toBe('Bob');
  expect(age.value).toBe(18);
  expect(mapRef.value).toEqual({ a: 2, b: '3' });
  expect(mapReactive.value).toEqual({ a: 2, b: '3' });
  agg.setMapRefA(3);
  agg.setMapReactiveA(3);
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value).toEqual({ a: 3, b: '3' });
  expect(mapReactive.value).toEqual({ a: 3, b: '3' });
});

it('bindRef multi page', async () => {
  const agg = createAgg();
  const mapRef = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { forceSync: true }
  );
  const mapRef2 = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { forceSync: true }
  );
  await new Promise((resolve) => setTimeout(resolve));
  mapRef.value = { a: 2, b: '3' };
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef2.value).toEqual({ a: 2, b: '3' });
  expect(agg.mapRef.value).toEqual({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  agg.setMapRef({ a: 1, b: '2' });
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value).toEqual({ a: 1, b: '2' });
  expect(mapRef2.value).toEqual({ a: 1, b: '2' });
});

it('bindRef deep', async () => {
  const agg = createAgg();
  const name = bindRef(
    agg.name,
    (n) => {
      agg.setName(n);
    },
    { deep: true }
  );
  const age = bindRef(
    agg.age,
    (n) => {
      agg.setAge(n);
    },
    { deep: true }
  );
  const mapRef = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { deep: true }
  );
  const mapReactive = bindRef(
    agg.mapReactive,
    (n) => {
      agg.setMapReactive(n);
    },
    { deep: true }
  );
  expect(name.value).toBe('');
  expect(age.value).toBe(0);
  expect(mapRef.value).toEqual({ a: 1, b: '2' });
  expect(mapReactive.value).toEqual({ a: 1, b: '2' });
  name.value = 'Bob';
  age.value = 18;
  mapRef.value = { a: 2, b: '3' };
  mapReactive.value = { a: 2, b: '3' };
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.name.value).toBe('Bob');
  expect(agg.age.value).toBe(18);
  expect(agg.mapRef.value).toEqual({ a: 2, b: '3' });
  expect(agg.mapReactive).toEqual({ a: 2, b: '3' });
  mapRef.value.a = 1;
  mapReactive.value.a = 1;
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.mapRef.value.a).toBe(1);
  expect(agg.mapReactive.a).toBe(1);
});

it('bindRef deep forceSync', async () => {
  const agg = createAgg();
  const name = bindRef(
    agg.name,
    (n) => {
      agg.setName(n);
    },
    { deep: true, forceSync: true }
  );
  const age = bindRef(
    agg.age,
    (n) => {
      agg.setAge(n);
    },
    { deep: true, forceSync: true }
  );
  const mapRef = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { deep: true, forceSync: true }
  );
  const mapReactive = bindRef(
    agg.mapReactive,
    (n) => {
      agg.setMapReactive(n);
    },
    { deep: true, forceSync: true }
  );
  const mapA1 = bindRef(
    () => agg.mapRef.value.a,
    () => {
      agg.setMapRefA(1);
    },
    { deep: true, forceSync: true }
  );
  const mapA2 = bindRef(
    () => agg.mapReactive.a,
    () => {
      agg.setMapReactiveA(1);
    },
    { deep: true, forceSync: true }
  );
  agg.setAge(18);
  agg.setName('Bob');
  agg.setMapRef({ a: 2, b: '3' });
  agg.setMapReactive({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  expect(name.value).toBe('Bob');
  expect(age.value).toBe(18);
  expect(mapRef.value).toEqual({ a: 2, b: '3' });
  expect(mapReactive.value).toEqual({ a: 2, b: '3' });
  agg.setMapRefA(3);
  agg.setMapReactiveA(3);
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value.a).toBe(3);
  expect(mapReactive.value.a).toBe(3);
  expect(mapA1.value).toBe(3);
  expect(mapA2.value).toBe(3);
});

it('bindRef multi page', async () => {
  const agg = createAgg();
  const mapRef = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { deep: true, forceSync: true }
  );
  const mapRef2 = bindRef(
    agg.mapRef,
    (n) => {
      agg.setMapRef(n);
    },
    { deep: true, forceSync: true }
  );
  await new Promise((resolve) => setTimeout(resolve));
  mapRef.value.a = 2;
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef2.value).toEqual({ a: 2, b: '2' });
  expect(agg.mapRef.value).toEqual({ a: 2, b: '2' });
  await new Promise((resolve) => setTimeout(resolve));
  agg.setMapRefA(1);
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value.a).toBe(1);
  expect(mapRef2.value.a).toBe(1);
});
