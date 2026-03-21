import { randomBytes, createHash } from "crypto";

const PREIMAGE_SIZE = 32;

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
