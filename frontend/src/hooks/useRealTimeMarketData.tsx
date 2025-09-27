import { useState, useEffect, useRef, useCallback } from 'react';

interface MarketData {
  commodity: string;
  price: number;
  change: number;
  change_percent: number;
  currency: string;
  last_updated: string;
  data_source: string;
}

interface MarketUpdate {
  type: string;
  timestamp: string;
  data: MarketData[];
}

export const useRealTimeMarketData = (commodities: string[] = ['wheat', 'corn', 'soybean']) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    try {
      // WebSocket server URL (adjust port if needed)
      const wsUrl = 'ws://localhost:8765';
      
      websocketRef.current = new WebSocket(wsUrl);
      setConnectionStatus('connecting');

      websocketRef.current.onopen = () => {
        console.log('WebSocket connected for real-time market data');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // Subscribe to specific commodities
        if (websocketRef.current) {
          websocketRef.current.send(JSON.stringify({
            type: 'subscribe',
            commodities: commodities
          }));
        }
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'market_update') {
            setMarketData(message.data || []);
            setLastUpdate(message.timestamp || new Date().toISOString());
          } else if (message.type === 'commodity_data') {
            // Handle specific commodity data
            const commodityData = message.data.map((item: any) => ({
              commodity: item.commodity,
              ...item.data
            }));
            setMarketData(commodityData);
            setLastUpdate(new Date().toISOString());
          } else if (message.type === 'price_response') {
            // Handle individual price response
            setMarketData(prev => {
              const updated = prev.filter(item => item.commodity !== message.commodity);
              return [...updated, { commodity: message.commodity, ...message.data }];
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < 5) {
          const delay = Math.pow(2, reconnectAttempts.current) * 1000; // 1s, 2s, 4s, 8s, 16s
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (attempt ${reconnectAttempts.current})`);
            connect();
          }, delay);
        }
      };

      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      setConnectionStatus('disconnected');
    }
  }, [commodities]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    setConnectionStatus('disconnected');
    reconnectAttempts.current = 0;
  }, []);

  const requestPrice = useCallback((commodity: string) => {
    if (websocketRef.current && connectionStatus === 'connected') {
      websocketRef.current.send(JSON.stringify({
        type: 'get_price',
        commodity: commodity
      }));
    }
  }, [connectionStatus]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Fallback to HTTP API if WebSocket fails
  const [httpFallbackData, setHttpFallbackData] = useState<MarketData[]>([]);
  const [httpLoading, setHttpLoading] = useState(false);

  const fetchHttpFallback = useCallback(async () => {
    if (connectionStatus === 'connected') return; // Don't fetch if WebSocket is working
    
    setHttpLoading(true);
    try {
      const token = localStorage.getItem('token');
      const responses = await Promise.all(
        commodities.map(async (commodity) => {
          const response = await fetch(`http://localhost:5001/api/financial/real-time-price?commodity=${commodity}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              commodity: commodity,
              ...data.data
            };
          }
          return null;
        })
      );

      const validData = responses.filter(Boolean) as MarketData[];
      setHttpFallbackData(validData);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('HTTP fallback failed:', error);
    } finally {
      setHttpLoading(false);
    }
  }, [commodities, connectionStatus]);

  // Use HTTP fallback every 30 seconds if WebSocket is not connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (connectionStatus !== 'connected') {
      fetchHttpFallback(); // Initial fetch
      interval = setInterval(fetchHttpFallback, 30000); // Every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionStatus, fetchHttpFallback]);

  return {
    marketData: connectionStatus === 'connected' ? marketData : httpFallbackData,
    connectionStatus,
    lastUpdate,
    isLoading: connectionStatus === 'connecting' || httpLoading,
    reconnectAttempts: reconnectAttempts.current,
    requestPrice,
    connect,
    disconnect
  };
};

// Real-time price ticker component
export const RealTimePriceTicker: React.FC<{
  commodities?: string[];
  className?: string;
}> = ({ commodities = ['wheat', 'corn', 'soybean'], className = '' }) => {
  const { marketData, connectionStatus, lastUpdate, isLoading } = useRealTimeMarketData(commodities);

  if (isLoading) {
    return (
      <div className={`real-time-ticker loading ${className}`}>
        <span>Loading real-time prices...</span>
      </div>
    );
  }

  return (
    <div className={`real-time-ticker ${className}`}>
      <div className="ticker-header">
        <span className={`connection-status ${connectionStatus}`}>
          {connectionStatus === 'connected' ? '🟢 LIVE' : '🔴 OFFLINE'}
        </span>
        {lastUpdate && (
          <span className="last-update">
            Updated: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="ticker-items">
        {marketData.map((item) => (
          <div key={item.commodity} className="ticker-item">
            <span className="commodity">{item.commodity.toUpperCase()}</span>
            <span className="price">
              {item.currency === 'USD' ? '$' : '₹'}{item.price?.toFixed(2) || '0.00'}
            </span>
            <span className={`change ${item.change_percent > 0 ? 'positive' : item.change_percent < 0 ? 'negative' : 'neutral'}`}>
              {item.change_percent > 0 ? '+' : ''}{item.change_percent?.toFixed(2) || '0.00'}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// CSS styles for the ticker
export const RealTimeTickerStyles = `
.real-time-ticker {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.real-time-ticker.loading {
  text-align: center;
  font-style: italic;
  opacity: 0.7;
}

.ticker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
}

.connection-status.connected {
  color: #4caf50;
  font-weight: bold;
}

.connection-status.disconnected {
  color: #f44336;
  font-weight: bold;
}

.connection-status.connecting {
  color: #ff9800;
  font-weight: bold;
}

.ticker-items {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  padding: 4px 0;
}

.ticker-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
  text-align: center;
}

.commodity {
  font-size: 11px;
  opacity: 0.8;
  margin-bottom: 2px;
}

.price {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 2px;
}

.change {
  font-size: 12px;
  font-weight: 600;
}

.change.positive {
  color: #4caf50;
}

.change.negative {
  color: #f44336;
}

.change.neutral {
  color: #9e9e9e;
}

.last-update {
  opacity: 0.7;
  font-size: 11px;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

.real-time-ticker.loading {
  animation: pulse 1.5s infinite;
}

@media (max-width: 768px) {
  .ticker-items {
    gap: 16px;
  }
  
  .ticker-item {
    min-width: 60px;
  }
  
  .price {
    font-size: 14px;
  }
}
`;

export default useRealTimeMarketData;