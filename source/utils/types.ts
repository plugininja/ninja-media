export type GenericObject = Record<string, any>;

/** Allows a literal union (of `string` or `number`) to also accept any other value of the base type, without losing IntelliSense autocomplete for the provided literals. */
export type LooseLiteral<T extends string | number> =
    | T
    | (T extends string ? string & {} : number & {});

/** - Dot-notation keys for nested objects with `any` value (including optional properties) */
export type NestedKey<T extends GenericObject> = T extends Array<unknown>
    ? never
    : {
          [K in keyof T & string]: T[K] extends Function
              ? never
              : T[K] extends GenericObject
              ? `${K}` | `${K}.${NestedKey<T[K]>}`
              : `${K}`;
      }[keyof T & string];

/** Helper type: given an object and a dot path, extract the type at that path */
export type NestedValue<
    T extends GenericObject,
    P extends NestedKey<T>,
> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
        ? T[K] extends GenericObject
            ? NestedValue<T[K], Rest & NestedKey<T[K]>>
            : never
        : never
    : P extends keyof T
    ? T[P]
    : never;

/** Replace all spaces in a string `T` with the string `With` (default is `-`) */
export type ReplaceSpace<
    T extends string,
    With extends string = "-",
> = T extends `${infer First} ${infer Rest}`
    ? ReplaceSpace<Rest, With> extends infer Refined
        ? Refined extends string
            ? `${First}${With}${Refined}`
            : never
        : never
    : T;

export type NumericString = `${number}`;
