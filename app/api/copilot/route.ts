import { streamText } from 'ai';
import { getAiModel } from '@/lib/ai/provider';
import { getChartOfAccounts } from '@/lib/actions/accounting-actions';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model: requestedModel, context } = await req.json();

    const model = await getAiModel(requestedModel || 'gemini');

    // Context processing
    const { pathname, staffRole, staffName } = context || {};

    // Base context string
    let contextStr = `
USER CONTEXT:
- Name: ${staffName || 'Unknown'}
- Role: ${staffRole || 'Unknown'}
- Current Page: ${pathname || 'Unknown'}

BUSINESS CONTEXT:
- Company Name: TechHat
- Ownership: 50/50 Partnership
- Partner A: Asadullah Al Galib
- Partner B: Bokhtiar Rahman
- All capital, investment, profits, and assets are shared exactly 50% / 50% between these two partners.
`;

    // Add Accounts if on Accounting related pages
    if (pathname?.includes('/admin/accounting') || pathname?.includes('/admin/finance')) {
      const accountsRes = await getChartOfAccounts();
      const accounts = accountsRes.success ? accountsRes.data : [];
      const accountsList = (accounts as any[]).map(a => `- ${a.name} (ID: ${a.id}, Type: ${a.type})`).join('\n');
      
      contextStr += `
DATABASE (Chart of Accounts):
${accountsList}

RULES FOR JOURNAL ENTRIES:
1. Asset & Expense: Increases are Debits, Decreases are Credits.
2. Liability, Equity, Revenue: Increases are Credits, Decreases are Debits.
`;
    }

    const systemPrompt = `You are the TechHat ERP Copilot (Enterprise Intelligence Platform).
Your goal is to act as a highly intelligent Business Copilot, Accounting Advisor, and System Assistant.

${contextStr}

SECURITY & PERMISSIONS:
- Only suggest actions that the user's Role is allowed to perform.
- Never auto-post accounting entries.

ACCOUNTING VALIDATION & PREVIEW CARD:
If the user asks you to create a journal entry, you must NEVER auto-post it. 
Instead, you must validate the entry:
1. Does Debit equal Credit?
2. Are the accounts valid based on the Chart of Accounts provided?

If you are missing information (Amount, specific Accounts, or Date), ASK the user for clarification.
DO NOT expose or print the raw Account IDs in your conversational text. Use them ONLY inside the JSON block below.

If you have ALL the information and the entry is valid, you MUST output a JSON block to generate a Journal Validation Preview Card for the user to approve:

\`\`\`json
{
  "action": "validation_preview",
  "confidence": "98%",
  "date": "YYYY-MM-DD",
  "reference": "Optional Ref",
  "notes": "Brief explanation",
  "totalDebit": 500,
  "totalCredit": 500,
  "items": [
    { "accountId": "exact-id-1", "description": "Line 1", "debit": 500, "credit": 0 },
    { "accountId": "exact-id-2", "description": "Line 2", "debit": 0, "credit": 500 }
  ]
}
\`\`\`

Wait for the user to click the "Fill Form" button on the UI (the UI handles the JSON rendering).
`;

    const result = await streamText({
      model,
      system: systemPrompt,
      messages,
      onError: (err) => {
        console.error('streamText error:', err);
      }
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('Copilot API Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Something went wrong' }), { status: 500 });
  }
}
