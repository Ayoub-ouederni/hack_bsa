import { randomBytes, createHash } from "crypto";

const PREIMAGE_SIZE = 32;
const FULFILLMENT_LENGTH = 36;
const CONDITION_LENGTH = 39;

export interface ConditionFulfillment {
  condition: string;
  fulfillment: string;
}

export function generateConditionAndFulfillment(): ConditionFulfillment {
  const preimage = randomBytes(PREIMAGE_SIZE);
  const hash = createHash("sha256").update(preimage).digest();

  const fulfillment = encodeFulfillment(preimage);
  const condition = encodeCondition(hash);

  return {
    condition: condition.toString("hex").toUpperCase(),
    fulfillment: fulfillment.toString("hex").toUpperCase(),
  };
}

function encodeFulfillment(preimage: Buffer): Buffer {
  // A0 22 80 20 <32-byte preimage>
  const buf = Buffer.alloc(2 + 2 + PREIMAGE_SIZE);
  buf[0] = 0xa0; // tag: PREIMAGE-SHA-256 fulfillment
  buf[1] = 0x22; // length: 34 bytes
  buf[2] = 0x80; // tag: preimage
  buf[3] = 0x20; // length: 32 bytes
  preimage.copy(buf, 4);
  return buf;
}

function encodeCondition(fingerprint: Buffer): Buffer {
  // A0 25 80 20 <32-byte fingerprint> 81 01 20
  const buf = Buffer.alloc(2 + 2 + PREIMAGE_SIZE + 3);
  buf[0] = 0xa0; // tag: PREIMAGE-SHA-256 condition
  buf[1] = 0x25; // length: 37 bytes
  buf[2] = 0x80; // tag: fingerprint
  buf[3] = 0x20; // length: 32 bytes
  fingerprint.copy(buf, 4);
  buf[36] = 0x81; // tag: maxFulfillmentLength
  buf[37] = 0x01; // length: 1 byte
  buf[38] = 0x20; // value: 32 (preimage size)
  return buf;
}

export function conditionFromPreimage(preimage: Buffer): string {
  const hash = createHash("sha256").update(preimage).digest();
  return encodeCondition(hash).toString("hex").toUpperCase();
}

export function fulfillmentFromPreimage(preimage: Buffer): string {
  return encodeFulfillment(preimage).toString("hex").toUpperCase();
}

export function extractPreimage(fulfillmentHex: string): Buffer {
  const buf = Buffer.from(fulfillmentHex, "hex");
  if (buf.length !== FULFILLMENT_LENGTH || buf[0] !== 0xa0 || buf[2] !== 0x80) {
    throw new Error("Invalid PREIMAGE-SHA-256 fulfillment");
  }
  return buf.subarray(4, 36);
}

export function verifyConditionFulfillment(
  conditionHex: string,
  fulfillmentHex: string
): boolean {
  const fulBuf = Buffer.from(fulfillmentHex, "hex");
  if (fulBuf.length !== FULFILLMENT_LENGTH || fulBuf[0] !== 0xa0 || fulBuf[2] !== 0x80) {
    return false;
  }

  const preimage = fulBuf.subarray(4, 36);
  const hash = createHash("sha256").update(preimage).digest();

  const condBuf = Buffer.from(conditionHex, "hex");
  if (condBuf.length !== CONDITION_LENGTH || condBuf[0] !== 0xa0 || condBuf[2] !== 0x80) {
    return false;
  }

  const fingerprint = condBuf.subarray(4, 36);
  return hash.equals(fingerprint);
}
