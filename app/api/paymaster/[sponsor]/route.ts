import { createPaymasterClient } from '../client';

export async function POST(request: Request, { params }: { params: Promise<{ sponsor: string }> }) {
  const req = await request.json();
  const { sponsor } = await params;

  if (req.method === 'pm_getPaymasterStubData') {
    const userOperation = req.params[0];
    const entryPointAddress = req.params[1];
    const chainId = req.params[2];
    const paymasterClient = createPaymasterClient(chainId);
    const res = await paymasterClient.getPaymasterStubData({ ...userOperation, entryPointAddress, chainId });
    return Response.json({ result: { ...res, sponsor: { name: sponsor } } });
  } else if (req.method === 'pm_getPaymasterData') {
    const userOperation = req.params[0];
    const entryPointAddress = req.params[1];
    const chainId = req.params[2];
    const paymasterClient = createPaymasterClient(chainId);
    const res = await paymasterClient.getPaymasterData({ ...userOperation, entryPointAddress, chainId });
    return Response.json({ result: { ...res, sponsor: { name: sponsor } } });
  }

  return Response.json({ error: 'Invalid method' }, { status: 400 });
}
