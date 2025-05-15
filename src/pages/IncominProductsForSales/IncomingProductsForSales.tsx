import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const Custom = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const backendUrl = import.meta.env.VITE_API_URL;
    const [data, setData] = useState<any>(null);
    const [pendingProducts, setPendingProducts] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState<any[]>([]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc',
    });
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]); // State to store selected items

    const fetchUserById = async (userId: string) => {
        if (!userId) {
            console.error('User ID is undefined or empty');
            return;
        }

        try {
            const response = await axios.get(`${backendUrl}/salesperson/get-sales-person/${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const salespersonData = response.data.salesperson;
            const products = salespersonData.pendingProducts || [];

            // Normalize _id to id for the datatable
            const normalized = products.map((item: any) => ({
                ...item,
                id: item._id || item.id,
            }));

            setPendingProducts(normalized);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Profile'));

        if (!token || userRole !== 'salesperson') {
            navigate('/auth/cover-login');
            return;
        }

        try {
            const userData = localStorage.getItem('userData');
            if (userData) {
                const parsedData = JSON.parse(userData);
                setData(parsedData);
            } else {
                console.error('No user data found in localStorage');
            }
        } catch (err) {
            console.error('Error parsing user data from localStorage:', err);
        }
    }, [navigate]);

    useEffect(() => {
        if (data && data.id) {
            fetchUserById(data.id);
        }
    }, [data]);
console.log(recordsData);
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const sortedData = sortBy(pendingProducts, sortStatus.columnAccessor);
        const paginatedData = sortStatus.direction === 'desc' ? sortedData.reverse() : sortedData;
        setRecordsData(paginatedData.slice(from, to));
    }, [page, pageSize, pendingProducts, sortStatus]);

    const handleAccept = async () => {
        try {
            if (!selectedRecords || selectedRecords.length === 0) {
                console.error('No records selected.');
                return;
            }
    
            console.log('Selected Records:', selectedRecords);
    
            const productIds = selectedRecords
                .map((item) => item?.productId?._id) // Adjusted mapping logic
                .filter((id) => id); // Filter out undefined or null IDs
    
            if (productIds.length === 0) {
                console.error('No valid product IDs found in selected records.');
                return;
            }
    
            await axios.put(
                `${backendUrl}/salesperson/accept-products/${data.id}`,
                { productIds },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            // Optionally, you can refresh the data after accepting products
            fetchUserById(data.id);
            showMessage('Products accepted successfully!', 'success');
        } catch (error) {
            console.error('Error accepting products:', error);
            showMessage('Failed to accept products', 'error');
        }
    };
    
    const handleReject = async () => {
        try {
            if (!selectedRecords || selectedRecords.length === 0) {
                console.error('No records selected.');
                return;
            }
    
            console.log('Selected Records:', selectedRecords);
    
            const productIds = selectedRecords
                .map((item) => item?.productId?._id) // Adjusted mapping logic
                .filter((id) => id); // Filter out undefined or null IDs
    
            if (productIds.length === 0) {
                console.error('No valid product IDs found in selected records.');
                return;
            }
    
            await axios.put(
                `${backendUrl}/salesperson/reject-products/${data.id}`, // Adjusted endpoint for rejection
                { productIds },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
    
            // Optionally, you can refresh the data after rejecting products
            fetchUserById(data.id);
            showMessage('Products rejected successfully!', 'success');
        } catch (error) {
            console.error('Error rejecting products:', error);
            showMessage('Failed to reject products', 'error');
        }
    };

 const showMessage = (msg: string = '', type: 'success' | 'error' | 'warning' | 'info' | 'question' = 'success') => {
            Swal.fire({
                icon: type,
                title: msg,
                toast: true,
                position: 'top',
                showConfirmButton: false,
                timer: 3000,
            });
        };
    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Incoming Products</h5>
                    <div className="ltr:ml-auto rtl:mr-auto" style={{display: 'flex', gap: '10px'}}>
                        <button disabled={selectedRecords.length === 0} type="button" className="btn btn-primary" onClick={handleAccept}>
                            Accept
                        </button>
                        <button disabled={selectedRecords.length === 0} type="button" className="btn btn-outline-danger" onClick={handleReject}>Reject</button>

                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'productId.stock_code', title: 'Stock Code' },
                            { accessor: 'productId.description', title: 'Description' },
                            { accessor: 'productId.gross_weight', title: 'Gross Weight' },
                            { accessor: 'productId.net_amount', title: 'Price' },
                        ]}
                        highlightOnHover
                        withBorder
                        withColumnBorders
                        selectedRecords={selectedRecords}
                        onSelectedRecordsChange={setSelectedRecords}
                        idAccessor="id"
                        minHeight={200}
                    />
                </div>
            </div>
        </div>
    );
};

export default Custom;
