import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FiAlertCircle, FiInfo, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

function logs() {
    const backendUrl = import.meta.env.VITE_API_URL;
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalLogs, setTotalLogs] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState('today');
    const [hasNextPage, setHasNextPage] = useState(false);
    const [hasPrevPage, setHasPrevPage] = useState(false);

    const token = localStorage.getItem('authToken');
    const itemsPerPage = 15;

    const logTypeConfig = {
        info: { icon: FiInfo, bgColor: 'bg-blue-500' },
        default: { icon: FiInfo, bgColor: 'bg-indigo-500' },
    };

    const filterOptions = [
        { value: 'all', label: 'All Logs' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'lastweek', label: 'Last Week' },
        { value: 'lastmonth', label: 'Last Month' },
    ];

    // Function to format date in a readable format
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Unknown date';

        try {
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            };
            return new Date(dateString).toLocaleString(undefined, options);
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    // Function to fetch logs with pagination and filtering
    const fetchLogs = async (page: number = 1, filter: string = 'today') => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/admin/get-logs`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    page,
                    limit: itemsPerPage,
                    filter
                }
            });

            const { data, pagination } = response.data;
            
            setLogs(data || []);
            setCurrentPage(pagination.currentPage);
            setTotalPages(pagination.totalPages);
            setTotalLogs(pagination.totalLogs);
            setHasNextPage(pagination.hasNextPage);
            setHasPrevPage(pagination.hasPrevPage);
            
            console.log('Logs Data:', data);
            console.log('Pagination:', pagination);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter change
    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        setCurrentPage(1); // Reset to first page when filter changes
        fetchLogs(1, filter);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchLogs(page, selectedFilter);
    };

    // Initial fetch
    useEffect(() => {
        fetchLogs(1, selectedFilter);
    }, [backendUrl, token]);

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pageNumbers.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pageNumbers.push(i);
                }
            } else {
                pageNumbers.push(1);
                pageNumbers.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pageNumbers.push(i);
                }
                pageNumbers.push('...');
                pageNumbers.push(totalPages);
            }
        }
        
        return pageNumbers;
    };

    return (
        <div className="panel h-full">
            <div className="flex items-start justify-between dark:text-white-light mb-5 -mx-5 p-5 pt-0 border-b border-white-light dark:border-[#1b2e4b]">
                <h5 className="font-semibold text-lg">Activity Log</h5>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                        {totalLogs > 0 && `${totalLogs} total logs`}
                    </span>
                </div>
            </div>

            {/* Filter Buttons */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => handleFilterChange(option.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedFilter === option.value
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-7">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="h-4 w-4 bg-blue-500 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ) : logs && logs.length > 0 ? (
                    <>
                        {logs.map((log, index) => {
                            const logType = 'default';
                            const logConfig = logTypeConfig[logType] || logTypeConfig.default;
                            const IconComponent = logConfig.icon;
                            const isLast = index === logs.length - 1;

                            return (
                                <div className="flex" key={log._id || index}>
                                    <div className="shrink-0 ltr:mr-2 rtl:ml-2 relative z-10">
                                        {!isLast && (
                                            <div className="before:w-[2px] before:h-[calc(100%-24px)] before:bg-white-dark/30 before:absolute before:top-10 before:left-4" />
                                        )}
                                        <div className={`${logConfig.bgColor} shadow w-8 h-8 rounded-full flex items-center justify-center text-white`}>
                                            <IconComponent size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold dark:text-white-light">
                                            {(log as any)?.log}
                                        </h5>
                                        <p className="text-white-dark text-xs">{formatDate(log.createdAt)}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center mt-8 pt-6 border-t border-white-light dark:border-[#1b2e4b]">
                                <div className="flex items-center gap-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={!hasPrevPage}
                                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            hasPrevPage
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                                : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                        }`}
                                    >
                                        <FiChevronLeft size={16} />
                                        Previous
                                    </button>

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1 mx-2">
                                        {getPageNumbers().map((pageNum, index) => (
                                            <React.Fragment key={index}>
                                                {pageNum === '...' ? (
                                                    <span className="px-2 py-1 text-gray-500">...</span>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePageChange(pageNum as number)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                            currentPage === pageNum
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* Next Button */}
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={!hasNextPage}
                                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            hasNextPage
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                                : 'bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                        }`}
                                    >
                                        Next
                                        <FiChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                            {selectedFilter === 'all' ? 'No logs available.' : `No logs found for ${filterOptions.find(f => f.value === selectedFilter)?.label}.`}
                        </p>
                    </div>
                )}
            </div>

            {/* Page Info */}
            {logs.length > 0 && (
                <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalLogs)} of {totalLogs} logs
                </div>
            )}
        </div>
    );
}

export default logs;