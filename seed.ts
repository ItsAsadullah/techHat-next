import { initializeSystemAccounts, seedPartnersAndDeposits } from './lib/actions/accounting-setup-actions';

async function main() {
  console.log('Initializing system accounts...');
  const res1 = await initializeSystemAccounts();
  console.log(res1);
  
  console.log('Seeding partners and deposits...');
  const res2 = await seedPartnersAndDeposits();
  console.log(res2);
}

main().catch(console.error);
