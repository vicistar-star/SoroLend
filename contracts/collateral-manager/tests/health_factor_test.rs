#![cfg(test)]
use soroban_sdk::{testutils::Address as _, Address, Env};
use collateral_manager::{CollateralManager, CollateralManagerClient};

#[test]
fn test_health_factor() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, CollateralManager);
    let client = CollateralManagerClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let asset1 = Address::generate(&env);
    let asset2 = Address::generate(&env);

    let one = 1_000_000_000_000_000_000i128;
    let price1 = 100 * one; // $100
    let price2 = 10 * one;  // $10
    
    let threshold1 = 80 * one / 100; // 80%
    let threshold2 = 50 * one / 100; // 50%

    client.set_price(&asset1, &price1);
    client.set_price(&asset2, &price2);
    client.set_liquidation_threshold(&asset1, &threshold1);
    client.set_liquidation_threshold(&asset2, &threshold2);

    // Use smaller amounts to avoid 10^38 overflow: 1.0 and 10.0
    client.deposit_collateral(&user, &asset1, &one); // $100 value, $80 available borrow
    client.deposit_collateral(&user, &asset2, &(10 * one)); // $100 value, $50 available borrow

    // Total value = $2000
    // Total available borrow = $130
    // Wait, total value = 1*100 + 10*10 = 100 + 100 = 200
    // Available borrow = 100*0.8 + 100*0.5 = 80 + 50 = 130

    let total_borrow_usd = 100 * one; // $100 borrow
    let hf = client.get_health_factor(&user, &total_borrow_usd);

    // HF = 130 / 100 = 1.3
    assert_eq!(hf, 13 * one / 10);
}

#[test]
fn test_get_collateral_value() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, CollateralManager);
    let client = CollateralManagerClient::new(&env, &contract_id);

    let user = Address::generate(&env);
    let asset = Address::generate(&env);

    let one = 1_000_000_000_000_000_000i128;
    let price = 50 * one; // $50

    client.set_price(&asset, &price);
    client.deposit_collateral(&user, &asset, &(2 * one));

    let value = client.get_collateral_value_usd(&user);
    assert_eq!(value, 100 * one);
}
