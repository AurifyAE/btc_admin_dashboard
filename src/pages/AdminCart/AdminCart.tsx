import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Products = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 20, 30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState([]);

    const token = localStorage.getItem('authToken');

    const backendUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/auth/cover-login'); // Redirect to home if token exists
        }
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle('Admin Cart'));
    }, [dispatch]);

    // Fetch products from the backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${backendUrl}/admin/get-mongo-products`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                    },
                });
                console.log('Response from server:', response.data); // Log the response data
    
                // Transform the data to include all details from the server
                const transformedProducts = response.data.products.map((product:any) => ({
                    id: product._id || null, // or product.id if applicable
    stockCode: product.stock_code,
    description: product.description || "N/A",
    grossWeight: parseFloat(product.gross_weight),
    stoneWeight: parseFloat(product.stone_weight),
    netWeight: parseFloat(product.net_weight),
    pureWeight: parseFloat(product.pure_weight),
    makingRate: parseFloat(product.mkg_rate),
    makingAmount: parseFloat(product.mkg_amount),
    netAmount: parseFloat(product.net_amount),
    barcode: product.barcode
                }));
    
                setProducts(transformedProducts);
                console.log('Fetched products:', transformedProducts); // Log the fetched products
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
    
        fetchProducts();
    }, [backendUrl, token]);
    // Update recordsData when products or pagination changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(products.slice(from, to));
    }, [products, page, pageSize]);

    return (
        <div>
            <div className="panel mt-6">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Products of admin cart</h5>
                <div className="datatables">
                <DataTable
    noRecordsText="No products available"
    highlightOnHover
    className="whitespace-nowrap table-hover"
    records={recordsData}
    columns={[
        { accessor: 'stockCode', title: 'Stock Code' },
        { accessor: 'description', title: 'Description' },
        { accessor: 'grossWeight', title: 'Gross Weight (g)' },
        { accessor: 'stoneWeight', title: 'Stone Weight (g)' },
        { accessor: 'netWeight', title: 'Net Weight (g)' },
        { accessor: 'pureWeight', title: 'Pure Weight (g)' },
        { accessor: 'makingRate', title: 'Making Rate (%)' },
        { accessor: 'makingAmount', title: 'Making Charges (₹)' },
        { accessor: 'netAmount', title: 'Net Amount (₹)' },
        { accessor: 'barcode', title: 'Barcode' }
    ]}
    totalRecords={products.length}
    recordsPerPage={pageSize}
    page={page}
    onPageChange={(p) => setPage(p)}
    recordsPerPageOptions={PAGE_SIZES}
    onRecordsPerPageChange={setPageSize}
    minHeight={200}
    paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
/>
                </div>
            </div>
        </div>
    );
};

export default Products;