import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { IRootState } from '../store';
import { setPageTitle } from '../store/themeConfigSlice';
import IconX from '../components/Icon/IconX';
import axios from 'axios';
import useMarketData from './hooks/userMarketData';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts'; // Add this import
import { useNavigate } from 'react-router-dom';

interface SeriesData {
    name: string;
    data: number[];
}
  
// Update this interface to use ApexOptions
interface ChartState {
    series: SeriesData[];
    options: ApexOptions; // Changed from ChartOptions to ApexOptions
}

interface MarketData {
    initialBid: number;
    low: number;
    high: number;
    offer: number;
    bid: number;
    epic: string;
    symbol: string;
    marketOpenTimestamp: string | number | null; 
    nextMarketOpen: string | number | null; 
    // Add other expected properties if needed
}
  
const Index = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sales Admin'));
    });
const navigate = useNavigate();
    const token = localStorage.getItem('authToken');
const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
        
    }, [navigate]);

    const [loading, setLoading] = useState(false);
    const [goldRate, setGoldRate] = useState<number | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [timeAgo, setTimeAgo] = useState<string>('');
    const [newRate, setNewRate] = useState<string>('');
    const [updateMessage, setUpdateMessage] = useState<string>('');
    const [updateStatus, setUpdateStatus] = useState<'success' | 'error' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [chartData, setChartData] = useState<ChartState>({
        series: [
          {
            name: 'Offer',
            data: [],
          },
        ],
        options: {
          chart: {
            type: 'line' as const, // Fix: use 'as const' to ensure correct typing
            height: 350,
          },
          xaxis: {
            categories: [],
          },
          title: {
            text: 'Market Data',
            align: 'left' as const, // Fix: use 'as const' for align property
          },
        },
      });
    
    // Using the WebSocket hook to get real-time market data
    const { marketData } = useMarketData(['GOLD']) as { marketData: MarketData | null };

    const backendUrl = import.meta.env.VITE_API_URL;

    // Function to calculate time difference
    const calculateTimeAgo = (updatedAt: string) => {
        const now = new Date();
        const updateTime = new Date(updatedAt);
        const diffMs = now.getTime() - updateTime.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
            return 'just now';
        } else if (diffMins === 1) {
            return '1 minute ago';
        } else if (diffMins < 60) {
            return `${diffMins} minutes ago`;
        } else if (diffHours === 1) {
            return '1 hour ago';
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else if (diffDays === 1) {
            return '1 day ago';
        } else {
            return `${diffDays} days ago`;
        }
    };

    // Function to format date in a readable format
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    // Function to fetch gold rate from backend (fallback if websocket is not available)
    const fetchGoldRate = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/admin/rate`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            
            // Store rate and updated time information
            setGoldRate(response.data.rate);
            setLastUpdated(response.data.updatedAt);
            setTimeAgo(calculateTimeAgo(response.data.updatedAt));
            
            console.log('Gold Rate Data:', response.data);
        } catch (error) {
            console.error('Error fetching gold rate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newRate || isNaN(parseFloat(newRate))) {
            setUpdateMessage('Please enter a valid rate');
            setUpdateStatus('error');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.put(
                `${backendUrl}/admin/rate`,
                { rate: parseFloat(newRate) },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            // Update the displayed rate after successful update
            setGoldRate(response.data.rate);
            setLastUpdated(response.data.updatedAt);
            setTimeAgo(calculateTimeAgo(response.data.updatedAt));
            
            setUpdateMessage('Rate updated successfully');
            setUpdateStatus('success');
            
            // Close modal after a brief delay
            setTimeout(() => {
                closeModal();
            }, 1500);
            
        } catch (error) {
            console.error('Error updating gold rate:', error);
            setUpdateMessage('Failed to update rate');
            setUpdateStatus('error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // If market data is not available, fall back to the API
        if (!marketData) {
            fetchGoldRate();
        }
    }, []);

    // Only update timestamp when market data changes, not the rate itself
    useEffect(() => {
        if (marketData && 'timestamp' in marketData) {
            console.log('Real-time Gold Rate Data:', marketData);
            // Note: Not updating goldRate here, as it will be edited manually
        }
    }, [marketData]);
    
    const openModal = () => {
        // Set the initial value in the modal to the current rate if available
        if (goldRate !== null) {
            setNewRate(goldRate.toString());
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setUpdateMessage('');
        setUpdateStatus(null);
    };

    useEffect(() => {
        if (marketData) {
            setChartData((prev) => ({
                ...prev,
                series: [
                    {
                        name: 'Offer',
                        data: [...prev.series[0].data, marketData.offer],
                    },
                ],
                options: {
                    ...prev.options,
                    xaxis: {
                        ...(prev.options.xaxis ?? {}),
                        categories: [
                            ...(prev.options.xaxis?.categories ?? []),
                            new Date().toLocaleTimeString(),
                        ],
                    },
                }
                
            }));
        }
    }, [marketData]);

    return (
        <div>
            <div className="pt-5">
                <div className="grid xl:grid-cols-2 gap-6 mb-6">
                    <div className="panel h-full">
                        <div className="flex items-center justify-between mb-5">
                            <h5 className="font-semibold text-lg dark:text-white-light">Gold Market Data</h5>
                            
                            {/* Real-time indicator */}
                            {marketData && (
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-full text-xs bg-success bg-opacity-20 text-success flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-success mr-1 animate-pulse"></span>
                                        Live
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* Comprehensive market data display */}
                        <div className="flex flex-col">
                            {/* Primary data */}
                            <div className="flex items-center justify-between p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Rate</p>
                                    <p className="text-2xl font-semibold mt-1">
                                        {goldRate !== null ? (
                                            <span className="text-primary">${goldRate.toFixed(2)}</span>
                                        ) : (
                                            <span className="text-gray-400">Loading...</span>
                                        )}
                                    </p>
                                </div>
                                
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={openModal}
                                    disabled={loading}
                                >
                                    Update Rate
                                </button>
                            </div>

                            {/* Detailed market data */}
                            {marketData && (
                                <div className="bg-white dark:bg-gray-900 rounded-md overflow-hidden mb-4">
                                    <div className="grid grid-cols-2 gap-4 p-4">
                                       
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">Offer</span>
                                            <span className="font-medium">${marketData.offer?.toFixed(2) || '-'}</span>
                                        </div>
                                      
                                    </div>
                                  
                                </div>
                            )}
                            
                            {/* Last updated info */}
                            <div>
                                {lastUpdated && (
                                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex flex-col">
                                        <span>Last updated: {formatDate(lastUpdated)}</span>
                                        <span className="font-medium">{timeAgo}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Modal for updating rate */}
                        {isModalOpen && (
                            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center px-4">
                                <div className="panel bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
                                    <div className="flex items-center justify-between mb-5 p-4 border-b border-gray-200 dark:border-gray-700">
                                        <h5 className="font-semibold text-lg">Update Gold Rate</h5>
                                        <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                            <IconX />
                                        </button>
                                    </div>
                                    
                                    <form onSubmit={handleUpdateRate} className="p-4">
                                        <div className="mb-4">
                                            <label htmlFor="rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                New Rate
                                            </label>
                                            <input 
                                                id="rate"
                                                type="number" 
                                                placeholder="Enter new rate" 
                                                className="form-input w-full" 
                                                value={newRate}
                                                onChange={(e) => setNewRate(e.target.value)}
                                                step="0.01"
                                                min="0"
                                            />
                                        </div>
                                        
                                        {updateMessage && (
                                            <div className={`text-sm p-2 rounded mb-4 ${updateStatus === 'success' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                                {updateMessage}
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-end gap-2 mt-6">
                                            <button 
                                                type="button" 
                                                className="btn btn-outline-danger"
                                                onClick={closeModal}
                                                disabled={loading}
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                type="submit" 
                                                className="btn btn-primary"
                                                disabled={loading}
                                            >
                                                {loading ? (
                                                    <span className="flex items-center gap-2">
                                                        <span className="animate-spin border-2 border-white !border-l-transparent rounded-full w-4 h-4 inline-flex"></span>
                                                        Saving...
                                                    </span>
                                                ) : 'Save Changes'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                        
                    </div>
                    <div>
            <div >
                <div >
                    <div className="panel h-full">
                        <h5 className="font-semibold text-lg dark:text-white-light">Gold Market Data</h5>
                        {marketData && (
                            <div className="mt-4">
                                <ReactApexChart
                                    options={chartData.options}
                                    series={chartData.series}
                                    type="line"
                                    height={350}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
                </div>
                
            </div>
           
        </div>
    );
};

export default Index;