
Why Charms?

Charms is a programmable assets protocol and software for Bitcoin (and soon, cross-chain), designed to be developer-friendly.

Tip

The Charms protocol was originally designed for BOS.

But there are already a few token standards out there, even on Bitcoin, why create another one?

In short, because none of them are programmable, or particularly developer friendly. And we are fixing this.

We believe in the magic of programmability. We also believe in decentralization and security of Bitcoin. An under-appreciated aspect of Bitcoin’s security is its UTXO model. It’s widely believed that the UTXO model is “hard” to make programmable. But, with Charms, not impossible 😼

Let us introduce: developer-friendly, programmable assets, implemented directly on Bitcoin.

Because this is kind of magical, we call such tokens charms.
What are Charms

Put simply, charms are programmable tokens on top of Bitcoin UTXOs.

Programmability is needed to do one thing: create apps. Apps are:

    tokens
    NFT collections
    DEXes
    Auctions
    … you (create and) name it!

App state needs to be stored somehow, and that’s what charms are for.

A single charm is a token, NFT, instance of arbitrary app state. Structurally, it is an entry of mapping app -> data living on top of a Bitcoin UTXO. And you can have as many as you want, creating a string of charms.

Fungible tokens and NFTs are treated as special cases:

    a fungible token data (within a charm) is its amount (a positive integer, e.g. 69420),
    NFTs carry arbitrary data, which is useful for all kinds of use cases (e.g. remaining token supply — if a fungible token is managed by an NFT).

Combining tokens, NFTs and arbitrary apps in strings of charms allows for composability:

    a limit order to trade one token for another,
    artist royalty policies for NFTs
    bridging
    … limitless other things.

A string of charms gets created or spent as one unit, just like a Bitcoin UTXO. Charms can only exist on top of UTXOs (such outputs are said to be charmed). Because of this, whoever owns a Bitcoin UTXO, can do whatever they want with the charms in it (even destroy them).
How are Charms Created

Charms come into existence by the magic of spells added to Bitcoin transactions.
Difference from Runes

Runes and Ordinals are an inspiration for Charms (among other things).

Runes are tokens on top of Bitcoin, managed by runestones — metadata messages (in OP_RETURN outputs), directing minting and transferring of runes (the Runes tokens). Runestones can be viewed as a kind of spells.

Runes seem to lean towards digital artifacts, collectibles (with concepts like rarity of a name).

Charms aim to address programmability and composability: you can have multiple apps interacting with each other. Charms could (perhaps in a not too distant future) even work with Runes.


Spells

Spells are the magic that creates charms.

The idea is to add charms-related metadata (spells) to Bitcoin transactions (similar to Runes’ runestones).

Spells are client-side validated, meaning that the users choose to interpret or ignore them. If they choose to interpret them, they can use charms — similar to Ordinals and Runes interpreted by ord.

A spell is said to be correct if and only if all of these are true:

    it is successfully parsed and interpreted
    makes sense for the transaction (e.g., doesn’t produce more Charms outputs than there are Bitcoin outputs)
    has a valid proof

Correct spells can mint, burn and transfer tokens. The practical effect of a spell is that tokens are considered parts of the enhanced transaction outputs.

Incorrect spells are ignored.

Double-spending is prevented by Bitcoin.

What Spells Look Like

Spells create and transform charms via Bitcoin transactions.

A spell is included in a transaction witness spending a Taproot output. It is included in an envelope — a sequence of opcodes OP_FALSE OP_IF … (push data) … OP_ENDIF, which is effectively a no-op: since the condition is false, no data is pushed onto the stack.

OP_FALSE
OP_IF
  OP_PUSH "spell"
  OP_PUSH $spell_data
  OP_PUSH $proof_data
OP_ENDIF

where:

    OP_PUSH "spell" shows that the envelope contains a spell.
    OP_PUSH $spell_data — CBOR-encoded NormalizedSpell.
    OP_PUSH $proof_data — Groth16 proof attesting to verification of correctness of the spell.

Logical Structure of a Spell

Here is an example of a spell that sends an NFT and some fungible tokens, and also mints some tokens:

version: 8

apps:
  $0000: n/f54f6d40bd4ba808b188963ae5d72769ad5212dd1d29517ecc4063dd9f033faa/7df792057addc74f1a6ca23da5b8b82475a7c31c3a4d45266c16a604c62eba4c
  $0001: t/7e7e5623a8b44556021171f533a3404b009e7c66edd5a47362c8e54c54a6e058/b25ddd68cd441a2bb0f7113abaaef74983c4e01fc66c7465e1f18363fc80454d
  $0002: t/f54f6d40bd4ba808b188963ae5d72769ad5212dd1d29517ecc4063dd9f033faa/7df792057addc74f1a6ca23da5b8b82475a7c31c3a4d45266c16a604c62eba4c

ins:
  - utxo_id: 33027a870a0f8c7b3d3114d970b6e67d11b32316ad5b6c58bdc7e0d8e77f7e6a:1
    charms:
      $0001: 42
      $0002: 69000

  - utxo_id:  92077a14998b31367efeec5203a00f1080facdb270cbf055f09b66ae0a273c7d:0
    charms:
      $0000:
        ticker: TOAD
        remaining: 30580

outs:
  - address: tb1p2lgmc56q8vu4run2p8u3a4mzp8h7e7qgu0243rlgchzqqe8zt0as2vld7e
    charms:
      $0000:
        ticker: TOAD
        remaining: 30160
      $0001: 42

  - address: tb1pxpjgtv30gl0nvce5ujzqgc0802gy9vtta4ens9mzpucymlg5fgfsprzrlc
    charms:
      $0002: 69420

In this example we have:

    apps — a list of apps involved in the spell. App is a tuple of tag/identity/VK (see App) where:
        tag is a single character representing the app type (n for NFTs, t for fungible tokens). tag can be anything, but n and t have special meaning (simple transfers of NFTs and tokens don’t need app contract proofs, so the recursive spell proof can be generated faster).
        identity is a 32-byte array identifying the asset within this app.
        VK is the verification key hash of the app implementing the logic of the asset: how it can be minted or burned, staked or used.

    ins — a list of input UTXOs to be spent by the transaction.

    outs — a list of outputs (strings of charms) created by this spell.


Apps

Charms exist to make programmable assets possible on Bitcoin.

So, what are Charms apps?

Here’s the code structure of such app contract (in Rust):

use charms_sdk::data::{
    check, nft_state_preserved, sum_token_amount, token_amounts_balanced, App, Data, Transaction,
    NFT, TOKEN,
};

/// The entry point of the app. This function defines the app contract
/// that needs to be satisfied for the transaction spell to be correct.
pub fn app_contract(app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    match app.tag {
        NFT => {
            check!(nft_contract_satisfied(app, tx, x, w))
        }
        TOKEN => {
            check!(token_contract_satisfied(app, tx, x, w))
        }
        _ => unreachable!(),
    }
    true
}

fn nft_contract_satisfied(app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    let token_app = &App {
        tag: TOKEN,
        id: app.id.clone(),
        vk_hash: app.vk_hash.clone(),
    };
    check!(nft_state_preserved(app, tx) || can_mint_nft(app, tx, x, w) || can_mint_token(&token_app, tx, x, w));
    true
}

fn token_contract_satisfied(app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    check!(amounts_balanced(app, tx) || can_mint_token(app, tx, x, w));
    true
}

// ... `can_mint_nft` and `can_mint_token` implementations ...

Get a full working example by running:
Terminal window

charms app new my-tokens

app_contract is the predicate that needs to be satisfied by the transaction. If all such predicates (for all apps participating in the spell) are satisfied AND all pre-requisite transactions have correct spells, then and only then this transaction’s spell is correct.


Introduction

By following this guide, you’ll learn how to create Charms apps, enabling use cases such as collectibles, tokens, and programmable assets on Bitcoin without requiring additional blockchains or layer-2 solutions.
What You’ll Learn

    How to set up your environment for Charms development
    How to create a Charms app
    How to cast a spell onto a Bitcoin transaction

Sections

    Pre-Requisites
    Getting Started
    Cast a Spell


Pre-Requisites
Bitcoin Core

Bitcoin Core v28.0 or later is required (we’re going to use testnet4). You can install it with Homebrew:
Terminal window

brew install bitcoin

This guide assumes a bitcoin node running with the following configuration (bitcoin.conf):

server=1
testnet4=1
txindex=1
addresstype=bech32m
changetype=bech32m

bitcoin.conf is usually located at:

    macOS: ~/Library/Application Support/Bitcoin/bitcoin.conf,
    Linux: ~/.bitcoin/bitcoin.conf.

Important: we assume bitcoin-cli is aliased as b:
Terminal window

alias b=bitcoin-cli

Make sure you have a wallet loaded:
Terminal window

b createwallet testwallet  # create a wallet (you might already have one)
b loadwallet testwallet    # load the wallet (bitcoind doesn't do it automatically when it starts)

Test BTC

Get some test BTC:
Terminal window

b getnewaddress # prints out a new address associated with your wallet

Visit https://mempool.space/testnet4/faucet and get some test BTC to the address you just created. Get at least 50000 sats (0.0005 (test) BTC). Also, get more than one UTXO, so either tap the faucet more than once or send some sats within your wallet to get some small UTXOs and at least one larger one (>= 10000 sats).
jq

You will also need to have jq installed:
Terminal window

brew install jq


Getting Started

Let’s get started with Charms! This guide will walk you through building your Charms app in a few minutes.

Make sure you have Rust installed:

Install Charms CLI:
Terminal window

## important to have this end with `/target` (a dependency issue)
export CARGO_TARGET_DIR=$(mktemp -d)/target
cargo install charms --version=0.10.0

Create an app

This will create a directory initialized with a Git repo for your new Charms app:
Terminal window

charms app new my-token

cd ./my-token

unset CARGO_TARGET_DIR
cargo update

This will print out the verification key for your new app:
Terminal window

app_bin=$(charms app build)
charms app vk "$app_bin"

(something like this:)

8e877d70518a5b28f5221e70bd7ff7692a603f3a26d7076a5253e21c304a354f

Test the app for a spell with a simple NFT mint example:
Terminal window

export app_vk=$(charms app vk)

# set to a UTXO you're spending (you can see what you have by running `b listunspent`)
export in_utxo_0="d8fa4cdade7ac3dff64047dc73b58591ebe638579881b200d4fea68fc84521f0:0"

export app_id=$(echo -n "${in_utxo_0}" | sha256sum | cut -d' ' -f1)
export addr_0="tb1p3w06fgh64axkj3uphn4t258ehweccm367vkdhkvz8qzdagjctm8qaw2xyv"

prev_txs=02000000000101a3a4c09a03f771e863517b8169ad6c08784d419e6421015e8c360db5231871eb0200000000fdffffff024331070000000000160014555a971f96c15bd5ef181a140138e3d3c960d6e1204e0000000000002251207c4bb238ab772a2000906f3958ca5f15d3a80d563f17eb4123c5b7c135b128dc0140e3d5a2a8c658ea8a47de425f1d45e429fbd84e68d9f3c7ff9cd36f1968260fa558fe15c39ac2c0096fe076b707625e1ae129e642a53081b177294251b002ddf600000000

cat ./spells/mint-nft.yaml | envsubst | charms spell check --prev-txs=${prev_txs} --app-bins=${app_bin}

If all is well, you should see that the app contract for minting an NFT has been satisfied.

To continue playing with the other example spells, keep the same app_id value: you create the app_id value for a newly minted NFT, and then keep using it for the lifetime of the NFT and any associated fungible tokens (if the app supports them).


Cast a Spell

Now that we have implemented an app, we’re ready to cast a spell onto a real Bitcoin transaction. We’re going to use bitcoin-cli to interact with the Bitcoin network.

Quick note: Check if you have pre-requisites installed.

Important: we assume bitcoin-cli is aliased as b:
Terminal window

alias b=bitcoin-cli

Using an app

We’ve just tested the app with an NFT-minting spell. Let’s use it on Bitcoin testnet4 (we have a node set up in pre-requisites).

Prepare:
Terminal window

app_bin=$(charms app build)

# pick from the output of `bitcoin-cli listunspent`
# should NOT be the same as the one you used for minting the NFT
funding_utxo="2d6d1603f0738085f2035d496baf2b91a639d204b414ea180beb417a3e09f84e:1"
funding_utxo_value="50000" # in sats
change_address=$(b getrawchangeaddress)

export RUST_LOG=info

Run:
Terminal window

cat ./spells/mint-nft.yaml | envsubst | charms spell prove --app-bins=${app_bin} --prev-txs=$prev_txs --funding-utxo=$funding_utxo --funding-utxo-value=$funding_utxo_value --change-address=$change_address

This will create (but not yet sign) two Bitcoin transactions:

    commit transaction and
    spell transaction.

The commit transaction creates exactly one output (committing to a spell and its proof) which is then spent by the spell transaction. The spell transaction contains the spell and proof (in the witness spending the output created by the commit tx), and it cannot exist without the commit transaction.

Note

Currently, charms spell prove takes a pretty long time (about 5 minutes). We’re working on improving this.

charms spell prove prints the 2 hex-encoded signed transactions at the end of its output, which looks like a JSON array (because it is a JSON array):

[{"bitcoin":"020000000001015f...57505efa00000000"},{"bitcoin":"020000000001025f...e14c656300000000"}]

You can now sign these transactions. Then submit both to the Bitcoin network as a package:
Terminal window

b submitpackage '["020000000001015f...57505efa00000000", "020000000001025f...e14c656300000000"]'


Introduction

This guide provides wallet providers with the technical specifications needed to integrate Charms support into their wallets.

By implementing this protocol, wallet providers can offer their users the ability to view, transfer, and interact with Charms, enabling use cases such as collectibles, tokens, and programmable assets on Bitcoin without requiring additional blockchains or layer-2 solutions.
End Results

By implementing this protocol, wallet providers can offer their users the ability to:

    View and manage Charms assets
    Transfer Charms (both NFTs and fungible tokens)
    Interact with Charms-enabled applications
    Participate in the growing Charms ecosystem

Integration Steps

Charms wallet integration consists of several components:

    Visualization: Displaying Charms assets in the wallet interface
    Transfer NFTs: Enabling users to send NFT charms
    Transfer Fungible Tokens: Enabling users to send fungible token charms
    Wallet features considerations: Some current operations like UTXO consolidation need to be Charms-compliant

Guide Sections

    Introduction (this page)
    Charms Visualization
    Charms Transfer
        Transfer NFTs
        Transfer Tokens
        Prover API
        Signing Transactions
        Broadcasting Transactions

References

    Spell JSON


Charms Visualization

To display Charms assets in your wallet, you’ll need to fetch data from the Charms API. This section explains how to retrieve and display Charms data.
Fetching Charms Data

To get all Charms associated with a specific UTXO, you can use charms_lib.wasm module (available as a Charms release artifact, can be built from the source at Charms GitHub).

To create JS bindings for the WASM module:
Terminal window

wasm-bindgen --out-dir target/wasm-bindgen-nodejs --target nodejs path/to/charms_lib.wasm

Example

Bitcoin transaction (bitcoin-tx.json):

{
  "bitcoin": "020000000001024c24d84d55241594f59337265d8bdae0bbfce8841b2d667d45129a75ea92aa130100000000ffffffffe1562b13c190c62084ee16cbf1feb354dd9029822bbb821010ba70a452c9bfc50000000000ffffffff02e803000000000000225120ec52e2809d78721dc1444ef22749b8e73c0c8f59cad4f70e7af4b13d305a2874580900000000000016001445d77e6d194773f086df5ee258d1803ea5d27b4901405495c9e8f8fca5f20fcf5130e944111d150986b67065a5030167d8f27c893c1304ffdfd8ffdece713882b0a01b4eb91912bd667b0a21cc86b73d11508444cdd80341d6516f4c39207cf3c14986997b57d069bf1e5e60b39ce867ac1a102cf56e71e49964b6ddb256c5070902c42e606af3a538ab156e19706990f7ca39ab27d53b7581fddd020063057370656c6c4d080282a36776657273696f6e07627478a1646f75747381a1001b00000009502f9000716170705f7075626c69635f696e70757473a18361749820183d187f18e718e418ce18a6121819184718af187318d70e1851181918be18bd188a18a518b718ed18fe187418bf18af186e1877189a1818184718bd189b982018c9187518d418e018c2189218fb189518ef18bd18a518c118331218d618ac181d188b185a18ef18f718f018f118e518571886184518a218da187018ff185ff699010418a41859184c1859181e18501884185d18701851187b188518181856189a18d80d1823184018cc182d18e118ed184918f4183f18c718e818e318e5081829184b1859188918a7181e18480e1833186518c518e006182018f318180a1872183f18da1887185e186f0e18ac1879187218740718e21826185b18f618d30a18da18df1820183f18d0186a184a183a10183e18ec18431823188518af18a91888186c184e183618ec189418bf1844183018ee181f186a18e01832188f0f187918ec181f09186318d818ae1849189f186f1318bd18a41877187318591860188b18ae182118b0189818dd18bd18f118ce18ee187b182318a6185a18d2188818aa0f18ab182d185918291218eb189c18e7182618a418e3182e1882189418891829185f18211871189418d9188a185e189118dd18861898187518cd09181d0918701856181c186a181a18a1184118791826184ca533185418a418591883182e1821183a18dc18ab18c318cc18b4181918c9040c0018e0186718581869181818a81898181b1888186318e8185f189c188a1869186818351857185018c31882184818af184618f618ac185e18a418db1898185c18c91879189e181a18d216187b185918f218db18fa1831185818e7187e186318c318ee184b182209188d1831186e1846186b184718d518f01875188718b90718f3188f18b018446820adcd6a7d4ea97319846d90c15b30609bf0174cb0c0f9c032e626009b6185cb17ac21c1adcd6a7d4ea97319846d90c15b30609bf0174cb0c0f9c032e626009b6185cb1700000000"
}

Simpe JavaScript test demonstrating how to use the API (extractAndVerifySpell.node.test.js):

const assert = require('assert');
const path = require('path');
const fs = require('fs');

function main() {
  const wasmModulePath = path.resolve(__dirname, 'path/to/wasm-bindgen-nodejs/charms_lib.js');
  // Ensure wasm artifacts exist
  assert.ok(fs.existsSync(wasmModulePath), `Wasm JS glue not found at ${wasmModulePath}`);

  const wasm = require(wasmModulePath);
  assert.ok(typeof wasm.extractAndVerifySpell === 'function', 'extractAndVerifySpell export not found');

  const txJsonPath = path.resolve(__dirname, './bitcoin-tx.json');
  assert.ok(fs.existsSync(txJsonPath), `Sample tx JSON not found at ${txJsonPath}`);

  const tx = JSON.parse(fs.readFileSync(txJsonPath, 'utf8'));

  // Invoke the wasm function extractAndVerifySpell
  const res = wasm.extractAndVerifySpell(tx, false);
  console.log('[extractAndVerifySpell.test] OK');
  console.log('%o', res);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[extractAndVerifySpell.test] FAILED');
    console.error(err);
    process.exit(1);
  }
}

Run the test:
Terminal window

node extractAndVerifySpell.node.test.js

This will print the Charms spell data:

[extractAndVerifySpell.test] OK
{
  version: 7,
  tx: {
    ins: [
      '13aa92ea759a12457d662d1b84e8fcbbe0da8b5d263793f5941524554dd8244c:1',
      [length]: 1
    ],
    outs: [ Map(1) { 0 => 40000000000 }, [length]: 1 ]
  },
  app_public_inputs: Map(1) {
    't/3d7fe7e4cea6121947af73d70e5119bebd8aa5b7edfe74bfaf6e779a1847bd9b/c975d4e0c292fb95efbda5c13312d6ac1d8b5aeff7f0f1e5578645a2da70ff5f' => undefined
  }
}

API Response Structure

The extractAndVerifySpell(tx, mock) function returns the Charms spell object, describing all Charms in the outputs of the specified transaction. The response includes:

    Charms App Specifications, each containing:
        tag (‘n’ for NFTs, ‘t’ for fungible tokens)
        identity (a 32-byte identifier)
        verification key (a 32-byte verification key of the app’s compiled code)
    Input Specifications, each containing:
        UTXO ID of the input
    Output Specifications with Charms — mappings of App spec (referred by an index) to Charm content, which may be:
        Amounts (for fungible tokens)
        Arbitrary data (for NFTs and other types of charms)

NFTs are recommended (but not required) to adhere to CHIP-0420 for structuring their content.
Displaying Charms in Your Wallet

When implementing Charms visualization in your wallet:

    Scan UTXOs: For each UTXO in the user’s wallet, check if it contains Charms by querying the API
    Parse Responses: Process the API responses to extract Charm data
    Render UI Elements: Display Charms with appropriate visuals and information
    Handle Different Types: Implement different display logic for NFTs vs. fungible tokens

UI Considerations

    For NFTs, prominently display the image and name
    For tokens, show the quantity alongside the token name/symbol + image
    Include options for viewing detailed metadata (review Charms Token Metadata specification CHIP-0420)


Transactions Overview

Charms, like other digital assets can be transferred from one address to another, while preserving their unique properties. Charms transactions are inscribed with special pieces of data (called spells) within regular Bitcoin transactions.

A correct spell has a succinct zero-knowledge proof that can be verified by anyone using a Charms client (as CLI, API or library). The containing transaction and its previous transactions (producing the inputs being spent) are the public inputs the proof is verified against.

Note

If a transaction doesn’t have a correct spell (for whatever reason) and spends outputs with charms, the transaction may still be a valid Bitcoin transaction, but the charms in its inputs are effectively burned if the transaction is accepted in the blockchain.
Asset Preservation Rules

There are two types of simple transfers in Charms, corresponding to the two special types of charms — NFTs and (fungible) tokens. A simple transfer of assets defined by an app does not require to produce the proof of the app contract being satisfied by the transaction: simple asset preservation rules are sufficient:

    NFT transfers: The entire charm is transferred to a new output unchanged. For NFT apps involved in the transaction, the transaction is a simple transfer with regard to the app (the asset defined by the app), if and only if the NFTs in the outputs are exactly the same as the NFTs in the inputs.

    Fungible Token transfers: For (fungible) token apps involved in the transaction, the transaction is a simple transfer with regard to the app (the asset defined by the app), if and only if the total amount of the token in all outputs equals the total amount of the token in the inputs.

The Two-Transaction Model

Charms cast spells on transactions using a two-transaction model (similar to Ordinals):

    Commit Transaction: Sets up the transfer by committing to the spell to be inscribed, creating the Taproot output spendable (with a script path) by the spell transaction.
    Spell Transaction: Reveals the spell (and its proof), spending the Taproot output by presenting the script with the spell data in the witness.

Both transactions are submitted to the Bitcoin network as a package, ensuring that the spell is inscribed correctly and securely.
The Transfer Process

The complete transfer process involves several key steps:

    Prepare the Spell JSON: Specify the charms and transfer details
    Call the Prover API: Generate the required transactions
    Sign the Transactions: Sign both the commit and spell transactions
    Broadcast the Transactions: Send the transactions to the Bitcoin network as a package

Next Steps

The following sections will guide you through each step of the transfer process in detail:

    Transfer NFTs: How to transfer an NFT charm
    Transfer Tokens: How to transfer fungible tokens
    Prover API: How to use the Prover API to generate transactions
    Signing Transactions: How to sign Charms transactions
    Broadcasting Transactions: How to broadcast transactions to the network

References

    Spell JSON: Detailed explanation of the Spell JSON format


NFT Transfers

NFT transfer involves sending an NFT charm to a new UTXO. We will cover how to send one NFT charm to a single destination.

Note

A transaction can send multiple NFTs to one or more outputs. To achieve that

    add apps defining those NFTs,
    add inputs with those NFTs to the list of inputs and
    add the NFTs to transaction outputs.

Spell JSON for NFT Transfers

For NFT transfers, the entire charm is sent to a single destination. Here’s the Spell JSON structure for an NFT transfer:

{
  "version": 8,
  "apps": {
    "$00": "n/<app_id>/<app_vk>"
  },
  "ins": [
    {
      "utxo_id": "<source_txid>:<vout>",
      "charms": {
        "$00": {
          <nft_data>
        }
      }
    }
  ],
  "outs": [
    {
      "address": "<destination_address>",
      "charms": {
        "$00": {
          <nft_data>
        }
      },
      "sats": 1000
    }
  ]
}

Note

The simplest case is when the transaction does not involve anything beside simple transfers. If it does (e.g. new NFTs are minted or any inputs or outputs contain charms that are neither tokens nor NFTs), the transaction must satisfy the app contracts involved. We will describe how to deal with this in the Prover API section.
Key Components

    version: Must be set to 2 for the current protocol
    apps: Lists app specifications (each NFT is an app)
    ins: Specifies the source UTXO(s):
        utxo_id: The transaction ID and output index (txid:vout) of the source UTXO
        charms (optional): Contains the NFTs being transferred. Optional: it’s there for developer convenience, the Charms prover doesn’t need it.
    outs: Defines destination output(s):
        address: The destination address for the tranferred NFT
        charms: Describes charms (in this case, the transferred NFTs) being created in the output
        sats: The amount of satoshis for the output (optional, defaults to 1000)

Implementation Steps

    Retrieve Charm Data: Get the charm’s details from the source UTXO
    Construct the Spell JSON: Fill in the template with the specific NFT data (see Spell JSON Reference)
    Validate the JSON: Ensure all required fields are present and correctly formatted
    Proceed to Prover API: Use this JSON in the Prover API call (see Prover API)

Example

Here’s an example of a completed Spell JSON for an NFT transfer:

{
  "version": 8,
  "apps": {
    "$00": "n/af50d82d1e47e77ef5d03d1f6a1280eb137c91a51d696edcc0d2cc9351659508/a0029d4e7f8ba7361cde6004561c6209d968bd3686c456504cd0005e19ac1a2f"
  },
  "ins": [
    {
      "utxo_id": "eb711823b50d368c5e0121649e414d78086cad69817b5163e871f7039ac0a4a3:0",
      "charms": {
        "$00": {
          "ticker": "CHARMIX",
          "name": "Panoramix #1",
          "description": "An Ancient magician from the Gallia",
          "image": "https://shorturl.at/KfUka",
          "image_hash": "eb6e19663b72ab41354462cb2d3e03a97a745d0d2874f5d010c9b5c8f2544e9c",
          "url": "https://charms.dev"
        }
      }
    }
  ],
  "outs": [
    {
      "address": "tb1pvlvth530kvcth207u2mw7366pj8aezlvx35866k0g9mx7cf48r9q6yjsqr",
      "charms": {
        "$00": {
          "ticker": "CHARMIX",
          "name": "Panoramix #1",
          "description": "An Ancient magician from the Gallia",
          "image": "https://shorturl.at/KfUka",
          "image_hash": "eb6e19663b72ab41354462cb2d3e03a97a745d0d2874f5d010c9b5c8f2544e9c",
          "url": "https://charms.dev"
        }
      }
    }
  ]
}

Note: The following fields are (optional) properties of an NFT charm itself (recommended by CHIP-420):

    ticker: The ticker or symbol for the charm (e.g., "ticker": "CHARMIX")
    name: The name of the NFT (e.g., "name": "Panoramix #1")
    description: A description of the NFT (e.g., "description": "An Ancient magician from the Gallia")
    image: A URL to the image of the NFT (e.g., "image": "https://shorturl.at/KfUka")
    image_hash: A hash of the image for verification (e.g., "image_hash": "eb6e19663b72ab41354462cb2d3e03a97a745d0d2874f5d010c9b5c8f2544e9c")
    url: A URL for more information about the NFT (e.g., "url": "https://charms.dev")
    (other fields may be added as needed, depending on the app’s requirements)

UI Considerations

When implementing NFT transfers in your wallet UI:

    Clearly display the NFT being transferred
    Show the destination address in a user-friendly format
    Provide transaction fee information
    Include confirmation steps before proceeding
    Display transaction status updates during the process


Fungible Token Transfers

Token transfers involve spending one of more outputs with tokens, and creating one or more destination outputs with the same total amount of tokens.
Spell JSON for Token Transfers

Here’s the Spell JSON structure for a token transfer:

{
  "version": 8,
  "apps": {
    "$00": "t/<app_id>/<app_vk>"
  },
  "ins": [
    {
      "utxo_id": "<source_txid_1>:<vout_1>",
      "charms": {
        "$00": <amount_1>
      }
    },
    {
      "utxo_id": "<source_txid_N>:<vout_N>",
      "charms": {
        "$00": <amount_N>
      }
    }
  ],
  "outs": [
    {
      "address": "<dest_address_1>",
      "charms": {
        "$00": <dest_amount_1>
      }
    },
    {
      "address": "<dest_address_N>",
      "charms": {
        "$00": <dest_amount_N>
      }
    }
  ]
}

Note

The simplest case is when the transaction does not involve anything beside simple transfers. If it does (e.g. new tokens are minted or any inputs or outputs contain charms that are neither tokens nor NFTs), the transaction must satisfy the app contracts involved. We will describe how to deal with this in the Prover API section.
Key Components

    version: Must be set to 2 for the current protocol
    apps: Lists app specifications (each token is an app)
    ins: Specifies the source UTXO(s):
        utxo_id: The transaction ID and output index (txid:vout) of the source UTXO
        charms (optional): Contains the tokens being transferred. Optional: it’s there for developer convenience, the Charms prover doesn’t need it.
    outs: Defines destination outputs:
        address: The destination address for the tranferred tokens
        charms: Describes charms (in this case, the transferred tokens) being created in the output
        sats: The amount of satoshis for the output (optional, defaults to 1000)

Implementation Steps

    Retrieve Token Data: Collect the source UTXOs and their token amounts.
    Calculate Amounts: Determine the transfer and change amounts
    Construct the Spell JSON: Fill in the template with the specific token data (see Spell JSON Reference)
    Validate the JSON: Ensure all required fields are present and correctly formatted
    Proceed to Prover API: Use this JSON in the Prover API call (see Prover API)

Example

Here’s an example of a completed Spell JSON for a token transfer:

{
  "version": 8,
  "apps": {
    "$01": "t/1dc78849dc544b2d2bca6d698bb30c20f4e5894ec8d9042f1dbae5c41e997334/b22a36379c7c0b1e987f680e33b2263d94f86e2a75063d698ccf842ce6592840"
  },
  "ins": [
    {
      "utxo_id": "55777ba206bf747724a4e96586f2d912a77baa8a15a4c63a0b510531ad5fa65e:0",
      "charms": {
        "$01": 420000
      }
    }
  ],
  "outs": [
    {
      "address": "tb1pyrznm3ma6cl83qljqhw8z2usyjcxtkx9tkrqfuhjgrpsuarxcn8s0ut5qs",
      "charms": {
        "$01": 420
      }
    },
    {
      "address": "tb1phmk7c9mzaepumgeaz9lgly9qurkq6jxd44qssfd3w5563j49mfwqfrqvww",
      "charms": {
        "$01": 419580
      }
    }
  ]
}

Note: The content of a token charm is simply the amount of the token in the charm. The asset type of the token is fully defined by the app the charm refers to by its key. For example, t/1dc78849dc544b2d2bca6d698bb30c20f4e5894ec8d9042f1dbae5c41e997334/b22a36379c7c0b1e987f680e33b2263d94f86e2a75063d698ccf842ce6592840 in the above example is the token app specification. The amount of the token in the token charm is 420 in the first output and 419580 in the second output.
UI Considerations

When implementing token transfers in your wallet UI:

    Allow users to specify the amount to transfer
    Clearly display the transfer amount(s) and the remaining amount(s)
    Show the destination address in a user-friendly format
    Provide transaction fee information
    Include confirmation steps before proceeding
    Display transaction status updates during the process


Prover API

The Prover API is used to generate the required transactions for Charms transfers. This guide explains how to interact with the Prover API.
API Endpoint

The Prover API endpoint is:

https://v8.charms.dev/spells/prove

The Prover API supports both mainnet and testnet4.

Note

You can run your own prover with charms crate compiled with the prover feature enabled. Run the server:
Terminal window

charms server

The local proving server endpoint is:

http://localhost:17784/spells/prove

Request Format

The API request should be a POST request with a JSON body containing the following parameters:

const requestBody = {
  spell: parsedSpellJson,
  binaries: {},
  prev_txs: [],
  funding_utxo: "txid:vout",
  funding_utxo_value: utxoAmount,
  change_address: destinationAddress,
  fee_rate: 2.0
};

Parameters

    spell: The Spell JSON object (see Spell JSON Parameters)
    binaries: A map with app binaries (empty for basic transfers): { app VK (hex-encoded 32 bytes) to app binary (base64-encoded RISC-V ELF ) }. This is used by the prover to verify the spell against the app contract. The prover will run the program implementing the app contract with the spell data as input, and produce the ZK proof of its successful run, which it will use as input to produce the ZK proof of the spell as a whole.
    prev_txs: An array of previous transactions that created the UTXOs being spent, necessary to verify ownership in Bitcoin. Each transaction in the array should be provided in raw hex format.
    funding_utxo: The UTXO to use for funding the transaction (txid:vout format). Must be a plain Bitcoin output. The BTC from this UTXO is used to pay for the Bitcoin transaction fee and proving fee. The remaining amount is returned to chage_address.
    funding_utxo_value: The value of the funding UTXO in satoshis
    change_address: The address to send any remaining satoshis from the funding UTXO
    fee_rate: The fee rate to use for the transaction in satoshis per byte

Making the API Call

Here’s an example of how to call the Prover API:

// API endpoint
const proveApiUrl = 'https://v8.charms.dev/spells/prove';

// Request body
const requestBody = {
    spell: {
        version: 8,
        apps: {
            "$01": "t/1dc78849dc544b2d2bca6d698bb30c20f4e5894ec8d9042f1dbae5c41e997334/b22a36379c7c0b1e987f680e33b2263d94f86e2a75063d698ccf842ce6592840"
        },
        ins: [
            {
                utxo_id: "55777ba206bf747724a4e96586f2d912a77baa8a15a4c63a0b510531ad5fa65e:0",
                charms: {
                    "$01": 420000
                }
            }
        ],
        outs: [
            {
                address: "tb1pyrznm3ma6cl83qljqhw8z2usyjcxtkx9tkrqfuhjgrpsuarxcn8s0ut5qs",
                charms: {
                    "$01": 420
                }
            },
            {
                address: "tb1phmk7c9mzaepumgeaz9lgly9qurkq6jxd44qssfd3w5563j49mfwqfrqvww",
                charms: {
                    "$01": 419580
                }
            }
        ]
    },
    binaries: {},
    prev_txs: [
        "020000000001028b09b30d0530d042905b7b2f0ca8f935b7433bc9c0e4f02b2e9d28eb37ba155b0000000000ffffffff40b90f5e4a1499112e43b48bee6fb2f094fe64d9ad245dc1e0b33c33f6226ad40000000000ffffffff04e803000000000000225120f31cd45a2d7f2a1e2f8f7dff239dd4690cdb4366b946535acec2bd7fe74e0417e803000000000000225120964a06012de954fe5f6834048e6711a5330d3bf89377dc81f688f0fab5ae36847b23000000000000225120ff9f32061f3d77df48351293ee8d5c9bb39730004edef0abfdf1c2484ff1b503cdfa0700000000002251205469c594963a0c6f14b0df1d2f1f52804cc6072741f9853c7e52d1009a5c971a014029c1d8380093ef6c315c247968f72a2eb98bef68b9ddbe3cc95c11ad14ece8031bbbbfe2de380a7c97be03d75b75ce64afae29e7f95ebac58abbc9060d043431034179f7a21aad0eb5a99ac49adccb19e80ef91917912186ebd2470e8e5ec4252d9b00bc68c035f2b92f3a7c02c8c99651584e0244a8359f6dea61da746126245ab881fdc0030063057370656c6c4d080282a36776657273696f6e02627478a2647265667380646f75747382a1011a000668a0a100a5667469636b65726443484558646e616d656a4348455820546f6b656e65696d616765781b68747470733a2f2f69696c692e696f2f33634f7371616a2e706e676375726c7368747470733a2f2f636861726d732e6465762f6972656d61696e696e671a041cdb40716170705f7075626c69635f696e70757473a283616e9820181d18c71888184918dc1854184b182d182b18ca186d1869188b18b30c182018f418e51889184e18c818d904182f181d18ba18e518c4181e189918731834982018b2182a18361837189c187c0b181e1898187f18680e183318b21826183d189418f8186e182a187506183d1869188c18cf1884182c18e6185918281840f68361749820181d18c71888184918dc1854184b182d182b18ca186d1869188b18b30c182018f418e51889184e18c818d904182f181d18ba18e518c4181e189918731834982018b2182a18361837189c187c0b181e1898187f18680e183318b21826183d189418f8186e182a187506183d1869188c18cf1884182c18e6185918281840f69901041118b618a0189d1819186d18df18eb0318a018b1188418cd184518fa18a804181e18b7184b181b1872183818b018f9188a18c218641418eb18f318d818f3183e188a1840181a18e01833188e1851184b1838141885183718471823185c16189b184d87017a187e183418be18e818e1184c184e183b18e418a40b182f18d11018f618be182d183518f618ed186818881844185c18821889188110184218cc187118f618901896182918e51826188a184100183b1840189418d1186b189c187618e20d18e31872183318d818ef18b518911850188718461897186703189516184b183e184604188b1854181f18e718ba186d184f18d518f118ef182918ca12187f18dc18c718fb183618df182b18cf1826184218cd08185e18b518d018b818c6183413187d18cb051889187118ef18cd1118a218f618510b18251881182918f3184c183d186b18561860185018cd1837188f188518c718f301188318f7183618f4186f182518a618a6182a184b0c186c1843187918471518b3185d18ab18291618d0181d1876188718541856183418da188c18821841181c0f181c18c5181800186a185018760e18bb188918c918491849182918ba14186a18eb181b18ce18a218ee182118c7189d0f111819185918201855185c188018e0186918f71865091898187b1518ca18f3186d18d4682096acf9b0d05f25d9519b932320fb6fa5fbc4dcf6a5556562733595a62284793cac21c096acf9b0d05f25d9519b932320fb6fa5fbc4dcf6a5556562733595a62284793c00000000"
    ],
    funding_utxo: "c8ed70616f053a10b028f22b66cc5d7e36229a899613308e381ce7010ce5cf57:2",
    funding_utxo_value: 496186,
    change_address: "tb1putrfz7kq9yh3jymjcumq9heu9s4q7nmm8x7k55462n9rua408y9svaw3uv",
    fee_rate: 2.0
};

// Make the API call
const response = await fetch(proveApiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(requestBody)
});

// Response contains commit_tx and spell_tx
const result = await response.json();
const commitTx = result[0];
const spellTx = result[1];

Response Format

The API response will be a JSON array with the following structure:

[
  "hex_encoded_commit_tx",
  "hex_encoded_spell_tx"
]

The response is an array of exactly 2 hex-encoded transactions ready to be signed with the wallet’s private key and submitted to be broadcasted as a package.
Error Handling

The API may return error responses in the following cases:

    Invalid Spell JSON format
    Missing required parameters
    Insufficient funding UTXO value
    Invalid UTXO references
    Server errors

Implement proper error handling to catch and process these errors in your application.
Implementation Tips

    Validate the Spell JSON before sending it to the API
    Ensure the funding UTXO has sufficient value to cover the transaction fees
    Use appropriate fee rates based on network conditions
    Implement retry logic for temporary server errors
    Store both transactions securely until they are signed and broadcast


Signing Transactions

After generating the transactions using the Prover API, both transactions must be signed before they can be broadcast.
Transaction Types

There are two transactions that need to be signed:

    Commit Transaction: Uses standard P2TR (Pay-to-Taproot) transaction, spending the funding UTXO and creating the “spell commit output” (which is the only output). Sign with the appropriate signature for spending the funding UTXO. Signing this transaction is the equivalent of this bitcoin-cli command:

Terminal window

bitcoin-cli signrawtransactionwithwallet <commit_tx_hex>

    Spell Transaction: Spends the “spell commit output” — the Taproot output created by the Commit Transaction. The corresponding witness already contains the signature for spending this output. The rest of the transaction needs to be signed by the wallet. Signing this transaction is the equivalent of this bitcoin-cli command:

Terminal window

bitcoin-cli signrawtransactionwithwallet <spell_tx_hex> \
  '[{"txid": "<commit_tx_id>", "vout": 0, "scriptPubKey": "commit_tx_out_scriptPubKey", "amount": <commit_tx_out_amount>}]'

The commit transaction output data must be provided: it is necessary to construct the signature.
Key Points for Wallet Providers

    Signature Type: For simplicity, Charms use Taproot outputs, so the wallet needs to support Taproot (Schnorr signatures).
    Pre-signed Spell input: For the spell transaction, the last input already includes the valid witness (which includes the spell and its proof). The wallet only needs to sign the rest of the transaction.

Library Support

Most modern Bitcoin libraries support Taproot signing, including:

    Bitcoin Core
    bitcoinjs-lib
    rust-bitcoin
    btcd

Use your existing wallet infrastructure and signing libraries, just ensure they support Taproot and Schnorr signatures.


Broadcasting Transactions

After signing the transactions, they must be broadcast to the Bitcoin network.
Package Submission Requirement

The spell transaction spends one output created by the commit transaction, creating a dependency between them. To handle this dependency:

    Broadcast both transactions together as a package to ensure they’re accepted simultaneously.
    Most wallet libraries offer methods for submitting transaction packages.
    This is functionally equivalent to bitcoin-cli submitpackage command.

Important Considerations

    Mempool Acceptance: Both transactions must be accepted into the mempool to ensure proper processing. Therefore, it is a good idea to validate the transactions before submitting them.
    Fee Rates: When proving the spell, use an adequate fee rate (defaults to 2.0 sats per vB) to ensure acceptance to the mempool and ultimately, inclusion in the block. The fee rate is specified in the Prover API request.


Spell JSON Reference

Spell is the metadata added to a Bitcoin transaction to make it also a Charms transaction: spells create charms. This reference provides an explanation of each parameter in the Spell JSON format.
Structure Overview

The Spell JSON has the following top-level fields:

    version: Protocol version identifier
    apps: Application identifiers and verification keys
    public_inputs: Public inputs for apps (optional)
    private_inputs: Private inputs for apps (optional) — not recorded on-chain.
    ins: Input UTXOs containing charms
    outs: Output destinations for charms

Parameter Details
version

Protocol version number.

"version": 8

Required Value: Must be 2 for the current protocol.

Spells exist on-chain with lower versions, and they are recognized by the client, but are not supported by the prover.
apps

Lists apps involved in the transaction. Each app is specified by a tag, identity and verification key.

"apps": {
  "$00": "n/<app_id>/<app_vk>",
  "$01": "t/<app_id>/<app_vk>"
}

    $00, $01: App references within the spell (can be any unique identifier)
    tag: n — the app represents an NFT, t — the app represents a fungible token
    <app_id>: hex-encoded 32-byte app identity (the same for related NFTs/tokens)
    <app_vk>: hex-encoded 32-byte app verification key

There can be multiple apps in the same spell. Apps only different in the tag (e.g. n vs t) are considered different apps. Such apps can be related (and most likely are), for example, an NFT can manage issuance of a fungible token and carry token metadata (name, ticker symbol, description, logo, website URL, etc.) as recommended in CHIP-420.
public_inputs

Public inputs for proving the transaction against app contracts. This section is optional. It is not needed for simple transfers.

"public_inputs": {
  "$00": <public input data for app $00>,
  "$0N": <public input data for app $0N>
}

    $00, $0N: App references (same as in the apps section). Any app from the apps section can have an entry here, but it is not required.
    <public input data>: Public input data required for the app’s proof generation. This data is recorded on-chain.

private_inputs

Private inputs for proving the transaction against app contracts. This section is optional. It is not needed for simple transfers.

"private_inputs": {
  "$00": <private input data for app $00>,
  "$0N": <private input data for app $0N>
}

    $00, $0N: App references (same as in the apps section). Any app from the apps section can have an entry here, but it is not required.
    <private input data>: Private input data required for the app’s proof generation. This data is not recorded on-chain.

ins

Input UTXOs of the transaction. This section is required (can be an empty list — for transactions not spending any outputs with charms).

"ins": [
  {
    "utxo_id": "<txid>:<vout>",
    "charms": {
      "$00": <charm data>,
      "$0m": <charm data>
    }
  },
  {
    "utxo_id": "<source_txid>:<vout>",
    "charms": {
      "$00": <charm data>,
      "$0n": <charm data>
    }
  }
]

    utxo_id: Transaction ID and output index (txid:vout) of a UTXO being spent
    charms: Charms in the specified UTXO
        $00, $0m, $0n: App references (same as in the apps section). Any app from the apps section can have charms in source UTXOs.
        <charm data>: Depending on the app, this can be a single unsigned integer value (for fungible tokens) or a complex object (for NFTs). For example:
            For fungible tokens: <charm data> is the amount of the token in the UTXO
            For NFTs: <charm data> is an object containing metadata properties of the NFT

outs

Transaction outputs. This section is required (can be an empty list — for transactions not creating any outputs with charms).

"outs": [
  {
    "address": "<destination_address>",
    "charms": {
      "$00": <charm data>,
      "$0m": <charm data>
    },
    "sats": 1000
  },
  {
    "address": "<destination_address>",
    "charms": {
      "$00": <charm data>,
      "$0n": <charm data>
    },
    "sats": 1000
  }
]

    address: Recipient’s Bitcoin address
    charms: Charms in the specified UTXO
        $00, $0m, $0n: App references (same as in the apps section). Any app from the apps section can have charms in source UTXOs.
        <charm data>: Depending on the app, this can be a single unsigned integer value (for fungible tokens) or a complex object (for NFTs). For example:
            For fungible tokens: <charm data> is the amount of the token in the UTXO, e.g. 42 or 69000
            For NFTs: <charm data> is an object containing metadata properties of the NFT — see CHIP-420
    sats: Amount of satoshis to include in the output (optional, defaults to 1000, can be as low as the current dust limit)

Implementation Tips

    Retrieve the UTXO information from your wallet’s UTXO set
    Validate all values before constructing the final JSON
    Use proper JSON serialization to avoid formatting issues


Charms: Programmable Assets on Bitcoin and
Beyond
Ivan Mikushin1,2 Gadi Guy² Andrew Throuvalas²
¹Charms Inc
²BitcoinOS
May 2025
Abstract
Bitcoin remains the heart of the crypto economy, yet its poor programmability
and scalability have capped its potential. Enter Charms — a revolutionary
protocol that “enchants” Bitcoin, enabling programmable and portable assets
natively on its ledger. These assets are chain-agnositc, and can be seamlessly
“beamed” to various other UTXO blockchains, allowing them to live natively on
any integrated chain. Leveraging client-side validation of recursive zkVM proofs,
Charms eliminates the need for bridges, trusted validators, or transaction graph
traversal. The result: truly decentralized, client-side validated smart assets that
inherit Bitcoin’s security while transcending its limitations. Inspired by Bitcoin’s
pioneering metaprotocols and Cardano’s eUTXO model, Charms is a tesseract
representing the first post-chain standard able to integrate builders and users with
the existing dapp ecosystems of more scalable chains beyond Bitcoin. This is the
end of wrapped tokens and the beginning of Bitcoin’s full integration into the
programmable Web3 economy.
1
1 Introduction
Bitcoin (1) emerged as a beacon of freedom - the first peer-to-peer digital money system that
could liberate humanity from the control of central banks and financial intermediaries. The
network’s stability and decentralization have allowed it to prosper as “digital gold,” growing
into a $2T juggernaut at the heart of the crypto economy.
However, the very permanence that makes Bitcoin valuable has also been its curse. Its inflexible
design and cultural resistance to change left it unable to deliver on its full revolutionary
potential. Its limitations in scalability, privacy, and programmability drove developers to spawn
an entire parallel ecosystem of competing chains and tokens seeking greater decentralized
functionality. But in doing so, these projects cut themselves off from Bitcoin’s unmatched
security, repute, network effects, and massive capital base. The result is a fragmented crypto
landscape divided between Bitcoin’s rock-solid foundation and an innovative but siloed world
of decentralized applications - each unable to benefit from the other’s strengths.
Thankfully, several years of advancements in both UTXO technology and zero-knowledge
cryptography have assembled the pieces to an entirely new paradigm for augmenting the
motherchain, while melting its borders between the wider Web2 and Web3 worlds.
That paradigm is called Charms — a programmable, portable, and developer-friendly app
protocol for Bitcoin. Charms opens Bitcoin to all manner of crypto innovation, including
fungible tokens, NFTs, lending protocols, DEXes, and more — all powered by Bitcoin and
without sacrificing decentralization.
This protocol enables the first digital assets that simultaneously satisfy three important
qualities:
• They have the same direct ownership as Bitcoin (can be sent to a Bitcoin address as a Bitcoin
transaction output).
• They are programmable in ways that appeal to mainstream developers — using general
purpose languages, like TypeScript or Rust.
• They can be transferred across chains and used in any ecosystem while maintaining their
smart contract logic, without needing wrapped tokens or fragile bridges.
Charms are “unchained” because their state is verified by recursive zk-proofs, not in any single
ledger, so they can materialize natively on whatever chain hosts the proof — no locks, no bridges,
no custodians. Charms transcend blockchains as we know them today. This makes them not just
a theoretical boon for the Bitcoin ecosystem, but a highly practical pathway to bootstrapping
an advanced economy of Bitcoin tokens, which can leverage successful infrastructure already
present on other chains. One of those chains is Cardano — the first key technology that informed
the creation of Charms.
2 Precursors
2.1 Cardano
Cardano demonstrated that the UTXO model is, in fact, programmable – and has been for a
long time.
Cardano pioneered the eUTXO (Extended UTXO) model (2, 3), in which
• Multiple assets exist in a transaction output,
• the output also holds a piece of arbitrary data (called datum), and
2
• the output can be spent by a transaction that satisfies a predicate (encoded in Plutus
Script, a Cardano native bytecode level language) by presenting another piece of data (called
redeemer).
We discuss improvements over Cardano’s smart-contract design below (in ToAD — an
Extended Extended UTXO Model).
2.1.1 Extended UTXO Model
The Cardano blockchain pioneered the approach: the eUTXO model allows storing in
transaction outputs not just ADA (the system native token in Cardano), but also user
created Cardano native tokens (called so because the Cardano ledger natively enforces token
preservation, just like for ADA, without invoking smart-contracts). Cardano transaction outputs
can also contain datum — a piece of arbitrary data, effectively a smart-contract state associated
with the output. So, a Cardano UTXO can contain:
• an amount of ADA (required)
• any amounts of any tokens (optional)
• datum (optional)
Spending scripts (smart contracts) have the following signature:
fn spend(
datum: Option<Data>,
redeemer: Data,
utxo: OutputReference,
tx: Transaction,
) -> bool
For a transaction to be able to spend outputs locked in such script, Cardano nodes will have
to run the script for each such output.
If the script is implemented naively, a transaction trying to trade multiple outputs, each for
the same amount of Ada, might result in a single output mistaken as the payment for each
individual traded item — this is known as the double satisfaction problem (4, 5). The solution
is to look at the whole transaction (all spent and created outputs), effectively running the exact
same computation as many times as there are outputs spent from the smart contract.
There are other script types in Cardano (6), which don’t look at individual outputs and run
only once per transaction (if needed, e.g. if an asset is minted, the asset’s mint script is run).
2.2 Ordinals and Runes
Upon popularizing in early 2023, Bitcoin metaprotocols like Ordinals and Runes reimagined
how we can build on Bitcoin. They demonstrated that:
• Arbitrary size data can be put into a Bitcoin transaction,
• Digital assets can be created fully on Bitcoin and sent over to a Bitcoin address
• Client side validation is a practical way to extend Bitcoin without changing Bitcoin itself
Charms would not exist without Ordinal or Runes. However, they also wouldn’t exist if these
standards were already programmable. Without programmability, advanced token applications
such as Bitcoin IDs and yield bearing stablecoins remain out of reach.
3
2.3 zkVM Technology
zkVMs (Zero Knowledge Virtual Machines) enable developers to write provable programs in
general purpose programming languages (like Rust) and generate succinct (zkSNARK) proofs
of their execution. This allows for verifiable computation without revealing the underlying data,
enhancing privacy and scalability in blockchain applications.
Prior to zkVMs (effectively, until 2024 when zkVM projects started releasing to production),
ZK proofs could only be generated by running specially formatted input data (data items would
have to be elements of a large finite scalar field) through so called ZK circuits — specially
constructed programs with a single fixed length execution path (for example, branching logic
has to be emulated).
zkVMs were the missing piece of infrastructure that made Charms much easier to build, allowing
Charms apps to be written in Rust (vs ZK circuits) and proven within tolerable time (seconds
to minutes — depending on the app complexity) and verified in milliseconds.
2.4 ToAD — an Extended Extended UTXO Model
Charms started as ToAD (Tokens as App Data) (7) — a fresh take on an Extended UTXO
model.
ToAD was proposed as an improved ledger model for zkBitcoin (8). A transaction involving
zkBitcoin apps (“zkapps”) would have to satisfy a validation predicate with a signature
𝐹 : (ins, outs, 𝑥, 𝑤) → Bool
where:
• ins — set of outputs spent by the transaction,
• outs — set of outputs created by the transaction,
• 𝑥 — public redeeming (or spending) data necessary to validate the transaction (a great
example would be a set of spending signatures).
• 𝑤 — private witness data necessary to validate the transaction (e.g. pre-images of hashes in
the public data).
Each zkapp UTXO should have
• a map of: validation predicate → state data
‣ e.g. token policy → amount:
– 𝑇1 → 𝑎1
– 𝑇2 → 𝑎2
– 𝑇3 → 𝑎3
‣ e.g. smart-contract validator → smart-contract data
– 𝑆1 → 𝑑1
– 𝑆2 → 𝑑2
If a zkBitcoin transaction spends or creates any number of zkapp UTXOs, then all validation
predicates used in those UTXOs need to be satisfied to validate a transaction.
ToAD was an attempt to introduce a token model, (1) enjoying the benefits and (2) avoiding
the problems of Cardano eUTXO, and (3) do it on Bitcoin.
Charms applies minor changes to ToAD to level up the eUTXO model: from extended UTXO
to enchanted UTXO.
4
3 Techniques
3.1 Charms UTXO Model
The ToAD model, with minor changes, is adopted by Charms. Charms app contracts have the
following shape:
𝐹 : (app, tx, 𝑥, 𝑤) → Bool
In Charms,
• app contracts use tx (the whole transaction, listing ins and outs),
‣ ins, outs are lists of UTXOs
‣ UTXOs are
– identified by UTXO ID (256-bit byte string + integer index), and
– contain charms: map App → Data, where each individual entry app → data is called
a charm.
• app itself is an argument to the app contract — it has
‣ the vk — verification key,
‣ identity — useful when the same contract can power multiple assets / apps, and
‣ tag — a single character (with two values having special meaning, but free to be
used otherwise).
Data must be an unsigned integer (u64) for fungible token assets (apps with tag == TOKEN),
arbitrary data otherwise.
Outputs (UTXOs) can be created (by transactions) and then spent (by other transactions) —
these are the only two states of Charms outputs, just like in the underlying UTXO ledger.
5
Now, because outputs can contain multiple charms bound together (we call them strings of
charms), and they are passed to app contracts as such, it allows for composability of apps. For
example, an order-book exchange app data would be a limit order, specifying the quote token
and the minimum price for a base token in the same output.
Charms UTXO model achieves all design goals of ToAD and it can potentially add support for
any underlying UTXO-based ledger, relying solely on the client and the underlying blockchain
(without need to trust anyone). This ability to move across chains is powered by:
• the abstract nature of the Charms ledger model (designed to be a layer on top of a UTXO
ledger),
• recursive zkVM proofs.
3.2 Recursive zkVM Proofs
Charms client library doesn’t need to traverse the transaction history. All it needs to make
sure a transaction has correct Charms metadata (we call such metadata a spell) is a succinct
(Groth16 (9)) zkVM proof.
Spell proof in a transaction attests to the following statements being true:
(i) All pre-requisite transactions indeed produced the charms in their outputs: their spell proofs
are correct.
(ii) All Charms app contracts in this transaction are satisfied: their proofs are correct.
Therefore, if we’re looking at a Bitcoin transaction included in a block (which happens to be a
part of the main chain) with a correct Charms spell, we know two facts about it:
(i) It is spending and creating legitimate outputs — ensured by Bitcoin consensus.
(ii) Charms spent and created by the transaction are legitimate — as attested by the zkVM
proof.
So, all it takes to know that Charms in transaction outputs are legitimate, is read the spell and
verify the associated Groth16 proof: all the necessary data is available in the transaction (and
nowhere else).
This makes every client a Charms validator, even if it is a web or a mobile app.
3.3 Client Side Validation
This is precisely what every Charms client is doing. The underlying blockchain requirements
still apply, so the client needs to talk to a Bitcoin node to be able to get transactions creating
the client’s Bitcoin outputs. To read what Charms are in these outputs, the client reads the
spells and verifies proofs (in the transactions creating those outputs).
6
4 Charms Data Modeltx_1
tx_2
Outputs:Inputs:
tx1_txid:0
Outputs:Inputs:
spell proof
spell proof
tx_3 Outputs:
tx3_txid:1
Inputs:
tx3_txid:0
tx3_txid:2
12 cETH
38 cETH
39 cADA
1 cADA
30 cBTC
420 cUSD
69 cUSD
20 cBOS
80 cBOS
511 cUSD
spell proof
💲
tx1_txid:1
50 cETH
30 cBTC
40 cADA
B
B
tx2_txid:0
100 cBOS
1000 cUSD💲
💲
💲
4.1 App Contracts
Charms exist to make programmable assets possible on Bitcoin. Put simply, Charms are
programmable tokens on top of Bitcoin UTXOs.
Programmability exists to do one thing: enable apps. Charms apps can implement:
• fungible and non-fungible tokens,
• DEXes, auctions and lending protocols,
• … you (create and) name it.
App state needs to be stored somehow, and that’s what charms (as tokens) are for.
A single charm is a token, NFT or, generally, a fragment of app state pertaining to a particular
output. Structurally, it is an entry of a mapping app -> data on top of a Bitcoin UTXO. You
can have as many as you want such entries, creating a string of charms (a Charms output).
Combining tokens, NFTs and arbitrary apps in strings of charms allows for composability:
• a limit order to trade one token for another,
• artist royalty policies for NFTs
• bridging
• … limitless other things.
7
A string of charms gets created or spent as one unit, just like a Bitcoin UTXO. Charms can
only exist on top of UTXOs (such outputs are said to be enchanted). Because of this, whoever
owns the Bitcoin UTXO, can do whatever they want with charms in it (even destroy them).
Fungible tokens and NFTs are treated as special cases:
• a fungible token data (the value of a charm) is its amount (a positive integer, e.g. 69420),
• NFTs carry arbitrary data.
Charms Apps are essentially predicates that Charms transactions must satisfy:
pub fn app_contract(app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool
In the above signature,
• app: &App refers to the app itself, so that the predicate could find the app’s own data in
the transaction,
• tx: &Transaction is the transaction for which the predicate is being evaluated,
• x: &Data — app-specific (on-chain) public input,
• w: &Data — app-specific (off-chain) private input.
We detail the datatypes below.
4.1.1 App
pub struct App {
pub tag: char,
pub identity: B32,
pub vk: B32,
}
App is a tuple of tag/identity/VK (see App) where:
• tag is a single character representing the app type (with special values: n for NFTs, t for
fungible tokens). tag can be anything (with n and t treated specially: simple transfers of
NFTs and fungible tokens don’t need app contract proofs).
• identity — a 32-byte array uniquely identifying the asset (among others with the same tag
and implementation).
• VK — a 32-byte array representing the verification key hash of the app implementing the
logic of the asset: how it can be minted or burned, staked, etc.
4.1.2 Data
Data represents any CBOR-serializable data value (must implement Serialize and
Deserialize). charms-data library provides convenient API to convert to and from the app-
specific datatype.
4.1.3 Transaction
pub struct Transaction {
/// Input UTXOs.
pub ins: BTreeMap<UtxoId, Charms>,
/// Output charms.
pub outs: Vec<Charms>,
}
In UTXO model (e.g. as in Bitcoin, Dogecoin, Cardano), transactions spend inputs (previously
created UTXOs) and create outputs (new UTXOs).
Charms transactions are no different: spend inputs, create outputs.
8
4.1.4 Charms
pub type Charms = BTreeMap<App, Data>;
The Charms type represents the content of a Charms output or a string of charms — multiple
charms bound together (in a single UTXO). This is simply a mapping App -> Data. A single
entry of this mapping is called a charm, and it represents one asset of potentially many in a
single output.
In case of fungible tokens, Data encodes a positive integer (u64) — the amount of the fungible
token (specified by App) in the Charms output. It can be anything for other types of assets.
4.2 Spells and Proofs
Spells are the magic that creates charms.
The idea is to add some metadata to Bitcoin transactions that would tell the client software that
a transaction deals with Charms (inspired by Runes’ runestones and Ordinals’ inscriptions). We
call this metadata a spell because it “magically” enchants the transaction and creates charms.
Spells are client-side validated, meaning that the clients choose to interpret or ignore them.
A spell is said to be correct if and only if all of these are true:
• it is successfully parsed and interpreted
• makes sense for the transaction (e.g., doesn’t produce more Charms outputs than there are
Bitcoin outputs)
• has a valid proof
Correct spells can create, destroy and transfer charms (programmable assets). Incorrect spells
are ignored.
Double-spending is prevented by Bitcoin, so the spell’s proof only needs to prove that the spell
itself is correct. We go one step further and guarantee, that given the transaction is valid and
the spell is correct, it’s sufficient to verify the proof to ensure the spell is correct, i.e. there
is no need to traverse transaction history to make sure the transaction is dealing with
legitimate assets.
4.2.1 On-Chain Binary Representation of a Spell
A spell is included in a Taproot witness of the underlying Bitcoin transaction, in an envelope
— a sequence of opcodes OP_FALSE OP_IF … (push data) … OP_ENDIF, which is effectively a no-
op: since the condition is false, no data is pushed onto the stack.
OP_FALSE
OP_IF
OP_PUSH "spell"
OP_PUSH $spell_data
OP_PUSH $proof_data
OP_ENDIF
where:
• OP_PUSH "spell" shows that the envelope contains a spell.
• OP_PUSH $spell_data — CBOR-encoded NormalizedSpell.
• OP_PUSH $proof_data — Groth16 proof attesting to verification of correctness of the spell.
9
4.2.2 Structure of a Spell
A spell consists of:
• the protocol version
• the transaction (see NormalizedTransaction below)
‣ inputs,
‣ outputs
• public inputs for all involved apps
4.2.3 NormalizedSpell
pub struct NormalizedSpell {
pub version: u32,
pub tx: NormalizedTransaction,
pub app_public_inputs: BTreeMap<App, Data>,
}
NormalizedSpell encodes the spell structure in normalized form (to minimize size). The involved
Apps are enumerated in app_public_inputs (with potentially empty Data). Since it is a sorted
map, we can use the App’s integer index to refer to the App within the spell.
4.2.4 NormalizedTransaction
pub struct NormalizedTransaction {
pub ins: Option<Vec<UtxoId>>,
pub outs: Vec<NormalizedCharms>,
10
pub beamed_outs: Option<BTreeMap<u32, B32>>,
}
NormalizedTransaction is the normalized encoding of a Transaction (to minimize size).
ins field is optional because a spell is a metadata of a Bitcoin transaction: we can easily recover
the list of input UTXO IDs from the underlying transaction.
outs is a list of Charms outputs, where each is encoded as NormalizedCharms.
beamed_outs is discussed in the Beaming Charms section below.
4.2.5 NormalizedCharms
pub type NormalizedCharms = BTreeMap<usize, Data>;
NormalizedCharms represents a string of charms within a NormalizedSpell with Apps replaced
by integer indexes (in NormalizedSpell.app_public_inputs).
4.2.6 Proof
Spell proof is recursive: it’s a Groth16 proof of successful run of a zkVM program that verifies:
• the spell is well-formed
• the transaction satisfies all involved app contracts
• all spells from pre-requisite transactions (i.e. those creating the UTXOs we’re spending)
are correct
5 Recursive zkVM Proofsproof (is_spell_correct(tx_3) == true)
cETH_contract(cETH_app, tx_3, null, null) == true
cADA_contract(cADA_app, tx_3, null, null) == true
cBOS_contract(cBOS_app, tx_3, null, null) == true
cUSD_contract(cUSD_app, tx_3, null, null) == true
cBTC_contract(cBTC_app, tx_3, null, null) == true
MemePic_contract(one_simply_app, tx_3, null, null) == true
is_spell_correct(tx_1) == true
is_spell_correct(tx_2) == true
As we mentioned, spell proofs are recursive: a correct spell proof attests to
• verifying the spell is well-formed
• verifying app contract proofs
• verifying pre-requisite spell proofs ← this is the recursive part
This removes the need to traverse transaction history to confirm that the charms spent by a
transaction were indeed there. So, with a single Groth16 proof verification, we know if charms
in transaction outputs are good.
11
5.1 Spell is Well-formed
The following must hold for a spell to be well-formed.
• Protocol version is the one current one supported by the software.
• Apps from all input and output charms are listed (with their public inputs) and only those
apps are listed.
• There are no indexes in normalized charms outside the list of apps (higher than
number_of_apps - 1).
5.2 App Contract Proofs
An app contract proof is a zkVM proof that the app contract is satisfied by the transaction. The
app (compiled to a RISC-V binary) is run by the zkVM, and the proof that it runs successfully
is generated, with the following public and private inputs.
Public inputs:
• App
• Transaction
• x: Data — additional app-specific public input
Private inputs:
• w: Data — app-specific private input
These proofs are then verified against the app verification key (app.vk) when constructing
spell proofs.
There are two special cases that don’t require presenting app proofs:
• simple transfer of fungible tokens,
• simple transfer of NFTs.
Fungible tokens are implemented by Apps with tag 't' (app.tag == TOKEN). NFTs are
implemented by Apps with tag 'n' (app.tag == NFT).
Simple transfer of a fungible token means, the total amount of the fungible token in input
charms and output charms of a transaction is exactly the same.
Simple transfer of an NFT means that the NFT stays exactly the same in an output as it was
in an input of the transaction.
5.3 Spell Proofs
Charms software includes a program charms-spell-checker compiled to RISC-V binary and run
in a zkVM. The proof that it runs successfully is generated and then wrapped into a Groth16
proof, with the following public and private inputs.
Public inputs:
• Spell VK — the recursive spell verification key. It is used to verify pre-requisite spell proofs.
• NormalizedSpell — the spell being checked in normalized form.
Private inputs:
• app contract proofs — proofs that app contracts are satisfied by this spell.
• pre-requisite transactions — transactions that created Charms outputs spent or read by
this spell
App contract proofs are verified against corresponding app VKs.
12
Spells and their proofs from pre-requisite transactions are extracted and verified against the
spell VK.
5.4 Protocol Upgradability
Spells have version field, informing which spell VK to use when verifying the spell proof. Known
versions and corresponding spell VKs are known constants (within the Charms software which
is open source).
When a prerequisite transaction has a spell with a known protocol version, it is parsed
accordingly and its proof is verified against the spell VK for that version.
This enables simple and transparent upgradability of the protocol.
6 Beaming Charms
The meta-protocol design decoupled from the underlying blockchain empowers Charms to move
to other chains (and back to Bitcoin). We call this capability beaming as it reminds of transport
beaming depicted in Star Trek, where people or objects would disappear completely from one
place (say, on some planet) and fully materialize in a different place (say, the transporter room
of starship Enterprise).
6.1 Datatype Support
NormalizedTransaction has an optional field beamed_outs to mark Charms outputs (strings
of Charms) as beamed to other chains. The keys are indices of the beamed outputs (in this
NormalizedTransaction), and the values are SHA256 hashes of destination UTXO IDs on the
target blockchains.
pub struct NormalizedTransaction {
pub ins: Option<Vec<UtxoId>>,
pub outs: Vec<NormalizedCharms>,
/// Mapping from the output index to the destination UTXO ID hash.
pub beamed_outs: Option<BTreeMap<u32, B32>>,
}
This signals that charms are no longer assigned to the output. They cannot be “unlocked”,
because they are not here anymore.
6.1.1 Protocol
The protocol is executing a transfer of assets from chain B (e.g. Bitcoin) to chain C (e.g.
Cardano).
(i) on chain C: create a “placeholder” UTXO (or the destination UTXO)
• transactions creating such outputs don’t carry any spells
• do not spend this UTXOs yet!
(ii) on chain B: create a Charms output that is being “beamed” to chain C — added to the
mapping in beamed_outs with the hash of the “placeholder” UTXO ID on destination chain
C (created in step 0).
After these steps, the Charms output can be considered moved to chain C and is good to be
spent there.
(iii) A spell spending such output on chain C is correct if and only if it has a proof that:
13
• a transaction on chain C has created the beam destination output (this is taken care
of by the underlying blockchain),
• the spell would be correct without the beaming if the charms were put in the beam
destination UTXO directly on chain C,
• a correct spell on chain B (with valid proof) created the output with a corresponding
entry in beamed_outs with the hash of the destination UTXO ID on chain C,
• the beaming transaction (on chain B) is included in the main branch of the blockchain
history.
To prove transaction inclusion in the main branch on Bitcoin, we can provide
• Merkle proof of transaction inclusion in a block,
• proof of sufficient work performed on top of the block (to mine subsequent blocks).
We can visualize this process as:
(i) a transaction on the destination chain (C) create “placeholder” for Charms to be sent to,
(ii) a transaction on the source chain (B) beams the Charms into their “placeholder” (on the
destination chain, C).
6.1.2 Effect on Apps
App contracts don’t care about chains: there are no mentions of any chains (neither B, nor
C) in app contract code. UtxoId struct (which is used in app contracts) has the same format
regardless of the chain.
Thus apps become cross-chain without trying to become cross-chain.
14
6.1.3 Additional Considerations
If multiple strings of charms are sent to a single UTXO on the target chain, only one of
them can be spent. The spending transaction decides which one. The other ones are effectively
destroyed.
7 How it Works Put Together
The full cycle of building a Charms app (e.g. a Bitcoin backed stablecoin) looks something
like this:
(i) Run charms app new shiny-new-token in your shell, and get a fully buildable Rust project
that can be customized to whatever it needs to do.
(ii) Build the app contract functionality. The only limit is the signature of the entry point
function, the app contract predicate. Standard Rust can be used, no compromises. Use
charms app build to compile the app to the zkVM-ready RISC-V binary.
(iii) Test the app contracts with charms app run against different potential spells you anticipate.
(iv) Build front-end and back-end of the app and interact with Charms’ Rust or web APIs (or
the CLI) to generate spell proofs and embed them into Bitcoin transactions to be signed
by users’ wallets.
(v) Profit!
(vi) Go cross-chain without changing a line of code in app contracts.
(vii) More profit.
Operation flow for Charms apps (which also hints at why Charms app implementations are
called app contracts) is the following:
(i) Create your transaction / spell. It can do anything, as long as is satisfies the app
contracts for all involved charms.
(ii) Generate the zkVM proof that the spell is correct using Charms library, API or CLI.
In order to do this, provide previous transactions, plus proofs of inclusion for those on
different chains. The result is a transaction (enhanced with the spell and proof, or dare we
say, enchanted) ready to sign and submit to the blockchain.
(iii) Sign and submit the transaction.
The above flow is very similar to interaction with UTXO blockchains in general, with the only
difference that validation happens off-chain and is attested to by a zkVM proof.
8 What’s Next
8.1 Wasm App Contracts
Currently, Charms apps are written in Rust and compiled to RISC-V ELF binaries — to be
run and generate proofs by a zkVM.
RISC-V ELF is a popular choice of CPU architecture and binary format among zkVM vendors,
which means that currently only Rust can practically be used to implement Charms app
contracts.
We will continue using Rust to build Charms (it is fantastic as a systems programming
language), but we also want to lower the barrier for app developers, and therefore will look into
using Wasm (WebAssembly) as the binary format for Charms apps.
We will work with zkVM vendors to achieve this.
15
8.2 Charms as Native Tokens on Smart UTXO Chains
If the destination chain has smart contracts (token policies and locking scripts) that can verify
SNARK proofs over a pairing-friendly elliptic curve, such as BLS12-381 (which Cardano does),
it is possible for Charms tokens (both fungible and non-fungible) exist on that chain as native
tokens.
We will briefly describe how this would work on Cardano.
8.2.1 Charms as Cardano Native Tokens (CNTs)
On the high level, the end goal is:
• when Charms tokens are transferred to Cardano (in a wallet supporting both Bitcoin and
Cardano), they show up on Cardano as CNTs:
‣ when beamed to Cardano, tokens are minted as CNTs
‣ when beamed from Cardano, they are burned
• when Cardano tokens are transferred to Bitcoin (or other Charms-enabled chains), they are
treated in a similar fashion:
‣ tokens are locked on the Cardano side and minted as Charms
‣ when transferred back, they are burned as Charms and unlocked on Cardano
The idea is to use a proxy Cardano token policy for Charms tokens. This token policy will allow
minting and burning tokens based on verification of a ZK proof of the transaction in question
satisfying the Charms tokens’ app contracts.
We will also introduce a proxy spending script for Charms apps to act as Cardano smart
contracts. It will effectively introduce portable zkVM based smart contracts (implemented in
Rust) to Cardano.
We also need a proxy Charms app for original Cardano tokens coming to Charms. Minting and
burning of original CNTs is only possible when they are operated natively on Cardano. Aside
from minting and burning, original CNTs are going to be fully operational as Charms tokens
on any Charms-enabled blockchains.
8.3 More Chains
More than $80bn total market cap is in UTXO-based blockchains other than Bitcoin, including
the largest ones, Dogecoin ( $34bn), Cardano ($27bn). About half (the smallest chain being
larger than $6bn in market cap) allow storing sufficient additional data in transactions (as
evidenced by existence of their respective versions of Ordinals) to be able to carry a Charms
spell (and proof). We are looking to build Charms support for these blockchains.
9 Use Cases
The revolutionary capabilities of Charms enable entirely new categories of blockchain
applications. Here we explore three transformative use cases that showcase the protocol’s
potential to reshape both Bitcoin functionality and broader Web3 interoperability.
9.1 Unchained Bitcoin (xBTC)
We can wrap BTC into a Charms token - xBTC - introducing two groundbreaking upgrades to
the world’s largest digital asset.
First, xBTC brings programmability to BTC, much like how wETH enabled smart contract
functionality for ETH. This allows BTC holders to participate in advanced DeFi applications
16
and smart contract interactions that were previously impossible with native BTC - directly
upon the Bitcoin ledger.
Second, xBTC eliminates the need for traditional bridging infrastructure to move BTC between
chains. Once BTC is locked and xBTC is minted, the token can move freely between any
Charms-integrated chains without requiring additional locking or minting operations. This
dramatically reduces friction compared to conventional bridging solutions that require separate
infrastructure for each chain pair. Finally, this opens avenues for less trusted methods of moving
BTC between chains - particularly for chains that cannot verify external events, including
Litecoin and Dogecoin.
The result is a truly portable BTC that maintains its security while gaining unprecedented
functionality and cross-chain mobility.
9.2 Decentralized Bitcoin Onramp
Charms could revolutionize bitcoin acquisition by creating a decentralized, peer-to-peer,
censorship-resistant onramp that sidesteps traditional KYC requirements.
This system would enable users to purchase xBTC (a wrapped BTC implemented as a Charm)
directly paying with, say, CashApp without any intermediary’s knowledge. When a buyer sends
cash via CashApp, the system leverages zero-knowledge proofs to cryptographically verify the
transaction occurred without revealing personal details.
Once verified, a Cardano smart contract automatically releases the equivalent xBTC from
sellers’ escrowed funds to the buyer. The platform processes what appears to be regular peer-to-
peer transfers, so CashApp isn’t aware it is processing a P2P Bitcoin purchase. This creates a
truly private, non-KYC pathway to Bitcoin ownership that embodies core cypherpunk principles
of financial privacy and freedom from surveillance.
9.3 Self-Auditing Stablecoin
Charms’ ability to verify off-chain information through zero-knowledge proofs enables an
entirely new category of transparent, verifiable stablecoins. Consider a stablecoin that can
only mint new tokens when it has cryptographically verified sufficient backing in a traditional
financial account.
For example, a stablecoin could be programmed to verify the balance of a custodian’s CashApp
account before allowing any new minting. While this doesn’t eliminate custodial risk entirely,
it provides:
• Real-time verification of backing assets
• Transparent proof of reserves
• Automated compliance with backing requirements
• Reduced trust assumptions around custody
This creates a new standard for stablecoin transparency and verification, where backing can be
continuously monitored and proven rather than relying solely on periodic attestations.
These examples represent just a fraction of what’s possible with Charms. As the protocol
matures and more developers begin building with it, we expect to see an explosion of innovative
applications that leverage Charms’ unique capabilities to create more secure, interoperable, and
powerful blockchain solutions.
17
10 Conclusion
We have presented Charms — a programmable asset protocol for enchanting Bitcoin alongside
other UTXO-based ledgers (like Cardano).
By using recursive zkVM proofs, client-side validation, and a novel Extended UTXO model,
Charms straps Bitcoin with an unchained and secure metalayer for building the decentralized
internet of value. Charms doesn’t just give Bitcoin apps — it makes Bitcoin omniscient.
This is made possible by advancements in zkVM technology that powers our recursive ZK
proofs, eliminating the need to traverse blockchain transaction history. This allows clients to
be very thin and removes the need for indexers (for the purpose of validating transactions) or
any infrastructure other than the underlying blockchain.
By bootstrapping Charms on Cardano’s dApp ecosystem, we empower developers to build freely
— with Cardano projects becoming the first to explore this new programmable frontier. As
the rest of the crypto industry collapses inward toward Bitcoin’s gravity, Cardano becomes
the launchpad.
Our short-term development goals are to migrate to Wasm as the binary format for app
contracts, opening up to the broader app/web2 developer community, finish implementing
Charms integration with Cardano native tokens and begin expansion to other UTXO chains
(like Litecoin and Dogecoin).
Charms is the culmination of years of evolution in UTXO-based smart contracts. It’s not a
bridge, nor a Layer 2, but a new paradigm — the unchained token standard.
11 Acknowledgements
We would like to thank Edan Yago, Rainer Koirikivi, Ricart Juncadella, James Aman and the
rest of BitcoinOS team for insightful discussions and support that helped envision and realize
Charms and for reviewing this white paper.
Succinct is a remarkable group of people who have built SP1, a developer-friendly open source
zkVM, which we enjoyed using when building Charms.
We are also grateful to Maksym Petkus for reviewing this paper and for questions helping to
sharpen our thinking, as well as David Wong (of zkSecurity) who has done most of the work
behind zkBitcoin, the project Charms grew from.
References
1. NAKAMOTO, Satoshi. Bitcoin: A Peer-to-Peer Electronic Cash System. Online. 2008.
Available from: https://bitcoin.org/bitcoin.pdf
2. MANUEL M. T. CHAKRAVARTY, Kenneth MacKenzie, Orestis Melkonian, Jann Müller,
Michael Peyton Jones, Polina Vinogradova, Philip Wadler, Joachim Zahnentferner, James
Chapman. UTXOma:UTXO with Multi-Asset Support. Online. 2020. Available from:
https://iohk.io/en/research/library/papers/utxomautxo-with-multi-asset-support/
3. MANUEL M. T. CHAKRAVARTY, Kenneth MacKenzie, Orestis Melkonian, Michael
Peyton Jones, James Chapman and WADLER, Philip. The Extended UTXO Model.
Online. 2020. Available from: https://iohk.io/en/research/library/papers/the-extended-
utxo-model/
18
4. Plutus Reference. Common Weaknesses: Double Satisfaction. Online. 2022. Available from:
https://github.com/cardano2vn/plutus/blob/main/doc/reference/common-weaknesses/
double-satisfaction.rst
5. Aiken Documentation. Fundamentals: Common Design Patterns. Online. 2024. Available
from: https://aiken-lang.org/fundamentals/common-design-patterns
6. Aiken Documentation. Fundamentals: EUTXO Crash Course. Online. 2024. Available from:
https://aiken-lang.org/fundamentals/eutxo
7. IVAN MIKUSHIN, David Wong. zkBIP-001: Tokens as App Data (ToAD 🐸). Online. 2024.
Available from: https://github.com/CharmsDev/zkbitcoin/blob/main/zkBIPs/zkBIP-001.
md
8. DAVID WONG, Ivan Mikushin. zkBitcoin: Zero-Knowledge Applications for Bitcoin.
Online. 2024. Available from: https://github.com/CharmsDev/zkbitcoin/blob/main/
whitepaper.pdf
9. GROTH, Jens. On the size of pairing-based non-interactive arguments. 2016.
19