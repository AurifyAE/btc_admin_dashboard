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
    const backendUrl = import.meta.env.VITE_API_URL;

    const token = localStorage.getItem('authToken');
const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        if (!token || userRole !== 'admin') {
            navigate('/auth/cover-login');
            return;
        }
        
    }, [navigate]);

    useEffect(() => {
        dispatch(setPageTitle('Products'));
    }, [dispatch]);

    // Fetch products from the backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`${backendUrl}/admin/get-products`, {
                    headers: {
                        Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                    },
                });
                console.log('Response from server:', response.data); // Log the response data
    
                // Transform the data to include all details from the server
                const transformedProducts = response.data.products.map((product: any) => ({
                    stock_code: product.stock_code,
                    description: product.description,
                    gross_weight: parseFloat(product.gross_weight),
                    stone_weight: parseFloat(product.stone_weight),
                    net_weight: parseFloat(product.net_weight),
                    pure_weight: parseFloat(product.pure_weight),
                    mkg_rate: parseFloat(product.mkg_rate),
                    mkg_amount: parseFloat(product.mkg_amount),
                    net_amount: parseFloat(product.net_amount),
                    barcode: product.barcode
                }));
                
    
                setProducts(transformedProducts);
    console.log('Fetched products:', transformedProducts); // Log the fetched products
                // Call the function to copy products to MongoDB
                await copyProductsToMongoDB(transformedProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };
    
        fetchProducts();
    }, [backendUrl, token]);
    
    // Function to copy products from SQL to MongoDB
    const copyProductsToMongoDB = async (products: any[]) => {
        // console.log('Copying products to MongoDB...',products);
        try {
            const response = await axios.post(`${backendUrl}/admin/copy-products`,products, {
                headers: {
                    Authorization: `Bearer ${token}`, // Pass the token in the Authorization header
                },
            });
    
            console.log('Products copied to MongoDB:', response.data);
        } catch (error) {
            console.error('Error copying products to MongoDB:', error);
        }
    };
    // Update recordsData when products or pagination changes
    useEffect(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        setRecordsData(products.slice(from, to));
    }, [products, page, pageSize]);

    return (
        <div>
            <div className="panel mt-6">
                <h5 className="font-semibold text-lg dark:text-white-light mb-5">Products</h5>
                <div className="datatables">
                <DataTable
    noRecordsText="No products available"
    highlightOnHover
    className="whitespace-nowrap table-hover"
    records={recordsData}
    columns={[
        { accessor: 'stock_code', title: 'Stock Code' },
        { accessor: 'description', title: 'Description' },
        { accessor: 'gross_weight', title: 'Gross Weight (g)' },
        { accessor: 'stone_weight', title: 'Stone Weight (g)' },
        { accessor: 'net_weight', title: 'Net Weight (g)' },
        { accessor: 'pure_weight', title: 'Pure Weight (g)' },
        { accessor: 'mkg_rate', title: 'Making Rate (%)' },
        { accessor: 'mkg_amount', title: 'Making Charges (₹)' },
        { accessor: 'net_amount', title: 'Net Amount (₹)' },
        { accessor: 'barcode', title: 'Barcode' }
      ]
      }
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