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

pub fn app_contract(app: &App, tx: &Transaction, x: &Data, w: &Data) -> bool {
    let _ = x;

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
    fn test_attestation_valid_signature() {
        let att = make_attestation("esc123", "0xabc", "signer-key");
        let msg = format!("{}:{}", att.escrow_id, att.tx_hash);
        let expected = hmac_sha256(&att.signer, &msg);
        assert_eq!(att.signature, expected);
    }

    #[test]
    fn test_hmac_deterministic() {
        let s1 = hmac_sha256("key", "msg");
        let s2 = hmac_sha256("key", "msg");
        assert_eq!(s1, s2);
    }
}
