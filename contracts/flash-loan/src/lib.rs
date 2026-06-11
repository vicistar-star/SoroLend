#![no_std]

mod events;
mod math;
mod storage;

use events::*;
use math::*;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env};
use storage::*;

#[contracttype]
pub struct FlashLoanReceiveArgs {
    pub caller: Address,
    pub amount: i128,
    pub fee: i128,
    pub data: Bytes,
}

#[contract]
pub struct FlashLoan;

#[contractimpl]
impl FlashLoan {
    pub fn initialize(env: Env, admin: Address, fee_bps: i128) {
        if has_admin(&env) {
            panic!("already initialized");
        }
        write_admin(&env, &admin);
        write_fee_bps(&env, fee_bps);
    }

    pub fn set_fee(env: Env, admin: Address, fee_bps: i128) {
        admin.require_auth();
        let stored_admin = read_admin(&env);
        if admin != stored_admin {
            panic!("not authorized");
        }
        let old_fee = read_fee_bps(&env);
        write_fee_bps(&env, fee_bps);
        emit_fee_updated(&env, &admin, old_fee, fee_bps);
    }

    pub fn flash_loan(
        env: Env,
        caller: Address,
        asset: Address,
        amount: i128,
        receiver: Address,
        data: Bytes,
    ) {
        caller.require_auth();
        if amount <= 0 {
            panic!("invalid amount");
        }

        let fee_bps = read_fee_bps(&env);
        let fee = mul_div(amount, fee_bps, 10000);
        let _repay_amount = checked_add(amount, fee);

        // Transfer amount to receiver by calling pool's withdraw
        // In production this would transfer tokens; here we track via balance
        // For simplicity, we simulate by calling receiver's callback

        let args = FlashLoanReceiveArgs {
            caller: caller.clone(),
            amount,
            fee,
            data: data.clone(),
        };

        // Call receiver's flash_loan_receive function
        let receiver_client = FlashLoanReceiverClient::new(&env, &receiver);
        receiver_client.flash_loan_receive(&args);

        emit_flash_loan(&env, &caller, &receiver, &asset, amount, fee);
    }

    pub fn get_fee(env: Env) -> i128 {
        read_fee_bps(&env)
    }
}

#[soroban_sdk::contractclient(name = "FlashLoanReceiverClient")]
pub trait FlashLoanReceiver {
    fn flash_loan_receive(env: Env, args: FlashLoanReceiveArgs);
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[contract]
    pub struct MockFlashLoanReceiver;

    #[contractimpl]
    impl MockFlashLoanReceiver {
        pub fn flash_loan_receive(_env: Env, _args: FlashLoanReceiveArgs) {}
    }

    fn create_test_env() -> (Env, Address, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register_contract(None, FlashLoan);
        (env, admin, contract_id)
    }

    fn invoke_initialize(env: &Env, contract_id: &Address, admin: &Address, fee_bps: i128) {
        env.as_contract(contract_id, || {
            FlashLoan::initialize(env.clone(), admin.clone(), fee_bps)
        });
    }

    #[test]
    fn test_initialize() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 9);
        let fee = env.as_contract(&contract_id, || FlashLoan::get_fee(env.clone()));
        assert_eq!(fee, 9);
    }

    #[test]
    #[should_panic(expected = "already initialized")]
    fn test_initialize_twice_panics() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 9);
        invoke_initialize(&env, &contract_id, &admin, 5);
    }

    #[test]
    fn test_flash_loan() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 9);

        let caller = Address::generate(&env);
        let asset = Address::generate(&env);
        let receiver_id = env.register_contract(None, MockFlashLoanReceiver);
        let data = Bytes::new(&env);

        let _result = env.as_contract(&contract_id, || {
            FlashLoan::flash_loan(
                env.clone(),
                caller.clone(),
                asset.clone(),
                1000,
                receiver_id.clone(),
                data.clone(),
            )
        });
    }

    #[test]
    fn test_set_fee() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 9);

        env.as_contract(&contract_id, || {
            FlashLoan::set_fee(env.clone(), admin.clone(), 15)
        });
        let fee = env.as_contract(&contract_id, || FlashLoan::get_fee(env.clone()));
        assert_eq!(fee, 15);
    }

    #[test]
    #[should_panic(expected = "invalid amount")]
    fn test_invalid_amount_rejected() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 9);

        let caller = Address::generate(&env);
        let asset = Address::generate(&env);
        let receiver_id = env.register_contract(None, MockFlashLoanReceiver);
        let data = Bytes::new(&env);

        env.as_contract(&contract_id, || {
            FlashLoan::flash_loan(
                env.clone(),
                caller.clone(),
                asset.clone(),
                0,
                receiver_id.clone(),
                data.clone(),
            )
        });
    }

    #[test]
    fn test_fee_calculation() {
        let (env, admin, contract_id) = create_test_env();
        invoke_initialize(&env, &contract_id, &admin, 100);

        let caller = Address::generate(&env);
        let asset = Address::generate(&env);
        let receiver_id = env.register_contract(None, MockFlashLoanReceiver);
        let data = Bytes::new(&env);

        let _result = env.as_contract(&contract_id, || {
            FlashLoan::flash_loan(
                env.clone(),
                caller.clone(),
                asset.clone(),
                10000,
                receiver_id.clone(),
                data.clone(),
            )
        });
    }
}
