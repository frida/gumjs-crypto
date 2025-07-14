// Test can be run by frida cli
// node /path/to/frida-compile/dist/cli.js test.ts -o test.js
// frida 0 -l test.js

import { Buffer } from "buffer";
import crypto from "crypto";

const helloWorldSha =
    "309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f"
    + "989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f";

function digest() {
    const b64 = "MJ7MSJwS1utMxA9QyQLytNDtd+5RGnx6m808qG1M2G+YndNbxf9JlnDaNCVbRbDP2DDoH2Bdz33FVC6TrpzXbw==";
    assert(helloSha512().digest("hex") === helloWorldSha, "hex mismatch");
    assert(helloSha512().digest("base64") === b64, "base64 mismatch");
    assert((helloSha512().digest() as any) instanceof Buffer, "expected Buffer");
}

function update() {
    assert(helloSha512().update("hello world").digest("hex") !== helloWorldSha);

    const hexHash = crypto.createHash("md5").update("dc10ae47cb1686d7e7b4f54363b51ced0cd40b0c", "hex");
    assert(hexHash.digest("hex") == "0cd258c4493108f6e4ad3c0a4d937f2f")
    assertThrows(() => crypto.createHash("md5").update("1", "hex"));
    assertThrows(() => crypto.createHash("md5").update("BOOM", "hex"));

    const b64Hash = crypto.createHash("md5").update("3BCuR8sWhtfntPVDY7Uc7QzUCww=", "base64");
    assert(b64Hash.digest("hex") == "0cd258c4493108f6e4ad3c0a4d937f2f")
}

function digestThrows() {
    const hash = helloSha512();
    hash.digest("hex");
    assertThrows(() => { hash.update("hello world"); });
}

function helloSha512() {
    const hash = crypto.createHash("sha512");
    hash.update("hello world");
    return hash;
}

function assert(condition: boolean, msg: string = "assert failed") {
    if (!condition)
        throw new Error(msg);
}

function assertThrows(f: () => void) {
    try {
        f();
    } catch {
        return;
    }
    throw new Error("Didn't throw");
}

digest();
update();
digestThrows();
