import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { head } from 'lodash';
import Swal from 'sweetalert2';

// Define proper interfaces for the data structures
interface ProductDetails {
    name?: string;
    sku?: string;
    category?: string;
    [key: string]: any;
}

interface Product {
    _id?: string;
    uniqueId?: string;
    productDetails?: ProductDetails;
    productId?: ProductDetails;
    [key: string]: any;
}

interface Location {
    locationName?: string;
    [key: string]: any;
}

interface SalesPerson {
    _id?: string;
    salespersonId?: string;
    name?: string;
    email?: string;
    phone?: string;
    assignedLocation?: Location;
    returnAppliedProducts?: Product[];
    createdAt?: string;
    [key: string]: any;
}

// Define proper sort status type
interface SortStatus {
    columnAccessor: string;
    direction: 'asc' | 'desc';
}

// Define DataTable props to match your specific Mantine DataTable version
interface PaginationMeta {
    from: number;
    to: number;
    totalRecords: number;
}

interface DataTableColumn<T> {
    accessor: string;
    title: string;
    sortable?: boolean;
    render?: (record: T) => React.ReactNode;
    [key: string]: any;
}

// Add custom props interface to handle non-standard props


const ReturnCartOfAdmin = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [salesPersons, setSalesPersons] = useState<SalesPerson[]>([]);
    const [selectedSalesPerson, setSelectedSalesPerson] = useState<SalesPerson | null>(null);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState<SalesPerson[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedRecords, setSelectedRecords] = useState<Product[]>([]);
    const [sortStatus, setSortStatus] = useState<SortStatus>({ columnAccessor: 'name', direction: 'asc' });

    const token = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    const backendUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
        
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle('Return Cart of Admin'));
    }, [dispatch]);

    // Fetch sales persons from the backend

    const fetchSalesPersons = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/admin/get-sales-persons`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('Sales persons data:', response.data);

            let allSalesPersons: SalesPerson[] = [];
            if (response.data && Array.isArray(response.data.salespersons)) {
                allSalesPersons = response.data.salespersons;
            } else if (Array.isArray(response.data)) {
                allSalesPersons = response.data;
            }

            const salesPersonsWithReturns: SalesPerson[] = allSalesPersons.filter((sp: SalesPerson) => sp.returnAppliedProducts && sp.returnAppliedProducts.length > 0);

            salesPersonsWithReturns.forEach((sp: SalesPerson) => {
                if (sp.returnAppliedProducts && Array.isArray(sp.returnAppliedProducts)) {
                    sp.returnAppliedProducts = sp.returnAppliedProducts.map(
                        (product: Product, index: number): Product => ({
                            ...product,
                            uniqueId: product._id || `return-product-${sp._id || 'sp'}-${index}`,
                        })
                    );
                }
            });

            setSalesPersons(salesPersonsWithReturns);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching sales persons:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSalesPersons();
    }, [backendUrl, token]);

    // Update recordsData when salesPersons or pagination changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;

        // Apply sorting
        const sortedData = [...salesPersons].sort((a, b) => {
            const aValue = a[sortStatus.columnAccessor];
            const bValue = b[sortStatus.columnAccessor];

            if (aValue === undefined || bValue === undefined) return 0;

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortStatus.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
            } else {
                return sortStatus.direction === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
            }
        });

        setRecordsData(sortedData.slice(from, to));
    }, [salesPersons, page, pageSize, sortStatus]);

    // Handle click on a sales person row to view their return applied products
    const handleViewReturnAppliedProducts = (salesPerson: SalesPerson) => {
        setSelectedSalesPerson(salesPerson);
        // Clear any previous selections when switching sales person
        setSelectedRecords([]);
    };

    // Format the location name for display
    const formatLocation = (location: Location | undefined) => {
        return location?.locationName || 'N/A';
    };

    // Count return applied products
    const countReturnProducts = (salesPerson: SalesPerson) => {
        return salesPerson.returnAppliedProducts?.length || 0;
    };

    // Handle bulk actions for selected return products
    const acceptArrayOfProducts = () => {
        if (selectedRecords.length === 0) {
            showMessage('Please select at least one product to perform this action', 'warning');
            return;
        }

        // Extract the _id from each product's productId object
        const salesPersonId = selectedSalesPerson?._id;
        const productIds = selectedRecords.map((record) => record.productId?._id);

        // API call using PUT method to accept returns
        axios
            .put(
                `${backendUrl}/admin/accept-array-return-product/${salesPersonId}`,
                {
                    productIds,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((response) => {
                showMessage(`Successfully accepted ${productIds.length} products`, 'success');
                // Refresh product list after operation
                fetchSalesPersons();
                // Clear selection after successful operation
                setSelectedRecords([]);
                setSelectedSalesPerson(null);
            })
            .catch((error) => {
                console.error('Error performing bulk accept:', error);
                showMessage(`Failed to accept products: ${error.response?.data?.message || error.message}`, 'error');
            });
    };


    const rejectArrayOfProducts = () => {
        if (selectedRecords.length === 0) {
            showMessage('Please select at least one product to perform this action', 'warning');
            return;
        }

        // Extract the _id from each product's productId object
        const salesPersonId = selectedSalesPerson?._id;
        const productIds = selectedRecords.map((record) => record.productId?._id);

        // API call using PUT method to accept returns
        axios
            .put(
                `${backendUrl}/admin/reject-array-return-product/${salesPersonId}`,
                {
                    productIds,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            .then((response) => {
                showMessage(`Successfully rejected ${productIds.length} products`, 'success');
                // Refresh product list after operation
                fetchSalesPersons();
                // Clear selection after successful operation
                setSelectedRecords([]);
                setSelectedSalesPerson(null);
            })
            .catch((error) => {
                console.error('Error performing bulk accept:', error);
                showMessage(`Failed to accept products: ${error.response?.data?.message || error.message}`, 'error');
            });
    };

    console.log('selectedSalesPerson:', selectedSalesPerson);

    const acceptProduct = async (productId: string) => {
        console.log('Accepting product:', productId);
        const salesPersonId = selectedSalesPerson?._id;
        console.log('Sales Person ID:', salesPersonId);
        console.log(token, 'the token');
        try {
            await axios.put(
                `${backendUrl}/admin/accept-return-product/${salesPersonId}/${productId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log('Product accepted successfully');
            showMessage('Product accepted successfully', 'success');
            fetchSalesPersons();
            setSelectedSalesPerson(null);
        } catch (error) {
            console.error('Error accepting product:', error);
        }
    };

    const rejectingProduct = async (productId: string) => {
        console.log('Accepting product:', productId);
        const salesPersonId = selectedSalesPerson?._id;
        console.log('Sales Person ID:', salesPersonId);
        console.log(token, 'the token');
        try {
            await axios.put(
                `${backendUrl}/admin/reject-return-product/${salesPersonId}/${productId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            console.log('Product accepted successfully');
            showMessage('Product rejected successfully', 'success');
            fetchSalesPersons();
            setSelectedSalesPerson(null);
        } catch (error) {
            console.error('Error accepting product:', error);
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
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Sales Persons with Return Applied Products</h5>
                <div className="datatables">
                    <DataTable<SalesPerson>
                        noRecordsText="No sales persons with return products available"
                        highlightOnHover
                        className="whitespace-nowrap table-hover cursor-pointer"
                        records={recordsData}
                        columns={[
                            { accessor: 'salespersonId', title: 'ID', sortable: true },
                            { accessor: 'name', title: 'Name', sortable: true },
                            { accessor: 'email', title: 'Email', sortable: true },
                            { accessor: 'phone', title: 'Phone No.', sortable: true },
                            {
                                accessor: 'location',
                                title: 'Location',
                                sortable: true,
                                render: (record: SalesPerson) => formatLocation(record.assignedLocation),
                            },
                            {
                                accessor: 'returnProducts',
                                title: 'Return Products',
                                sortable: true,
                                render: (record: SalesPerson) => countReturnProducts(record),
                            },
                            {
                                accessor: 'createdAt',
                                title: 'Created Date',
                                sortable: true,
                                render: (record: SalesPerson) => (record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'N/A'),
                            },
                        ]}
                        totalRecords={salesPersons ? salesPersons.length : 0}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                        onRowClick={(record) => handleViewReturnAppliedProducts(record)}
                        fetching={loading}
                    />
                </div>
            </div>

            {selectedSalesPerson && selectedSalesPerson.returnAppliedProducts && selectedSalesPerson.returnAppliedProducts.length > 0 ? (
                <div className="panel mt-6">
                    <div className="flex justify-between items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Return Applied Products for {selectedSalesPerson.name}</h5>
                        <div className="flex gap-2">
                            <button type="button" className="btn btn-success" disabled={selectedRecords.length === 0} onClick={acceptArrayOfProducts}>
                                Approve Selected
                            </button>
                            <button type="button" className="btn btn-danger" disabled={selectedRecords.length === 0} onClick={rejectArrayOfProducts}>
                                Reject Selected
                            </button>
                            <button type="button" className="btn btn-outline-primary" onClick={() => setSelectedSalesPerson(null)}>
                                Back to Sales Persons
                            </button>
                        </div>
                    </div>
                    <div className="datatables">
                        <DataTable<Product>
                            noRecordsText="No return applied products available"
                            highlightOnHover
                            className="whitespace-nowrap table-hover"
                            records={selectedSalesPerson.returnAppliedProducts}
                            columns={[
                                {
                                    accessor: 'description',
                                    title: 'Description',
                                    sortable: true,
                                    render: (record: Product) => {
                                        const details = record.productDetails || record.productId;
                                        return details?.description || 'N/A';
                                    },
                                },
                                {
                                    accessor: 'stock_code',
                                    title: 'Stock Code',
                                    sortable: true,
                                    render: (record: Product) => {
                                        const details = record.productDetails || record.productId;
                                        return details?.stock_code || 'N/A';
                                    },
                                },
                                // {
                                //     accessor: 'category',
                                //     title: 'Category',
                                //     sortable: true,
                                //     render: (record: Product) => {
                                //         const details = record.productDetails || record.productId;
                                //         return details?.category || 'N/A';
                                //     },
                                // },
                                {
                                    accessor: 'actions',
                                    title: 'Actions',
                                    render: (record: Product) => (
                                        <div className="flex gap-2">
                                            <button type="button" className="btn btn-sm btn-primary" onClick={() => acceptProduct(record.productId?._id)}>
                                                Approve
                                            </button>
                                            <button type="button" className="btn btn-sm btn-danger" onClick={() => rejectingProduct(record.productId?._id)}>
                                                Reject
                                            </button>
                                        </div>
                                    ),
                                },
                            ]}
                            minHeight={200}
                            selectedRecords={selectedRecords}
                            onSelectedRecordsChange={setSelectedRecords}
                            idAccessor="uniqueId"
                        />
                    </div>
                </div>
            ) : selectedSalesPerson ? (
                <div className="panel mt-6">
                    <div className="flex justify-between items-center mb-5">
                        <h5 className="font-semibold text-lg dark:text-white-light">Return Applied Products for {selectedSalesPerson.name}</h5>
                        <button type="button" className="btn btn-outline-primary" onClick={() => setSelectedSalesPerson(null)}>
                            Back to Sales Persons
                        </button>
                    </div>
                    <div className="flex justify-center items-center p-10">
                        <p className="text-lg">No return applied products available for this sales person.</p>
                    </div>
                </div>
            ) : null}
        </div>
    );
};

export default ReturnCartOfAdmin;
