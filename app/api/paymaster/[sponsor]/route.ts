import { createPaymasterClient } from '../client';

export async function POST(request: Request, { params }: { params: Promise<{ sponsor: string }> }) {
  try {
    const req = await request.json();
    const { sponsor } = await params;

    console.log('=== Paymaster API Request ===');
    console.log('Method:', req.method);
    console.log('Sponsor:', sponsor);
    console.log('Request body:', JSON.stringify(req, null, 2));

    if (req.method === 'pm_getPaymasterStubData') {
      const userOperation = req.params[0];
      const entryPointAddress = req.params[1];
      const chainId = req.params[2];

      console.log('pm_getPaymasterStubData params:');
      console.log('- Chain ID:', chainId);
      console.log('- Entry Point:', entryPointAddress);
      console.log('- User Op keys:', Object.keys(userOperation || {}));

      try {
        const paymasterClient = createPaymasterClient(chainId);
        console.log('Paymaster client created successfully');
        const res = await paymasterClient.getPaymasterStubData({ ...userOperation, entryPointAddress, chainId });
        console.log('Paymaster stub data response:', res);
        return Response.json({ result: { ...res, sponsor: { name: sponsor } } });
      } catch (error) {
        console.error('Paymaster stub data error:', error);
        return Response.json(
          {
            error: error instanceof Error ? error.message : 'Failed to get paymaster stub data',
          },
          { status: 500 },
        );
      }
    } else if (req.method === 'pm_getPaymasterData') {
      const userOperation = req.params[0];
      const entryPointAddress = req.params[1];
      const chainId = req.params[2];

      console.log('pm_getPaymasterData params:');
      console.log('- Chain ID:', chainId);
      console.log('- Entry Point:', entryPointAddress);
      console.log('- User Op keys:', Object.keys(userOperation || {}));

      try {
        const paymasterClient = createPaymasterClient(chainId);
        console.log('Paymaster client created successfully');
        const res = await paymasterClient.getPaymasterData({ ...userOperation, entryPointAddress, chainId });
        console.log('Paymaster data response:', res);
        return Response.json({ result: { ...res, sponsor: { name: decodeURIComponent(sponsor) } } });
      } catch (error) {
        console.error('Paymaster data error:', error);
        return Response.json(
          {
            error: error instanceof Error ? error.message : 'Failed to get paymaster data',
          },
          { status: 500 },
        );
      }
    }

    console.log('Invalid method:', req.method);
    return Response.json({ error: 'Invalid method' }, { status: 400 });
  } catch (error) {
    console.error('Paymaster API error:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
