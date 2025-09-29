import asyncio
import websockets
import json
import logging
from datetime import datetime
import threading
from realtime_market_service import realtime_market_service

class WebSocketMarketService:
    def __init__(self):
        self.clients = set()
        self.logger = logging.getLogger(__name__)
        self.running = False
        
    async def register_client(self, websocket):
        """Register a new client for market data updates"""
        self.clients.add(websocket)
        self.logger.info(f"Client registered. Total clients: {len(self.clients)}")
        
        # Send initial market data
        try:
            initial_data = await self.get_market_snapshot()
            await websocket.send(json.dumps(initial_data))
        except Exception as e:
            self.logger.error(f"Error sending initial data: {e}")

    async def unregister_client(self, websocket):
        """Unregister a client"""
        self.clients.discard(websocket)
        self.logger.info(f"Client unregistered. Total clients: {len(self.clients)}")

    async def get_market_snapshot(self):
        """Get current market data snapshot"""
        commodities = ['wheat', 'corn', 'soybean', 'rice', 'cotton']
        market_data = []
        
        for commodity in commodities:
            try:
                price_data = realtime_market_service.get_real_time_price_multi_source(commodity, 'US')
                if price_data:
                    market_data.append({
                        'commodity': commodity,
                        'price': price_data.get('price', 0),
                        'change': price_data.get('change', 0),
                        'change_percent': price_data.get('change_percent', 0),
                        'currency': price_data.get('currency', 'USD'),
                        'last_updated': price_data.get('last_updated', ''),
                        'data_source': price_data.get('data_source', 'unknown')
                    })
            except Exception as e:
                self.logger.error(f"Error fetching {commodity}: {e}")
        
        return {
            'type': 'market_update',
            'timestamp': datetime.utcnow().isoformat(),
            'data': market_data
        }

    async def broadcast_market_update(self):
        """Broadcast market updates to all connected clients"""
        if not self.clients:
            return
            
        try:
            market_data = await self.get_market_snapshot()
            
            # Send to all connected clients
            disconnected_clients = set()
            for client in self.clients:
                try:
                    await client.send(json.dumps(market_data))
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.add(client)
                except Exception as e:
                    self.logger.error(f"Error broadcasting to client: {e}")
                    disconnected_clients.add(client)
            
            # Remove disconnected clients
            for client in disconnected_clients:
                await self.unregister_client(client)
                
        except Exception as e:
            self.logger.error(f"Broadcast error: {e}")

    async def market_data_handler(self, websocket, path):
        """WebSocket handler for market data connections"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    
                    if data.get('type') == 'subscribe':
                        # Handle subscription requests
                        commodities = data.get('commodities', ['wheat', 'corn', 'soybean'])
                        await self.send_commodity_data(websocket, commodities)
                    
                    elif data.get('type') == 'get_price':
                        # Handle individual price requests
                        commodity = data.get('commodity')
                        if commodity:
                            price_data = realtime_market_service.get_real_time_price_multi_source(commodity, 'US')
                            await websocket.send(json.dumps({
                                'type': 'price_response',
                                'commodity': commodity,
                                'data': price_data
                            }))
                            
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'message': 'Invalid JSON format'
                    }))
                except Exception as e:
                    self.logger.error(f"Message handling error: {e}")
                    
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)

    async def send_commodity_data(self, websocket, commodities):
        """Send specific commodity data to a client"""
        commodity_data = []
        
        for commodity in commodities:
            try:
                price_data = realtime_market_service.get_real_time_price_multi_source(commodity, 'US')
                if price_data:
                    commodity_data.append({
                        'commodity': commodity,
                        'data': price_data
                    })
            except Exception as e:
                self.logger.error(f"Error fetching {commodity}: {e}")
        
        await websocket.send(json.dumps({
            'type': 'commodity_data',
            'data': commodity_data
        }))

    async def start_periodic_updates(self):
        """Start periodic market data updates"""
        self.running = True
        
        while self.running:
            try:
                await self.broadcast_market_update()
                await asyncio.sleep(60)  # Update every minute
            except Exception as e:
                self.logger.error(f"Periodic update error: {e}")
                await asyncio.sleep(30)  # Retry after 30 seconds

    def stop_updates(self):
        """Stop periodic updates"""
        self.running = False

    def start_websocket_server(self, host='localhost', port=8765):
        """Start the WebSocket server"""
        def run_server():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            self.logger.info(f"WebSocket server starting on ws://{host}:{port}")

            async def main():
                server = await websockets.serve(
                    self.market_data_handler,
                    host,
                    port,
                    ping_interval=30,
                    ping_timeout=10
                )

                periodic_task = asyncio.create_task(self.start_periodic_updates())

                try:
                    await server.wait_closed()
                finally:
                    periodic_task.cancel()
                    try:
                        await periodic_task
                    except asyncio.CancelledError:
                        pass

            try:
                loop.run_until_complete(main())
            except Exception as e:
                self.logger.error(f"WebSocket server error: {e}")
            finally:
                pending = asyncio.all_tasks(loop)
                for task in pending:
                    task.cancel()
                try:
                    loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
                except Exception:
                    pass
                finally:
                    loop.close()
        
        # Run in separate thread
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        return server_thread

# Global WebSocket service instance
websocket_market_service = WebSocketMarketService()