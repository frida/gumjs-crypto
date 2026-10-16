import { test, expect, describe } from "@frida/injest/agent";
import { Buffer } from "buffer";

import crypto from "../index.js";

const helloWorldSha =
    "309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f"
    + "989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f";
const helloWorldShaBase64 =
    "MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw==";

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
});
