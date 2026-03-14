#!/usr/bin/env node
/**
 * Local signing script — replaces the missing MCP btc_sign_message / stacks_sign_message tools.
 *
 * Uses the same libraries and derivation paths as aibtc-mcp-server.
 * Reads the encrypted keystore at ~/.aibtc/, decrypts with the wallet password,
 * derives keys, and signs messages.
 *
 * Usage:
 *   node scripts/sign.mjs btc  "message to sign"              # BIP-322 P2WPKH (bc1q)
 *   node scripts/sign.mjs btc  "message to sign" --taproot     # BIP-322 P2TR   (bc1p)
 *   node scripts/sign.mjs stx  "message to sign"              # Stacks message signing
 *
 * Environment:
 *   WALLET_PASSWORD  — wallet password (required)
 *   WALLET_ID        — wallet UUID (default: active wallet from config)
 *   NETWORK          — mainnet | testnet (default: mainnet)
 *
 * Output: JSON with { signature, signer, format }
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { mnemonicToSeedSync } from "@scure/bip39";
import { HDKey } from "@scure/bip32";
import {
  Transaction,
  p2wpkh,
  p2tr,
  Script,
  RawTx,
  RawWitness,
  NETWORK as BTC_MAINNET,
  TEST_NETWORK as BTC_TESTNET,
} from "@scure/btc-signer";
import {
  signMessageHashRsv,
  publicKeyFromSignatureRsv,
  getAddressFromPublicKey,
} from "@stacks/transactions";
import { hashMessage } from "@stacks/encryption";
import { hashSha256Sync } from "@stacks/encryption";
import { bytesToHex } from "@stacks/common";
import { generateWallet, getStxAddress } from "@stacks/wallet-sdk";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const AIBTC_DIR = path.join(process.env.HOME, ".aibtc");
const NETWORK = process.env.NETWORK || "mainnet";

// ---------------------------------------------------------------------------
// Keystore decryption (mirrors aibtc-mcp-server encryption.ts)
// ---------------------------------------------------------------------------

function deriveKey(password, salt, params) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, params.keyLen, {
      N: params.N, r: params.r, p: params.p,
    }, (err, key) => err ? reject(err) : resolve(key));
  });
}

async function decryptKeystore(encrypted, password) {
  const ciphertext = Buffer.from(encrypted.ciphertext, "base64");
  const iv = Buffer.from(encrypted.iv, "base64");
  const authTag = Buffer.from(encrypted.authTag, "base64");
  const salt = Buffer.from(encrypted.salt, "base64");
  const key = await deriveKey(password, salt, encrypted.scryptParams);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error("Decryption failed — invalid password");
  }
}

// ---------------------------------------------------------------------------
// Key derivation (mirrors aibtc-mcp-server bitcoin.ts)
// ---------------------------------------------------------------------------

function deriveBtcKeyPair(mnemonic, network) {
  const seed = mnemonicToSeedSync(mnemonic);
  const master = HDKey.fromMasterSeed(seed);
  const coinType = network === "mainnet" ? 0 : 1;
  const derived = master.derive(`m/84'/${coinType}'/0'/0/0`);
  const btcNet = network === "testnet" ? BTC_TESTNET : BTC_MAINNET;
  const addr = p2wpkh(derived.publicKey, btcNet);
  return {
    address: addr.address,
    privateKey: new Uint8Array(derived.privateKey),
    publicKey: new Uint8Array(derived.publicKey),
  };
}

function deriveTaprootKeyPair(mnemonic, network) {
  const seed = mnemonicToSeedSync(mnemonic);
  const master = HDKey.fromMasterSeed(seed);
  const coinType = network === "mainnet" ? 0 : 1;
  const derived = master.derive(`m/86'/${coinType}'/0'/0/0`);
  const btcNet = network === "testnet" ? BTC_TESTNET : BTC_MAINNET;
  const xOnly = derived.publicKey.slice(1);
  const addr = p2tr(xOnly, undefined, btcNet);
  return {
    address: addr.address,
    privateKey: new Uint8Array(derived.privateKey),
    internalPubKey: new Uint8Array(xOnly),
  };
}

async function deriveStxAddress(mnemonic, network) {
  const wallet = await generateWallet({ secretKey: mnemonic, password: "" });
  const account = wallet.accounts[0];
  const address = getStxAddress(account, network);
  return { address, privateKey: account.stxPrivateKey };
}

// ---------------------------------------------------------------------------
// BIP-322 signing (mirrors aibtc-mcp-server signing.tools.ts)
// ---------------------------------------------------------------------------

function concatBytes(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) { result.set(a, off); off += a.length; }
  return result;
}

function bip322TaggedHash(message) {
  const tagBytes = new TextEncoder().encode("BIP0322-signed-message");
  const tagHash = hashSha256Sync(tagBytes);
  const msgBytes = new TextEncoder().encode(message);
  return hashSha256Sync(concatBytes(tagHash, tagHash, msgBytes));
}

function doubleSha256(data) {
  return hashSha256Sync(hashSha256Sync(data));
}

function bip322BuildToSpendTxId(message, scriptPubKey) {
  const msgHash = bip322TaggedHash(message);
  const scriptSig = concatBytes(new Uint8Array([0x00, 0x20]), msgHash);
  const rawTx = RawTx.encode({
    version: 0,
    inputs: [{ txid: new Uint8Array(32), index: 0xffffffff, finalScriptSig: scriptSig, sequence: 0 }],
    outputs: [{ amount: 0n, script: scriptPubKey }],
    lockTime: 0,
  });
  return doubleSha256(rawTx).reverse();
}

function bip322Sign(message, privateKey, scriptPubKey, tapInternalKey) {
  const toSpendTxid = bip322BuildToSpendTxId(message, scriptPubKey);
  const toSignTx = new Transaction({ version: 0, lockTime: 0, allowUnknownOutputs: true });
  toSignTx.addInput({
    txid: toSpendTxid,
    index: 0,
    sequence: 0,
    witnessUtxo: { amount: 0n, script: scriptPubKey },
    ...(tapInternalKey && { tapInternalKey }),
  });
  toSignTx.addOutput({ script: Script.encode(["RETURN"]), amount: 0n });
  toSignTx.signIdx(privateKey, 0);
  toSignTx.finalizeIdx(0);
  const input = toSignTx.getInput(0);
  if (!input.finalScriptWitness) throw new Error("BIP-322 signing failed: no witness");
  return Buffer.from(RawWitness.encode(input.finalScriptWitness)).toString("base64");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const [,, mode, message, ...flags] = process.argv;

  if (!mode || !message || !["btc", "stx"].includes(mode)) {
    console.error("Usage: node scripts/sign.mjs btc|stx \"message\" [--taproot]");
    process.exit(1);
  }

  const password = process.env.WALLET_PASSWORD;
  if (!password) {
    console.error("Error: WALLET_PASSWORD env var is required");
    process.exit(1);
  }

  // Resolve wallet ID
  const config = JSON.parse(fs.readFileSync(path.join(AIBTC_DIR, "config.json"), "utf8"));
  const walletId = process.env.WALLET_ID || config.activeWalletId;

  // Read and decrypt keystore
  const keystorePath = path.join(AIBTC_DIR, "wallets", walletId, "keystore.json");
  const keystore = JSON.parse(fs.readFileSync(keystorePath, "utf8"));
  const mnemonic = await decryptKeystore(keystore.encrypted, password);

  const btcNet = NETWORK === "testnet" ? BTC_TESTNET : BTC_MAINNET;
  const useTaproot = flags.includes("--taproot");

  if (mode === "btc") {
    if (useTaproot) {
      const keys = deriveTaprootKeyPair(mnemonic, NETWORK);
      const scriptPubKey = p2tr(keys.internalPubKey, undefined, btcNet).script;
      const sig = bip322Sign(message, keys.privateKey, scriptPubKey, keys.internalPubKey);
      console.log(JSON.stringify({
        success: true,
        signatureBase64: sig,
        format: "BIP-322 (P2TR Taproot)",
        signer: keys.address,
        network: NETWORK,
        message,
      }));
    } else {
      const keys = deriveBtcKeyPair(mnemonic, NETWORK);
      const scriptPubKey = p2wpkh(keys.publicKey, btcNet).script;
      const sig = bip322Sign(message, keys.privateKey, scriptPubKey);
      console.log(JSON.stringify({
        success: true,
        signatureBase64: sig,
        format: "BIP-322 (P2WPKH native SegWit)",
        signer: keys.address,
        network: NETWORK,
        message,
      }));
    }
  } else if (mode === "stx") {
    const stx = await deriveStxAddress(mnemonic, NETWORK);
    const msgHash = hashMessage(message);
    const msgHashHex = bytesToHex(msgHash);
    const signature = signMessageHashRsv({ messageHash: msgHashHex, privateKey: stx.privateKey });
    console.log(JSON.stringify({
      success: true,
      signature,
      format: "RSV (65 bytes hex, SIWS-compatible)",
      signer: stx.address,
      network: NETWORK,
      message,
    }));
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ success: false, error: err.message }));
  process.exit(1);
});
