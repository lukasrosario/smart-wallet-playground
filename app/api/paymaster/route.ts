export async function POST(request: Request) {
  const res = await request.json();
  console.log('lukas request', res);
  return Response.json({ res });
}
