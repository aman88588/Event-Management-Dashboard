import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@shared/routes';

export function useWebSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WS Connected');
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'UPDATE_REGISTRATIONS') {
          // Invalidate events list to refresh counts
          queryClient.invalidateQueries({ queryKey: [api.events.list.path] });
        }
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    return () => {
      socket.close();
    };
  }, [queryClient]);
}
