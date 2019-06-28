"use strict";
const _ = require('lodash');
require('jest-expect-message');
class CommonChecker {
    static expectNotEmpty(object) {
        expect(_.isEmpty(object)).toBeFalsy();
    }
    static expectOnlyOneArrayItemForTheList(object) {
        expect(object.data.length).toBe(1);
        expect(object.metadata.total_amount).toBe(1);
        expect(object.metadata.has_more).toBe(false);
    }
    static expectOnlyTwoArrayItemForTheList(object) {
        expect(object.data.length).toBe(2);
        expect(object.metadata.total_amount).toBe(2);
        expect(object.metadata.has_more).toBe(false);
    }
    static checkArrayOfObjectsInterface(manyActualObjects, objectInterfaceRules, options) {
        expect(Array.isArray(manyActualObjects)).toBeTruthy();
        this.expectNotEmpty(manyActualObjects);
        for (const oneObject of manyActualObjects) {
            this.checkOneObjectInterface(oneObject, objectInterfaceRules, options);
        }
    }
    static checkOneObjectInterface(oneObject, objectInterfaceRules, options) {
        this.expectNotEmpty(oneObject);
        if (options.exactKeysAmount) {
            expect(Object.keys(oneObject).sort()).toEqual(Object.keys(objectInterfaceRules).sort());
        }
        for (const key in objectInterfaceRules) {
            if (!objectInterfaceRules.hasOwnProperty(key)) {
                continue;
            }
            switch (objectInterfaceRules[key].type) {
                case 'number':
                    expect(oneObject[key]).toBeGreaterThanOrEqual(objectInterfaceRules[key].length);
                    expect(Number.isFinite(oneObject[key])).toBeTruthy();
                    // @ts-ignore
                    expect(typeof oneObject[key], `Wrong type of key ${key}. Object: ${JSON.stringify(oneObject)}`)
                        .toBe(objectInterfaceRules[key].type);
                    break;
                case 'string':
                    expect(oneObject[key].length).toBeGreaterThanOrEqual(objectInterfaceRules[key].length);
                    // @ts-ignore
                    expect(typeof oneObject[key], `Wrong type of key ${key}. Object: ${JSON.stringify(oneObject)}`)
                        .toBe(objectInterfaceRules[key].type);
                    break;
                case 'string_array':
                    expect(oneObject[key].length).toBeGreaterThanOrEqual(objectInterfaceRules[key].length);
                    expect(Array.isArray(oneObject[key])).toBeTruthy();
                    break;
                default:
                    throw new TypeError(`Unsupported expected type: ${objectInterfaceRules[key].type}`);
            }
            if (typeof objectInterfaceRules[key].value !== 'undefined') {
                expect(oneObject[key]).toBe(objectInterfaceRules[key].value);
            }
        }
    }
    // eslint-disable-next-line sonarjs/cognitive-complexity
    static checkManyObjectsInterface(manyActualObjects, objectInterfaceRules, options) {
        expect(typeof manyActualObjects).toBe('object');
        expect(Array.isArray(manyActualObjects)).toBeFalsy();
        this.expectNotEmpty(manyActualObjects);
        for (const actualKey in manyActualObjects) {
            if (!manyActualObjects.hasOwnProperty(actualKey)) {
                continue;
            }
            const oneObject = manyActualObjects[actualKey];
            this.checkOneObjectInterface(oneObject, objectInterfaceRules, options);
        }
    }
}
module.exports = CommonChecker;
