type RequestBody = {
  callsId: string;
};

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json();
    const { callsId } = body;

    const response = await fetch(process.env.RPC_URL as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'wallet_getCallsStatus',
        params: [callsId],
        jsonrpc: '2.0',
        id: crypto.randomUUID(),
      }),
    });

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error('Error in wallet status proxy:', error);
    return Response.json({ error: 'Failed to fetch wallet status' }, { status: 500 });
  }
}
