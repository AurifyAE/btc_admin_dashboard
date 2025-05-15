import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import sortBy from 'lodash/sortBy';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';

const ProductInHand = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const backendUrl = import.meta.env.VITE_API_URL;

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
    const [selectedRecords, setSelectedRecords] = useState<any[]>([]); // Added state for selected records

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
            const products = salespersonData.assignedProducts || [];

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
        dispatch(setPageTitle('Products in Hand'));

        if (!token || userRole !== 'salesperson') {
            navigate('/auth/cover-login');
            return;
        }

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

  

    // Another example function for different action
    const handleReturnProducts = async () => {
        try {
            if (!selectedRecords || selectedRecords.length === 0) {
                console.error('No records selected.');
                return;
            }
            
            console.log('Selected Records:', selectedRecords);
            
            const productIds = selectedRecords
                .map((item) => item?.productId?._id)
                .filter((id) => id);
            
            if (productIds.length === 0) {
                console.error('No valid product IDs found in selected records.');
                return;
            }
            console.log('Product IDs to return:', productIds);
            // Example endpoint - you'll need to create this on your backend
            await axios.put(
                `${backendUrl}/salesperson/return-products/${userData.id}`,
                { productIds },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            
            // Refresh data after updating products
            fetchProductsForUser(userData.id);
            showMessage('Products returned successfully!', 'success');
        } catch (error) {
            console.error('Error returning products:', error);
            showMessage('Failed to return products', 'error');
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
                    <h5 className="font-semibold text-lg dark:text-white-light">Products in Hand</h5>
                    <div className="ltr:ml-auto rtl:mr-auto" style={{display: 'flex', gap: '10px'}}>
                        {/* <button disabled={selectedRecords.length === 0} type="button" className="btn btn-primary" onClick={handleMarkAsSold}>
                            Mark as Sold
                        </button> */}
                        <button disabled={selectedRecords.length === 0} type="button" className="btn btn-outline-danger" onClick={handleReturnProducts}>
                            Return Products
                        </button>
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
                        sortStatus={tableSortStatus}
                        onSortStatusChange={setTableSortStatus}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPage={pageSize}
                        onRecordsPerPageChange={setPageSize}
                        totalRecords={productsInHand.length}
                        recordsPerPageOptions={PAGE_SIZES}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductInHand;