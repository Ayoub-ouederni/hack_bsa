const xrpl = require("xrpl");

async function testMultiSign() {
  const client = new xrpl.Client("wss://s.altnet.rippletest.net:51233");
  await client.connect();
  console.log("✅ Connected to XRPL Testnet\n");

  // Step 1: Create 3 wallets (1 fund wallet + 2 signers)
  console.log("Creating 3 testnet wallets (this takes ~15s)...");
  const [fundWallet, signer1, signer2] = await Promise.all([
    client.fundWallet(),
    client.fundWallet(),
    client.fundWallet(),
  ]);
  console.log(`Fund wallet:  ${fundWallet.wallet.address}`);
  console.log(`Signer 1:     ${signer1.wallet.address}`);
  console.log(`Signer 2:     ${signer2.wallet.address}\n`);

  // Step 2: Set up 2-of-2 signer list on fund wallet
  console.log("Setting up 2-of-2 signer list...");
  const signerListTx = await client.submitAndWait(
    {
      TransactionType: "SignerListSet",
      Account: fundWallet.wallet.address,
      SignerQuorum: 2,
      SignerEntries: [
        {
          SignerEntry: {
            Account: signer1.wallet.address,
            SignerWeight: 1,
          },
        },
        {
          SignerEntry: {
            Account: signer2.wallet.address,
            SignerWeight: 1,
          },
        },
      ],
    },
    { wallet: fundWallet.wallet }
  );
  console.log(
    `✅ SignerListSet result: ${signerListTx.result.meta.TransactionResult}\n`
  );

  // Step 3: Build a Payment TX from fund wallet (unsigned)
  const paymentTx = {
    TransactionType: "Payment",
    Account: fundWallet.wallet.address,
    Destination: signer1.wallet.address,
    Amount: xrpl.xrpToDrops("10"),
  };

  // Autofill to get Sequence, Fee, etc.
  const prepared = await client.autofill(paymentTx, 2); // signerCount=2
  console.log("Prepared TX for multi-sign:");
  console.log(`  Sequence: ${prepared.Sequence}, Fee: ${prepared.Fee}\n`);

  // Step 4: Each signer signs with multisign=true
  console.log("Signer 1 signing (multisign=true)...");
  const signed1 = signer1.wallet.sign(prepared, true);
  console.log(`  ✅ Signer 1 signed. Blob length: ${signed1.tx_blob.length}`);

  console.log("Signer 2 signing (multisign=true)...");
  const signed2 = signer2.wallet.sign(prepared, true);
  console.log(`  ✅ Signer 2 signed. Blob length: ${signed2.tx_blob.length}\n`);

  // Step 5: Combine signatures
  console.log("Combining signatures...");
  const combined = xrpl.multisign([signed1.tx_blob, signed2.tx_blob]);
  console.log(`✅ Combined blob length: ${combined.length}\n`);

  // Step 6: Submit the multi-signed TX
  console.log("Submitting multi-signed transaction...");
  const result = await client.submitAndWait(combined);
  console.log(
    `\n🎉 MULTI-SIGN RESULT: ${result.result.meta.TransactionResult}`
  );
  console.log(`   TX Hash: ${result.result.hash}`);

  if (result.result.meta.TransactionResult === "tesSUCCESS") {
    console.log("\n✅✅✅ MULTI-SIGNING WORKS on XRPL Testnet! ✅✅✅");
  } else {
    console.log("\n❌ Multi-signing failed.");
  }

  await client.disconnect();
}

testMultiSign().catch((err) => {
  console.error("❌ Error:", err.message || err);
  process.exit(1);
});
