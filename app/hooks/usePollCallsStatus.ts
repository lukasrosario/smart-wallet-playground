import { useQuery } from '@tanstack/react-query';

type UsePollCallsStatusProps = {
  callsId: string;
};

// TODO: use provider when rpc url is fixed
export function usePollCallsStatus({ callsId }: UsePollCallsStatusProps) {
  return useQuery({
    queryKey: ['getCallsStatus', callsId],
    queryFn: async () => {
      const response = await fetch('/api/callsStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          callsId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calls status');
      }

      return response.json();
    },
    refetchInterval: (query) => {
      const status = query.state.data?.result?.status;
      return status === 'CONFIRMED' ? false : 1000;
    },
    enabled: !!callsId && callsId !== '',
    select: (data) => data?.result,
  });
}
