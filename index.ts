import { Buffer } from "buffer";

export default {
    createHash,
    randomBytes,
    randomFillSync,
    getRandomValues,
}

export function createHash(type: ChecksumType): Hash {
    return new Hash(new Checksum(type));
}

export class Hash {
    checksum: Checksum;

    constructor(checksum: Checksum) {
        this.checksum = checksum;
    }

    update(data: string | ArrayBufferView, inputEncoding?: BufferEncoding): Hash {
        this.checksum.update(toChecksumData(data, inputEncoding));
        return this;
    }

    digest(encoding: BinaryToTextEncoding = "binary"): Buffer | string {
        if (encoding === "hex")
            return this.checksum.getString();

        const rawDigest = Buffer.from(this.checksum.getDigest());
        if (encoding === "binary")
            return rawDigest;

        return rawDigest.toString(encoding);
    }

    copy(): Hash {
        throw new Error("copy() not yet supported");
    }
}

function toChecksumData(data: string | ArrayBufferView, inputEncoding?: BufferEncoding): string | ArrayBuffer {
    if (typeof data !== "string")
        return viewToArrayBuffer(data);

    if (inputEncoding === undefined)
        return data;

    const bytes = Buffer.from(data, inputEncoding);
    if (inputEncoding === "hex" && bytes.length * 2 !== data.length)
        throw new Error("Invalid hex string");

    return viewToArrayBuffer(bytes);
}

function viewToArrayBuffer(view: ArrayBufferView): ArrayBuffer {
    return view.buffer.slice(view.byteOffset, view.byteOffset + view.byteLength) as ArrayBuffer;
}

export function randomBytes(size: number): Buffer;
export function randomBytes(size: number, callback: (error: Error | null, buf: Buffer) => void): void;
export function randomBytes(size: number, callback?: (error: Error | null, buf: Buffer) => void): Buffer | void {
    const bytes = Buffer.alloc(size);
    getRandomValues(bytes);

    if (callback === undefined)
        return bytes;

    setImmediate(callback, null, bytes);
}

export function randomFillSync<T extends Uint8Array | DataView>(buffer: T, offset = 0, size = buffer.byteLength - offset): T {
    getRandomValues(new Uint8Array(buffer.buffer, buffer.byteOffset + offset, size));
    return buffer;
}

export function getRandomValues<T extends ArrayBufferView>(array: T): T {
    fillWithRandomBytes(new Uint8Array(array.buffer, array.byteOffset, array.byteLength));
    return array;
}

function fillWithRandomBytes(bytes: Uint8Array): void {
    if (Process.platform === "windows")
        fillUsingBCrypt(bytes);
    else
        fillUsingUrandom(bytes);
}

function fillUsingBCrypt(bytes: Uint8Array): void {
    const BCRYPT_USE_SYSTEM_PREFERRED_RNG = 2;

    const scratch = Memory.alloc(bytes.length);
    getBCryptGenRandom()(NULL, scratch, bytes.length, BCRYPT_USE_SYSTEM_PREFERRED_RNG);
    bytes.set(new Uint8Array(scratch.readByteArray(bytes.length)!));
}

type BCryptGenRandom = NativeFunction<number, [NativePointerValue, NativePointerValue, number, number]>;

let cachedBCryptGenRandom: BCryptGenRandom | null = null;

function getBCryptGenRandom(): BCryptGenRandom {
    cachedBCryptGenRandom ??= new NativeFunction(
        Module.load("bcrypt.dll").getExportByName("BCryptGenRandom"),
        "int32",
        ["pointer", "pointer", "uint32", "uint32"]);
    return cachedBCryptGenRandom;
}

function fillUsingUrandom(bytes: Uint8Array): void {
    const urandom = new File("/dev/urandom", "rb");
    bytes.set(new Uint8Array(urandom.readBytes(bytes.length)));
    urandom.close();
}

type BinaryToTextEncoding = "binary" | "base64" | "base64url" | "hex";
