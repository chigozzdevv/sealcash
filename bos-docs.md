# BitcoinOS – The Operating System for a Bitcoin Powered World

We are building the ultimate upgrade to Bitcoin. Our mission is to preserve Bitcoin's core capabilities, while building a system where any type of computation or VM can validate back to Bitcoin, creating a global economy on top of true censorship resistant and sound money.&#x20;

**The system incorporates:**&#x20;

* [**BitSNARK**](https://docs.bitcoinos.build/technical-documentation/quickstart)**:** This is a highly optimized VM for succinct zk proofs to be posted and verified on the Bitcoin chain. We achieved this during Bitcoin Nashville in July 2024, [successfully verifying the first zk-SNARK proof on the Bitcoin blockchain](https://x.com/BTC_OS/status/1816180788938870815). It is open-sourced here[GitHub](https://github.com/bitsnark/bitsnark-lib) and documented in [a blog post here](https://www.bitcoinos.build/blog/bitcoinos-open-sourcing-the-bitsnark-verification-protocol).  BitSNARK lays the foundation for trustless bridging and true rollups on Bitcoin.
* [**Grail**](https://docs.bitcoinos.build/technical-documentation/grail)**:** A trustless bridge between Bitcoin L1 and other chains, including but not limited to Bitcoin L2s. Agents that operate the bridge, utilize the BitSNARK verification protocol to post and verify bridge transactions between Bitcoin and other chains. These chains include, but are not limited to Bitcoin L2s.&#x20;
* **MerkleMesh:** Aggregating data from a whole ecosystem of interoperable virtual machines and verifying it back to the security of Bitcoin, MerkleMesh creates interoperability for distinct chains that use BitSNARK and Grail Bridge as modular components for trustless bridging and proof verification.&#x20;

BitSNARK is currently under further optimization and Grail bridge is in the final stages of completion, and we are entering several key partnerships and integrations within and outside of the Bitcoin ecosystem. More on this will be revealed in due time, but announcements are made on our [Twitter ](https://x.com/BTC_OS)and [Blog](https://www.bitcoinos.build/blog).&#x20;

Carry on reading the next section which explains [why BitSNARK is such an important milestone](https://docs.bitcoinos.build/technical-documentation/quickstart) and how it fits into the evolution of scaling Bitcoin.&#x20;

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FLUaZ5gKVEBdUtUHY04Kp%2FBOS%20Technology%20chart%20Dark.png?alt=media&#x26;token=823d8e2d-cb64-4545-b0ab-5637acc45e4c" alt=""><figcaption></figcaption></figure>

### Jump right in

<table data-view="cards"><thead><tr><th></th><th></th><th data-hidden data-card-cover data-type="files"></th><th data-hidden></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td><strong>BitSNARK</strong></td><td></td><td></td><td></td><td><a href="technical-documentation/quickstart">quickstart</a></td></tr><tr><td><strong>GRAIL</strong></td><td></td><td></td><td></td><td><a href="broken-reference">Broken link</a></td></tr><tr><td><strong>Links</strong></td><td></td><td></td><td></td><td><a href="technical-documentation/quickstart/publish-your-docs">publish-your-docs</a></td></tr></tbody></table>

# BitSNARK

**Why is this an Important Milestone for Bitcoin**

BitcoinOS is the first team that has managed to run a fraud proof challenge on Bitcoin, verifying the first zk proof ever on Bitcoin mainnet. This was done on the 24th July 2024. A historical moment. We call this protocol BitSNARK.&#x20;

The final verification was confirmed in block 853626.

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FZ5tIsT7oBS3CcqvDtBWb%2FBlock%20zk%20proof.png?alt=media&#x26;token=28c4836e-a03c-45a1-a43b-6cf1b747e0bd" alt=""><figcaption></figcaption></figure>

We open sourced v0.1 of our BitSNARK Verification Protocol in September 2024.

[Github repo for BitSNARK verification](https://github.com/bitsnark/bitsnark-lib)

[Tweet to Prove First Zk Proof Verified On Bitcoin](https://x.com/BTC_OS/status/1816180788938870815)

Since its inception, Bitcoin has emerged with decentralization, permanence and security as its guiding principles. To achieve this, Bitcoin has been deliberately designed to maintain constraints to its ability to process more expressive compute. In order to extend its properties to support more complicated systems and computations, developers have to implement innovative techniques while minimizing changes to Bitcoin's core.&#x20;

The idea of using zk-SNARKs to scale Bitcoin, was actually introduced as early as 2013, by Gregory Maxwell, one of the core contributors to Bitcoin. Since then, zk proofs have proliferated through the crypto space, with significant support from Vitalik Buterin, who put it on the Ethereum roadmap. It is very clear that zk proofs and SNARKs in particular have a significant role to play in scaling Bitcoin.&#x20;

For years, Bitcoin's limited and inflexible code made SNARK verification on Bitcoin seemingly impossible. However, in October 2023, the BitVM whitepaper published by Robin Linus inspired developers to begin challenging that belief. \
\
When BitVM was first introduced, it didn't apply zk proofs in its implementation of fraud proof verification, but instead described a generalized VM that included a fraud proof process. While the ideas encouraged further development, there were still significant practical hurdles around blockspace, cost and trustlessness.&#x20;

Building on the ideas presented in the [BitVM whitepaper](https://bitvm.org/bitvm.pdf), and implementing SNARK proofs, the BitcoinOS team has managed to build and successfully execute our own zk prover/challenger protocol on Bitcoin.&#x20;

We have created BitSNARK as an optimized VM to address the practical limitations of the BitVM paradigm. We published our [whitepaper in April 2024](https://assets-global.website-files.com/661e3b1622f7c56970b07a4c/662a7a89ce097389c876db57_BitSNARK__Grail.pdf), covering how BitSNARK improves on both costs and blockspace requirements, reduces sybil attack vectors, while significantly reducing trust assumptions inherent in BitVM. This paper was validated when we [verified the first zk proof](https://x.com/BTC_OS/status/1816180788938870815) on Bitcoin in July 2024 with BitSNARK. Furthermore, the paper also describes how BitSNARK can be implemented to create trustless bridging for Bitcoin, a key and missing part of the Bitcoin scaling puzzle thus far. We named the bridge Grail.&#x20;

As teams continue to expand the use case and capabilities for Bitcoin, we are convinced that BitSNARK and Grail will play crucial roles in the scaling of Bitcoin far beyond a store of value. We are already seeing the same architecture described in Robin Linus' BitVM2 paper, incorporating both SNARKs and extending it's use case to describe a near trustless bridge, similar to that of Grail.&#x20;

Our mission is to build a Bitcoin native interoperable and trustless system without forks, where any type of computation or VM can plug into Bitcoin and enable the creation of a global economy on top of true censorship resistant and sound money.&#x20;

BitSNARK is currently under further optimization and Grail bridge is in the final stages of completion, and we are entering several key partnerships and integrations within and outside of the Bitcoin ecosystem. More on this will be revealed in due time, but announcements are made on our [Twitter ](https://x.com/BTC_OS)and [Blog](https://www.bitcoinos.build/blog).&#x20;

Please also join our [builders community](https://t.me/BitcoinOS_Build) on telegram if you want to contribute and build a world on Bitcoin together.&#x20;

{% hint style="info" %}
Check out our [Github Repo](https://github.com/bitsnark/bitsnark-lib) for BitSNARK to learn more about how we verified BitSNARK on Bitcoin mainnet. Head to our [blog](https://www.bitcoinos.build/blog/bitcoinos-open-sourcing-the-bitsnark-verification-protocol) to read more.&#x20;
{% endhint %}

# BitSNARK VM - Verifying zkSNARKs On Bitcoin

BitSNARK VM is a virtual machine emulating a simplified register-based processor with only three instructions, natively supporting the finite field calculations required for elliptic curve pairing operations. As a result, the verification protocol is notably simplified, requires no memory consistency checks, and only requires two challenge scenarios:

1. Single-instruction execution error proofs
2. Reveal-equivocation proofs

The VM has a limited number of 256-bit registers, each with a unique ID. Each instruction receives register IDs, performs a single calculation, and emits its result into the target register. Certain registers can be marked as immutable, so their values cannot be modified and they can be optimized in the Bitcoin script. The following instructions are supported:

* `addmod(𝑡, 𝑎, 𝑏, 𝑚)` – Add the values of registers 𝑎 and 𝑏, modulo 𝑚, into register 𝑡.
* `andbit(𝑡, 𝑎, 𝑏, 𝑐)` – If bit 𝑏 of register 𝑎 is 1, write the value of register 𝑐 into register 𝑡; otherwise, write the value 0.
* `equal(𝑡, 𝑎, 𝑏)` – If the values of registers 𝑎 and 𝑏 are equal, write 0 into register 𝑡; otherwise, write 0.

Additionally, an attempt to write a value into an immutable register results in the program being rejected if the value being written is different from the value in that register.

It can be demonstrated that these instructions are sufficient to implement a zkSNARK verifier.

**An Iterative Prover vs Challenger Loop - Verifyable Onchain**

BitSNARK is designed as a two-party protocol for a prover and a verifier, where the prover initiates the execution by revealing the program’s input and its result, and the verifier can dispute it if they believe the claim is incorrect. When considering more than two operators, a two-party BitSNARK protocol is set up for each pair of agents, allowing any successful two-party challenge to block an invalid program execution.

The protocol is organized as a series of challenge-and-response interactions with a time lock. It also engages with the verifier via a peer-to-peer protocol to create a set of pre-signed transactions. These transactions can be used by the two parties to perform the steps of the protocol.

Each step of the iteration, if a proof is challenged:

* The prover splits the program execution in half and commits to the state of the virtual machine at the point of incision.
* The verifier chooses which of the two resulting parts they believe is false.
* The process iterates until the prover has committed to a single BitSNARK operation.

This process can be executed on-chain to determine the winner of the protocol.

If no challenge is entered during the allowed time period, or if the verifier fails to demonstrate a rejection, the funds are unlocked, and the prover can make use of them.

If the challenge is successful, the funds remain securely locked until any other operator initiates a withdrawal process on their own. The verifier is incentivized by receiving a sum from an output created beforehand by the prover in the initiating transaction.

Each iteration involves a time-locked transaction—if a party walks away, they lose the game once the timeout has expired.

<br>
# BitSNARK - Security Assumptions

While many systems rely on a majority vote in a threshold signature scheme for security, BitSNARK provides stronger protection by allowing a single honest agent to prevent abuse by any or all of the other agents. This is referred to as a 1/n (one of many) trust assumption instead of m/n (majority of many).

An initiating agent is required to create a transaction containing an output with a minimum amount of Bitcoin, which is forfeited to any verifier who successfully proves that the transaction is fraudulent. This incentivizes agents to monitor blockchain transactions for opportunities to engage in the verification protocol. The verifier is also required to attach an output to their challenges to penalize verifiers for making challenges in non-fraudulent cases. The result of this mutual incentive scheme is that the cost of engaging in the protocol does not fall on the user of the system; instead, it is covered by the dishonest participant. This “optimistic” approach allows us to keep costs to a minimum.

<br>

<br>
# GRAIL

The bridge is intended to allow users to transfer assets between the Bitcoin blockchain and any VM in a trustless way (trust minimized), leveraging BitSNARK verification to secure bridge transactions and transfers.

The primary advantage of BitSNARK in trustless bridging lies in its small, fixed proof size of just 300 bytes, compared to alternative systems, which requires a potentially large footprint due to its defined multi-step challenge protocols. Those systems can consume nearly an entire 4MB Bitcoin block for a single complex proof, while our Grail Bridge design allows up to 40 separate bridge transactions per block, with each withdrawal using just 100 KB. This makes BitSNARK naturally more scalable and cost-effective for high-frequency use cases.

Additionally, the bridge design could allow for operator-level batching, where operators can aggregate multiple user transactions and commit them in bulk, further reducing costs per transaction. For smaller transactions, operators can leverage their liquidity on the other chain to facilitate instant swaps, without generating on-chain proofs each time. If a specific transaction needs verification, we can do so on the rollup side of the other chain, eliminating the need for separate proofs on Bitcoin. This design supports higher frequency use cases with lower latency and costs, compared to the heavy on-chain footprint and slower finality of other systems.&#x20;

This approach makes our solution more adaptable fo[^1]r a wide range of use cases, from high-volume cross-chain interactions to rapid transfers, which would be impractical under the cost structure of alternative systems.&#x20;

[^1]:
# GRAIL

The bridge is intended to allow users to transfer assets between the Bitcoin blockchain and any VM in a trustless way (trust minimized), leveraging BitSNARK verification to secure bridge transactions and transfers.

The primary advantage of BitSNARK in trustless bridging lies in its small, fixed proof size of just 300 bytes, compared to alternative systems, which requires a potentially large footprint due to its defined multi-step challenge protocols. Those systems can consume nearly an entire 4MB Bitcoin block for a single complex proof, while our Grail Bridge design allows up to 40 separate bridge transactions per block, with each withdrawal using just 100 KB. This makes BitSNARK naturally more scalable and cost-effective for high-frequency use cases.

Additionally, the bridge design could allow for operator-level batching, where operators can aggregate multiple user transactions and commit them in bulk, further reducing costs per transaction. For smaller transactions, operators can leverage their liquidity on the other chain to facilitate instant swaps, without generating on-chain proofs each time. If a specific transaction needs verification, we can do so on the rollup side of the other chain, eliminating the need for separate proofs on Bitcoin. This design supports higher frequency use cases with lower latency and costs, compared to the heavy on-chain footprint and slower finality of other systems.&#x20;

This approach makes our solution more adaptable fo[^1]r a wide range of use cases, from high-volume cross-chain interactions to rapid transfers, which would be impractical under the cost structure of alternative systems.&#x20;

[^1]:
# Bridge Agents - Operators

The Grail bridge requires agents called operators.&#x20;

Operators monitor the bridge operations and assist users with deposits and withdrawals. They constantly monitor both the Bitcoin and rollup networks and participate in defined bridging protocol steps.&#x20;

A minimum of two operators are required to keep the bridge protocol going, but any number can be supported.&#x20;

<br>
# Operator Transfer - Away From Bitcoin

Operators can lock funds on the Bitcoin side by sending them to Taproot addresses created using BitSNARK. Funds will be locked in a UTXO until a SNARK proof is provided to enable their retrieval.

On the L2 side, operators send a SNARK proof to the bridge smart contract, which causes the bridge to mint tokens to the operator’s wallet.

<br>
# Operator Transfer - Receiving to Bitcoin

In the reverse process to our previous example, an operator burns their tokens via the smart contract on the L2, thereby obtaining a SNARK proof that allows the operator to retrieve their funds on the Bitcoin side from the UTXO using the BitSNARK protocol.

<br>
# Operator Registration

Operators are required to register and maintain an active internet endpoint to support peer-to-peer (P2P) interactions with other operators.

Registration requires minting a public key identity and an exit secret. The public key and the hash of the exit secret are registered by a bridge smart contract. It also requires depositing the required stake, which is locked as a guarantee while the operator is active. The stake can be recovered when the operator requests to exit the protocol, provided no violation has been demonstrated up until that point.

The exit secret is revealed to claim the stake and exit the role. The exit secret also contains information that can prevent the operator from participating in any future protocol exchanges.

<br>
# Operator Identities and Group Multi-Sig ID

Operators maintain a multi-signature identity that is used to pre-sign transactions and optimize operational costs in non-adversarial scenarios.

The bridge uses the MuSig2 two-round protocol to create Schnorr signatures approved by the full set of operators.

This allows the bridge to operate as one identity in cases of transactions made in good faith. <br>

# Grail Bridge - Deposit

Three smart contract functions are used to coordinate operations for a deposit on the bridge. For clarity, “a user” refers to a user of the bridge, not an agent such as the operator.

The Bridge - 3 Smart Contracts

**Initiate deposit**

1. A user specifies a set of funding UTXOs on the Bitcoin network and requests an address to make a deposit.
2. Operators work together to generate an address and a set of pre-signed transactions.
3. A Taproot address is created using BitSNARK.

**Confirm deposit**&#x20;

1. As soon as the operators have signed the required transactions, the deposit is confirmed, and the user can initiate the transfer.
2. The user can verify that the address has been generated correctly and that all the requisite transactions have been signed before transferring their funds.

**Complete deposit**

1. Given a proof of transfer to the accepted bridge deposit address on the Bitcoin network, the equivalent amount of the rollup’s ERC20 token is transferred to the user in the rollup
2. The locked UTXOs are registered in the smart contract and remain locked until a SNARK is generated to enable their retrieval.

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FH0fWpIpOtHCbK9wVy46b%2FGrail%20Deposit.jpg?alt=media&#x26;token=65e648cc-dc8a-48b3-8658-d6a065657e26" alt=""><figcaption></figcaption></figure>

# Grail Bridge - Deposit

Three smart contract functions are used to coordinate operations for a deposit on the bridge. For clarity, “a user” refers to a user of the bridge, not an agent such as the operator.

The Bridge - 3 Smart Contracts

**Initiate deposit**

1. A user specifies a set of funding UTXOs on the Bitcoin network and requests an address to make a deposit.
2. Operators work together to generate an address and a set of pre-signed transactions.
3. A Taproot address is created using BitSNARK.

**Confirm deposit**&#x20;

1. As soon as the operators have signed the required transactions, the deposit is confirmed, and the user can initiate the transfer.
2. The user can verify that the address has been generated correctly and that all the requisite transactions have been signed before transferring their funds.

**Complete deposit**

1. Given a proof of transfer to the accepted bridge deposit address on the Bitcoin network, the equivalent amount of the rollup’s ERC20 token is transferred to the user in the rollup
2. The locked UTXOs are registered in the smart contract and remain locked until a SNARK is generated to enable their retrieval.

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FH0fWpIpOtHCbK9wVy46b%2FGrail%20Deposit.jpg?alt=media&#x26;token=65e648cc-dc8a-48b3-8658-d6a065657e26" alt=""><figcaption></figcaption></figure>

# Grail Bridge - Operator-Initiated Withdrawal (withdraw to Bitcoin)

This supports the user withdrawal on the back end.&#x20;

In the operator-initiated withdrawal operation, an operator holding tokens will exchange them for some of the UTXOs locked on the bridge.

**Request Withdrawal**

1. The operator requests a withdrawal and specifies an amount and target address. The smart contract collects the token equivalent, selects a group of UTXOs that match the amount, and assigns those UTXOs to the operator's address.
2. Afterward, the smart contract state is committed to the Bitcoin network. The operator can use a zk-proof showing that the UTXOs have been assigned to them to transfer the funds on the Bitcoin network.

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FJsGBmj9rZeQw1vWOo6Yc%2Foperator%20initiated%20wihdrawal.jpg?alt=media&#x26;token=e5ed5696-4572-4fd4-9904-ffdff54823a1" alt=""><figcaption></figcaption></figure>

# Grail Bridge - Coordinated Withdrawal

If all operators are available and cooperating, an operator-initiated withdrawal can be completed using a group signature for the transfer to the target address, avoiding the need to calculate and commit the zk-proof.

<br>
# Operator-assisted Withdrawal

If a user requests to withdraw tokens, the operation can be completed by an operator holding Bitcoin.

The following smart contract functions are available:

* **Initiate Withdrawal:** The user specifies an amount and target address. The smart contract collects the funds and registers the withdrawal request.&#x20;
* **Operator Assignment:** An operator responds and selects a set of UTXOs they control to service the request. The withdrawal is assigned to them. As soon as the state is confirmed, they transfer Bitcoin to the target address using the preselected UTXOs.
* **Complete Withdrawal:** The operator completes the operation by presenting proof of inclusion in the Bitcoin blockchain for the transaction to the target address. The smart contract then transfers the target amount in tokens to the operator.

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FUTqpM9AdnyA6MLDItpsq%2Foperator%20assisted.jpg?alt=media&#x26;token=35a9ba04-42dc-4d42-a873-1eb1078d43a5" alt=""><figcaption></figcaption></figure>
# Grail Bridge - Proofs Used

**Two types of proofs are used in the Grail bridge to support its operations:**

1. Proof of transaction inclusion on the Bitcoin network
2. Proof of state transition of the bridge smart contract on the L2 side

For both types, a zkSNARK Groth16 proof is generated and verified. Proof recursion is expected to be supported, allowing proofs from other systems, such as Plonky2 and STARKs. In other words, a zkSNARK proof can be used to verify another proof.

**Proof of transaction inclusion on the Bitcoin network**

Given a transaction hash, a proof that the transaction has been mined on the Bitcoin network is generated by combining the following conditions:

* Proof that the transaction was included in a particular block
* Proof that a predefined number of blocks were confirmed afterward
* Proof that a known accepted block is present in the chain

**Proof that a variable on the bridge smart contract reached a particular state**

Proofs of the bridge smart contract state are used in two cases:

* To confirm that a UTXO has been assigned to an operator for withdrawal
* To confirm that a stake has been released after an operator has resigned

Depending on the design and security assumptions of the rollup, the proofs can be constructed as follows:

* **Proof of transaction inclusion on the Bitcoin network** — provided that the rollup is committing transaction information to the Bitcoin network as a data availability layer and that the rollup has a dispute mechanism to reject invalid state transitions (i.e., proving that the rollup has posted a transaction on the Bitcoin network).
* **Proof of storage state on the rollup’s smart contract** — alternatively, it can be shown that a target variable with its value has been included in the smart contract storage when calculating the rollup’s block hash. This would allow significant scalability in terms of reducing verification burden via BitSNARK.&#x20;

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2Fu3pDYo5MqRNFGRyPjgfr%2FProof%20of%20rollup.jpg?alt=media&#x26;token=4775dadf-43f6-4439-9879-5de9dd054a5f" alt=""><figcaption></figcaption></figure>

# GRAIL PRO, CHARMS, ZKBTC

**Abstract**

Bitcoin OS is an ecosystem that extends Bitcoin’s capabilities beyond simple payments into the realm of programmable, decentralized applications. By combining zero-knowledge proofs (ZKP), multiparty computation (MPC), and trusted execution environments (TEE), Bitcoin OS introduces a framework for smart contracts, synthetic assets, and cross-chain interoperability without compromising Bitcoin’s security model.&#x20;

The core components of Bitcoin OS are:&#x20;

● Charms: A zero-knowledge token standard for UTXO blockchains.&#x20;

● Grail Pro: A secure enclave network enabling general-purpose smart contracts.&#x20;

● zkBTC: A fully collateralized synthetic Bitcoin token serving as the gateway into the ecosystem.&#x20;

<br>
# Introduction

Grail Pro is a platform designed to allow the execution of smart contracts directly on the Bitcoin blockchain. This is made possible by leveraging several technologies such as zero-knowledge proofs (ZKP), multiparty computation (MPC) and trusted execution environments (TEE). Grail Pro is a network of secure enclaves that form a decentralized vault capable of locking cryptocurrencies and other tokens, and releasing them according to predetermined conditions. The integrity and security of this system is enforced using ZKP, which can be generated by users and verified inside the enclaves.&#x20;

Charms, a ZKP-powered token standard for UTXOs blockchains, allows the creation of smart assets. Each smart asset is a token that has its own logic attached to it. Charms can be made to embody various behaviors, from simple fungible tokens to complicated financial schemes. Charm tokens are blockchain agnostic, which means they can potentially reside on any UTXO-based blockchain, and be transferred easily between blockchains without relying on any counter-party or liquidity provision.&#x20;

The first application of Grail Pro is zkBTC, a synthetic Bitcoin token. zkBTC is backed by 100% BTC collateral, and can be redeemed automatically and trustlessly without relying on any counterparty. This serves as a gateway to the Bitcoin OS ecosystem by providing users a

Charm token with real-world value that can be swapped, traded, borrowed, invested or used to pay fees.&#x20;

In order to get a better picture of how all this works, let’s consider the pieces individually and then see how they work together to implement various real-world applications.&#x20;

<br>
# Charms

Charms are represented as metadata written onto Bitcoin transactions as inscriptions. This metadata maps information to each one of the transaction’s outputs, allowing these pieces of information to be owned in the same sense that a Bitcoin UTXO is owned by some wallet’s keys. Charms, therefore, use the same ownership model as Bitcoin, and rely on Bitcoin’s security and consensus mechanism.&#x20;

Charms come in two flavors: non-fungible tokens (NFT) and fungible tokens. An NFT can contain any data that can practically be written to Bitcoin, while fungible tokens only contain amounts. The simplest charm is a fungible token, for which the total amount in each transaction’s inputs is equal to the total amount in the transaction’s outputs, thus maintaining a constant supply.&#x20;

Each charm is associated with a specific program, called zk-app, which enforces constraints on the ways metadata can be manipulated. zk-apps, plus the ability of different charms to interact in interesting ways, allow developers to implement any conceivable behavior.&#x20;

A transaction that contains charms as inputs or outputs we call a “spell”. The distinction between charms (tokens) and spells (operations on tokens) is critical for our understanding of how charms work. Let’s examine a spell from two perspectives, a “physical” perspective in which we look at the Bitcoin transaction containing the spell, and a logical perspective in which we look at the metadata and how it is interpreted.&#x20;

![](https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FGqupKYy25kIMuvuFjaOh%2Fimage.png?alt=media\&token=af161cd9-2667-4a9d-ba43-0798a081558b)\
\
Each spell contains two Bitcoin transactions, the spell itself, and a commitment transaction that precedes it. The commitment transaction receives BTC (1 in the diagram) for the transaction’s fees, as well as BTC needed to fund the spell’s outputs, since every output has to contain at least 546 satoshis (dust limit). The commitment transaction’s output (2 in the diagram) has a taproot address that allows the spending input to specify a spending script which contains the inscription. The inscription is encoded as binary data in CBOR format, and is encapsulated in the script between OP\_FALSE, OP\_IF and OP\_ENDIF instructions so that it is ignored when running the script. This allows arbitrary data to be encoded into the transaction. The spell transaction also has additional inputs and outputs (3 and 4 in the diagram), and a change output (5 in the diagram) which allows redundant BTC to be returned to the user’s wallet after deducting the transaction fee.&#x20;

A Logical Perspective&#x20;

Each spell can contain multiple zk-apps. A zk-app is a program, identified as a string of the form: \<n|t>/\<app\_id>/\<app\_vk>, where the first character is either ‘n’ for an NFT or ‘t’ for a fungible token. app\_id is an arbitrary 32-byte hex string. For the sake of uniqueness, it is recommended for app\_id be the SHA256 digest of the incoming output that funds the spell. app\_vk is the verification key, and is the SHA256 digest of the zk-app compiled binary. This distinction allows forming multiple charms of the same zk-app (by having a unique app\_id for each one), or multiple charms with the same app\_id that have different zk-apps associated with them.&#x20;

A spell can have multiple outputs, where each output contains multiple charms with different IDs. For each NFT, an object can be associated with each output. Fungible tokens have only amounts associated with each output.&#x20;

A typical pattern, which can be described as the simplest useful application of charms, would be an NFT/fungible token pair. The NFT metadata describes the pair by providing a name and icon. Ownership of the NFT allows its owner to mint new batches of the fungible token. A transaction of this application would look like this:&#x20;

![](https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FbFq0d44VdDxLemlHHUNp%2Fimage.png?alt=media\&token=5ef00b06-330c-499d-b9c3-a7cac64f86e9)\
\
In this example, the owner of an NFT performs a transaction that transmits the NFT charm from an address in his wallet to a different address in his wallet, while also producing a fungible token with the same app\_id and app\_vk. The zk-app must verify that the amount of fungible tokens in the output is allowed to exceed the number of tokens in the inputs only if one of the inputs contains the NFT token, thus enforcing the owner’s minting privilege.

A subsequent transferal of tokens minted in this way would look like this:

![](https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FSYIn7wzPvZpWkhna4Qw9%2Fimage.png?alt=media\&token=de9b5e70-bde7-4714-b41e-4c71fd2cf9f6)<br>

In this example, the transaction has multiple inputs containing the fungible token, and two outputs, one where the tokens are to be sent, and the other a change output, returning the rest of the token back to the sender’s wallet.&#x20;

Proofs and Recursion&#x20;

A zk-app is a program, expressed in any high level language and compiled to WASM. The program receives an object describing a spell as its input, and either allows or forbids the transaction. If the program approves it, the Charms SDK will generate the required transaction, calculate a GROTH16 SNARK proof and embed the proof into the binary object included in the inscription. Each transaction can have inputs that also contain charms, and their proofs are “folded” into the current proof using recursive ZKP techniques. In this way it can be assured that a spell is only valid if all of its preceding spells are also valid.&#x20;

In order to verify the validity of a spell, it is therefore not necessary to traverse the graph backwards all the way to the originating transduction - the validity of a transaction history is included in the proof itself.&#x20;

A spell with an invalid proof is treated as non-existent by the wallet and all related software. In this way, if a spell is generated that violates the constraints defined by zk-app, the tokens involved in that transaction simply cease to exist. This gives a strong incentive to participants in the protocol to generate only permitted spells.&#x20;

Limitations of the Ownership Model&#x20;

Since Bitcoin lacks the ability to verify SNARK proofs on-chain, invalid spells can be created and mined. The incentive to avoid this lies in the fact that any operations that violate the constraints of the zk-app result in the tokens involved ceasing to exist so that cheating means losing funds.. This loss in itself is a strong incentive to behave honestly, and is in addition to losing the dust required for the tx, which acts as a spam control for the entire system.&#x20;

This limitation prevents certain smart contracts from being implemented using charms alone. Grail Pro allows this problem to be overcome efficiently, by providing a “Grail address” that is owned by the network and can only be spent according to the constraints of the zk-app, thus making Charms a complete platform for general purpose smart contracts.
# Charms Development Integration

Charms Development Integration

For building custom apps on Charms (integrated with Grail Pro for zkBTC), use the open-source Charms repository:

\- Install CLI: \`cargo install --locked Charms\`

\- Create App: \`Charms app new my-token\`

\
This enables programmable tokens/NFTs with app state, using spells in Taproot witnesses.

<br>
# Grail Pro

Grail Pro is designed to allow the execution of general purpose smart contracts on the Bitcoin blockchain, including (but not limited to) those that require programmable BTC. For example, Grail Pro allows Uniswap or Aave-like smart contracts that depend on pooling user funds and&#x20;

allows smart contracts that are multi-party and not just bi-lateral. Grail Pro allows BTC to become programmable by creating BTC charms (zkBTC). It consists of a network of operators, each running within a trusted execution environment (TEE). The operators perform the following functions:&#x20;

Roster Management&#x20;

The operators maintain a global roster of operators that is kept synchronized by exchanging state messages over an authenticated P2P network. Each operator is identified by its public key, which is associated with a specific snapshot of application code, configuration and operating system using a cryptography attestation. This ensures that only operators with the expected code can be included in the roster.&#x20;

Each operator keeps a Schnorr keypair, allowing it to sign outgoing messages and taproot transactions.&#x20;

MPC Signing&#x20;

The operators maintain a “Grail address”, which is a taproot address that can only be spent by providing a quorum of 12 signatures. This address can be used to lock BTC, as well as charms, in such a way that they can only be spent according to the constraints of the specific zk-app. This is enforced using MPC and advanced taproot techniques. Each operator receives signature requests and signs them only if an appropriate ZKP is provided that assures that the constraints of the zk-app are met.&#x20;

Secure Persistence&#x20;

The operators maintain an encrypted key-value storage. Access is vetted using cryptographic attestation. This is used to provide operators with encrypted persistence so that they keep their identity. User wallets can back-up their keys and restore them using the attestation capabilities of biometric authentication devices.&#x20;

A protocol designed for this purpose (ESSR) is used to allow only parties with valid credentials to decrypt the value in the keystore. The protocol uses HPKE to encrypt the secrets both at-rest and in-flight. Credentials can be either cryptographic TEE attestations or Passkeys for biometric authentication.&#x20;

Trusted Execution Environments&#x20;

Grail Pro currently runs inside AWS Nitro enclaves. The enclave generates a key-pair randomly at startup and maintains the same key throughout its existence.

Enclaves are organized in clusters, where each cluster is considered an independent operator identified by a single key-pair. Enclaves in a cluster are deployed on different availability zones, and thus back each other up in case of outage. The following diagram shows how enclaves are arranged in clusters, each cluster acting as an independent operator and communicating with the rest of the operators over an authenticated P2P network.&#x20;

![](https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2FXJXdJfnZF0P2TymigR6R%2Fimage.png?alt=media\&token=5c9b31cf-4efa-4cf1-953d-4097709f2ebe)

\ <br>
# Grail Pro - Institutional Integration

Grail Pro allows custodians a unique opportunity to become a part of the Grail Pro network by running their own operator node. This allows custodians to integrate their own system with their operator node, in order to achieve fine-grained control over the BTC release policy.&#x20;

This allows, for example:&#x20;

● A custodian can stay in control of BTC locked by itself or by its customers&#x20;

● BTC locked in this way can be seen as never having left the custodian’s wallet&#x20;

● The policy allows for a 1 of N security assumption, in the sense that by running an&#x20;

operator node a custodian can prevent other nodes from releasing locked BTC unduly even if the majority of the network becomes compromised

\
\ <br>
# Backend API Integration

Authentication: Obtain a JWT token via a secure login service to identify the user.  The token is used to identify the user to the back-end.

Key APIs:

#### Transaction API Requests

POST /api/v1/peg-in\
Request body:&#x20;

{\
&#x20; "wallet\_address": "\<user\_wallet\_address>",\
&#x20; "amount": "\<amount>",\
&#x20; "recovery\_key": "\<recovery\_key>",\
&#x20; "transaction\_type": "peg-in"\
}

**Response body:**

{\
&#x20; "status": "success",\
&#x20; "taproot\_address": "\<taproot\_address>"\
}

#### Cosigner State API Request

GET /api/v1/cosigners/state

**Response:**

{\
&#x20; "cosigners": \[\
&#x20;   {\
&#x20;     "public\_key": "\<public\_key>",\
&#x20;     "attestation": "\<attestation\_document>"\
&#x20;   }\
&#x20; ],\
&#x20; "aggregation\_strategy": "\<strategy\_description>"\
}

<br>
# Running Your Own Backend and Frontend

**Backend Deployment**

&#x20; -Clone Repository&#x20;

&#x20; -Install and Run

cd backend\
npm install\
npm start

**Frontend Customization**

&#x20; \- Customize and Build:&#x20;

* cd frontend\
  npm install\
  npm run build

&#x20; \- Deploy the application.

<br>
# Grail Pro - System Architecture

**System Architecture**

Grail Pro comprises three main components: operators, backend, and frontend, forming a trustless workflow where frontend initiates requests, backend processes and validates with ZK-proofs, and operators approve via secure hardware.

**Operator**

Description: A cloud-based or on-premise machine running in a secure execution environment (e.g., AWS Nitro Enclave, HSM, or other TEEs) to review and sign ZK-proof-backed requests.

Security: Cryptographic attestations (produced by the TEE provider) enforce platform and application code correctness; internal keys are generated and protected within the TEE, with messages signed for authenticity. Secrets never leave the environment. The system uses an m-of-n multisig (e.g., 12-of-16 threshold) to eliminate single points of failure—requiring at least 12 independently operated operators to be compromised for loss of service or funds.

Functionality: Receives signing requests backed by SNARKs (Succinct Non-interactive Arguments of Knowledge), verifying them against predefined rule-based strategies before signing. Supports roster management for adding/removing operators and updating thresholds.

Advanced Features: Operators can clone TEEs using a shared cloning secret for persistence across availability zones, creating clusters without exposing private keys. Cloning involves secure key transfer between identical TEE snapshots. Integration with zkVMs allows recursive proofs for efficient validation, ensuring compliance with app contracts (e.g., for zkBTC minting).
# Backend

Design: A horizontally scalable, trustless service employing a decentralized queue-based architecture for processing tasks in an orderly manner.

Tasks: Scans integrated blockchains for relevant transactions, stores them in a dedicated database (without secrets or personally identifiable information), generates ZK-proofs (using schemes like Groth16), and handles transaction formation, validation, tracking, and error management via HTTP API endpoints.

Workflow: Detects payments, creates bridging transactions (e.g., locking BTC to mint zkBTC or burning zkBTC to release BTC), and forwards unsigned transactions to operators via a simple message broker. Collects signatures and publishes once the threshold is met. Supports complex transactions with multiple inputs/outputs for batching user payments.

<br>
# Front End

Role: Provides a user-friendly interface for managing transaction flows, sign-offs, and real-time tracking within the Grail ecosystem. Integrates with users' blockchain wallets.

Trust Model: Users trust the frontend due to custodian branding, audited open-source code, and simplicity. It queries operators for public keys to generate Taproot deposit addresses with timelocks for refunds.

<br>
# Grail Pro - Operational Workflows

Please find the sections outlining the operational work flows of the key components of the Grail Pro system.&#x20;

# Running an Operator

**Running an Operator**

**Prerequisites:**&#x20;

* AWS Nitro Enclave-compatible infrastructure and a Docker environment.
* Docker environment

**Steps:**&#x20;

1. AWS Nitro Enclave Setup:&#x20;

* Configure environment and secure communications

2. Deploy Cosigner Container:

* docker run -d --env-file .env grailpro/cosigner:latest<br>

3. Key Management and Attestation:

* Generate cryptographic attestation using included CLI tools and register cosigner with the network

# Bridging Workflow (BTC <> zkBTC)

Process: (Full Flow for Bridging BTC and zkBTC):

&#x20; 1\. The user, via the frontend, queries operators for the current roster's public keys and generates a Taproot deposit address (spendable by multisig or user refund after timelock).

&#x20; 2\. The address is submitted to the backend (which can be operator-run; users don't need to trust it as they can perform actions themselves).

&#x20; 3\. Backend detects payment, creates a bridging transaction: for BTC to zkBTC, it locks BTC in multisig and mints zkBTC; for zkBTC to BTC, it burns zkBTC and releases BTC.

&#x20; 4\. Backend sends unsigned transactions to all operators via the message broker.

&#x20; 5\. Operators verify (including ZK-proofs for app contract satisfaction) and return signatures.

&#x20; 6\. Backend aggregates signatures and publishes the transaction upon threshold.

<br>
# Peg-in & Peg-out Transaction Flows

Peg-in: Securely locks Bitcoin in a vault to atomically mint Charms tokens (e.g., zkBTC), using a unique frontend-generated Taproot address with dynamic scripts for signing conditions and recovery transactions.

Peg-out: Burns Charms tokens to retrieve Bitcoin from the vault.

Execution: Users send funds; backend detects/validates incoming transactions, generates required ZK-proofs, and submits for operator approval. Funds/assets are delivered directly to the user's wallet. Supports beaming for cross-chain transfers without wrappers.

<br>

<br>
# zkBTC

In order to provide a gateway to the ecosystem of decentralized applications made possible by Grail Pro and Charms, a token must be provided that has real-world value by locking BTC in the Grail Pro vault and allowing anybody to redeem this token for BTC in a trustless fashion without relying on counter-parties or liquidity providers.

To this end, we created zkBTC, a token pegged to BTC, that can be issued on Bitcoin mainnet (programmable BTC on Bitcoin) and is transferable to other chains.&#x20;

zkBTC can be “pegged-in” by locking BTC in a Grail Pro vault and minting zkBTC in equal amounts, or “pegged-out” by burning zkBTC and redeeming BTC from the vault.&#x20;

Logical View of a Typical Transaction&#x20;

A Grail Pro transduction that performs these operations will typically look like this:&#x20;

<figure><img src="https://2269990358-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FW6CEFSda0QSwAjuZe0uJ%2Fuploads%2Fd112UbSaiRQ7rVdgsiq6%2Fimage.png?alt=media&#x26;token=4ed7aa4e-c397-40b0-a9ad-f9694137ef0d" alt=""><figcaption></figcaption></figure>

In this diagram crossed circles represent the Grail vault, and small circles represent user wallets. N represents the zkBTC NFT, T represents the fungible token, and B represents BTC.&#x20;

Dotted box 1 shows the zkBTC NFT, which is controlled by Grail Pro. Minting of zkBTC is only allowed to the owner of the NFT, thus allowing Grail Pro to maintain the total supply of zkBTC at exactly 1:1 ratio with the amount of locked BTC.&#x20;

Dotted box 2 shows a peg-in transaction, where a user sends BTC from his wallet and receives the same amount of zkBTC. The BTC is then sent to the Grail vault, locking it for later peg-out transactions.&#x20;

Dotted box 3 shows a peg-out transaction, where a user sends his zkBTC token to be burned. An equal amount of BTC is taken from the vault and sent to the user’s wallet.&#x20;

Every Grail Pro transaction can have multiple peg-in and peg-out transactions at once, thus batching together multiple user operations for the sake of efficiency and cost reduction.&#x20;

\ <br>
# Conclusions

Bitcoin OS represents a paradigm shift: from Bitcoin as passive digital gold to Bitcoin as the foundation for a programmable financial operating system. By combining Charms, Grail Pro, and zkBTC, we unlock a future where Bitcoin supports complex decentralized applications without trusted intermediaries, without wrapped tokens, and without compromise.
# LINKS

BitcoinOS is the operating system capable of compiling any code and any VM to Bitcoin. Our breakthroughs in the use of ZK proofs allow us to embed any computation directly into Bitcoin transactions. Developers are using this to build everything from trustless bridges to true Bitcoin L2s, native private transactions, and fully programmable tokens on Bitcoin.

[Manifesto](https://www.bitcoinos.build/blog/bitcoinos-the-ultimate-upgrade-to-bitcoin)

[Website](https://www.bitcoinos.build/)&#x20;

[Twitter/X](https://x.com/BTC_OS)

[Blog](https://www.bitcoinos.build/blog)&#x20;

[Official link to Our BitSNARK Verification on Bitcoin Mainnet](https://x.com/BTC_OS/status/1816180788938870815)

[Whitepaper](https://assets-global.website-files.com/661e3b1622f7c56970b07a4c/662a7a89ce097389c876db57_BitSNARK__Grail.pdf)

[Github repo for BitSNARK](https://github.com/bitsnark/bitsnark-lib)

[BitSNARK Open Source Announcement Post](https://www.bitcoinos.build/blog/bitcoinos-open-sourcing-the-bitsnark-verification-protocol)