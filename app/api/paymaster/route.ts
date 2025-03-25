import { createPaymasterClient } from 'viem/account-abstraction';
import { http } from 'viem';

const paymasterClient = createPaymasterClient({
  transport: http(process.env.PAYMASTER_URL),
});

export async function POST(request: Request) {
  const req = await request.json();
  if (req.method === 'pm_getPaymasterStubData') {
    console.log('pm_getPaymasterStubData', req);
    const userOperation = req.params[0];
    const entryPointAddress = req.params[1];
    const chainId = req.params[2];
    const res = await paymasterClient.getPaymasterStubData({ ...userOperation, entryPointAddress, chainId });
    console.log('lukas res', res);
    return Response.json({ result: res });
  } else if (req.method === 'pm_getPaymasterData') {
    console.log('pm_getPaymasterData', req);
    const userOperation = req.params[0];
    const entryPointAddress = req.params[1];
    const chainId = req.params[2];
    const res = await paymasterClient.getPaymasterData({ ...userOperation, entryPointAddress, chainId });
    console.log('lukas res', res);
    return Response.json({ result: res });
  }

  return Response.json({ error: 'Invalid method' }, { status: 400 });
}
