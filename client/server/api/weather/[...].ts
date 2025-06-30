export default defineEventHandler((event) =>
    proxyRequest(event, 'http://localhost:5000/api/weather/data', event.node.req)
)