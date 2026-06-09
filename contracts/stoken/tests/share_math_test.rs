#![cfg(test)]
use soroban_sdk::{testutils::Address as _, Address, Env};
use stoken::{SToken, STokenClient};

#[test]
fn test_share_conversion() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, SToken);
    let client = STokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let asset = Address::generate(&env);
    client.initialize(&admin, &asset);

    // Initial state: 1:1
    assert_eq!(client.convert_to_shares(&1000, &1000), 1000);
    assert_eq!(client.convert_to_assets(&1000, &1000), 1000);

    // Mint some shares
    client.mint(&Address::generate(&env), &1000);
    // Total shares = 1000
    
    // If total assets in pool = 2000 (meaning value of assets doubled due to interest)
    // convert_to_shares(assets, total_assets)
    assert_eq!(client.convert_to_shares(&1000, &2000), 500); // 1000 assets should now give 500 shares
    
    // convert_to_assets(shares, total_assets)
    assert_eq!(client.convert_to_assets(&500, &2000), 1000); // 500 shares should be worth 1000 assets
}

#[test]
fn test_mint_burn() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register_contract(None, SToken);
    let client = STokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let asset = Address::generate(&env);
    client.initialize(&admin, &asset);

    let user = Address::generate(&env);
    client.mint(&user, &1000);
    assert_eq!(client.balance_of(&user), 1000);
    assert_eq!(client.total_shares(), 1000);

    client.burn(&user, &400);
    assert_eq!(client.balance_of(&user), 600);
    assert_eq!(client.total_shares(), 600);
}
