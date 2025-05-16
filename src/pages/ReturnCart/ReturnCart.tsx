import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProductInHand = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const backendUrl = import.meta.env.VITE_API_URL;
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    useEffect(() => {
        if (!token || userRole !== 'salesperson') {
            navigate('/auth/cover-login');
            return;
        }
        
    }, [navigate]);
    
    const [userData, setUserData] = useState<any>(null);
    const [productsInHand, setProductsInHand] = useState<any[]>([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState<any[]>([]);
    const [tableSortStatus, setTableSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc',
    });

    const fetchProductsForUser = async (userId: string) => {
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
            const products = salespersonData.returnAppliedProducts || [];

            console.log('Products:', products);
            // Normalize _id to id for the datatable
            const normalizedProducts = products.map((item: any) => ({
                ...item,
                id: item._id || item.id,
            }));

            console.log('Normalized Products:', normalizedProducts);

            setProductsInHand(normalizedProducts);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };


    useEffect(() => {
        dispatch(setPageTitle('Return Cart'));

   
        try {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
                const parsedData = JSON.parse(storedUserData);
                setUserData(parsedData);
            } else {
                console.error('No user data found in localStorage');
            }
        } catch (err) {
            console.error('Error parsing user data from localStorage:', err);
        }
    }, [navigate]);

    useEffect(() => {
        if (userData && userData.id) {
            fetchProductsForUser(userData.id);
        }
    }, [userData]);

    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const sortedProducts = sortBy(productsInHand, tableSortStatus.columnAccessor);
        const finalProducts = tableSortStatus.direction === 'desc' ? sortedProducts.reverse() : sortedProducts;
        setRecordsData(finalProducts.slice(from, to));
    }, [page, pageSize, productsInHand, tableSortStatus]);

   

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Return Cart</h5>
                    <div className="ltr:ml-auto rtl:mr-auto" style={{ display: 'flex', gap: '10px' }}>
                        {/* <button disabled={selectedRecords.length === 0} type="button" className="btn btn-primary" onClick={handleMarkAsSold}>
                            Mark as Sold
                        </button> */}
                        {/* <button disabled={selectedRecords.length === 0} type="button" className="btn btn-outline-danger" onClick={handleReturnProducts}>
                            Return Products
                        </button> */}
                    </div>
                </div>
                <div className="datatables">
                    <DataTable
                        className="whitespace-nowrap table-hover"
                        records={recordsData}
                        columns={[
                            { accessor: 'productId.stock_code', title: 'Stock Code' },
                            { accessor: 'productId.description', title: 'Description' },
                            { accessor: 'productId.net_weight', title: 'Net Weight (g)' },
                            { accessor: 'productId.net_amount', title: 'Net Amount (₹)' }
                            
                        ]}
                        highlightOnHover
                        withBorder
                        withColumnBorders
                        idAccessor="id"
                        minHeight={200}
                        sortStatus={tableSortStatus}
                        onSortStatusChange={setTableSortStatus}
                        // Removed selectedRecords and related props
                        // Removed pagination-related props
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductInHand;
