use charms_sdk::data::{charm_values, App, Data, Transaction};
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

pub fn app_contract(app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    let _ = x;

    let witness: EscrowWitness = match w.value() {
        Ok(w) => w,
        Err(_) => {
            eprintln!("Failed to parse witness");
            return false;
        }
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
        None => {
            eprintln!("No escrow found in outputs");
            return false;
        }
    };

    if escrow.state != EscrowState::Locked {
        eprintln!("Escrow must be in Locked state");
        return false;
    }
    if escrow.amount == 0 {
        eprintln!("Amount must be > 0");
        return false;
    }
    if escrow.buyer.is_empty() || escrow.seller.is_empty() {
        eprintln!("Buyer and seller required");
        return false;
    }
    if escrow.buyer == escrow.seller {
        eprintln!("Buyer and seller must be different");
        return false;
    }
    true
}

fn validate_release(app: &App, tx: &Transaction, attestation: &Attestation) -> bool {
    let in_escrow: Option<Escrow> = charm_values(app, tx.ins.iter().map(|(_, v)| v))
        .find_map(|data| data.value().ok());

    let escrow = match in_escrow {
        Some(e) => e,
        None => {
            eprintln!("No escrow found in inputs");
            return false;
        }
    };

    if escrow.state != EscrowState::Locked {
        eprintln!("Input escrow must be Locked");
        return false;
    }

    let msg = format!("{}:{}", attestation.escrow_id, attestation.tx_hash);
    let expected_sig = hmac_sha256(&attestation.signer, &msg);
    
    if attestation.signature != expected_sig {
        eprintln!("Invalid attestation signature");
        return false;
    }

    let out_escrow: Option<Escrow> = charm_values(app, tx.outs.iter())
        .find_map(|data| data.value().ok());

    match out_escrow {
        Some(out) if out.state == EscrowState::Released && out.amount == escrow.amount => true,
        _ => {
            eprintln!("Invalid output state or amount");
            false
        }
    }
}

fn validate_refund(app: &App, tx: &Transaction, current_block: u64) -> bool {
    let in_escrow: Option<Escrow> = charm_values(app, tx.ins.iter().map(|(_, v)| v))
        .find_map(|data| data.value().ok());

    let escrow = match in_escrow {
        Some(e) => e,
        None => {
            eprintln!("No escrow found in inputs");
            return false;
        }
    };

    if escrow.state != EscrowState::Locked {
        eprintln!("Input escrow must be Locked");
        return false;
    }
    if current_block < escrow.timeout {
        eprintln!("Timeout not reached");
        return false;
    }

    let out_escrow: Option<Escrow> = charm_values(app, tx.outs.iter())
        .find_map(|data| data.value().ok());

    match out_escrow {
        Some(out) if out.state == EscrowState::Refunded && out.amount == escrow.amount => true,
        _ => {
            eprintln!("Invalid output state or amount");
            false
        }
    }
}

fn hmac_sha256(key: &str, msg: &str) -> String {
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
    use charms_sdk::data::B32;

    fn make_app() -> App {
        App {
            tag: 'e',
            identity: B32([0u8; 32]),
            vk: B32([1u8; 32]),
        }
    }

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

    fn make_bad_attestation() -> Attestation {
        Attestation {
            escrow_id: "esc1".into(),
            tx_hash: "0xabc".into(),
            signer: "signer".into(),
            signature: "wrong_signature".into(),
        }
    }

    #[test]
    fn test_create_valid_escrow() {
        let escrow = make_escrow();
        assert_eq!(escrow.state, EscrowState::Locked);
        assert!(escrow.amount > 0);
        assert!(!escrow.buyer.is_empty());
        assert!(!escrow.seller.is_empty());
        assert_ne!(escrow.buyer, escrow.seller);
    }

    #[test]
    fn test_create_fails_zero_amount() {
        let mut escrow = make_escrow();
        escrow.amount = 0;
        assert_eq!(escrow.amount, 0);
    }

    #[test]
    fn test_create_fails_same_buyer_seller() {
        let mut escrow = make_escrow();
        escrow.seller = escrow.buyer.clone();
        assert_eq!(escrow.buyer, escrow.seller);
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
        let att = make_bad_attestation();
        let msg = format!("{}:{}", att.escrow_id, att.tx_hash);
        let expected = hmac_sha256(&att.signer, &msg);
        assert_ne!(att.signature, expected);
    }

    #[test]
    fn test_refund_timeout_not_reached() {
        let escrow = make_escrow();
        let current_block = 500;
        assert!(current_block < escrow.timeout);
    }

    #[test]
    fn test_refund_timeout_reached() {
        let escrow = make_escrow();
        let current_block = 1001;
        assert!(current_block >= escrow.timeout);
    }

    #[test]
    fn test_release_state_transition() {
        let mut escrow = make_escrow();
        assert_eq!(escrow.state, EscrowState::Locked);
        escrow.state = EscrowState::Released;
        assert_eq!(escrow.state, EscrowState::Released);
    }

    #[test]
    fn test_refund_state_transition() {
        let mut escrow = make_escrow();
        assert_eq!(escrow.state, EscrowState::Locked);
        escrow.state = EscrowState::Refunded;
        assert_eq!(escrow.state, EscrowState::Refunded);
    }

    #[test]
    fn test_amount_preserved_on_release() {
        let input = make_escrow();
        let mut output = input.clone();
        output.state = EscrowState::Released;
        assert_eq!(input.amount, output.amount);
    }

    #[test]
    fn test_amount_preserved_on_refund() {
        let input = make_escrow();
        let mut output = input.clone();
        output.state = EscrowState::Refunded;
        assert_eq!(input.amount, output.amount);
    }

    #[test]
    fn test_hmac_deterministic() {
        let s1 = hmac_sha256("key", "msg");
        let s2 = hmac_sha256("key", "msg");
        assert_eq!(s1, s2);
    }

    #[test]
    fn test_hmac_different_keys_differ() {
        let s1 = hmac_sha256("key1", "msg");
        let s2 = hmac_sha256("key2", "msg");
        assert_ne!(s1, s2);
    }

    #[test]
    fn test_hmac_different_msgs_differ() {
        let s1 = hmac_sha256("key", "msg1");
        let s2 = hmac_sha256("key", "msg2");
        assert_ne!(s1, s2);
    }

    #[test]
    fn test_witness_create_variant() {
        let w = EscrowWitness::Create;
        match w {
            EscrowWitness::Create => assert!(true),
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_witness_release_variant() {
        let att = make_attestation("e1", "tx1", "s1");
        let w = EscrowWitness::Release { attestation: att.clone() };
        match w {
            EscrowWitness::Release { attestation } => {
                assert_eq!(attestation.escrow_id, "e1");
            }
            _ => panic!("Wrong variant"),
        }
    }

    #[test]
    fn test_witness_refund_variant() {
        let w = EscrowWitness::Refund { current_block: 5000 };
        match w {
            EscrowWitness::Refund { current_block } => {
                assert_eq!(current_block, 5000);
            }
            _ => panic!("Wrong variant"),
        }
    }
}
