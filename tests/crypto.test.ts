import { test, expect, describe } from "@frida/injest/agent";
import { Buffer } from "buffer";

import crypto from "../index.js";

const helloWorldSha =
    "309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f"
    + "989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f";
const helloWorldShaBase64 =
    "MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw==";

const helloBytes = [0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64];

function digestOfBytes(bytes: ArrayBufferView) {
    return crypto.createHash("sha512").update(bytes).digest("hex");
}

function helloSha512() {
    const hash = crypto.createHash("sha512");
    hash.update("hello world");
    return hash;
}

describe("createHash", () => {
    test("digest as hex", () => {
        expect(helloSha512().digest("hex")).toBe(helloWorldSha);
    });

    test("digest as base64", () => {
        expect(helloSha512().digest("base64")).toBe(helloWorldShaBase64);
    });

    test("digest defaults to a Buffer", () => {
        expect(helloSha512().digest() instanceof Buffer).toBeTruthy();
    });

    test("update changes the digest", () => {
        const hash = helloSha512();
        hash.update("hello world");
        expect(hash.digest("hex")).not.toBe(helloWorldSha);
    });

    test("update after digest throws", () => {
        const hash = helloSha512();
        hash.digest("hex");
        expect(() => hash.update("hello world")).toThrow();
    });

    test("update with a Buffer", () => {
        expect(digestOfBytes(Buffer.from(helloBytes))).toBe(helloWorldSha);
    });

    test("update with a Uint8Array", () => {
        expect(digestOfBytes(new Uint8Array(helloBytes))).toBe(helloWorldSha);
    });

    test("update with a DataView", () => {
        const view = new DataView(new Uint8Array(helloBytes).buffer);
        expect(digestOfBytes(view)).toBe(helloWorldSha);
    });

    test("update with a view into a larger buffer", () => {
        const backing = new Uint8Array([0xff, ...helloBytes, 0xff]);
        const view = new Uint8Array(backing.buffer, 1, helloBytes.length);
        expect(digestOfBytes(view)).toBe(helloWorldSha);
    });

    test("update with a hex input encoding", () => {
        const hash = crypto.createHash("sha512");
        hash.update("68656c6c6f20776f726c64", "hex");
        expect(hash.digest("hex")).toBe(helloWorldSha);
    });

    test("update with a base64 input encoding", () => {
        const hash = crypto.createHash("sha512");
        hash.update("aGVsbG8gd29ybGQ=", "base64");
        expect(hash.digest("hex")).toBe(helloWorldSha);
    });

    test("update with odd-length hex throws", () => {
        expect(() => crypto.createHash("sha512").update("6", "hex")).toThrow();
    });

    test("update with invalid hex digits throws", () => {
        expect(() => crypto.createHash("sha512").update("BOOM", "hex")).toThrow();
        expect(() => crypto.createHash("sha512").update("glam", "hex")).toThrow();
    });
});

describe("randomBytes", () => {
    test("returns a Buffer of the requested size", () => {
        const bytes = crypto.randomBytes(16);
        expect(bytes instanceof Buffer).toBeTruthy();
        expect(bytes.length).toBe(16);
    });

    test("returns different bytes on each call", () => {
        const a = crypto.randomBytes(32).toString("hex");
        const b = crypto.randomBytes(32).toString("hex");
        expect(a).not.toBe(b);
    });

    test("delivers the bytes to a callback asynchronously", async () => {
        let delivered = false;
        const bytes = await new Promise<Buffer>(resolve => {
            crypto.randomBytes(16, (error, buf) => {
                delivered = true;
                resolve(buf);
            });
            expect(delivered).toBe(false);
        });
        expect(bytes.length).toBe(16);
    });
});

describe("randomFillSync", () => {
    test("fills the whole buffer and returns it", () => {
        const buffer = Buffer.alloc(32);
        expect(crypto.randomFillSync(buffer)).toBe(buffer);
        expect(isZeroed(buffer)).toBe(false);
    });

    test("fills only the requested range", () => {
        const buffer = Buffer.alloc(32);
        crypto.randomFillSync(buffer, 8, 16);
        expect(isZeroed(buffer.subarray(0, 8))).toBe(true);
        expect(isZeroed(buffer.subarray(8, 24))).toBe(false);
        expect(isZeroed(buffer.subarray(24))).toBe(true);
    });

    test("fills a DataView", () => {
        const view = new DataView(new ArrayBuffer(32));
        crypto.randomFillSync(view);
        expect(isZeroed(new Uint8Array(view.buffer))).toBe(false);
    });

    test("fills a view into a larger buffer", () => {
        const backing = new Uint8Array(32);
        crypto.randomFillSync(new Uint8Array(backing.buffer, 8, 16));
        expect(isZeroed(backing.subarray(0, 8))).toBe(true);
        expect(isZeroed(backing.subarray(8, 24))).toBe(false);
        expect(isZeroed(backing.subarray(24))).toBe(true);
    });
});

describe("getRandomValues", () => {
    test("fills the array and returns it", () => {
        const array = new Uint8Array(32);
        expect(crypto.getRandomValues(array)).toBe(array);
        expect(isZeroed(array)).toBe(false);
    });

    test("fills every byte of a wider typed array", () => {
        const array = new Uint32Array(16);
        crypto.getRandomValues(array);
        expect(isZeroed(new Uint8Array(array.buffer, 0, 32))).toBe(false);
        expect(isZeroed(new Uint8Array(array.buffer, 32))).toBe(false);
    });
});

function isZeroed(bytes: Uint8Array) {
    return bytes.every(b => b === 0);
}
