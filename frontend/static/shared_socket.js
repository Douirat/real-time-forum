let socket = null;
let ports = [];

onconnect = (event) => {
  const port = event.ports[0];
  ports.push(port);
  port.start();

  port.onmessage = (e) => {
    const msg = e.data;

    if (msg === 'init') {
      if (!socket) {
        socket = new WebSocket('ws://localhost:8080/ws');

        socket.onopen = () => {
          ports.forEach(p => p.postMessage({ type: 'open' }));
        };

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          ports.forEach(p => p.postMessage({ type: 'message', data }));
        };

        socket.onclose = () => {
          ports.forEach(p => p.postMessage({ type: 'closed' }));
        };

        socket.onerror = () => {
          ports.forEach(p => p.postMessage({ type: 'error' }));
        };
      }
    }

    if (msg.type === 'send') {
      socket?.send(JSON.stringify(msg.data));
    }
  };
};
