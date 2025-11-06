import { expect, it } from 'vitest';
import * as multiInstanceAgg from './_multi-instance-agg';
import { bindRef, bindDeepRef } from '../bind';

it('bindRef', async () => {
  const agg = multiInstanceAgg.useMultiInstaceAgg('bindRef');
  const name = bindRef(agg.states.name, (n) => {
    agg.commands.setName(n);
  });
  const age = bindRef(agg.states.age, (n) => {
    agg.commands.setAge(n);
  });
  const mapRef = bindRef(agg.states.mapRef, (n) => {
    agg.commands.setMapRef(n);
  });
  const mapReactive = bindRef(agg.states.mapReactive, (n) => {
    agg.commands.setMapReactive(n);
  });
  expect(name.value).toBe('');
  expect(age.value).toBe(0);
  expect(mapRef.value).toEqual({ a: 1, b: '2' });
  expect(mapReactive.value).toEqual({ a: 1, b: '2' });
  name.value = 'Bob';
  age.value = 18;
  mapRef.value = { a: 2, b: '3' };
  mapReactive.value = { a: 2, b: '3' };
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.states.name.value).toBe('Bob');
  expect(agg.states.age.value).toBe(18);
  expect(agg.states.mapRef.value).toEqual({ a: 2, b: '3' });
  expect(agg.states.mapReactive).toEqual({ a: 2, b: '3' });
});

it('bindRef forceSync', async () => {
  const agg = multiInstanceAgg.useMultiInstaceAgg('bindRef forceSync');
  const name = bindRef(
    agg.states.name,
    (n) => {
      agg.commands.setName(n);
    },
    true
  );
  const age = bindRef(
    agg.states.age,
    (n) => {
      agg.commands.setAge(n);
    },
    true
  );
  const mapRef = bindRef(
    agg.states.mapRef,
    (n) => {
      agg.commands.setMapRef(n);
    },
    true
  );
  const mapReactive = bindRef(
    agg.states.mapReactive,
    (n) => {
      agg.commands.setMapReactive(n);
    },
    true
  );
  agg.commands.setAge(18);
  agg.commands.setName('Bob');
  agg.commands.setMapRef({ a: 2, b: '3' });
  agg.commands.setMapReactive({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  expect(name.value).toBe('Bob');
  expect(age.value).toBe(18);
  expect(mapRef.value).toEqual({ a: 2, b: '3' });
  expect(mapReactive.value).toEqual({ a: 2, b: '3' });
});

it('bindRef multi page', async () => {
  const agg = multiInstanceAgg.useMultiInstaceAgg('bindRef multi page');
  const mapRef = bindRef(
    agg.states.mapRef,
    (n) => {
      agg.commands.setMapRef(n);
    },
    true
  );
  const mapRef2 = bindRef(
    agg.states.mapRef,
    (n) => {
      agg.commands.setMapRef(n);
    },
    true
  );
  await new Promise((resolve) => setTimeout(resolve));
  mapRef.value = { a: 2, b: '3' };
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef2.value).toEqual({ a: 2, b: '3' });
  expect(agg.states.mapRef.value).toEqual({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  agg.commands.setMapRef({ a: 1, b: '2' });
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value).toEqual({ a: 1, b: '2' });
  expect(mapRef2.value).toEqual({ a: 1, b: '2' });
});

it('bindDeepRef', async () => {
  const agg = multiInstanceAgg.useMultiInstaceAgg('bindDeepRef');
  const name = bindDeepRef(agg.states.name, (n) => {
    agg.commands.setName(n);
  });
  const age = bindDeepRef(agg.states.age, (n) => {
    agg.commands.setAge(n);
  });
  const mapRef = bindDeepRef(agg.states.mapRef, (n) => {
    agg.commands.setMapRef(n);
  });
  const mapReactive = bindDeepRef(agg.states.mapReactive, (n) => {
    agg.commands.setMapReactive(n);
  });
  expect(name.value).toBe('');
  expect(age.value).toBe(0);
  expect(mapRef.value).toEqual({ a: 1, b: '2' });
  expect(mapReactive.value).toEqual({ a: 1, b: '2' });
  name.value = 'Bob';
  age.value = 18;
  mapRef.value = { a: 2, b: '3' };
  mapReactive.value = { a: 2, b: '3' };
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.states.name.value).toBe('Bob');
  expect(agg.states.age.value).toBe(18);
  expect(agg.states.mapRef.value).toEqual({ a: 2, b: '3' });
  expect(agg.states.mapReactive).toEqual({ a: 2, b: '3' });
  mapRef.value.a = 1;
  mapReactive.value.a = 1;
  await new Promise((resolve) => setTimeout(resolve));
  expect(agg.states.mapRef.value.a).toBe(1);
  expect(agg.states.mapReactive.a).toBe(1);
});

it('bindDeepRef forceSync', async () => {
  const agg = multiInstanceAgg.useMultiInstaceAgg('bindDeepRef forceSync');
  const name = bindDeepRef(
    agg.states.name,
    (n) => {
      agg.commands.setName(n);
    },
    true
  );
  const age = bindDeepRef(
    agg.states.age,
    (n) => {
      agg.commands.setAge(n);
    },
    true
  );
  const mapRef = bindDeepRef(
    agg.states.mapRef,
    (n) => {
      agg.commands.setMapRef(n);
    },
    true
  );
  const mapReactive = bindDeepRef(
    agg.states.mapReactive,
    (n) => {
      agg.commands.setMapReactive(n);
    },
    true
  );
  agg.commands.setAge(18);
  agg.commands.setName('Bob');
  agg.commands.setMapRef({ a: 2, b: '3' });
  agg.commands.setMapReactive({ a: 2, b: '3' });
  await new Promise((resolve) => setTimeout(resolve));
  expect(name.value).toBe('Bob');
  expect(age.value).toBe(18);
  expect(mapRef.value).toEqual({ a: 2, b: '3' });
  expect(mapReactive.value).toEqual({ a: 2, b: '3' });
  agg.commands.setMapRefA(1);
  agg.commands.setMapReactiveA(1);
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value.a).toBe(1);
  expect(mapReactive.value.a).toBe(1);
});

it('bindDeepRef multi page', async () => {
  const agg = multiInstanceAgg.useMultiInstaceAgg('bindDeepRef multi page');
  const mapRef = bindDeepRef(
    agg.states.mapRef,
    (n) => {
      agg.commands.setMapRef(n);
    },
    true
  );
  const mapRef2 = bindDeepRef(
    agg.states.mapRef,
    (n) => {
      agg.commands.setMapRef(n);
    },
    true
  );
  await new Promise((resolve) => setTimeout(resolve));
  mapRef.value.a = 2;
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef2.value).toEqual({ a: 2, b: '2' });
  expect(agg.states.mapRef.value).toEqual({ a: 2, b: '2' });
  await new Promise((resolve) => setTimeout(resolve));
  agg.commands.setMapRefA(1);
  await new Promise((resolve) => setTimeout(resolve));
  expect(mapRef.value.a).toBe(1);
  expect(mapRef2.value.a).toBe(1);
});
