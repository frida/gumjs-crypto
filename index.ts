import { Buffer } from "buffer";

export default {
    createHash,
}

export function createHash(type: ChecksumType): Hash {
    return new Hash(new Checksum(type));
}

export class Hash {
    checksum: Checksum;

    constructor(checksum: Checksum) {
        this.checksum = checksum;
    }

    update(data: string | Buffer | DataView, inputEncoding?: string): Hash {
        // TODO: TypedArray
        if (data instanceof DataView)
            throw new Error("DataView not yet supported");

        else if (typeof data == "string" && inputEncoding === "hex") {
            if(data.length % 2 != 0)
                throw new Error(`Hex must be even length, got length: ${data.length}`);

            // This is stricter than node as node ignores invalid hex-strings (except length).
            if (!/^[0-9A-Fa-f]*$/g.test(data))
                throw new Error(`Hex must be 0-9 or a-f`);
            data = new Buffer(data, inputEncoding);
        }
        else if (typeof data == "string" && inputEncoding === "base64") {
            data = new Buffer(data, inputEncoding);
        }
        else if (inputEncoding !== undefined)
            throw new Error("inputEncoding not yet supported");

        if (data instanceof Buffer)
            this.checksum.update(data.buffer as ArrayBuffer);
        else
            this.checksum.update(data);

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

type BinaryToTextEncoding = "binary" | "base64" | "base64url" | "hex";
