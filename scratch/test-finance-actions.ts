import { getIncomeStatement, getBalanceSheet } from '../lib/actions/finance-actions';

async function test() {
  console.log("Testing getIncomeStatement...");
  const res1 = await getIncomeStatement();
  console.log(JSON.stringify(res1, null, 2));

  console.log("Testing getBalanceSheet...");
  const res2 = await getBalanceSheet();
  console.log(JSON.stringify(res2, null, 2));
}

test();
