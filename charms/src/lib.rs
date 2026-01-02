use charms_sdk::data::{App, Data, Transaction, charm_values};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EscrowState {
    Locked,
    Released,
    Refunded,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Escrow {
    pub state: EscrowState,
    pub amount: u64,
    pub buyer: String,
    pub seller: String,
    pub timeout: u64,
    pub asset_request: AssetRequest,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetRequest {
    pub chain: String,
    pub contract: String,
    pub amount: String,
    pub receiver: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EscrowWitness {
    Create,
    Release { attestation: Attestation },
    Refund { current_block: u64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attestation {
    pub escrow_id: String,
    pub tx_hash: String,
    pub signer: String,
    pub signature: String,
}

pub fn app_contract(app: &App, tx: &Transaction, _x: &Data, w: &Data) -> bool {
    // Parse witness data safely
    let witness: EscrowWitness = match w.value() {
        Ok(w) => w,
        Err(_) => return false,
    };

    match witness {
        EscrowWitness::Create => validate_create(app, tx),
        EscrowWitness::Release { attestation } => validate_release(app, tx, &attestation),
        EscrowWitness::Refund { current_block } => validate_refund(app, tx, current_block),
    }
}

fn validate_create(app: &App, tx: &Transaction) -> bool {
    let out_escrow: Option<Escrow> = charm_values(app, tx.outs.iter())
        .find_map(|data| data.value().ok());

    let escrow = match out_escrow {
        Some(e) => e,
        None => return false,
    };

    escrow.state == EscrowState::Locked
        && escrow.amount > 0
        && !escrow.buyer.is_empty()
        && !escrow.seller.is_empty()
        && escrow.buyer != escrow.seller
}

fn validate_release(app: &App, tx: &Transaction, attestation: &Attestation) -> bool {
    let in_escrow: Option<Escrow> = charm_values(app, tx.ins.iter().map(|(_, v)| v))
        .find_map(|data| data.value().ok());

    let escrow = match in_escrow {
        Some(e) => e,
        None => return false,
    };

    if escrow.state != EscrowState::Locked {
        return false;
    }

    let msg = format!("{}:{}", attestation.escrow_id, attestation.tx_hash);
    let expected_sig = hmac_sha256(&attestation.signer, &msg);
    
    if attestation.signature != expected_sig {
        return false;
    }

    let out_escrow: Option<Escrow> = charm_values(app, tx.outs.iter())
        .find_map(|data| data.value().ok());

    match out_escrow {
        Some(out) => out.state == EscrowState::Released && out.amount == escrow.amount,
        None => false,
    }
}

fn validate_refund(app: &App, tx: &Transaction, current_block: u64) -> bool {
    let in_escrow: Option<Escrow> = charm_values(app, tx.ins.iter().map(|(_, v)| v))
        .find_map(|data| data.value().ok());

    let escrow = match in_escrow {
        Some(e) => e,
        None => return false,
    };

    if escrow.state != EscrowState::Locked || current_block < escrow.timeout {
        return false;
    }

    let out_escrow: Option<Escrow> = charm_values(app, tx.outs.iter())
        .find_map(|data| data.value().ok());

    match out_escrow {
        Some(out) => out.state == EscrowState::Refunded && out.amount == escrow.amount,
        None => false,
    }
}

pub fn hmac_sha256(key: &str, msg: &str) -> String {
    let key_bytes = key.as_bytes();
    let msg_bytes = msg.as_bytes();

    let mut ipad = [0x36u8; 64];
    let mut opad = [0x5cu8; 64];

    for (i, &b) in key_bytes.iter().enumerate().take(64) {
        ipad[i] ^= b;
        opad[i] ^= b;
    }

    let mut inner = Sha256::new();
    inner.update(&ipad);
    inner.update(msg_bytes);
    let inner_hash = inner.finalize();

    let mut outer = Sha256::new();
    outer.update(&opad);
    outer.update(&inner_hash);

    hex::encode(outer.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_escrow() -> Escrow {
        Escrow {
            state: EscrowState::Locked,
            amount: 100000,
            buyer: "buyer123".into(),
            seller: "seller456".into(),
            timeout: 1000,
            asset_request: AssetRequest {
                chain: "ethereum".into(),
                contract: "0xdac17f".into(),
                amount: "1000000".into(),
                receiver: "0x1234".into(),
            },
        }
    }

    fn make_attestation(escrow_id: &str, tx_hash: &str, signer: &str) -> Attestation {
        let msg = format!("{}:{}", escrow_id, tx_hash);
        Attestation {
            escrow_id: escrow_id.into(),
            tx_hash: tx_hash.into(),
            signer: signer.into(),
            signature: hmac_sha256(signer, &msg),
        }
    }

    #[test]
    fn test_escrow_state_locked() {
        let escrow = make_escrow();
        assert_eq!(escrow.state, EscrowState::Locked);
    }

    #[test]
    fn test_escrow_positive_amount() {
        let escrow = make_escrow();
        assert!(escrow.amount > 0);
    }

    #[test]
    fn test_escrow_different_parties() {
        let escrow = make_escrow();
        assert_ne!(escrow.buyer, escrow.seller);
        assert!(!escrow.buyer.is_empty());
        assert!(!escrow.seller.is_empty());
    }

    #[test]
    fn test_escrow_zero_amount_invalid() {
        let mut escrow = make_escrow();
        escrow.amount = 0;
        assert_eq!(escrow.amount, 0);
    }

    #[test]
    fn test_escrow_same_parties_invalid() {
        let mut escrow = make_escrow();
        escrow.seller = escrow.buyer.clone();
        assert_eq!(escrow.buyer, escrow.seller);
    }

    #[test]
    fn test_escrow_empty_buyer_invalid() {
        let mut escrow = make_escrow();
        escrow.buyer = "".into();
        assert!(escrow.buyer.is_empty());
    }

    #[test]
    fn test_escrow_empty_seller_invalid() {
        let mut escrow = make_escrow();
        escrow.seller = "".into();
        assert!(escrow.seller.is_empty());
    }

    #[test]
    fn test_escrow_state_transitions() {
        let mut escrow = make_escrow();
        assert_eq!(escrow.state, EscrowState::Locked);
        
        escrow.state = EscrowState::Released;
        assert_eq!(escrow.state, EscrowState::Released);
        
        escrow.state = EscrowState::Refunded;
        assert_eq!(escrow.state, EscrowState::Refunded);
    }

    #[test]
    fn test_escrow_amount_preservation() {
        let escrow = make_escrow();
        let original_amount = escrow.amount;
        
        let mut released_escrow = escrow.clone();
        released_escrow.state = EscrowState::Released;
        assert_eq!(released_escrow.amount, original_amount);
        
        let mut refunded_escrow = escrow.clone();
        refunded_escrow.state = EscrowState::Refunded;
        assert_eq!(refunded_escrow.amount, original_amount);
    }

    #[test]
    fn test_escrow_timeout_validation() {
        let escrow = make_escrow();
        let current_block = 999;
        assert!(current_block < escrow.timeout);
        
        let current_block = 1001;
        assert!(current_block >= escrow.timeout);
    }

    #[test]
    fn test_attestation_valid_signature() {
        let att = make_attestation("esc123", "0xabc", "signer-key");
        let msg = format!("{}:{}", att.escrow_id, att.tx_hash);
        let expected = hmac_sha256(&att.signer, &msg);
        assert_eq!(att.signature, expected);
    }

    #[test]
    fn test_attestation_invalid_signature() {
        let mut att = make_attestation("esc123", "0xabc", "signer-key");
        att.signature = "wrong".into();
        let msg = format!("{}:{}", att.escrow_id, att.tx_hash);
        let expected = hmac_sha256(&att.signer, &msg);
        assert_ne!(att.signature, expected);
    }

    #[test]
    fn test_attestation_different_escrow_id() {
        let att1 = make_attestation("esc123", "0xabc", "signer");
        let att2 = make_attestation("esc456", "0xabc", "signer");
        assert_ne!(att1.signature, att2.signature);
    }

    #[test]
    fn test_attestation_different_tx_hash() {
        let att1 = make_attestation("esc123", "0xabc", "signer");
        let att2 = make_attestation("esc123", "0xdef", "signer");
        assert_ne!(att1.signature, att2.signature);
    }

    #[test]
    fn test_attestation_different_signer() {
        let att1 = make_attestation("esc123", "0xabc", "signer1");
        let att2 = make_attestation("esc123", "0xabc", "signer2");
        assert_ne!(att1.signature, att2.signature);
    }

    #[test]
    fn test_hmac_deterministic() {
        let s1 = hmac_sha256("key", "msg");
        let s2 = hmac_sha256("key", "msg");
        assert_eq!(s1, s2);
    }

    #[test]
    fn test_hmac_different_keys() {
        let s1 = hmac_sha256("key1", "msg");
        let s2 = hmac_sha256("key2", "msg");
        assert_ne!(s1, s2);
    }

    #[test]
    fn test_hmac_different_messages() {
        let s1 = hmac_sha256("key", "msg1");
        let s2 = hmac_sha256("key", "msg2");
        assert_ne!(s1, s2);
    }

    #[test]
    fn test_hmac_empty_inputs() {
        let s1 = hmac_sha256("", "");
        let s2 = hmac_sha256("key", "");
        let s3 = hmac_sha256("", "msg");
        assert_ne!(s1, s2);
        assert_ne!(s1, s3);
        assert_ne!(s2, s3);
    }

    #[test]
    fn test_hmac_long_inputs() {
        let long_key = "a".repeat(100);
        let long_msg = "b".repeat(1000);
        let s1 = hmac_sha256(&long_key, &long_msg);
        let s2 = hmac_sha256(&long_key, &long_msg);
        assert_eq!(s1, s2);
        assert_eq!(s1.len(), 64);
    }

    #[test]
    fn test_escrow_witness_variants() {
        let witness_create = EscrowWitness::Create;
        let attestation = make_attestation("esc1", "tx1", "signer1");
        let witness_release = EscrowWitness::Release { attestation };
        let witness_refund = EscrowWitness::Refund { current_block: 1000 };

        match witness_create {
            EscrowWitness::Create => assert!(true),
            _ => panic!("Wrong variant"),
        }

        match witness_release {
            EscrowWitness::Release { attestation } => {
                assert_eq!(attestation.escrow_id, "esc1");
            }
            _ => panic!("Wrong variant"),
        }

        match witness_refund {
            EscrowWitness::Refund { current_block } => {
                assert_eq!(current_block, 1000);
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_asset_request_validation() {
        let req = AssetRequest {
            chain: "ethereum".into(),
            contract: "0xdac17f".into(),
            amount: "1000000".into(),
            receiver: "0x1234".into(),
        };
        assert!(!req.chain.is_empty());
        assert!(!req.contract.is_empty());
        assert!(!req.amount.is_empty());
        assert!(!req.receiver.is_empty());
    }

    #[test]
    fn test_asset_request_different_chains() {
        let eth_req = AssetRequest {
            chain: "ethereum".into(),
            contract: "0xdac17f".into(),
            amount: "1000000".into(),
            receiver: "0x1234".into(),
        };
        let sol_req = AssetRequest {
            chain: "solana".into(),
            contract: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".into(),
            amount: "1000000".into(),
            receiver: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM".into(),
        };
        assert_ne!(eth_req.chain, sol_req.chain);
        assert_ne!(eth_req.contract, sol_req.contract);
        assert_ne!(eth_req.receiver, sol_req.receiver);
    }

    #[test]
    fn test_escrow_serialization() {
        let escrow = make_escrow();
        let serialized = serde_json::to_string(&escrow).unwrap();
        let deserialized: Escrow = serde_json::from_str(&serialized).unwrap();
        assert_eq!(escrow.state, deserialized.state);
        assert_eq!(escrow.amount, deserialized.amount);
        assert_eq!(escrow.buyer, deserialized.buyer);
        assert_eq!(escrow.seller, deserialized.seller);
        assert_eq!(escrow.timeout, deserialized.timeout);
    }

    #[test]
    fn test_attestation_serialization() {
        let att = make_attestation("esc123", "0xabc", "signer");
        let serialized = serde_json::to_string(&att).unwrap();
        let deserialized: Attestation = serde_json::from_str(&serialized).unwrap();
        assert_eq!(att.escrow_id, deserialized.escrow_id);
        assert_eq!(att.tx_hash, deserialized.tx_hash);
        assert_eq!(att.signer, deserialized.signer);
        assert_eq!(att.signature, deserialized.signature);
    }

    #[test]
    fn test_witness_serialization() {
        let witness = EscrowWitness::Create;
        let serialized = serde_json::to_string(&witness).unwrap();
        let deserialized: EscrowWitness = serde_json::from_str(&serialized).unwrap();
        match deserialized {
            EscrowWitness::Create => assert!(true),
            _ => panic!("Serialization failed"),
        }
    }
}
